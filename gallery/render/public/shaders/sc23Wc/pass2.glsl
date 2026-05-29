


// each pixel tracks an agent
// .xy is the agent location (in pixels)
// .z is the agent direction (in radians)

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
    // our previous state
    vec4 A = texture(iChannel0, uv);
    vec4 C = texture(iChannel2, uv);
    // make sure we are tracking the nearest particle by testing
    // each of our nearest pixels to see if their particle is nearer
    for (int x=-2; x<=2; x++) {
        for (int y=-2; y<=2; y++) {
            A = getNearestParticle(A, fragCoord, vec2(x, y));
        }
    }
    
    vec4 noise = random4(vec3(A.xy, iTime));
    
    float speed = 20.;
    float sensor_length = 20.;
    
    // set up antenea 
    mat2 rot = rotate2d(A.z);
    vec2 sensor0 = vec2(1,0) * sensor_length; // sensor straight ahead at the angle your moving 
    vec2 sensor1 = vec2(1,1) * sensor_length; // sensor to the right
    vec2 sensor2 = vec2(1,-1) * sensor_length; // sensor to the left
    vec2 sensor0_in_world = rot* sensor0+A.xy;
    vec2 sensor1_in_world = rot* sensor1+A.xy;
    vec2 sensor2_in_world = rot* sensor2+A.xy;
    
    // get the forest location
    vec4 F = texture (iChannel2, sensor0_in_world/iResolution.xy);
    vec4 FL = texture (iChannel2, sensor1_in_world/iResolution.xy);
    vec4 FR = texture (iChannel2, sensor2_in_world/iResolution.xy);
    
  
    if(A.w ==1.0){
         // attracted to forest logic
        if (F.x > FL.x && F.x > FR.x) {
            // no change to heading
        } else if (F.x < FL.x && F.x < FR.x) {
            // rotate randomly left or right
            A.z += (noise.z = 0.5);
        } else if (FL.x < FR.x) {
            A.z+= 1.;
            // rotate right
        } else if (FR.x < FL.x) {
            // rotate left
            A.z -=1.;
        }
    }
   
     if(A.w ==0.0){
        // running from forest logic
        if (F.x > FL.x && F.x > FR.x) {
            // no change to heading
             A.z += (noise.z = 0.5);
        } else if (F.x < FL.x && F.x < FR.x) {
            // rotate randomly left or right
            //A.z += (noise.z = 0.5);
        } else if (FL.x < FR.x) {
            A.z-= 1.;
            // rotate right
        } else if (FR.x < FL.x) {
            // rotate left
            A.z +=1.;
        }
     }
    
    
    rot = rotate2d(A.z);
    // move the particle
    // get the xy velocity from the A.z direction
    // polar to cartesian
    vec2 vel =  rot* vec2(speed,0);
    // integrate velocity to position
    A.xy += vel * iTimeDelta;
    
    // get the bounded position within the screen image
    vec2 b = clamp(A.xy, vec2(0), iResolution.xy);
    // compare the bounded and actual positions -- if they are different, reflect their orientations:
    if (A.x != b.x) { A.z = TWOPI*0.5 - A.z; } // reflect in Y axis
    if (A.y != b.y) { A.z = TWOPI - A.z; } // reflect in X axis
    // also, actually clamp the position on screen
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
        A.w = noise.y<0.5 ? 1.0: 0.0;
        
        // direction:
        A.z = noise.z * TWOPI;
    }
    
    fragColor = A;
}