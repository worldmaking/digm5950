/*

218856542

DATT4950 Assignment #3

Robert Jamrocha-Tullo

\"Space Strugglers\"

Interactions: Click, and hold anywhere on the screen with the mouse button
to create an \"air pocket\". This will create a membrane that stores air which
the space strugglers on screen will sense the pressure of, flock to, break
through, and let down their personal membrane while taking in the fresh air.
In buffer A, the if statement at the bottom has the N variable, which can be
changed to initialize a different number of agents, which is good for
different screen sizes. Additionally, the constants of the image buffer
(surrounded by ***) may be fun to play with, and certain screen sizes may
need to in order to see intended effects, such as the eyes of the membrane.
The program is meant to be run on an 800 x 450 sized screen and the default
settings for it will work just fine, I have not tested it with 1600 x 900, but
I'd imagine it would work fine on that size as well.

Description: The guys you see floating around the screen are what I like to
call \"Space Strugglers!\" They are these little guys with cores of
bioluminescent blue which sport a pink membrane that they use to trap air
around them, sort of like a natural spacesuit. They wander around space in
different directions. What's interesting about them is how they evolve and
behave. When moving in a specific direction, if you look closely, you will
see that they start to develop eyeballs that look toward that direction. They
also seem to have an innate desire to breathe fresh air. When they bump into
each other, they will combine membranes to share the air between them, like
they want to experience something new. Of course, if you click and hold on the
screen, they will sense the air pressure of the pocket you've created, and
take it as a chance to relax, getting rid of their membrane, similar to how
a human would take off their coat after a long winter day. Many of these
processes such as seeking air pockets were programmed directly, but many
behaviours took me by surprise, such as the sharing of membranes and growing
of eyes.

Citations: The basis of lots of code in this shadertoy was learned from
lectures by Graham Wakefield, and some was inspired by his shadertoys,
such as https://www.shadertoy.com/view/7fl3zH
And concepts from his website: https://alicelab.world/digm5950/glsl.html
Additionally, the concepts for smoothlife used in this shadertoy are
interpolated from this research paper by Stephan Rafler:
https://arxiv.org/pdf/1111.1567
which was introduced to me by Graham Wakefield on his website at
https://alicelab.world/digm5950/ca.html

Specific citations of how each concept was applied from where are further
described in each buffer (including later in this one).

Technical Realization: I started out by amending code for particle systems
being attracted to sugar (aka Chemotaxis). I modified the attractor to instead
be a system where you click and hold on the screen, and modified the behaviour
of particles so that it looked more like they were wandering around, running
to the attractor, and then dispursing when it disappeared. I also modified the
appearance of the particles and their attractor. I then was inspired by
Rafler's smoothlife algorithms and decided to implement my version of it into
a buffer, essentially taking the image that the particle system created and
building smoothlife off of it. I then played around with more variables, not
only of the smoothlife functions, but also of the particles so that they could
better interact with the smoothlife. Eventually, I found good balances that
created the interesting behaviours that I noted in the system description.
Future implementations of this code could introduce more elements to the
system, possibly adding even more cellular automata that the particles can
interact with, and possibly even interact with the smoothlife. Maybe an evil
alien that scares the particles could appear, and it eating particles could
cause a reaction that makes the smoothlife grow a certain way.

*/

//IMAGE: The image buffer takes the compiled particle + attractor data from
//buffer D, then transforms the image using smoothlife functions, to give it
//the appearance we see on screen.

//The basis of this code was inspired by Lectures from Graham Wakefield.
//Many concepts used in this buffer (although parameters have been heavily
//modified) come from research by Stephan Rafler, found at:
// https://arxiv.org/pdf/1111.1567

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {

    //takes current coordinate and scales it to (0,0)-(1,1), aka normalize
    vec2 uv = fragCoord / iResolution.xy;
    float mask = 1.-texture(iMask, uv).a;
    
    //Creates vec4 A which is the previous state of the image from last frame
    vec4 A = texture(iChannel0, uv);
    
    //initializes inner and outer radii that will be used for functions to
    //determine size for density
    float inner_radius = 3.5;
    float outer_radius = 10.0;
    
    //initializes variables that will be added to and used to determine
    //population for density
    float inner_sum = 0.0;
    float outer_sum = 0.0;
    //loops over the diameter of the outer radius
    for (float x = -outer_radius; x <= outer_radius; x++) {
        
        //and the diameter of the inner radius
        for (float y = -outer_radius; y <= outer_radius; y++){
        
            //creates a variable for texel
            vec2 pixel = vec2(x,y);
            vec2 texel = pixel / iResolution.xy;
            //which is used to get the texture of that area, which will in the
            //future be used to calculate life population and then density
            float life = texture(iChannel0, uv + texel).x;     
            
            //distance is calculated,
            float dist = length(pixel);
            
            //and then used in a sigmoid function to determine if the current
            //point is in the radial circle we are looking for (otherwise, the
            //for loop would go over a square).
            float outer_w = 1.0 - sigmoid(dist, outer_radius, 1.0);
            float inner_w = 1.0 - sigmoid(dist, inner_radius, 1.0);
            
            //Population is calculated
            outer_sum += life * outer_w;
            inner_sum += life * inner_w;
            
        }
    
    }
    
    //area of inner circle is calculated with pi r squared
    float inner_area = 3.14159 * inner_radius * inner_radius;
    //population and area are used to calculate density
    float inner_density = inner_sum / inner_area;
    
    //area of outer circle is calculated with pi r squared
    float outer_area = 3.14159 * outer_radius * outer_radius;
    //outer density is calculated similarly to how inner density was calculated
    //except that the inner circle's area must be eliminated
    float outer_density = (outer_sum - inner_sum) / (outer_area - inner_area);
    
    //These are constant variables that effect the appearance of the smoothlife
    //They have been modified based off Rafler's research to give the particles
    //their look, which is that of a blue glowing particle inside of a pink
    //membrane, with an eye pointing in the direction of movement.
    //These values work best on an 800 x 450 sized screen.
    //***
    float b1 = 0.25;
    float b2 = 0.1;
    float a1 = 0.01;
    float d1 = 0.1;
    float d2 = 0.75;
    float a2 = 0.01;
    //***
    
    //Rules for transition:
    //determines a value on if the automata is lonely
    float notlonely = sigmoid(outer_density, d1, a1);
    //determines a value on if the automata is crowded
    float notcrowded = 1.0 - sigmoid(outer_density, d2, a1);
    //crates a logical AND expression through math to determine that it will
    //survive if it is not lonely AND not crowded
    float survive = notlonely * notcrowded;
    
    //Rules for birth:
    //determines value if there is enough density
    float enough = sigmoid(outer_density, b1, a1);
    //and if there is not too much density
    float nottoomuch = 1.0 - sigmoid(outer_density, b2, a1);
    //then performs a logical AND, automata is born if it is dense enough and
    //not too dense
    float birth = enough * nottoomuch;
    
    //Creates an interpolation between the transition and birth rules
    float liveness = sigmoid(inner_density, 0.5, a2);
    float transition = mix(birth, survive, liveness);
    
    //Clamps the transition value from 0 to 1
    transition = clamp(transition, 0., 1.);
    
    //Applies transition to rules to the x value of A
    A.x = transition;
    
    //Applies A to the fragColor of the image buffer, completing the image.
    fragColor = A * mask;
   
}