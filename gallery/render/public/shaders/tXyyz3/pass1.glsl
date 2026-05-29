/*
------------------------------------------------------------
Student Number: 219029677
Name: Santiago Bucio-Cano
Title: Big Bang Cellular Automaton

Buffers:
- Buffer A: Stores the persistent cellular state (feedback buffer)
- Image: Displays the state stored in Buffer A

Interactions / Parameters:
- Mouse Interaction where it clears space
- The system is stochastic: resetting the shader will produce
  slightly different long-term behaviors due to rare random sparks.
- Interesting parameters to modify:
    * decay            – controls how slowly cells fade through phases
    * neighbour limits – birth condition sensitivity
    * noise threshold  – frequency of spontaneous activation
    * initial blob radius (currently 20 pixels)

System Description:
This system is a modified cellular automaton inspired by Conway’s
Game of Life, but extended with a continuous-valued state rather
than binary alive/dead cells. Cells are born at full intensity (1.0),
then decay through several discrete "phases" before becoming dead.

Rather than strict Life rules, birth occurs when a small number of
neighbors are active, and death is gradual rather than immediate.
Rare spontaneous activations introduce long-term variation and
prevent the system from settling into static patterns.

The result is a randomly evolving, organic-looking field that can
support growth, decay, and re-ignition over long timescales.

Sources / Inspiration:
- Conway’s Game of Life (John Conway)
- Course notes on feedback buffers in Shadertoy
- Noise function adapted from common GLSL hash patterns

Technical Realization:
The system uses a feedback buffer (iChannel0) to store state between
frames. Each pixel samples its 8 neighbors, counts active cells, and
updates its state based on decay rules and neighborhood conditions.
Multiple phase thresholds are used to create visually distinct decay
bands.

Future Extensions:
- Color mapping based on phase instead of grayscale
- Directional bias or flow fields
- Larger neighborhood kernels or continuous diffusion
------------------------------------------------------------
*/

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    // --------------------------------------------------
    // Normalized pixel coordinates (0–1)
    // --------------------------------------------------
    vec2 uv = fragCoord / iResolution.xy;
    float mask = 1.-texture(iMask, uv).a;

    // --------------------------------------------------
    // Read previous frame state from feedback buffer
    // --------------------------------------------------
    vec4 previousState = texture(iChannel0, uv);
    float cellState = previousState.r;

    // --------------------------------------------------
    // Initialization (first frame only)
    // Create a circular seed in the center of the screen
    // --------------------------------------------------
    if (iFrame == 0)
    {
        vec2 screenCenter = iResolution.xy * vec2(0.76, 0.35);
        float distanceFromCenter = length(fragCoord - screenCenter);

        // Cells inside radius start fully alive
        cellState = (distanceFromCenter < 20.0) ? 2.0 : cellState;
    }
    if (iFrame == 0)
    {
        vec2 screenCenter = iResolution.xy * vec2(0.23, 0.25);
        float distanceFromCenter = length(fragCoord - screenCenter);

        // Cells inside radius start fully alive
        cellState = (distanceFromCenter < 20.0) ? 2.0 : cellState;
    }

    // --------------------------------------------------
    // Sample Moore neighborhood (8 surrounding pixels)
    // --------------------------------------------------
    vec2 pixel = 1.0 / iResolution.xy;

    vec4 east      = texture(iChannel0, uv + vec2( 1.0,  0.0) * pixel);
    vec4 west      = texture(iChannel0, uv + vec2(-1.0,  0.0) * pixel);
    vec4 north     = texture(iChannel0, uv + vec2( 0.0,  1.0) * pixel);
    vec4 south     = texture(iChannel0, uv + vec2( 0.0, -1.0) * pixel);
    vec4 northeast = texture(iChannel0, uv + vec2( 1.0,  1.0) * pixel);
    vec4 northwest = texture(iChannel0, uv + vec2(-1.0,  1.0) * pixel);
    vec4 southeast = texture(iChannel0, uv + vec2( 1.0, -1.0) * pixel);
    vec4 southwest = texture(iChannel0, uv + vec2(-1.0, -1.0) * pixel);

    // --------------------------------------------------
    // Count how many neighboring cells are "alive"
    // A threshold is used since state is continuous
    // --------------------------------------------------
    int neighbourCount =
          int(east.x      > 0.5)
        + int(west.x      > 0.5)
        + int(north.x     > 0.5)
        + int(south.x     > 0.5)
        + int(northeast.x > 0.5)
        + int(northwest.x > 0.5)
        + int(southeast.x > 0.5)
        + int(southwest.x > 0.5);

    // --------------------------------------------------
    // Phase-based decay and birth rules
    // --------------------------------------------------
    float decayRate = 0.03;   // Smaller values slow evolution
    float nextState = cellState;
    float globalDecay = decayRate + float(iFrame) * 0.0001;

    // Fully alive → slowly decay but clamp to phase floor
    if (cellState > 0.9)
    {
        nextState = max(0.66, cellState - globalDecay);

    }
    // Mid-phase decay
    else if (cellState > 0.5)
    {
        nextState = max(0.33, cellState - decayRate);
    }
    // Final fading phase
    else if (cellState > 0.1)
    {
        nextState = max(0.0, cellState - decayRate);
    }
    else
    {
        // --------------------------------------------------
        // Dead cell logic:
        // - Can be born from neighbors
        // - Or rarely sparked by noise
        // --------------------------------------------------

        // Simple pseudorandom hash-based noise for randomness
        vec4 noise = random4(fragCoord.xy);

        // Birth condition similar to Game of Life
        if (neighbourCount == 3)
        {
            nextState = 1.0;
        }
    
    }

    // --------------------------------------------------
    // Mouse interaction: energy injection
    // --------------------------------------------------
    if (iMouse.z > 0.0) // left mouse button
    {
        vec2 mouseUV = iMouse.xy / iResolution.xy;
        float d = distance(uv, mouseUV);

        float radius   = 0.05;  // brush size
        float strength = 1.2;   // injected energy

        float influence = smoothstep(radius, 0.0, d);

        // Additive injection (respects decay phases)
        nextState = max(nextState, influence * strength);
    }
    
    // --------------------------------------------------
    // Output grayscale color based on cell state
    // --------------------------------------------------
    
    fragColor = vec4(nextState, nextState, nextState, 1.0) * mask;
}


