// Generate a high-density cluster of dynamic energy points

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec4 A = texture(iChannel0, uv);
    
    if (iFrame < 5 || length(A.xy) < 0.1) {
        float gridSize = 20.0; // A very dense grid to ensure the screen is completely filled
        A.xy = (floor(fragCoord / gridSize) + 0.5) * gridSize;
        A.z = fract(sin(dot(A.xy, vec2(12.9, 78.2))) * 437.5) * 6.28;
        A.w = fract(sin(A.z) * 123.4);
    }
    
    // Search for the nearest particle 
    for (int x = -1; x <= 1; x++) {
        for (int y = -1; y <= 1; y++) {
            vec4 N = texture(iChannel0, (fragCoord + vec2(x,y)*4.0) / iResolution.xy);
            if (distance(fragCoord, N.xy) < distance(fragCoord, A.xy)) A = N;
        }
    }
    
    // [Fluid Motion Logic]
    // 1. Read the “fractal wind direction” at the current particle's position from Buffer B
    vec2 fieldVelocity = texture(iChannel1, A.xy / iResolution.xy).xy;
    
    // 2. Combine the original basic motion with fractal field motion
    vec2 baseMotion = vec2(cos(A.z + iTime*0.3), sin(A.z + iTime*0.3)) * 10.0; // Reduce the intensity of the basic exercises
    A.xy += (baseMotion + fieldVelocity) * iTimeDelta; 
    
    A.xy = mod(A.xy, iResolution.xy); // Loop coordinates, never go black
    A.xy = clamp(A.xy, vec2(0), iResolution.xy);
    
    fragColor = A;
}