/*
Assignment 1: Cellular Automata
By Gavin Johnstone
217100033

Title: Greasefire

Instructions: 

    Left mouse button to zoom in.
    
    Reset time to generate a new instance.

    **Once you've enjoyed the aesthetic version, remove the "-" from the "wobble" variable 
    to add chaos!**
    
    You can also change the speed (fps) and number of ants (antFreq).
    
Description:
    This system is based on the Brian's Brain cellular automata. During our lab, we played with creating a 
    more gradual decay for the cells and I discovered that setting the decay really low creates a really 
    interesting and beautiful pattern, so I decided to use that as a starting point.
    
    The system consists of two different modified "Brain" systems, one that is blue and one that is red.
    The blue one is the default but has a limited chance to regenerate, resulting in this really cool "decay"
    effect. In order to keep it from dissapearing, traveling green pixels spawn a red "brain" system which 
    regenerates much easier and can reignite dying blue cells. The limiting factor for the red cells is that 
    they die when crowded out by blue cells. The optional wobble feature for the green cells is based on a
    randomized Langton's Ant.

    Individually, I believe the blue rule exhibits Class 1 long-term behaviour (it dies out) and the red rule 
    is Class 4 (without blue, red fills the screen with a complex pattern that may or may not oscilate).
    However, when they are put together we end up with this seemingly endless dance whereing the blue 
    consumes red, preventing its growth while perpetually dying. The red trails spawned by the green cells 
    only grow when they hit the blue clouds because the default structure formed suffocates itself with 
    generated blue cells. With enough green cells spawned in, this will go on effectively infinitely, though 
    I think there is theoretically always an extremely small chance that the green cells will all fail to 
    start a new reaction before the last blue cloud dies, meaning the system will become cyclic given 
    infinite time. When the random movement is intoduced however, two green cells colliding could always
    restart the reaction.
    
    Originially, my idea for this project was based the idea of objects in flowing water creating wakes. The
    oscillation of the modified Brian's Brain looks a lot like flowing water when you remove one side of it's
    neighborhood. I found though, that interrupting this pattern doesn't look all that interesting and gets a
    bit lost in the chaotic patterns, which is when I came up with the idea of a second rule in another colour.
    The beautiful behaviour that emerged was pretty much just something I discovered when playing with the 
    many parameters and countering behaviours I didn't want; when red filled the screen I made blue able to 
    kill it, when blue was limiting the potential for reactions I made new reds delete blues. Interestingly,
    I thought having newly spawned blues delete reds 
    
    A posible future extension could be finding other interesting ways to perpetuate the cycle, instead of
    the green cells. Perhaps new structures could spawn when a large enough section is dead, or at set 
    intervals in random locations. One thing I would like to improve is the green cell generation, as the 
    random function will occasionally result in too few cells being created.

Code sources:
Brian's Brain - Author: grrrwaaa - https://www.shadertoy.com/view/t3tcDN
Langton's Ant - Author: grrrwaaa - https://www.shadertoy.com/view/W33yRS
FPS Limiter - Author: TrevallionJ - https://www.shadertoy.com/view/wtscDj


*/


float fps = 30.0; // change speed (must be a factor of 60)
float wobble = 0.01; // Remove "-" to make the ants wiggle!
float antFreq = 0.0001; // change the number of ants (default 0.0001)

float activated = 1.0;
float off = 0.0;
float decay = 0.04;
float minimum = 0.1;
int bluePop = 5; 
int redPop = 3;
int crowding = 5;

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = fragCoord/iResolution.xy;
    
    // generate noise
    vec4 noise = random4(vec3(fragCoord, iTime));
    
    vec4 C = texture(iChannel0, (fragCoord / iResolution.xy));
    
    // get the 8 neighbouring pixel values:
    vec4 E  = texture(iChannel0, (fragCoord + vec2( 1, 0))/iResolution.xy);
    vec4 W  = texture(iChannel0, (fragCoord + vec2(-1, 0))/iResolution.xy);
    vec4 N  = texture(iChannel0, (fragCoord + vec2( 0, 1))/iResolution.xy);
    vec4 S  = texture(iChannel0, (fragCoord + vec2( 0,-1))/iResolution.xy);
    vec4 NE = texture(iChannel0, (fragCoord + vec2( 1, 1))/iResolution.xy);
    vec4 NW = texture(iChannel0, (fragCoord + vec2(-1, 1))/iResolution.xy);
    vec4 SE = texture(iChannel0, (fragCoord + vec2( 1,-1))/iResolution.xy);
    vec4 SW = texture(iChannel0, (fragCoord + vec2(-1,-1))/iResolution.xy);
    
    // get alive blue neighbour total
    int total = int(E.b > minimum) + int(W.b > minimum) 
                + int(N.b > minimum) + int(S.b > minimum) 
                + int(NE.b > minimum) + int(NW.b > minimum) 
                + int(SE.b > minimum) + int(SW.b > minimum);
    // get alive red neighbour total
    int rtotal = int(E.r > minimum) + int(W.r > minimum) 
                + int(N.r > minimum) + int(S.r > minimum) 
                + int(NE.r > minimum) + int(NW.r > minimum) 
                + int(SE.r > minimum) + int(SW.r > minimum);

    
    // if ant is coming west
    if (E.g == 1.0) { 
        // minor chance of changing direction
        if (noise.w < wobble) {
            C.g = 0.95;
        } else if (noise.w > 1.0-wobble){
            C.g = 0.9;
        } else {
            C.g = 1.0;
        }
        
    // if ant is coming southwest
    } else if (NE.g == 0.95) { 
        // minor chance of changing direction
        if (noise.w < wobble) {
            C.g = 1.0;
        } else if (noise.w > 1.0-wobble){
            C.g = 0.9;
        } else {
            C.g = 0.95;
        }
        
    // if ant is coming northwest
    } else if (SE.g == 0.9) { 
        // minor chance of changing direction
        if (noise.w < wobble) {
            C.g = 0.95;
        } else if (noise.w > 1.0-wobble){
            C.g = 1.0;
        } else {
            C.g = 0.9;
        }
    
    // if not an ant
    } else {
        
        C.g = 0.0; // delete ant

        //if blue channel is alive
        if(C.b >= minimum) { 
            // decay over time
            C.b -= decay; 
        // if there's blue neighbors, activate
        } else if (C.b < minimum && total == bluePop) { 
            C.b = activated;
        // if touching red, activate
        } else if (rtotal == 3) { 
            C.b = activated;
        } else { // die
            C.b = off;
        }

        //if red channel is alive
        if(C.r >= minimum) { 
            // decay over time
            C.r -= decay; 
        // if touching red and not crowded by blue, activate red and kill blue
        } else if (C.r < minimum && rtotal == redPop && total < crowding) { 
            C.r = activated;
            C.b = off;
        // if behind ant, activate and kill blue
        } else if ( W.g > minimum || NW.g > minimum || SW.g > minimum ){
            C.r = activated;
            C.b = off;
        } else { // die
            C.r = off;
        }
    }
    
    // reset 
    if (iFrame == 0) {
        // generate random blue
        C = vec4(noise.x);
        C.r = 0.0;
        C.g = 0.0;

        
        // spawn ants randomly
        if (noise.y < 0.5 && noise.y > 0.5 - antFreq) { 
            C.g = 1.0;
        }
    }
    
    // limit FPS (credit to https://www.shadertoy.com/view/wtscDj)
    if(mod(float(iFrame), 60.0 / fps) == 0.0){
        fragColor = C.rgba;
        
    } else { // keep previous frame
        fragColor = texture(iChannel0, uv);
    }
    
}