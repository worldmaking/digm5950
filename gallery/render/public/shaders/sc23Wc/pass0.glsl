
/*

Student ID: 219581438
Final Project
Julia Scheerer 

title: Caterpillars and Healers



DESCRIPTION:
Overall what Assignment does:
yellow agents: caterpillars, eat trees and blue agents/healers inspire spores and tree growth

this system is an extention of the forest fire probabilistic CA in conjunction with an agent system. 
2 types of agents to control the growth and decay of the forest. 


TECHNICAL REALIZATONS:

I was able to create this system by putting the forest fire CA into what was previously the "sugar" buffer
in lab 8. from here I had to decide how the agwents were going to affect the forest. 
initially I had them attached to the lightning strikes but lightning strikes were already so rare that it wasn't
clear thats what the agents were affecting. I then wondered what would happen if I attached them to the burning
probability (if near an agent check burning probabiliy otherwise don't burn). 

this was decent but I had to decide on on the burn radius around each agent. I made this relativly large because 
not every agent is automatically causing the forest to burn so I wanted the ones who were to make a statment. 
Then I attached the spore and tree growth probabilites to another set of agents that were avoiding the trees 
these agents would promote tree growth in their current locations, this just meant randomly assigning the agents to be 
burning or growth agents and storing their type. I just reversed the attracted to trees logic for growth agents so they 
avoided trees instead. 

from here it was all about balancing the probabilites for this version where they were only considered when 
an agent of the correct type was near them. this meant all probabilites needed to increase significantly overall, 
while still maintaning balance between growth and burning probabilites. I like the levels I settled on but feel free
to adjust them. I think this version works because theres always some amount of burning from a decent amount of agents 
but not too many and the regrowth is slow enough not to make the forest too dense but fast enough that the forest 
still regrows and doesnt stay mostly dead. you could go smaller with the growth probability but I didn't want
this to be way too slow either. 



FUTURE EXTENTIONS:
I really like the version I created but in the future I could see attaching rain probability to something. 
I could implement a version where if 2 or more agents are close to each other rain is more likly or lightning is more likely.

*/



void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    vec2 uv = (fragCoord / iResolution.xy);
   
    // zoom in
    if (iMouse.z > 0.0) {
        float magnification = 6.;
        uv /= magnification;
        uv += iMouse.xy / ((iResolution.xy + (iResolution.xy / (magnification - 1.0))));
    }
    
    
    // get our cell
    vec4 A = texture(iChannel0, uv);
    vec4 B = texture(iChannel1, uv);
    vec4 C = texture(iChannel2, uv);
    
    // divide position by resolution to view in 0..1
    
    // get distance from this pixel to the particle it is tracking:
    float d = distance(uv * iResolution.xy, A.xy);
    //float p = 1/d.;
    //float p = exp(0.3*-d);
    float p = smoothstep(2., 0., d);
    
    
    // forest:
  
    if (C.x == 0.5) { // if alive
        fragColor = vec4(0, 0.5, 0, 1);
    } else if (C.x == 1.0) { // if burning
        fragColor = vec4(1, 0.5, 0, 1);
    } else {
        fragColor = vec4(0); // dead
    }
    
    // trails:
   fragColor += B;
    // agents:
    fragColor += vec4(p);
    
   
}