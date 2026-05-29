// Buffer A
// This buffer controls ALL agent behavior.
// Each pixel represents one agent.

// Data stored in A:
// A.xy = position (in pixels)
// A.z  = direction (angle in radians)
// A.w  = caste / personality

// Caste ranges:
// 0.0–0.33  = forager (food-seeking)
// 0.33–0.66 = settler (stability-seeking)
// 0.66–1.0  = disruptor (chaos-seeking)
//
// 0.42–0.58 = hybrid (fusion state)


// Finds the closest agent nearby (for tracking system)
vec4 getNearestParticle(vec4 A, vec2 fragCoord, vec2 offset)
{
    // Wrap coordinates so simulation loops around edges
    vec2 wrapped = mod(fragCoord + offset + iResolution.xy, iResolution.xy);

    // Sample neighbor agent
    vec4 N = texture(iChannel0, wrapped / iResolution.xy);

    // Compare distances
    float d1 = distance(fragCoord, A.xy);
    float d2 = distance(fragCoord, N.xy);

    // Return whichever agent is closer
    return (d2 < d1) ? N : A;
}

// Finds a nearby agent to simulate "collision" / fusion
vec4 getCloseNeighbor(vec2 fragCoord, vec4 selfParticle, float radius)
{
    for (int x = -3; x <= 3; x++)
    {
        for (int y = -3; y <= 3; y++)
        {
            // Wrap around screen edges
            vec2 wrapped = mod(fragCoord + vec2(x, y) + iResolution.xy,
                               iResolution.xy);

            vec4 N = texture(iChannel0, wrapped / iResolution.xy);

            // Compute toroidal (wrap-around) distance
            vec2 delta = abs(selfParticle.xy - N.xy);
            delta = min(delta, iResolution.xy - delta);
            float d = length(delta);

            // If close enough, return this neighbor
            if (d > 0.5 && d < radius)
            {
                return N;
            }
        }
    }

    return selfParticle;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord / iResolution.xy;

    // Current agent
    vec4 A = texture(iChannel0, uv);

  
    // Find nearest agent (particle tracking system)
    for (int x = -2; x <= 2; x++)
    {
        for (int y = -2; y <= 2; y++)
        {
            A = getNearestParticle(A, fragCoord, vec2(x, y));
        }
    }

    // Random noise for variation
    vec4 noise = random4(vec3(A.xy, iTime));

    // Base movement values
    float speed = 42.0;
    float wander = 0.45;
    float turnfactor = 0.42;
    float sensor_length = 10.0;

    // Determine agent type
    float caste = floor(A.w * 3.0);
    bool hybrid = (A.w > 0.42 && A.w < 0.58);

    // Fusion / collision logic

    vec4 neighbor = getCloseNeighbor(fragCoord, A, 6.0);

    // Compute distance with wrapping
    vec2 nDelta = abs(A.xy - neighbor.xy);
    nDelta = min(nDelta, iResolution.xy - nDelta);
    float neighborDist = length(nDelta);

    float neighborCaste = floor(neighbor.w * 3.0);
    bool neighborHybrid = (neighbor.w > 0.42 && neighbor.w < 0.58);

    if (neighborDist < 4.0)
    {
        // Fusion rule: forager + disruptor
        bool fusionPair =
            ((caste < 0.5 && neighborCaste > 1.5) ||
             (caste > 1.5 && neighborCaste < 0.5));

        // Hybrid can absorb others
        bool hybridAbsorb =
            (hybrid && !neighborHybrid && neighborDist < 3.0);

        if (fusionPair || hybridAbsorb)
        {
            // Pull positions together
            A.xy = mix(A.xy, neighbor.xy, 0.08);

            // Blend directions
            A.z = mix(A.z, neighbor.z, 0.5);

            // Become hybrid
            A.w = 0.5 + 0.06 * sin(iTime + A.xy.x * 0.01 + A.xy.y * 0.01);

            caste = floor(A.w * 3.0);
            hybrid = true;
        }
    }

    // Behavior tuning based on caste

    float sugarBias;
    float membraneBias;
    float changeBias;
    float tempBias;

    if (hybrid)
    {
        // Smooth, balanced movement
        speed = 18.0;
        wander = 0.08;
        turnfactor = 0.18;
        sensor_length = 16.0;

        sugarBias = 1.1;
        membraneBias = 0.85;
        changeBias = 0.65;
        tempBias = 0.05;
    }
    else if (caste < 0.5)
    {
        // Foragers (fast, food-seeking)
        speed = 54.0;
        wander = 0.20;
        turnfactor = 0.62;
        sensor_length = 14.0;

        sugarBias = 2.2;
        membraneBias = 0.15;
        changeBias = 0.10;
        tempBias = 0.12;
    }
    else if (caste < 1.5)
    {
        // Settlers (slow, stable)
        speed = 24.0;
        wander = 0.10;
        turnfactor = 0.22;
        sensor_length = 8.0;

        sugarBias = 0.65;
        membraneBias = 1.35;
        changeBias = -0.45;
        tempBias = -0.20;
    }
    else
    {
        // Disruptors (fast, chaotic)
        speed = 62.0;
        wander = 0.82;
        turnfactor = 0.70;
        sensor_length = 11.0;

        sugarBias = 0.55;
        membraneBias = 0.25;
        changeBias = 1.80;
        tempBias = 0.42;
    }

    // Directional sensing (front, left, right)

    mat2 rot = rotate2d(A.z);

    vec2 sensor0 = vec2(1.0,  0.0) * sensor_length;
    vec2 sensor1 = vec2(1.0,  1.0) * sensor_length;
    vec2 sensor2 = vec2(1.0, -1.0) * sensor_length;

    vec2 sensor0_world = mod(rot * sensor0 + A.xy + iResolution.xy, iResolution.xy);
    vec2 sensor1_world = mod(rot * sensor1 + A.xy + iResolution.xy, iResolution.xy);
    vec2 sensor2_world = mod(rot * sensor2 + A.xy + iResolution.xy, iResolution.xy);

    // Sample environment (food + disturbance)
    vec4 F  = texture(iChannel1, sensor0_world / iResolution.xy);
    vec4 FL = texture(iChannel1, sensor1_world / iResolution.xy);
    vec4 FR = texture(iChannel1, sensor2_world / iResolution.xy);

    // Sample substrate
    vec4 D0 = texture(iChannel2, sensor0_world / iResolution.xy);
    vec4 D1 = texture(iChannel2, sensor1_world / iResolution.xy);
    vec4 D2 = texture(iChannel2, sensor2_world / iResolution.xy);

    // Combine influences into movement decisions
    float front =
          F.r * sugarBias
        - F.g * 0.9
        + D0.r * membraneBias
        + D0.a * changeBias;

    float left =
          FL.r * sugarBias
        - FL.g * 0.9
        + D1.r * membraneBias
        + D1.a * changeBias;

    float right =
          FR.r * sugarBias
        - FR.g * 0.9
        + D2.r * membraneBias
        + D2.a * changeBias;

    // Steering decision
    if (front < left && front < right)
        A.z += wander * (noise.z - 0.5);
    else if (left < right)
        A.z += turnfactor;
    else if (right < left)
        A.z -= turnfactor;

    // Swim motion (adds organic movement)

    float swimPhase = iTime * 4.0 + A.xy.x * 0.01;

    A.z += sin(swimPhase) * 0.1;

    // Move agent
    vec2 vel = rotate2d(A.z) * vec2(speed, 0.0);
    A.xy += vel * iTimeDelta;

    // Wrap around screen (important!)
    A.xy = mod(A.xy + iResolution.xy, iResolution.xy);

 
    if (iFrame == 0)
    {
        float N = 28.0;
        A.xy = round(fragCoord / N) * N;

        vec4 seed = random4(vec3(A.xy, iFrame));
        A.z = seed.z * TWOPI;
        A.w = seed.w;
    }

    fragColor = A;
}