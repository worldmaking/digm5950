// Establishes vec2 'applyZoom' that contains the zoom-in interaction
vec2 applyZoom(vec2 uv)
{
    // Establishes vec2 'm' for use in the zoom-in interaction
    vec2 m = iMouse.xy / iResolution.xy;

    // The statment and following lines create the zoom-in interaction
    if(iMouse.z <= 0.0)
        m = vec2(0.5);
    float zoom = (iMouse.z > 0.0) ? 2.5 : 1.0;
    uv = (uv - m) / zoom + m;
    return uv;
}


void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    // Normalized pixel coordinates (from 0 to 1), keeping the image in view based on the resolution size
    vec2 uv = fragCoord / iResolution.xy;
    uv = applyZoom(uv);
    
    // Establishes vec4 'state' and floats 'chem' and 'voltage to visualize Buffer A, B, and C
    vec4 state = texture(iChannel0, uv);
    float chem = texture(iChannel1, uv).r;
    float voltage = texture(iChannel2, uv).r;
    
    // Establishes floats 'd', 'e', and 'p' for use elsewhere in the Buffer    
    float d = state.r;
    float e = state.g;
    float p = state.b;

    // Establishes vec3 'col' that creates the system's colour palette
    vec3 col = vec3(
        0.3 + 0.2 * d,
        0.2 + 0.8 * e,
        0.5 + 0.5 * sin(p * 6.283)
    );
    
    // Adds "chemical" glow through Buffer B
    col += vec3(1.0, 0.5, 0.2) * chem * 0.8;

    // Alters 'col' to stablize colours
    col *= smoothstep(0.0, 0.8, d);
    
    // Alters 'col' to apply the bright "electric" glow
    col += vec3(0.3, 0.8, 1.5) * voltage * 1.2;

    // Sets fragColor so the system is visible
    fragColor = vec4(col, 1.0);
}