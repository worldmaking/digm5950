// Rotation matrix
mat2 rot(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a)); }

// Fractal Space Folding: Generating Extremely Complex Patterns
vec2 getFractalUV(vec2 uv) {
    uv = (uv - vec2(0.6, 0.45)) * 1.4;
    uv.x *= iResolution.x / iResolution.y;
    
    // Iterative Folding (IFS)
    for(int i = 0; i < 5; i++) {
        uv = abs(uv); // mirror
        if (uv.x < uv.y) uv = uv.yx; // Diagonal flip
        uv *= 1.5; // zoom in
        uv -= vec2(0.5, 0.8); // Offset
        uv *= rot(0.2 + iTime * 0.02); // Rotate slowly
    }
    return uv;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 baseUV = fragCoord / iResolution.xy;
    float mask = 1.-texture(iMask, baseUV).a;
    
    if (iMouse.z > 0.) {
        float mag = 10.;
        baseUV /= mag;
        baseUV += iMouse.xy / ((iResolution.xy + (iResolution.xy / (mag - 1.))));
    }
    
    
    // 1. Obtain the extremely complex kaleidoscope coordinates
    vec2 uv = getFractalUV(baseUV);
    
    // 2. Sampling a particle field
    vec4 A = texture(iChannel0, mod(uv * 0.1, 1.0));
  //  float d = distance(uv * 50.0, A.xy * 0.1);
    float d = distance(uv, A.xy/iResolution.xy);
    
    // 3. Texture Detail Layer
    // Domain-warped noise, creating a fibrous texture
    float f = abs(sin(uv.x * 5.0 + iTime)) * abs(cos(uv.y * 5.0));
    float wave = sin(length(uv) * 10.0 - iTime * 3.0);
    
    // 4. Precise color schemes
    vec3 colBlue = vec3(0.0, 0.5, 1.0); // Electric blue
    vec3 colGold = vec3(1.0, 0.6, 0.1); // Gold
    vec3 colBlack = vec3(0.02, 0.01, 0.05);
    
    // 5. Color blending logic
    // Alternate colors based on spatial position and particle identity
    float colorMixer = smoothstep(-1.0, 1.0, sin(uv.x + uv.y + iTime));
    vec3 baseCol = mix(colGold, colBlue, colorMixer * A.w);
    
    // Overlay dynamic light field
    float glow = exp(-d);
    vec3 finalCol = mix(colBlack, baseCol, glow * (0.5 + 0.5 * f));
    
    // Increase the electric blue core pulse
    float pulse = pow(glow, 4.0);
    finalCol += colBlue * pulse * 2.0;
    
    // Add details to the edges of the gold and fire
    float edge = smoothstep(0.4, 0.5, f);
    finalCol += colGold * edge * glow;

    // 6. Black outline (stained glass effect)
    float lines = smoothstep(0.0, 0.05, abs(uv.x * uv.y));
    finalCol *= mix(0.2, 1.0, lines);

    // Increase contrast in post-processing
    finalCol = pow(finalCol, vec3(1.1)) * 1.5;
    // Very slight vignetting, maintaining a full-screen look
    finalCol *= smoothstep(2.0, 0.5, length(baseUV - 0.5));



    fragColor = vec4(finalCol, 1.0) * mask;
}