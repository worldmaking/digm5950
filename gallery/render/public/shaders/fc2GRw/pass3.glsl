// BUFFER B: Trails of all agents
void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    // convert pixel coordinate to normalize texture coordinate
    vec2 uv = fragCoord / iResolution.xy;
    
    // our previous state
    vec4 A = texture(iChannel0, uv); // the particles
    vec4 B = texture(iChannel1, uv); // the trails
    
    
    // decay:
    B *= 0.98;
       
    // get distance from this pixel to the particle it is tracking:
    float d = distance(fragCoord, A.xy);
    // draw the particle
    float p = smoothstep(1., 0., d);
    
    
    B += vec4(p);
    
    fragColor = B;
}