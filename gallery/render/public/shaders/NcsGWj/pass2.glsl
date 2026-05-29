//BUFFER A: This buffer creates the data of position, direction and
//movement for the particle agents moving around the screen.

//The basis for this code is from https://www.shadertoy.com/view/7fl3zH
//By Graham Wakefield, with my changes.

//This buffer creates \"pixels\" (comprised of regions that take up multiple
//pixels on screen) that track a particle.
//vec4 A is the variable used for the current \"pixel\"
//its w contains the nearest particle's memory, its x and y track the nearest
//particle's location, and the z contains its direction.

//Function to determine nearest particle. It takes the location of the current
//pixel and its neighbour, then determines which is closer to their particles.
vec4 getNearestParticle(vec4 A, vec2 fragCoord, vec2 offset) {
    //Creates a variant of 'A' for neighbour
    vec4 N = texture(iChannel0, (fragCoord+offset)/iResolution.xy);
    //gets the distances for current pixel to particle
    float d1 = distance(fragCoord, A.xy);
    //and distance for neighbouring particle to its pixel
    float d2 = distance(fragCoord, N.xy);
    //tracks neighbour's particle if it is closer to current pixel
    if (d2 < d1) { return N; } else { return A; }
}


void mainImage( out vec4 fragColor, in vec2 fragCoord) {
    //takes current coordinate and scales it to (0,0)-(1,1), aka normalize
    vec2 uv = fragCoord / iResolution.xy;
    float mask = 1.-texture(iMask, uv).a;
    //updates A with whatever data was on the previous frame
    vec4 A = texture(iChannel0, uv);
    
    //For loop that performs the getNearestParticle function from earlier
    //on all the pixel's neighbours, effectively making sure that the pixel
    //is tracking its nearest neighbour.
    for (int x=-2; x<=2; x++) {
        for (int y=-2; y<=2; y++) {
            A = getNearestParticle(A, fragCoord, vec2(x, y));
        }
    }
    
    //Noise variable generated, using the particle's position and the time
    //elapsed as a seed, ensuring that each particle will stay consistent to
    //itself while also having some randomness.
    vec4 noise = random4(vec3(A.xy, iTime));
    
    //the speed and direction change of the particle are initialized, however
    //these values will soon update.
    float speed = 50.;
    float turn = 0.;
    
    //This part of the buffer actually pulls from buffer C, which contains
    //an attractor field. It uses this data to create a \"pressure\" that
    //the particles sense.
    vec4 C = texture(iChannel2, A.xy / iResolution.xy);
    float pressure = C.g;
    
    //Compares strength of pressure to the particle's memory of pressure
    //last frame
    float memory = A.w;
    
    //Checks if the pressure is stronger than last frame
    if (pressure > memory) {
        //If so, go keep following in the direction of the new pressure.
        //Direction is changed to be more consistent
        turn = 0.01;
        //And speed picks up.
        speed = 100.;
    } else {
        //If there is no sensed nearby pressure change, keep changing
        //directions, and take it slower.
        turn = 1.;
        speed = 50.;
    }
    
    //The direction is updated, using the amount of direction change variable,
    //and a bit of randomization from the earlier noise function.
    A.z += turn * (noise.x*2. - 1.);
    
    //Creates a velocity using cos and sin to create x and y variables from
    //direction variable z, and combines it with speed, so there is direction
    //and magnitude.
    vec2 vel = vec2(cos(A.z), sin(A.z)) * speed;
    //That velocity is then placed into the x and y variables.
    A.xy += vel * iTimeDelta;
    
    // get the bounded position within the screen image
    vec2 b = clamp(A.xy, vec2(0), iResolution.xy);
    // compare the bounded and actual positions -- if they are different, reflect their orientations:
    if (A.x != b.x) { A.z = TWOPI*0.5 - A.z; } // reflect in Y axis
    if (A.y != b.y) { A.z = TWOPI - A.z; } // reflect in X axis
    // also, actually clamp the position on screen
    A.xy = b.xy; 
    
    //add current pressure to memory
    A.w = pressure;
    
    //Initializes particles on frame 0 (the start)
    if (iFrame == 0) {
        //Creates each pixel of size N by N
        // *** You may edit this variable depending on screen size. I have it
        //set to 40 for an 800 x 450 screen, but if you are double the size,
        //you may set it to 80. ***
        float N = 40.;
        //Also rounds each on screen pixel to nearest N
        A.xy = round(fragCoord/N) * N;
        //Noise variable is created using A.xy isntead of fragCoord so that
        //the particle has consistent noise.
        vec4 noise = random4(vec3(A.xy, iFrame));
        
        //Random direction is chosen
        A.z = noise.z * TWOPI;
    }
    
    //Data of A is sent to fragColor of the buffer.
    fragColor = A;
    fragColor.w *= mask;
}