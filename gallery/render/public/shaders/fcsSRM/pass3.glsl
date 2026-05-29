void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    // Normalized pixel coordinates (from 0 to 1), keeping the image in view based on the resolution size
    vec2 uv = fragCoord / iResolution.xy;
    vec2 px = 1.0 / iResolution.xy;
    
    // Establishes vec4 'state' to represent the previous location/state of a given cell
    vec4 state = texture(iChannel0, uv);
    
    // Establishes floats 'v' and 'r' that represent the metaphorical "voltage" and "revovery" systems found within the Buffer
    float v = state.r; // voltage
    float r = state.g; // recovery

    // Establishes float 'lap' which uses the laplacian float established in the common tab to represent the current Buffer
    float lap = laplacian(iChannel0, uv, px);

    // Establishes floats 'cellDensity' that works with Buffer A
    float cellDensity = texture(iChannel1, uv).r;

    // Establishes float 'stimulus' that triggers when density is in a "sweet spot"
    float stimulus = smoothstep(0.3, 0.6, cellDensity) * 0.8;

    // Establishes floats 'diffusion', 'excite', and 'recover' that are used to alter 'v' and 'r' later in the system
    float diffusion = 1.2;
    float excite    = 1.5;
    float recover   = 0.8;

    // Alters 'v' using the aboce floats
    v += diffusion * lap;
    v += excite * stimulus * (1.0 - r);

    // Establishes natural, constant "decay" within 'v'
    v *= 0.96;

    // Makes 'r' increases when active
    r += v * 0.05;

    // Establishes natural, constant "decay" within 'r'
    r *= 0.97;

    // Clamps both 'v' and 'r' to make sure their values are between 0.0 and 1.0
    v = clamp(v, 0.0, 1.0);
    r = clamp(r, 0.0, 1.0);
    
    // Sets fragColor so the system is visible
    fragColor = vec4(v, r, 0.0, 1.0);
}