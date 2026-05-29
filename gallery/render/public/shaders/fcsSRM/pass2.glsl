void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    // Normalized pixel coordinates (from 0 to 1), keeping the image in view based on the resolution size
    vec2 uv = fragCoord / iResolution.xy;
    vec2 px = 1.0 / iResolution.xy;

    // Establishes float 'heat' represent the previous location/state of a given cell, in this case, being used for the heat map
    float heat = texture(iChannel0, uv).r;
    float lap = laplacian(iChannel0, uv, px);

    // Establishes float 'blurred' for use elsewhere in the Buffer
    float blurred = heat + lap * 0.5;

    // Establishes float 'decay', which destroys the bright cells as they move
    float decay = 0.98;
    blurred *= decay;

    // Establishes floats 'cellDensity' and 'heatAdd' that work with Buffer A
    float cellDensity = texture(iChannel1, uv).r;
    float heatAdd = cellDensity * 0.05;
    blurred += heatAdd;

    // Alters 'blurred' so it is limited to a value between 0.0 and 1.0
    blurred = clamp(blurred, 0.0, 1.0);

    // Sets fragColor so the system is visible
    fragColor = vec4(blurred,0.0,0.0,1.0);
}