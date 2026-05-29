// Buffer B — Particle state
// Each pixel stores the state of the nearest particle:
//   .xy = particle position (pixels)
//   .z  = heading angle (radians)
//   .w  = species ID (0–9, stored as float)
//
// Role of particles in the ecosystem:
//   Particles do NOT directly overwrite cell values.
//   Instead, their trails (bufC) carry species information that
//   bufA reads to select which kernel to apply at each location.
//   This means particles only shape the *surrounding kernel environment*
//   of living cells — they act as "gardeners" steering growth rules,
//   not bulldozers that destroy existing life.
//
//   Without steering, a particle moving in a straight line through a colony
//   stamps its species trail across the interior, flipping the kernel and
//   killing the cells it crosses.  Steering keeps particles on the edges.
//
// Particle–cell relationship:
//   - In regions where cells have already grown (high Lenia luminance),
//     particles are attracted toward the bright boundary edges.
//     They orbit or skirt around established colonies rather than
//     cutting straight through, preserving the active kernel zone.
//   - When a particle does pass near a living region, its species trail
//     may shift the local kernel — but only gradually, because trail
//     diffusion and decay (bufC) smooth out abrupt transitions.
//   - The net effect: particles continuously sculpt the kernel landscape
//     around cell colonies, enabling new growth patterns to emerge at
//     the periphery while leaving the interior ecology intact.

// iChannel0: self   (particle feedback)
// iChannel1: bufA   (Lenia field for attraction)


vec4 getNearestParticle(vec4 A, vec2 fragCoord, vec2 offset) {
    vec4 N = texture(iChannel1, (fragCoord+offset)/iResolution.xy);
    return (distance(fragCoord,N.xy) < distance(fragCoord,A.xy)) ? N : A;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord / iResolution.xy;
    float mask = 1.-texture(iMask, uv).a;
    vec4 A  = texture(iChannel1, uv);

    // nearest-particle propagation
    for (int x=-2; x<=2; x++)
    for (int y=-2; y<=2; y++)
        A = getNearestParticle(A, fragCoord, vec2(x,y));

    vec4 rnd = random4(vec3(A.xy, iTime));

    float speed        = 60.;
    float wander       = 0.4;
    float turnfactor   = 0.6;
    float sensor_length = 18.;

    mat2 rot = rotate2d(A.z);
    vec2 s0  = rot * vec2(1., 0.) * sensor_length + A.xy;
    vec2 s1  = rot * vec2(1., 1.) * sensor_length + A.xy;
    vec2 s2  = rot * vec2(1.,-1.) * sensor_length + A.xy;

    // use overall luminance as attraction field
    vec3 c0 = texture(iChannel0, s0/iResolution.xy).rgb;
    vec3 c1 = texture(iChannel0, s1/iResolution.xy).rgb;
    vec3 c2 = texture(iChannel0, s2/iResolution.xy).rgb;
    float F  = dot(c0, vec3(0.333));
    float FL = dot(c1, vec3(0.333));
    float FR = dot(c2, vec3(0.333));

    if (F>=FL && F>=FR)   A.z += wander*(rnd.z-0.5)*0.3;
    else if (FL>=FR)      A.z += turnfactor;
    else                  A.z -= turnfactor;

    rot   = rotate2d(A.z);
    A.xy += rot * vec2(speed,0.) * iTimeDelta;

    vec2 b = clamp(A.xy, vec2(0.), iResolution.xy);
    if (A.x!=b.x) A.z = TWOPI*0.5 - A.z;
    if (A.y!=b.y) A.z = TWOPI     - A.z;
    A.xy = b;

    if (iFrame==0) {
        float N = 60.;
        A.xy = round(fragCoord/N)*N;
        vec4 r0 = random4(vec3(A.xy, 0.));
        A.z  = r0.z * TWOPI;
        A.w  = floor(r0.w * 10.);   // species 0-9
    }

    fragColor = A;
}
