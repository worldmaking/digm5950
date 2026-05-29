// Buffer B
// Trail accumulation shaped by the living substrate
// Wrapped neighbor sampling for seamless edges.

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord / iResolution.xy;
    float mask = 1.-texture(iMask, uv).a;

    vec4 A = texture(iChannel0, uv);
    vec4 B = texture(iChannel1, uv);
    vec4 D = texture(iChannel2, uv);

    float substrate  = D.r;
    float activity   = D.g;
    float transition = D.a;

    vec2 coordN = mod(fragCoord + vec2(0, 1) + iResolution.xy, iResolution.xy);
    vec2 coordS = mod(fragCoord + vec2(0,-1) + iResolution.xy, iResolution.xy);
    vec2 coordE = mod(fragCoord + vec2(1, 0) + iResolution.xy, iResolution.xy);
    vec2 coordW = mod(fragCoord + vec2(-1,0) + iResolution.xy, iResolution.xy);

    vec4 N = texture(iChannel1, coordN / iResolution.xy);
    vec4 S = texture(iChannel1, coordS / iResolution.xy);
    vec4 E = texture(iChannel1, coordE / iResolution.xy);
    vec4 W = texture(iChannel1, coordW / iResolution.xy);
    vec4 avg = (N + S + E + W) / 4.0;

    float decay = 0.988;
    decay += substrate * 0.006;
    decay -= activity * 0.008;
    decay -= transition * 0.006;
    decay = clamp(decay, 0.97, 0.995);

    B *= decay;
    B = mix(B, avg, 0.07);

    vec2 delta = abs(fragCoord - A.xy);
    delta = min(delta, iResolution.xy - delta);
    float d = length(delta);

    float p = smoothstep(1.8, 0.0, d);
    p *= mix(0.85, 1.35, substrate);
    B += vec4(p);

    vec4 floorVal = vec4(0.002 + substrate * 0.004);
    B = max(B, floorVal);

    fragColor = clamp(B, 0.0, 1.0) * mask;
}