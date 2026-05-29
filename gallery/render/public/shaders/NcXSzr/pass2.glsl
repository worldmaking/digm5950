// JFA 风格的最邻近粒子追踪
vec4 getNearestParticle(vec4 A, vec2 fragCoord, vec2 offset) {
    vec4 N = texture(iChannel0, (fragCoord+offset)/iResolution.xy);
    float d1 = distance(fragCoord, A.xy);
    float d2 = distance(fragCoord, N.xy);
    if (d2 < d1) { return N; } else { return A; }
}

void mainImage( out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec4 A = texture(iChannel0, uv);
    
    // --- 1. 物理追踪与种群维持 ---
    for (int x=-2; x<=2; x++) {
        for (int y=-2; y<=2; y++) {
            A = getNearestParticle(A, fragCoord, vec2(x, y));
        }
    }
    
    float myDist = distance(fragCoord, A.xy);
    // 维持种群密度，如果某处空了，就在本地诞生新生物
    if (myDist > 25.0) {
        A.xy = fragCoord + (random2(fragCoord + iTime) - 0.5) * 10.0;
        A.z = random2(fragCoord + iTime + 1.0).x * TWOPI;
        A.w = 0.0; // 初始为黯淡状态
    }

    // --- 2. 智能行为逻辑 ---
    vec4 noise = random4(vec3(A.xy, iTime));
    
    float baseSpeed = 50. + noise.y * 20.0; 
    float speed = baseSpeed;
    float turnfactor = 0.3; 
    float sensor_length = 25.; 
    
    mat2 rot = rotate2d(A.z);
    // 三个前向传感器
    vec2 sensorF_pos = rot * vec2(1, 0) * sensor_length + A.xy;
    vec2 sensorL_pos = rot * vec2(1, 1) * sensor_length + A.xy; 
    vec2 sensorR_pos = rot * vec2(1, -1) * sensor_length + A.xy;
    
    // 采样栖息地 V 浓度 (来自 Buffer B)
    float habF = texture(iChannel1, sensorF_pos / iResolution.xy).g;
    float habL = texture(iChannel1, sensorL_pos / iResolution.xy).g;
    float habR = texture(iChannel1, sensorR_pos / iResolution.xy).g;
    float maxHab = max(habF, max(habL, habR));

    // 采样鼠标诱饵 (来自 Buffer C)
    float lureF = texture(iChannel2, sensorF_pos / iResolution.xy).r;
    float lureL = texture(iChannel2, sensorL_pos / iResolution.xy).r;
    float lureR = texture(iChannel2, sensorR_pos / iResolution.xy).r;
    float maxLure = max(lureF, max(lureL, lureR));

    // 基础漫游转向
    A.z += (noise.x - 0.5) * 0.15;

    // --- 决策树 ---
    if (maxLure > 0.1) {
        // A. 优先级最高：响应鼠标诱饵 (掠食/逃跑模式)
        if (lureF > lureL && lureF > lureR) { /* 直行 */ } 
        else if (lureL > lureR) { A.z += turnfactor * 1.5; } 
        else { A.z -= turnfactor * 1.5; }
        speed = baseSpeed * 2.5; // 兴奋加速
    } 
    else if (maxHab > 0.05) {
        // B. 优先级中等：趋生行为 (游向有机质浓度高的地方)
        if (habF > habL && habF > habR) { A.z += (noise.x-0.5)*0.05; } // 在物质中轻微晃动游动
        else if (habL > habR) { A.z += turnfactor * 0.5; } 
        else { A.z -= turnfactor * 0.5; }
        speed = baseSpeed * (1.0 + maxHab); // 有食物时加速
    }
    else {
        // C. 空旷地带：洋流漂移与随机漫游
        if (iMouse.z > 0.0) {
            // 鼠标点击时的全局召唤
            vec2 dirToMouse = normalize(iMouse.xy - A.xy);
            float angleToMouse = atan(dirToMouse.y, dirToMouse.x);
            A.z = mix(A.z, angleToMouse, 0.05);
            speed = baseSpeed * 1.5;
        } else {
            // 随洋流漂移
            float flowAngle = fbm2D(A.xy * 0.003, iTime * 0.05) * TWOPI * 2.0; 
            A.z = mix(A.z, flowAngle, 0.08);
            speed = baseSpeed * 0.6; // 节能模式
        }
    }
    
    // --- 3. 运动学更新 ---
    vec2 vel = rot * vec2(speed, 0);
    A.xy += vel * iTimeDelta;
    
    // 边界反弹
    vec2 b = clamp(A.xy, vec2(0), iResolution.xy);
    if (A.x != b.x) { A.z = TWOPI*0.5 - A.z; A.xy.x = b.x;}
    if (A.y != b.y) { A.z = TWOPI - A.z; A.xy.y = b.y;}
    
    // --- 4. 生命反馈 (A.w 代表光亮强度) ---
    // 生物在有机质丰富的地方会变得明亮健康，在空旷处黯淡
    A.w = mix(A.w, smoothstep(0.02, 0.5, maxHab) * 1.2, 0.05);
    if(maxLure > 0.5) A.w = 1.5; // 被诱饵激活时发出强光

    // 初始化
    if (iFrame < 5) {
        A.xy = random2(fragCoord).xy * iResolution.xy;
        A.z = random2(fragCoord).y * TWOPI; 
        A.w = 1.0; 
    }
    
    fragColor = A;
}