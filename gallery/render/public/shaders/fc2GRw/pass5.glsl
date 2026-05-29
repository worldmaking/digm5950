// BUFFER D: Group 2 of agents

// each pixel tracks an agent
// .xy is the agent location (in pixels)
// .z is the agent direction (in radians)
// .w is the agent's memory

// D is group 2 of agents They chase the agents from group 1 in Buffer A

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
    float mask = 1.-texture(iMask, uv).a;
    
    // our previous states
    vec4 D = texture(iChannel0, uv);
    
    // See which pixel is closest to each agent
    for (int x=-2; x<=2; x++) {
        for (int y=-2; y<=2; y++) {
            D = getNearestParticle(D, fragCoord, vec2(x, y));
        }
    }
       
    // set initial speed and direction
    float speed = 700.;
    float turn = 0.;
    
    // sense the agents in buffer A:
    vec4 B = texture(iChannel1, D.xy / iResolution.xy);
    float smell = B.g;
    
    // compare the current smell to my memory of the smell from the last frame
    float memory = D.w;
    
    // is my life getting better?
    if (smell > memory) {
        // if the smell here is better than the previous frame, keep going straight and go really slow
        turn = 0.01;
        speed = 3.;
    } else {
        // if the smell is not better, try another direction and move really quickly
        turn = 1.;
        speed = 100.; 
    }
    
    // Apply the turn at a pseudorandom angle
    vec4 noise = random4(vec3(D.xy, iTime));
    D.z += turn * (noise.x*2. - 1.);
    
    // move the particle to the location determined by the velocity (gotten from A.z direction)
    // convert polar to cartesian coordinates
    vec2 vel = vec2(cos(D.z), sin(D.z)) * speed;
    
    // integrate velocity with position
    D.xy += vel * iTimeDelta;
    
    // get the bounded position within the screen image
    vec2 b = clamp(D.xy, vec2(0), iResolution.xy);
    // compare the bounded and actual positions; if they are different reflect their orientations
    if (D.x != b.x) { D.z = TWOPI*0.5 - D.z; } // reflect in Y axis
    if (D.y != b.y) { D.z = TWOPI - D.z; } // reflect in X axis
    // clamp the position on screen
    D.xy = b.xy; 
    
    // log current smell to compare to the smell in the next frame
    D.w = smell;
    
    // initialize
    if (iFrame == 0) {
        // every pixel in a NxN square is tracking the same particle
        // round the position to the nearest "N"
        float N = 8.;
        D.xy = round(fragCoord/N) * N;
        // we have to seed the random generator using the particle's
        // location, not the pixel location, so that all pixels agree
        vec4 noise = random4(vec3(D.xy, iFrame));
                
        // set the direction of the agents
        D.z = noise.z * TWOPI;
    }
    
    fragColor = D;
}