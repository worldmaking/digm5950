// Buffer D
// Living substrate / membrane
// R = local state
// G = flip probability
// B = temperature
// A = moment of change


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord / iResolution.xy;
    float mask = 1.-texture(iMask, uv).a;
    vec4 noise = random4(vec3(fragCoord.xy, iTime));

    vec2 c0  = mod(fragCoord + vec2( 0, 0) + iResolution.xy, iResolution.xy);
    vec2 cE  = mod(fragCoord + vec2( 1, 0) + iResolution.xy, iResolution.xy);
    vec2 cW  = mod(fragCoord + vec2(-1, 0) + iResolution.xy, iResolution.xy);
    vec2 cN  = mod(fragCoord + vec2( 0, 1) + iResolution.xy, iResolution.xy);
    vec2 cS  = mod(fragCoord + vec2( 0,-1) + iResolution.xy, iResolution.xy);
    vec2 cNE = mod(fragCoord + vec2( 1, 1) + iResolution.xy, iResolution.xy);
    vec2 cNW = mod(fragCoord + vec2(-1, 1) + iResolution.xy, iResolution.xy);
    vec2 cSE = mod(fragCoord + vec2( 1,-1) + iResolution.xy, iResolution.xy);
    vec2 cSW = mod(fragCoord + vec2(-1,-1) + iResolution.xy, iResolution.xy);

    vec4 C  = texture(iChannel0, c0  / iResolution.xy);
    vec4 E  = texture(iChannel0, cE  / iResolution.xy);
    vec4 W  = texture(iChannel0, cW  / iResolution.xy);
    vec4 N  = texture(iChannel0, cN  / iResolution.xy);
    vec4 S  = texture(iChannel0, cS  / iResolution.xy);
    vec4 NE = texture(iChannel0, cNE / iResolution.xy);
    vec4 NW = texture(iChannel0, cNW / iResolution.xy);
    vec4 SE = texture(iChannel0, cSE / iResolution.xy);
    vec4 SW = texture(iChannel0, cSW / iResolution.xy);

    float nearVals[8] = float[8](N.r, S.r, E.r, W.r, NW.r, NE.r, SW.r, SE.r);

    float differences =
          abs(C.r - N.r) + abs(C.r - S.r)
        + abs(C.r - E.r) + abs(C.r - W.r)
        + abs(C.r - NE.r) + abs(C.r - NW.r)
        + abs(C.r - SE.r) + abs(C.r - SW.r);

    float different = differences / 8.0;

    float temperature = 0.15 + 0.85 * uv.x;
    temperature *= 0.8 + 0.2 * sin(iTime * 0.15);

    float probability = pow(max(different, 0.0001), 1.0 / max(temperature, 0.02));

    if (noise.x < probability)
    {
        int which = int(noise.y * 8.0);
        C.r = nearVals[which];
        C.a = 1.0;
    }
    else
    {
        C.a = 0.0;
    }

    if (iFrame == 0)
    {
        C.r = noise.x;
        C.a = 0.0;
    }

    C.g = probability;
    C.b = temperature;

    fragColor = C * mask;
}