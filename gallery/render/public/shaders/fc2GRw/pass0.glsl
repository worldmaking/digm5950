/*
Student Number: 219461854

Assignment Number: A3

Your Name: Robin Tarnocai

**Title**: Wall of Fire

**Interactions**
The main interaction this project supports is clicking to trigger group 2 of agents to eat. By clicking 
and holding the left mouse button the second group of agents (the gray ones without a trail) will eat the 
fire that is moving across the screen. To get it to do this automatically without the need for mouse input,
uncomment the section between lines 50-58 in Buffer C which has this occur periodically for a fixed amount 
of time. 

**Description**
The idea I had that led to this system was the interaction of two groups of agents. I made one group that
has antennae and chases fire and eats the fire slowly when it touches it, and a second group of agents that
are attracted to the agents in the first group via changes in smell on each subsequent frame.The fire 
underneath is a bar of orange that moves down the screen and fades out very slowly. The agents in the 
second group, while not attracted to the fire directly, eat the fire at a much quicker rate than the first
group of agents. I was hoping to implement a more conditional cellular automata as opposed to a 
consistently changing environment. Long term, the behaviour remains fairly similar. Without interaction
or the automatic feeding enabled, the fire takes over the screen and the agents struggle to eat through it.
Otherwise, the agents consistently eat away the fire and it replenishes itself. One note about 
functionality is that when you leave the page and return to it, the amount of agents seems to diminish.

**Sources**
I referenced Lab materials primarily from weeks 1, 8 and 9. 
https://www.shadertoy.com/view/7fl3zH , Lab 8 by Graham Wakefield
https://www.shadertoy.com/view/tcVfW3 , Lab 1 by Graham Wakefield
https://www.shadertoy.com/view/7fl3zH , Lab 9 by Graham Wakefield

**Technical Realization**
The regeneration and edges of the fire are influenced by a gaussian blur that is applied to all eight of 
its neighbours. The movement across the screen is inspired by the game of life variation applied in lab 2
where the concentration of noise increases across a sine wave variation. Here, the probability of noise 
influences the replication of the cellular automata and the gradual decay affects its destruction. Before
getting to this version, I started with the circle movement from Lab 8. Then I tried randomizing the
movement pattern, but that offered few opportunities for the agents to successfully converge on their 
targets, resulting in a more disjointed appearance in the final product. The slower movement of a larger
target is inherently simpler, but produces a more visually interesting aesthetic.
A future extension I would love to implement would be improving the unpredictability of the cellular
automata underneath as I described above.

*/


void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    vec2 uv = (fragCoord / iResolution.xy);

    
    /*
    // zoom in
    if (iMouse.z > 0.0) {
        float magnification = 6.;
        uv /= magnification;
        uv += iMouse.xy / ((iResolution.xy + (iResolution.xy / (magnification - 1.0))));
    }
    */
    
    // get our cell
    vec4 A = texture(iChannel0, uv);
    vec4 B = texture(iChannel1, uv);
    vec4 C = texture(iChannel2, uv);
    vec4 D = texture(iChannel3, uv);
    
    // get distance from this pixel to the particle it is tracking for group 1
    float d1 = distance(uv * iResolution.xy, A.xy);
    // get distance from this pixel to the particle it is tracking for group 2
    float d2 = distance(uv * iResolution.xy, D.xy);
    
    // rendering of agents in group 1
    float p1 = smoothstep(2., 0., d1);
    // rendering of agents in group 2
    float p2 = smoothstep(2., 0., d2);
    
    
    // fire: add to canvas
    fragColor = C * vec4(1, 0.5, 0, 0);
    // trails: add to canvas
    fragColor += B * vec4(1, 0.5, 1, 0.5);
    // agents group 1: add to canvas
    fragColor += vec4(p1) * vec4(1, 0.5, 1, 0.5);
    // agents group 2: add to canvaas
    fragColor += vec4(p2) * vec4(0.2, 0.2, 0.2, 0.2);
   
}