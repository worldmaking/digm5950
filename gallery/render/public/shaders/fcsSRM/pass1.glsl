void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    // Normalized pixel coordinates (from 0 to 1), keeping the image in view based on the resolution size
    vec2 uv = fragCoord / iResolution.xy;
    vec2 px = 1.0 / iResolution.xy;
    
    // Establishes vec4 'state' to represent the previous location/state of a given cell
    vec4 state = texture(iChannel0, uv);
    float chem = texture(iChannel1, uv).r;

    // Establishes floats 'd', 'e', and 'p' for use elsewhere in the Buffer
    float d = state.r;
    float e = state.g;
    float p = state.b;
    
    // Establishes float 'voltage', representing Buffer C
    float voltage = texture(iChannel2, uv).r;

    // Establishes float 'lap' which uses the laplacian float established in the common tab to represent the current Buffer
    float lap = laplacian(iChannel0, uv, px);

    // Establishes vec2 'grad' which uses the gradient vec2 established in the common tab to represent Buffer B
    vec2 grad = gradient(iChannel1, uv, px);

    // Establishes vec2 'flow' that dictates the movement of the system
    vec2 flow = normalize(grad) * 0.1;
    
    // Establishes vec2 'eGrad', which uses the "electric" system established in Buffer C
    vec2 eGrad = gradient(iChannel2, uv, px);
    
    // Establishes float 'chaosMask' for use in altering the 'flow' vec2
    float chaosMask = noise(uv * 8.0 + iTime);
    
    // Applies an alteration of 'grad' and 'eGrad' to flow
    flow += grad * mix(-0.5, 1.0, chaosMask);
    flow += eGrad * mix(-1.0, 1.5, noise(uv * 6.0 - iTime));
    
    // Establishes floats related to advection, which leads to the overlapping movement found within the system
    float advectStrength = 5.0 + 10.0 * noise(uv * 4.0 + iTime);
    float advected = texture(iChannel0, uv - flow * px * advectStrength).r;

    // Uses float 'd' in combination with the above floats to allow the system to move as it does
    d = mix(d, advected, 0.75);
   
    // Establishes and utilizes floats 'pressure' and 'tension' to make the explosions more "rough" for lack of a better word
    float pressure = d * d;
    float tension  = -lap * 0.3;
    d += pressure * 0.04;
    d += tension;

    // Establishes and utilizes 'jitter' float. Without it, the system would just be a static white after a few seconds
    float jitter = (noise((uv) * 50.0 + iTime * 3.0) - 0.5) * 0.05;
    d += jitter;

    // Establishes and utilizes 'regrow' float that makes the bright, explosion-like cells more prevalent
    float regrow = smoothstep(0.0, 0.2, 0.25 - d) * 0.01;
    d += regrow;
    
    // Establishes 'intake', 'growth', and 'decay' floats to be used in the cell-spawning process
    float intake = chem * 0.25;
    float growth = d * (1.0 - d) * 0.25;
    float decay  = 0.08 * d;
    
    // Alters float 'e', with the above established floats
    e += growth + intake - decay;
    e = clamp(e, 0.05, 1.0);

    // An if statement that changes the values of 'd' and 'e' depending on their values following the above alterations
    if(e > 0.9 && d > 0.75)
    {
        d *= 0.7;
        e *= 0.7;
    }

    // The float 'p' is altered using the current state of 'd'
    p += 0.03 + d * 0.15;
    
    // The float 'd' is altered to keep the system running
    d = clamp(d, 0.0, 1.0);

    // Establishes floats 'cluster' and 'spawn' for use in the current Buffer
    float cluster = fbm((uv) * 6.0 + iTime * 0.2);
    float spawn = smoothstep(0.75, 0.85, cluster) * step(0.9, noise(uv * 20.0 + iTime));
    d += spawn * 0.5;
    
    // Establishes 'burst' float for use in the upcoming 'flow' modification
    float burst = step(0.85, noise(uv * 3.0 + floor(iTime * 2.0)));
    flow += vec2(
        noise(uv * 40.0 + iTime * 5.0),
        noise(uv * 40.0 - iTime * 5.0)
    ) * burst * 1.5;
    
    // Sets fragColor so the system is visible
    fragColor = vec4(d, e, fract(p), 1.0);

}