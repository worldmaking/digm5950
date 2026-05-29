void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    vec2 uv = fragCoord / iResolution.xy;
    vec2 texel = 1.0 / iResolution.xy;

    // --- 1. 空间异质性参数 (生物群落调制) ---
    // 用噪声调制 F 和 K，创造出“生物多样性”，打破全屏均匀感
    float variantNoise = fbm2D(uv * 1.8 + iTime * 0.01, iTime * 0.005);
    float variantNoise2 = smoothNoise2D(uv * 3.5 - iTime * 0.02);
    
    // F 控制“喂食率”，K 控制“消亡率”
    // 在噪声高的区域产生斑点(Dots)，低区域产生迷宫线条(Stripes)
    float baseF = 0.03, baseK = 0.06;
    float F = mix(baseF - 0.005, baseF + 0.02, variantNoise); 
    float K = mix(baseK - 0.002, baseK + 0.008, variantNoise2);
    
    float Du = 0.2, Dv = 0.1; // 扩散速率

    // --- 2. 拉普拉斯算子 ---
    vec4 n = texture(iChannel1, uv + vec2(0,1)*texel);
    vec4 s = texture(iChannel1, uv - vec2(0,1)*texel);
    vec4 e = texture(iChannel1, uv + vec2(1,0)*texel);
    vec4 w = texture(iChannel1, uv - vec2(1,0)*texel);
    vec4 cur = texture(iChannel1, uv);
    vec4 lap = n + s + e + w - 4.0 * cur;

    // --- 3. Gray-Scott 公式更新 ---
    float u = cur.r;
    float v = cur.g;
    float reaction = u * v * v;
    
    float nextU = u + (Du * lap.r - reaction + F * (1.0 - u));
    float nextV = v + (Dv * lap.g + reaction - (F + K) * v);

    // --- 4. 生物交互 (Buffer A 注入活性物质 V) ---
    vec4 A = texture(iChannel0, uv);
    float dist = distance(fragCoord, A.xy);
    // 鱼群经过的地方会强烈激发反应，产生物质 V，A.w 控制强度
    float injection = smoothstep(3.0, 0.0, dist) * A.w;
    nextV += injection * 0.4;

    // --- 5. 洋流漂移 (让生成的线随洋流动起来) ---
    float flowNoise = fbm2D(uv * 1.0, iTime * 0.02);
    vec2 drift = vec2(cos(flowNoise * TWOPI), sin(flowNoise * TWOPI)) * 0.0006;
    vec4 advectedState = texture(iChannel1, uv - drift); 
    
    // 结合新计算的状态与漂移状态
    nextU = mix(clamp(nextU, 0.0, 1.0), advectedState.r, 0.05);
    nextV = mix(clamp(nextV, 0.0, 1.0), advectedState.g, 0.05);

    // B 通道存储色彩相位，随时间缓慢增长，并受活性 V 调制
    float phase = advectedState.b + 0.001 + nextV * 0.01;

    fragColor = vec4(nextU, nextV, phase, 1.0);
    
    // 初始化 (全屏充满 U)
    if(iFrame < 10) fragColor = vec4(1.0, 0.0, 0.0, 1.0);
}