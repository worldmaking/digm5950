void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // convert pixel coordinate to normalize texture coord
    vec2 uv = fragCoord / iResolution.xy;
    
    // our previous state
    vec4 A = texture(iChannel0, uv); // the particles
    vec4 B = texture(iChannel1, uv); // the trails
    
    
    // decay:
    B *= 0.91;
    
    // draw the particle
    // get distance from this pixel to the particle it is tracking:
    float d = distance(fragCoord, A.xy);
    //float p = 1/d.;
    //float p = exp(1.9*-d);
    float p = smoothstep(1., 0., d);
    
    
    B += vec4(p);
    
    fragColor = B;
}