// Buffer C — Particle trail
// .r = trail intensity   .g = species ID / 9.0 (preserved across diffusion)
//
// iChannel1: bufB  (particle state)
// iChannel2: self  (trail feedback)

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord / iResolution.xy;

    // diffuse trail (4-neighbour weighted average)
    vec4 C  = texture(iChannel2, uv);
    vec4 N  = texture(iChannel2, (fragCoord+vec2( 0, 1))/iResolution.xy);
    vec4 S  = texture(iChannel2, (fragCoord+vec2( 0,-1))/iResolution.xy);
    vec4 E  = texture(iChannel2, (fragCoord+vec2( 1, 0))/iResolution.xy);
    vec4 W  = texture(iChannel2, (fragCoord+vec2(-1, 0))/iResolution.xy);

    // intensity diffuses normally
    float intensity = mix(C.r, (N.r+S.r+E.r+W.r)*0.25, 0.12);
    intensity *= 0.997;   // decay

    // species ID: take from the brightest neighbour (species "dominates" into surroundings)
    vec4 best = C;
    if (N.r > best.r) best = N;
    if (S.r > best.r) best = S;
    if (E.r > best.r) best = E;
    if (W.r > best.r) best = W;
    float speciesNorm = best.g;   // inherit species from brightest neighbour

    // deposit from nearest particle
    vec4  A = texture(iChannel1, uv);
    float d = distance(fragCoord, A.xy);
    float deposit = exp(-d*d*0.005);   // ~14px glow radius

    if (deposit > intensity) {
        intensity    = deposit;
        speciesNorm  = A.w / 9.0;   // overwrite species where particle is strong
    }

    fragColor = vec4(intensity, speciesNorm, 0., 1.);
}
