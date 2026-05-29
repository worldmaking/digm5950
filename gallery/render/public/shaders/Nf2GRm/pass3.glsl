// Reuse the rotation matrix from your Image
mat2 rot(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a)); }

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec2 p = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    
    // Generate a fractal arena (based on a variation of your original getFractalUV logic)
    vec2 flow = p;
    for(int i = 0; i < 4; i++) {
        flow = abs(flow);
        if (flow.x < flow.y) flow = flow.yx;
        flow *= 1.5;
        flow -= vec2(0.5, 0.8);
        flow *= rot(0.2 + iTime * 0.05); 
    }
    
    // Convert the fractal coordinates into a two-dimensional velocity vector
    vec2 velocity = normalize(flow) * 30.0; // 30.0 is the flow field intensity
    
    // Retrieve the particle state at the current position (Buffer A) - Space reserved here for interaction
    vec4 particleData = texture(iChannel0, uv);
    
    // Time smoothing (reading the buffer B from the previous frame) makes the flow field changes smoother and less abrupt
    vec4 prevField = texture(iChannel1, uv);
    vec2 smoothedVelocity = mix(velocity, prevField.xy, 0.9);
    
    // Output flow field velocity
    fragColor = vec4(smoothedVelocity, 0.0, 1.0);
}