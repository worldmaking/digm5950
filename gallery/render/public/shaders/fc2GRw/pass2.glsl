// BUFFER A: Group 1 of agents
// each pixel tracks an agent
// .xy is the agent location (in pixels)
// .z is the agent direction (in radians)
// .w is the agent's memory

// given current particle "A" at pixel `fragCoord`
// is the particle at `fragCoord+offset` nearer? if so return that.
vec4 getNearestParticle(vec4 A, vec2 fragCoord, vec2 offset) {
    // get by neighbour pixel
    vec4 N = texture(iChannel0, (fragCoord+offset)/iResolution.xy);
    // distance from my pixel to the particle I'm tracking:
    float d1 = distance(fragCoord, A.xy);
    // distance from my pixel to the particle my neighbor is tracking:
    float d2 = distance(fragCoord, N.xy);
    // if my neighbor's particle is nearer, track that instead! 
    if (d2 < d1) { return N; } else { return A; }
}

void mainImage( out vec4 fragColor, in vec2 fragCoord) {
    // convert pixel coordinate to normalize texture coord
    vec2 uv = fragCoord / iResolution.xy;
    // our previous state
    vec4 A = texture(iChannel0, uv);
    
    // make sure we are tracking the nearest particle by testing
    // each of our nearest pixels to see if their particle is nearer
    for (int x=-2; x<=2; x++) {
        for (int y=-2; y<=2; y++) {
            A = getNearestParticle(A, fragCoord, vec2(x, y));
        }
    }
    
    // set initial speed, direction and sensor length
    float speed = 50.;
    float turn = 0.;
    float sensorLength = 12.;
    
    mat2 rot = rotate2d(A.z);
    vec2 sensor0 = vec2(1, 0) * sensorLength;
    vec2 sensor1 = vec2(1, 1) * sensorLength;
    vec2 sensor2 = vec2(1, -1) * sensorLength;
    vec2 sensor0InWorld = rot * sensor0 + A.xy; //apply rotation to the sensor and add that to our agent's location
    vec2 sensor1InWorld = rot * sensor1 + A.xy;
    vec2 sensor2InWorld = rot * sensor2 + A.xy;
    
    // get trail field where the antennae are
    vec4 F = texture(iChannel2, sensor0InWorld / iResolution.xy);
    vec4 FL = texture(iChannel2, sensor1InWorld / iResolution.xy);
    vec4 FR = texture(iChannel2, sensor2InWorld / iResolution.xy);
    
    // make noise
    vec4 noise = random4(vec3(A.xy, iTime));

    // make trails AND follow those trails
    if (F.x > FL.x && F.x > FR.x) {
        // no change to heading
        
    } else if (F.x < FL.x && F.x < FR.x) {
        // rotate randomly left or right
        A.z += (noise.z - 0.5); // only get noise values between -0.5 -> 0.5 (same num above and below 0 to balance)
    } else if (FL.x < FR.x) {
        // rotate right
        A.z += 1.;
    } else if (FR.x < FL.x) {
        // rotate left
        A.z -= 1.;
    }

    // Apply the turn
    A.z += turn; // * (noise.x*2. - 1.);
    
    // move the particle to the location determined by the velocity (gotten from A.z direction)
    // convert polar to cartesian coordinates
    vec2 vel = rot * vec2(speed, 0);
    
    // integrate velocity with position
    A.xy += vel * iTimeDelta;
    
    // get the bounded position within the screen image
    vec2 b = clamp(A.xy, vec2(0), iResolution.xy);
    // compare the bounded and actual positions; if they are different reflect their orientations
    if (A.x != b.x) { A.z = TWOPI*0.5 - A.z; } // reflect in Y axis
    if (A.y != b.y) { A.z = TWOPI - A.z; } // reflect in X axis
    // clamp the position on screen
    A.xy = b.xy; 
    
    
    // initialize:
    if (iFrame == 0) {
        //A.xy = iResolution.xy * noise.xy;
        // every pixel in a NxN square is tracking the same particle
        // round the position to the nearest "N"
        float N = 30.;
        A.xy = round(fragCoord/N) * N;
        // we have to seed the random generator using the particle's
        // location, not the pixel location, so that all pixels agree
        vec4 noise = random4(vec3(A.xy, iFrame));
                
        // set the direction of the agents
        A.z = noise.z * TWOPI;
    }
    
    fragColor = A;
}