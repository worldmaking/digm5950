void mainImage( out vec4 fragColor, in vec2 fragCoord ) {

    // --------------------------------------------------
    // Normalized coordinates
    // --------------------------------------------------
    vec2 uv = fragCoord / iResolution.xy;
    float mask = 1.-texture(iMask, uv).a;

    // --------------------------------------------------
    // Zoom interaction (unchanged)
    // --------------------------------------------------
    if (iMouse.z > 0.0) {
        float magnification = 4.0;
        uv /= magnification;
        uv += iMouse.xy /
              (iResolution.xy + (iResolution.xy / (magnification - 1.0)));
    }

    // --------------------------------------------------
    // Read CA state from Buffer A
    // --------------------------------------------------
    float state = texture(iChannel0, uv).r;

    // --------------------------------------------------
    // Compute local density (neighbor average)
    // --------------------------------------------------
    float density = 0.0;

    for (int x = -1; x <= 1; x++) {
        for (int y = -1; y <= 1; y++) {
           vec2 offsetUV = uv + vec2(x, y) / iResolution.xy;
           density += step(0.9, texture(iChannel0, offsetUV).r);
        }
    }

    density /= 9.0; // normalize to [0,1]

    // --------------------------------------------------
    // Map state + density to color
    // --------------------------------------------------
    vec3 color = mix(
        vec3(0.1, 0.2, 0.6)*0.5,   // low-density/dead: blue
        vec3(1.0, 0.4, 0.1),   // high-density/active: orange
        density
    );

    // subtle glow based on current state
    color += state * vec3(0.6, 0.6, 0.4);

    fragColor = vec4(color, 1.0) * mask;
}

