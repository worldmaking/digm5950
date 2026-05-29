/*
STUDENT NUMBER: 215907876

ASSIGNMENT NUMBER : FA/DATT4950M / GS/DIGM5950M Assignment 02

NAME: PHILIP MICHALOWSKI

TITLE: DANCING IN THE SMOKE - AUTOMATA

INTERACTIONS: The project aims mostly to showcase how 2 systems intereact with
each other. There is none interaction from human perspective but there are quite
a few changes to get a different results (commented code in the shader next to the optimized implementaion).
- The smoke disapear factor can be altered - See buffer A
- a1 and a2 rules can be uncommented - Buffer B
- In Image bloom can have colorful smoke effects or basic black and white - Image Tab

DESCRIPTION:The automata I produced aimes to show how fully
continuous automata and smoke simulation can coexist and influence each other.
The smoke is moving around in the fluid way curling and dissapearing over time.
The automata produces new smoke and follows the old one's velocity map giving
interesting patterns and flow to the cells. In addition the neon/bloom effect
gives interesting look of saturated colors of the velocity map colored over the
cells. Its interesting to see 2 entities to cooperate with each other. It definitely is interesting
to see how computer simulations work especially the fluid in depth. The work doesnt support 
any long therm behaviours - its momentary change.

TECHNICAL REALIZATION : Before the continuous automata I saw different cursor
animation techniques with fluid simulation (https://lusion.co/). I started my
automata with the smoke simulation since smoke behaves quite similarly to fluid.
Smoke is a fluid simulation in Buffer A based on 3 sources (Sebastian Lague,
https://www.youtube.com/watch?v=Q78wvrQ9xsU&t=872s)(Gonkee,
https://www.youtube.com/watch?v=qsYE1wMEMPA) (Graham
Wakefield,https://www.shadertoy.com/view/WcccDf). I tried Gonkee tutorial
however I couldnt get the interpolation desired effect in the shader (ive got just waves on the screen). 
I went over the shadertoy and found Professor Wakefield's fluid simulation. The interpolation of
the previous velocities were made in a very different and simple way by sampling
neighbours offseted by a vector. I additionally watched Lague tutorial to understand math formulas better and partially recoded math
gradient pressure formulas to match his tutorial approach. After that fluid simulation started working correctly.

Then I added automata from class (Graham
Wakefield,https://www.shadertoy.com/view/t3dfR2 )in Buffer B. In smoke Buffer A I added life cells as smoke values in the if statement 
on top of the smoke simulation, similarly to perlin noize in the previous
assignment (Philip Michalowski, https://www.shadertoy.com/view/3X3cDs). 
The cells then produced smoke but there is no deeper intreaction on
the automata side. I mixed Buffer B automata life and death variables with smoke velocity to add some
interaction. Somewhat it changes the autmata death and birth rate but it wasnt
quite visible. I tried to also mix delta time with smoke velocity and density and still its slightly visible but
not that apparent. I decided to move towards moving the cells along the smoke velocity map. 
I wanted to shift the automata central pixel orientation in neighbourhood
to shifted coordinate based on the smokes force. Knowing that in GLSL its impossible to 
assign pixels to the other then current corrdiantes I figured that the best way to do is to sample 
from offseted neighbourhood just like I did in the other project where I selected vec2
(0,2) instead of (0,1)(Philip Michalowski,https://www.shadertoy.com/view/3X3cDs) but sample from the neighbourhood shifted
over velocity of the smoke. This way the pixel that is lets say
empty on the former frame and have alive agent 2.5 pixels away in the left direction 
(where smokes travels perfectly on the x axis normalized vec(1,0))
sampling from this 2.5 pixel shifted alive neighbourhood. 
Then the empty pixel will be populated instead of the middle one in the alive cell.
To get the direction I had to normalize the smoke xy vector
and becaues the sampling is made on uv values I need to translate the
coordinates to uv texels. Because the vector will point in the smoke direction I
want to sample from the opposite upstream direction that why I substract from the the
uv.

The last part was to figure out the the neon blur and particle colors based on
the velocity map. The velocities colors on the cells were quite straight forward. I know I had a
velocities mapped as xy channel and its length gives an idea how fast the smoke
is traveling in the pixel therefore I tried couple methods (raw length, mix and
smoothstep) to mix the cell color of red and green over speed. Smoothstep gave
the best visual quality transition over the speeds. Lastly I mixed color with the
grayscale density values depending on life values of automata to keep both entities. It gives the
color values not only from the velocity map but also smoke density therefore despite
interesting effect it doesnt give accuarate velocity map results.

For the bloom I had to do the research about that and I found this blog post
(David Lettier,
https://lettier.github.io/3d-game-shaders-for-beginners/bloom.html). It gave me
accurate formula to create a simple bloom and after the adjustemnt to rely of the
life.x values and adding it to the cellColor rather then entire fragColor mix to
avoid smoke bloom everything worked well.

FUTURE EXTENSIONS: It would be very interesting to see some cursor enagagement
with automata and fluid simulation. Maybe something related to cursor speed
interacting with smoke so that automata can survive- kinda like micro organisms
simulation Definitely 3D implementation would be intresting to see where fluid
is beign created by automata.
*/
void mainImage(out vec4 fragColor, in vec2 fragCoord)

{
  vec2 uv = fragCoord / iResolution.xy;
    float mask = 1.-texture(iMask, uv).a;
  // Smoke vector
  vec4 smoke = texture(iChannel0, uv);  
  // Automata vector
  vec4 life = texture(iChannel1, uv);   

  // Take the smoothstep of the velocy vector length
  // It produces the valus between 0 and 1
  // The velocity values arent very high therefore length has to be multiplied
  // to crete a meaningful transition rather then all green 
  // Mix also works but produces sharp transitions 
  // float speed = mix(0.0, 1.0,(length(smoke.xy) * 20000.0));
  float speed = smoothstep(0.0, 1.0, (length(smoke.xy) * 20000.0));

  // The length here works well however the colors were a little off so i
  // desided to firstly mix it based on the trehshold and then used smoothstep
  // to make the transition softer
  // vec3 cellCol = mix(vec3(0,1,0), vec3(1,0,0), length(smoke.xy) * 20000.0);
  // Its interesting because it visualizes the velocity map when pluged into
  // fragColor
  vec3 cellColor = mix(vec3(0, 1, 0), vec3(1, 0, 0), speed);

  // I mix the texture of smoke with color made of velocities based on the life
  // values. If there is life then show life texture color and when there is no
  // life show smoke. The color is dilluted with smoke grey based on the cell
  // life however it doesnt affect the overall looks it just creates more
  // vibrant and less vibrant colors (with bloom effect barely noticible)
  vec3 base = mix(vec3(smoke.w), cellColor, life.x);

  // Below - Bloom
  // Taken from David Lettier
  // https://lettier.github.io/3d-game-shaders-for-beginners/bloom.html

  // Size - amount of blur
  int size = 4;
  // Separation - blur spread
  float separation = 1.5;
  // Threshold - controls the pixels contrubuting to blur
  float threshold = .35;
  // Amount - blur output amount
  float amount = 2.5;

  // Sum and count of pixels in the size - similar to the neighbouring pixels
  // counting
  float sum = 0.0;
  float count = 0.0;

  // Traverse throuh blur size
  for (int i = -size; i <= size; i++) {
    for (int j = -size; j <= size; j++) {
      // Take the texture pixels from life automata time separation over
      // resolution since life has values in channel x I dont need to convert
      // values to greyscale to discard it in the treshhold if statement
      float value = texture(iChannel1,
                       (fragCoord + vec2(i, j) * separation) / iResolution.xy)
                    .x;

      // Do not contribute pixels values below the treshhold
      if (value < threshold) value = 0.0;

      // Add together the b values (life.x with offset) per tutorial
      sum += value;
      // Count number of iterations
      count += 1.0;
    }
  }

  // Apply the bloom as per tutorial but over cellColor so the smoke is not
  // affected
  vec3 bloom = cellColor * ((sum / count) * amount);
  
  // Black and white smoke bloom
  // vec3 bloom = smoke.aaa * ((sum / count) * amount);

  // Other version of bloom where smoke is affected or it creates smoke effect
  // vec3 bloom = cellCol * ((sum / count) + amount);
  // vec3 bloom = cellCol + ((sum / count) * amount);

  fragColor = vec4(base + bloom, 1.0);

  // When bloom produced with smoke vec3
  // fragColor = vec4(  bloom , 1.0);
  // fragColor = vec4(smoke.aaaa);
}