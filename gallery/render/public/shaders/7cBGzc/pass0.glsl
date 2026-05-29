void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord / iResolution.xy;
    vec2 m = iMouse.xy / iResolution.xy;

    // zoom
    if (iMouse.z > 0.0) {
        float magnification = 10.0;
        uv /= magnification;
        uv += iMouse.xy / (iResolution.xy + (iResolution.xy / (magnification - 1.0)));
    }

    vec4 A = texture(iChannel0, uv);
    vec4 B = texture(iChannel1, uv);
    vec4 C = texture(iChannel2, uv);

    // distance from tracked particle
    float d = distance(uv * iResolution.xy, A.xy);

    // sharper core + soft halo
    float core = smoothstep(4.0, 0.0, d);
    float halo = exp(-0.03 * d * d);

    // trails / fields
    float trail = length(B.rgb);
    float sugar = length(C.rgb);

    // animated palette
    vec3 palette = 0.5 + 0.5 * cos(
        vec3(0.0, 2.0, 4.0)
        + iTime * 9.0
        + sugar * 7.2
        + trail * 1.0
    );

    // radial glow pulse
    float pulse = 0.5 + 1.5 * sin(iTime * 12.0 - d * 0.08);

    // slight screen warp from sugar field
    vec2 warp = (C.xy - 0.5) * 0.15;
    vec3 warpedTrail = texture(iChannel2, uv + warp).rgb;

    // background nebula feel
    vec3 bg = 0.08 + 0.05 * cos(vec3(0.0, 1.5, 3.0) + iTime + uv.xyx * 8.0);

    vec3 col = bg;

    // trails become iridescent
    col += warpedTrail * palette * 1.8;

    // particle body
    col += vec3(0.0, 1.95, 0.9) * core * 6.8;

    // mouse proximity "divine spotlight"
    float md = distance(uv, m);
    col += vec3(0.2, 0.4, 1.0) * exp(-20.0 * md) * 0.4;


    fragColor = vec4(col, 1.0);
}