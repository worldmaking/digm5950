// SMOKE BUFFER

/*
 Previously I tried with this code based on the this youtube tutorial
 Gonkee
 https://www.youtube.com/watch?v=qsYE1wMEMPA&t=51s


vec2 f = fragCoord - C.rg * dt;
    f = clamp(f, vec2(0.0), iResolution.xy - vec2(2.0));
    vec2 i = floor(f);
    vec2 j = fract(f);

    vec4 iO = texture(iChannel0,(i+vec2(0.0,0.0))/iResolution.xy);
    vec4 iE = texture(iChannel0, (i+vec2(1.0,0.0))/iResolution.xy);
    vec4 iN = texture(iChannel0, (i+vec2(0.0,1.0))/iResolution.xy);
    vec4 iNE = texture(iChannel0, (i+vec2(1.0,1.0))/iResolution.xy);

      //Get the NSWE coordinates
    vec4 N = texture(iChannel0, (fragCoord+vec2(0.0,1.0))/iResolution.xy);
    vec4 S = texture(iChannel0, (fragCoord+vec2(0.0,-1.0))/iResolution.xy);
    vec4 W = texture(iChannel0, (fragCoord+vec2(-1.0,0.0))/iResolution.xy);
    vec4 E = texture(iChannel0, (fragCoord+vec2(1.0,0.0))/iResolution.xy);

    float z1 = mix (iO.b,iE.b,j.x);
    float z2 = mix (iN.b,iNE.b,j.x);
    float zt = mix (z1,z2,j.y);

It didnt give the smoke effect just a random noize therefore I moved to other solution
*/

// Interpolation Taken From
// Graham Wakefield
// https://www.shadertoy.com/view/WcccDf

// Interpolated coordinate looking back in previous velocities
// I figured more times you interpolate faster the smoke effect moves
vec2 prev_coord(vec2 coord, float dt) {
  coord -= texture(iChannel0, coord).xy * dt;
  coord -= texture(iChannel0, coord).xy * dt;
  coord -= texture(iChannel0, coord).xy * dt;
  coord -= texture(iChannel0, coord).xy * dt;
  coord -= texture(iChannel0, coord).xy * dt;
  coord -= texture(iChannel0, coord).xy * dt;
  coord -= texture(iChannel0, coord).xy * dt;
  coord -= texture(iChannel0, coord).xy * dt;
  coord -= texture(iChannel0, coord).xy * dt;
  coord -= texture(iChannel0, coord).xy * dt;
  coord -= texture(iChannel0, coord).xy * dt;
  coord -= texture(iChannel0, coord).xy * dt;
  coord -= texture(iChannel0, coord).xy * dt;
  coord -= texture(iChannel0, coord).xy * dt;
  coord -= texture(iChannel0, coord).xy * dt;
  coord -= texture(iChannel0, coord).xy * dt;
  coord -= texture(iChannel0, coord).xy * dt;
  coord -= texture(iChannel0, coord).xy * dt;
  coord -= texture(iChannel0, coord).xy * dt;
  coord -= texture(iChannel0, coord).xy * dt;
  return coord;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {

  // Texel code
  // Graham Wakefield
  // https://www.shadertoy.com/view/WcccDf
  vec2 oneTexel = 1.0 / iResolution.xy;
  vec2 uv = fragCoord / iResolution.xy;

  // Added flexible dt value
  // In the interpolation formula the previous frame is offset by the vector * DT
  float dt = 1.0;

  // Take Automata Values
  // It gives the x channel of life
  float life = texture(iChannel1, uv).x;


  // Modified From Smoke Shader
  // Graham Wakefield
  // https://www.shadertoy.com/view/WcccDf
  // Take the previous neighbouring pixel values.
  vec4 me = texture(iChannel0, prev_coord(uv, dt));
  vec4 E = texture(iChannel0, prev_coord(uv + vec2(1, 0) * oneTexel, dt));
  vec4 W = texture(iChannel0, prev_coord(uv - vec2(1, 0) * oneTexel, dt));
  vec4 N = texture(iChannel0, prev_coord(uv + vec2(0, 1) * oneTexel, dt));
  vec4 S = texture(iChannel0, prev_coord(uv - vec2(0, 1) * oneTexel, dt));

  /* DOESNT MAKE A DIFFERENCE IN EFFECT
  Learned and coded from Gonkee
  https://www.youtube.com/watch?v=qsYE1wMEMPA&t=51s
  I tried to make it work because on the Graham Wakefield
  shader there was a average taken - in the other approach it not applicable
    // Average
    // Diffusion
    float k = 1.0;
    float average = (N.b+S.b+W.b+E.b)/2.0;
    float current = (me.b + k * average);
    float density = current/(1.0 + k);

    me.b = density;
  */


  // Divergence, Pressure and Gradient Pressure Learned and Adjusted from Sebastian Lague
  // https://www.youtube.com/watch?v=Q78wvrQ9xsU
  // and
  // Gonkee
  // https://www.youtube.com/watch?v=qsYE1wMEMPA&t=51s

  // Divergence - calculates how much of the fluid is spreading
  // or sucking based on the x and y velocity of neighbour pixels.
  float divergenceX = E.x - W.x;
  float divergenceY = N.y - S.y;
  float divergence = (divergenceX + divergenceY) / 2.0;

  // Calculate Pressure based on divergence and add it to the b channel
  // Its called pressure solver on the other youtube video (Sebastian Lague, https://www.youtube.com/watch?v=Q78wvrQ9xsU)
  // that neutralizes the pressure to cancel out the divergence
  float pressure = ((W.b + E.b + S.b + N.b) - divergence) / 4.0;
  me.b = pressure;

  // Gradient Pressure - Calculates which neighbour pixel has the higher
  // pressure and subtract it as velocity to the xy channels so flow moves from
  // high pressure to low pressure
  vec2 gradientPressure = vec2((E.b - W.b) / 2.0, (N.b - S.b) / 2.0);
  // The xy channel as a velocity values
  me.xy -= gradientPressure;

  // Boundaries Taken From
  // Graham Wakefield
  // https://www.shadertoy.com/view/WcccDf
  // Adds 0 speed on the boundaries eg resolution of the screen creating a
  // swirling effect on the edges It was fun to witness when the whole screen is
  // covered in smoke, the whole smoke density was moving upwards in the bouncy
  // way illustrating the connections in the pressure field between pressure and
  // movement speed
  if (fragCoord.x < 1. || fragCoord.y < 1. ||
      fragCoord.x > iResolution.x - 1. || fragCoord.y > iResolution.y - 1.) {
    me.xy = vec2(0);
  }

  // Based on the previous noise created in the yeast automata (Philip Michalowski, https://www.shadertoy.com/view/3X3cDs) I figured
  // I can spawn smoke in the location of continuous automata
  if (life > 0.55) {
    // Add smoke in the life position - alpha channel illustrates smoke density
    me.w = life;
    // I also wanted to stop smoke so that the swirls can go around the cells
    // but it stops the smoke propagation - Also probably because the birth and death depends on
    // the fluid speed If the fluid is repelled by cells then there is no speed therefore no
    // spawn or death
    //  me.xy = vec2(0);
  }

  // Gravity Taken From
  // Graham Wakefield
  // https://www.shadertoy.com/view/WcccDf

  // Adds a little drag to the y speed so that fluid is going down and its
  // dependant on smoke density More smoke more pull. This value is optimal -
  // higher value makes smoke to merge too fast and it creates blobs and lower
  // just stalls smoke to perform as system
  me.y -= 0.0000002 * me.w;

  // I also wanted to introduce some smoke diffusion/dilute effect - it will dissapear over
  // time so that swirls and pressure field can have some space for new smoke
  // produced by the automata cells - its interesting to play with the values
  // There is a never ending smoke when commented. When the values is higher
  // the cells has that ghost feeling. and when 0.002 the smoke is balanced so
  // that cells produce a good amount to keep it going and swirling but not
  // overwhealming

  // tail effect
  //  me.w -= 0.02;

  // optimized smoke
  me.w -= 0.002;

  fragColor = me;
}