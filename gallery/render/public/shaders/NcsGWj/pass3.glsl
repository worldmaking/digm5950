//BUFFER B: This buffer takes data from buffer A and uses it to create actual
//visual data for the agents, such as trail data.

//The basis for this code is from https://www.shadertoy.com/view/7fl3zH
//By Graham Wakefield, with my changes.

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    //takes current coordinate and scales it to (0,0)-(1,1), aka normalize
    vec2 uv = fragCoord / iResolution.xy;
    float mask = 1.-texture(iMask, uv).a;
    
    //Gets the state of A (the current particle data)
    vec4 A = texture(iChannel0, uv);
    //And the previoius state of B (the trails and other visual data)
    vec4 B = texture(iChannel1, uv);
    
    
    //This makes the previous frame \"decay\" a little, so the last frame
    //is still there but less opaque, which creates the trail effect.
    B *= 0.925;
    
    //Gets distance from the actual pixel coordinate to the particle being
    //tracked
    float d = distance(fragCoord, A.xy);
    
    //If d is less than 50, it adds a new diffused particle to B, with its
    //intensity scaled off the distance from the particle, essentially making
    //a small light with the halo radius of 50 pixels.
    if (d < 50.){
            B += vec4((1.5/d)*1.,(1.5/d)*1.,(1.5/d)*1.,(1.5/d)*1.);
        }
    
    //Data for visuals of particle/trails is added to the fragColor of the
    //buffer.
    fragColor = B * mask;
}