// AUTOMATA BUFFER

// Modified Fully Continuous Automata Taken From Lecture Shader
// Graham Wakefield
// https://www.shadertoy.com/view/t3dfR2

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  // Uv coordinates
  vec2 uv = fragCoord / iResolution.xy;
    float mask = 1.-texture(iMask, uv).a;
  // Previous State of Automata
  vec4 A = texture(iChannel0, uv);
  // Smoke state to get velocity values
  vec4 smoke = texture(iChannel1, uv);

  // Inner and Outer radius of the circles
  float outer_radius = 8.0;
  float inner_radius = 3.;

  // Values of the life and death
  // I wanted to make the life and death conditions dependent on the smoke velocity
  // I mix the values previously provided based on the smoke y velocity
  float b1 = mix(0.245, 0.45, smoke.y);
  float b2 = b1 + 0.08;

  float d1 = mix(0.365, 0.45, smoke.y);
  float d2 = d1 + 0.18;

  // sigmoid transition widths (alpha)
  // I tried to adjust widths and mix it with smoke density however I feel its
  // more aesthetically when automata cells are somewhat separated rather than
  // clumped together this way the smoke distribution works better
  
  float a1 = 0.028;
  float a2 = 0.15;
  // float a1 = mix(0.015, 0.020, smoke.a);
  // float a2 = mix(0.010, 0.015, smoke.a);
  // Mix of cell speed based on the smoke x velocity
  float dt = mix(0.35, 0.4, smoke.x);  // between .2 and .4

  // sum up all the pixels in the outer & inner radius:
  float inner_sum = 0.0;
  float outer_sum = 0.0;
  for (float x = -outer_radius; x <= outer_radius; x++) {
    for (float y = -outer_radius; y <= outer_radius; y++) {
      vec2 pixel = vec2(x, y);
      vec2 texel = pixel / iResolution.xy;

      // I wanted to make automata to move to the smoke direction.
      // I normalized the smoke velocity to get only the direction of movement
      // and then
      // translate that shift over 2.5 pixel in the uv coordinate
      // This will create a shift vector that will allow to offset the sampling
      // per the smoke velocity
      vec2 shift = normalize(smoke.xy) * (2.5 / iResolution.xy);

      // Assigned offset will sample from previous frame pixel but not from the
      // neighbourhood around the pixel but offset via the smoke vector
      // position 
      // Empty pixel will scan neighbourhood 2.5 pixels away in the opposite to smoke direction 
      // (subtract the shift vector rather than add) and fill itself when it has the alive agent there.

      float life = texture(iChannel0, uv + texel - shift).x;

      // exclude this pixel, if it is too far away
      float dist = length(pixel);
      float outer_w = 1.0 - sigmoid(dist, outer_radius, 1.);
      outer_sum += life * outer_w;
      float inner_w = 1.0 - sigmoid(dist, inner_radius, 1.);
      inner_sum += life * inner_w;
    }
  }

  // Rest is the same as the Continuous Automata
  // Graham Wakefield
  // https://www.shadertoy.com/view/t3dfR2

  // Calculation of the inner radius area PI * R ^ 2
  float inner_area = 3.14159 * inner_radius * inner_radius;
  // Calculation of inner area density based on the pixel sum (pixels over the
  // area)
  float inner_density = inner_sum / inner_area;

  // Calculation of the outer area PI * R ^ 2
  float outer_area = 3.14159 * outer_radius * outer_radius;
  // Calculation of the outer area - its a big area - small area to get only the
  // outer ring
  float outer_density = (outer_sum - inner_sum) / (outer_area - inner_area);

  // Cellular automata rules based on sigmoid probability for survival
  float notlonely = sigmoid(outer_density, d1, a1);
  float notcrowded = 1.0 - sigmoid(outer_density, d2, a1);
  float survive = notlonely * notcrowded;

  // Cellular automata birth rules based on sigmoid probability
  float enough = sigmoid(outer_density, b1, a1);
  float nottoomuch = 1.0 - sigmoid(outer_density, b2, a1);
  float birth = enough * nottoomuch;  // logical AND

  // Liveness is inner life density
  float liveness = sigmoid(inner_density, 0.5, a2);
  // Based on the inside of the radius density make transition between birth and survive
  float transition = mix(birth, survive, liveness);

  // convert to a -1..+1 direction:
  float change = transition * 2.0 - 1.0;
  // apply change gradually:
  A.x += dt * change;

  // safety:
  A = clamp(A, 0.0, 1.0);

  // initialize:
  if (iFrame == 0) {
    A = random4(vec3(fragCoord, iFrame)).xxxx;
  }
  if (iFrame == 1) {
    if (A.x < 0.8) {
      A = vec4(0.);
    }
  }

  fragColor = A * mask;
}