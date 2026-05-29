void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    vec2 uv = fragCoord / iResolution.xy;
    float mask = 1.-texture(iMask, uv).a;
    vec4 C = texture(iChannel2, uv);
    
    // --- 1. 扩散与淡出 ---
    vec2 eps = 1.0 / iResolution.xy;
    vec4 avg = (
        texture(iChannel2, uv + vec2(0,eps.y)) +
        texture(iChannel2, uv - vec2(0,eps.y)) +
        texture(iChannel2, uv + vec2(eps.x,0)) +
        texture(iChannel2, uv - vec2(eps.x,0))
    ) * 0.25;
    
    // 混合扩散并快速淡出，形成瞬时的诱饵场
    C = mix(C, avg, 0.2) * 0.96;
    
    // --- 2. 鼠标点击画下诱饵 ---
    if(iMouse.z > 0.0) {
        float d = distance(fragCoord, iMouse.xy);
        C.r += smoothstep(25.0, 0.0, d) * 0.5;
    }

    C *= mask;
    
    fragColor = clamp(C, 0.0, 1.0);
}