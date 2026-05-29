// Buffer C
// Sugar / attractor field
// Influenced strongly by the living substrate in Buffer D
//
// R = nutrient / attractor
// G = disturbance memory
// B = phase glow / thermal glow
// A = spare glow

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord / iResolution.xy;
    float mask = 1.-texture(iMask, uv).a;

    vec4 C = texture(iChannel1, uv);

    vec2 coordN = mod(fragCoord + vec2(0, 1) + iResolution.xy, iResolution.xy);
    vec2 coordS = mod(fragCoord + vec2(0,-1) + iResolution.xy, iResolution.xy);
    vec2 coordE = mod(fragCoord + vec2(1, 0) + iResolution.xy, iResolution.xy);
    vec2 coordW = mod(fragCoord + vec2(-1,0) + iResolution.xy, iResolution.xy);

    vec4 N = texture(iChannel1, coordN / iResolution.xy);
    vec4 S = texture(iChannel1, coordS / iResolution.xy);
    vec4 E = texture(iChannel1, coordE / iResolution.xy);
    vec4 W = texture(iChannel1, coordW / iResolution.xy);
    vec4 avg = (N + S + E + W) / 4.0;

    C = mix(C, avg, 0.22);
    C *= vec4(0.992, 0.985, 0.990, 0.985);

    vec4 A = texture(iChannel0, uv);
    vec2 delta = abs(fragCoord - A.xy);
    delta = min(delta, iResolution.xy - delta);
    float dist = length(delta);

    C.r += exp(-dist * dist * 0.08);

    vec4 D = texture(iChannel2, uv);

    float substrate  = D.r;
    float activity   = D.g;
    float temp       = D.b;
    float transition = D.a;

    C.r += substrate * 0.025;
    C.g += transition * 0.045;
    C.r -= activity * 0.020;
    C.g += activity * 0.020;
    C.r -= temp * 0.010;
    C.b += temp * 0.020;

    // Smooth wandering motion using sin waves
    vec2 p = vec2(
        sin(iTime * 0.17 + 1.3),
        cos(iTime * 0.13 + 2.1)
    );

    // Add secondary motion so it's not just a loop
    p += vec2(
        sin(iTime * 0.07 + 4.0),
        cos(iTime * 0.05 + 3.2)
    ) * 0.5;

    // Normalize to screen space
    p = p * 0.4 + 0.5;  // keep inside bounds
    p *= iResolution.xy;

    vec2 cDelta = abs(fragCoord - p);
    cDelta = min(cDelta, iResolution.xy - cDelta);
    float d = length(cDelta);

    float circleCore = smoothstep(85.0, 0.0, d);
    float circleRing = smoothstep(120.0, 70.0, d) - smoothstep(70.0, 40.0, d);

    vec4 Dcircle = texture(iChannel2, p / iResolution.xy);
    float circleSubstrate = Dcircle.r;
    float circleActivity  = Dcircle.g;
    float circleTemp      = Dcircle.b;
    float circleChange    = Dcircle.a;

    float phase = 0.5 + 0.5 * sin(iTime * 0.9);

    if (phase > 0.5)
    {
        float feedStrength = smoothstep(0.5, 1.0, phase);
        float feedBoost = 1.0 + circleSubstrate * 0.6 - circleActivity * 0.4;

        C.r += circleCore * 0.08 * feedStrength * feedBoost;
        C.b += circleRing * 0.04 * feedStrength;
        C.a += circleCore * 0.02 * feedStrength;
    }
    else
    {
        float disruptStrength = smoothstep(0.5, 0.0, phase);
        float disruptBoost = 1.0 + circleChange * 0.8 + circleTemp * 0.3;

        C.r -= circleCore * 0.05 * disruptStrength;
        C.g += circleCore * 0.10 * disruptStrength * disruptBoost;
        C.b += circleRing * 0.05 * disruptStrength;
    }

    if (iMouse.z > 0.0)
    {
        vec2 mDelta = abs(fragCoord - iMouse.xy);
        mDelta = min(mDelta, iResolution.xy - mDelta);
        float dm = length(mDelta);

        float brush = smoothstep(120.0, 0.0, dm);
        C.r += brush * 0.05;
        C.g *= 1.0 - brush * 0.2;
    }

    C = clamp(C, 0.0, 1.0);
    fragColor = C * mask;
}