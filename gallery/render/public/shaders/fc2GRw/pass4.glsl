// BUFFER C: Field of Fire

mat3 gaussBlur = mat3(
        1, 2, 1,
        2, 4, 2,
        1, 2, 1
    ) * 1.0/16.0;

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    vec2 uv = (fragCoord / iResolution.xy);
    float mask = 1.-texture(iMask, uv).a;
    
    vec4 C = texture(iChannel2, uv); // the previous frame
    
    // gaussian blurred previous frame:
    vec4 N = texture(iChannel2, (fragCoord + vec2(0, 1))/iResolution.xy);
    vec4 S = texture(iChannel2, (fragCoord + vec2(0, -1))/iResolution.xy);
    vec4 E = texture(iChannel2, (fragCoord + vec2(1, 0))/iResolution.xy);
    vec4 W = texture(iChannel2, (fragCoord + vec2(-1, 0))/iResolution.xy);
    vec4 NE = texture(iChannel2, (fragCoord + vec2(1, 1))/iResolution.xy);
    vec4 SE = texture(iChannel2, (fragCoord + vec2(1, -1))/iResolution.xy);
    vec4 NW = texture(iChannel2, (fragCoord + vec2(-1, 1))/iResolution.xy);
    vec4 SW = texture(iChannel2, (fragCoord + vec2(-1, -1))/iResolution.xy);
    
    // apply the blur to the neighbourhood
    C = ((NE+SE+NW+SW) + 2.*(N+E+S+W) + 4.*C)/16.;
    
    vec4 noise = random4(vec3(fragCoord, iTime));

    // am I being eaten?
    vec4 A = texture(iChannel0, uv); // the closest agent from group 1
    vec4 D = texture(iChannel1, uv); // the closest agent from group 2
    float distToAgent1 = distance(A.xy, fragCoord); // distance to agents in group 1
    float distToAgent2 = distance(D.xy, fragCoord); // distance to agents in grroup 2
    
    // if an agent from group 1 is close to the food
    if (distToAgent1 < 1.) { 
        // decay some food around the agent to simulate it being eaten
        C *= 0.5; // lower value = more eaten
        
    }
    
    // probability that the agents will start eating
    float probability = 0.1;
    
    // if an agent from group 2 is close to the food and the mouse is pressed
    if (iMouse.z > 0.0 && distToAgent2 < 1.) {
        // decay the food around the agent to simulate it being eaten
        C *= 0.15;
    }

    /*
    // make it eat every every few seconds
    float timer = mod(iTime, 6.0);     
    if (timer > 3.0) {
        if (distToAgent2 < 1.) {
            C *= 0.15;
        }
    }
    */
    
    // background noise
    C += 0.1*(noise.z - 0.5);

    // move the wall across the screen
    if (noise.w < 0.1 *pow(abs(sin(iTime * 0.1 + uv.y*2.)), 50.)) { 
        C += vec4(0.5); // move down the screen according to iTime
    }

    // keep it in the range of 0.-> 1.:
    C = clamp(C, 0., 1.5);

    C *= mask;
    
    fragColor = C * (0, 0, 0, 1.);
}