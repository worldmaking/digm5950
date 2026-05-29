// sugar landscape (shader that generates the field / energy environment)

// Gaussian blur kernel (currently unused)
mat3 gaussBlur = mat3(
        1, 2, 1,
        2, 4, 2,
        1, 2, 1
    ) * 1.0/16.0;

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {

    // Normalized coordinates (0–1)
    vec2 uv = (fragCoord / iResolution.xy);
    
    // Field state from previous frame (trail / sugar)
    vec4 C = texture(iChannel2, uv);

    // ===== Diffusion =====
    // Get neighboring pixels (up, down, left, right)
    vec4 N = texture(iChannel2, (fragCoord + vec2(0, 1)) / iResolution.xy);
    vec4 S = texture(iChannel2, (fragCoord + vec2(0, -1)) / iResolution.xy);
    vec4 E = texture(iChannel2, (fragCoord + vec2(1, 0)) / iResolution.xy);
    vec4 W = texture(iChannel2, (fragCoord + vec2(-1, 0)) / iResolution.xy);

    // Create "blurring" by averaging neighbors
    vec4 avg = (N + S + E + W) / 4.;

    // Blend current value with average → diffusion of the field
    C = mix(C, avg, 0.);

    // ===== Decay =====
    // Gradually fades over time (memory fading)
    C = C * 0.95;
    
    // ===== Writing by particles =====
    // Get particle data
    vec4 A = texture(iChannel0, uv);

    // Distance between this pixel and the particle
    float dist = distance(fragCoord, A.xy);

    // Add to field based on distance (stronger at the center)
    C += exp(-dist * dist);
    
    
    // ===== Moving energy source (circular motion) =====
    float a = iTime * 0.2;
    float r = iResolution.y / 2.;

    // Point moving in a circle around the center
    vec2 p = vec2(iResolution.xy / 2.);
    p.x += r * cos(a);
    p.y += r * sin(a);

    // Option to control position with mouse (currently disabled)
    if (iMouse.z > 0.0) {
        // p = iMouse.xy;
    }

    float d = distance(fragCoord, p*5.);
    
    // ===== Circle radius (time-varying) =====
    float circleRadius = 100.0 + 150.0 * sin(iTime * 2.0);
    
    // ===== Ring structure (around particles) =====
    // Ring based on distance (strong at a specific radius, not center)
    float ring = exp(-0.02 * (dist - 12.0) * (dist - 12.0));
    C += ring;
    
    // ===== Value clamping =====
    // Keep field values within 0–1
    C = clamp(C, 0., 1.);
    
    // ===== Soft circular energy =====
    // Smooth-edged glowing circle
    float circle = smoothstep(circleRadius, circleRadius - 20.0, d);
    C += vec4(circle);
    
    // ===== Multiple energy sources (two moving points) =====
    vec2 p1 = iResolution.xy * vec2(
        0.3 + 0.3 * cos(iTime),
        0.5 + 0.2 * sin(iTime)
    );

    vec2 p2 = iResolution.xy * vec2(
        0.7 + 0.2 * cos(iTime * 1.3),
        0.5 + 0.2 * sin(iTime * 0.8)
    );

    float d1 = distance(fragCoord, p1);
    float d2 = distance(fragCoord, p2);

    // Smooth glowing fields
    float c1 = smoothstep(120.0, 10.0, d1);
    float c2 = smoothstep(100.0, 70.0, d2);

    C += vec4(c1 + c2);

    // ===== Composition with camera (live or external video) =====
    vec4 cam = texture(iChannel2, uv);

    // Blend field with camera (light overlay at 0.25)
    fragColor = mix(C, cam, 0.25);
}