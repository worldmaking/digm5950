void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // convert pixel coordinate to normalize texture coord
    vec2 uv = fragCoord / iResolution.xy;
    
    // our previous state
    vec4 A = texture(iChannel0, uv); // the particles
    vec4 B = texture(iChannel1, uv); // the trails
    
    
    // decay:
    B *= 0.9;
    
    // draw the particle
    // get distance from this pixel to the particle it is tracking:
    float d = distance(fragCoord, A.xy);
    //float p = 1/d.;
    //float p = exp(0.3*-d);
    float p = smoothstep(1., 0., d);
    
    if(p>0.0){
        if(A.w ==0.0){
            B += vec4(p,p,0.8,0.7); // running from forest, blue 
       
        }else if(A.w ==1.0 ){
        
            B += vec4(p,p+0.9,0.0,0.4); // going towards forest 
        }
    }
     
    
    
    B += vec4(p);
    
    fragColor = B;
}