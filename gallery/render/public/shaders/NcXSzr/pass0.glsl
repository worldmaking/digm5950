void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    vec2 uv = fragCoord / iResolution.xy;
    
    // --- 1. 电影级特效：色散采样 (Chromatic Aberration) ---
    // 模拟真实镜头在边缘产生的色彩偏移，消除空洞感
    float aberration = 0.004 * length(uv - 0.5);
    float rV = texture(iChannel1, uv + vec2(aberration, 0)).g;
    float gV = texture(iChannel1, uv).g;
    float bV = texture(iChannel1, uv - vec2(aberration, 0)).g;
    float v = (rV + gV + bV) / 3.0; // 用于计算亮度的平均浓度
    
    float dataB = texture(iChannel1, uv).b; // 用于调色的 phase

    // --- 2. 法线提取与菲涅尔效应 ---
    vec2 eps = vec2(2.0 / iResolution.x, 0.0);
    float v_n = texture(iChannel1, uv + eps.yx).g;
    float v_s = texture(iChannel1, uv - eps.yx).g;
    float v_e = texture(iChannel1, uv + eps.xy).g;
    float v_w = texture(iChannel1, uv - eps.xy).g;
    
    // 计算梯度法线，0.05 是凹凸深度因子
    vec3 normal = normalize(vec3(v_w - v_e, v_s - v_n, 0.05));
    
    // 菲涅尔：模拟生物发光，边缘发光强烈，中心透明，制造有机果冻质感
    float fresnel = pow(1.0 - max(dot(normal, vec3(0, 0, 1)), 0.0), 3.0);
    
    // --- 3. 基础色彩映射 ---
    vec3 baseCol = getAurora(dataB * 0.5 + iTime * 0.05);
    
    // --- 4. 混合最终视觉 ---
    // 用 v (浓度) 作为遮罩，结合次表面散色和生物荧光
    vec3 col = baseCol * v * 0.3; // 内部弱光
    col += baseCol * fresnel * gV * 2.5; // 边缘强烈的生物荧光
    
    // 增加边缘轮廓，让画面更锐利
    float edge = smoothstep(0.01, 0.03, length(vec2(v_e - v_w, v_n - v_s)));
    col += edge * baseCol * fresnel * 0.8;

    // --- 5. 渲染深邃背景与体积焦散 ---
    // 深海基色
    vec3 bgCol = vec3(0.002, 0.005, 0.01);
    
    // 模拟上方透射下来的流动光斑 (Caustics)
    float lightPattern = fbm2D(uv * 1.5 + iTime * 0.03, iTime * 0.02);
    lightPattern += smoothstep(0.5, 0.8, fbm2D(uv * 3.0 - iTime * 0.05, iTime * 0.01));
    bgCol += vec3(0.02, 0.06, 0.08) * lightPattern;
    
    // 混合背景与主体
    vec3 finalCol = mix(bgCol, col, smoothstep(0.01, 0.3, gV));
    
    // --- 6. 最后的电影化处理 ---
    // 增加细微的胶片颗粒感 (Film Grain) 消除数字感
    finalCol += (random2(uv + iTime).x - 0.5) * 0.02;

    // 暗角 (Vignette)
    finalCol *= smoothstep(1.3, 0.5, length(uv - 0.5));
    
    fragColor = vec4(clamp(finalCol, 0.0, 1.0), 1.0);
}