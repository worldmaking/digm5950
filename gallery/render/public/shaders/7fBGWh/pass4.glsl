// ISING AUTOMATA

// Modified From Lecture
// Graham Wakefield
// https://www.shadertoy.com/view/33yyzc

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord / iResolution.xy;
    float mask = 1.-texture(iMask, uv).a;

  // Get the Particle Possitions Channel
  vec4 A = texture(iChannel1, uv);
  // Get the Particle Trails Channel
  vec4 B = texture(iChannel2, uv);

  // Get self state
  vec4 C = texture(iChannel0, (fragCoord + vec2(0, 0)) / iResolution.xy);
  // vec4 C = texture(iChannel0, (A.xy + vec2(0, 0)) / iResolution.xy);

  // Get state of all neighbour pixels:
  vec4 E = texture(iChannel0, (fragCoord + vec2(1, 0)) / iResolution.xy);
  vec4 W = texture(iChannel0, (fragCoord + vec2(-1, 0)) / iResolution.xy);
  vec4 N = texture(iChannel0, (fragCoord + vec2(0, 1)) / iResolution.xy);
  vec4 S = texture(iChannel0, (fragCoord + vec2(0, -1)) / iResolution.xy);
  vec4 NE = texture(iChannel0, (fragCoord + vec2(1, 1)) / iResolution.xy);
  vec4 NW = texture(iChannel0, (fragCoord + vec2(-1, 1)) / iResolution.xy);
  vec4 SE = texture(iChannel0, (fragCoord + vec2(1, -1)) / iResolution.xy);
  vec4 SW = texture(iChannel0, (fragCoord + vec2(-1, -1)) / iResolution.xy);

  // Put all of my neighbor states into an array:
  float near[8] = float[8](N.r, S.r, E.r, W.r, NW.r, NE.r, SW.r, SE.r);

  // How many of my neighbours have different states:
  int different_states = int(C.r != N.r) + int(C.r != S.r) + int(C.r != E.r) +
                         int(C.r != W.r) + int(C.r != NE.r) + int(C.r != NW.r) +
                         int(C.r != SE.r) + int(C.r != SW.r);

  // Initialize the random noise. Time is slowed down so the changes are more subtle
  vec4 noise = random4(vec3(fragCoord, iTime / 3.));

  // Calculate different average state of the particle
  float different = float(different_states) / 8.0;

  // Mix the value of the uv and noise so that the perlin noise will switch
  // between random values of noise and perlin patches - to ensure that the
  // process is repetitive I use cos and slow down the time - Initially I wanted
  // to make cos in the 0-1 range however I tested couple other values and this
  // pattern (0.1 for time to get -0.4 to 0.6 range) seems to amplify the perlin and random noise effect combination
  // I also multiply uv and noise by 6 to create more points on the perlin noise
  // rather then one big patch
  vec2 mixedValue = mix(uv * 6., noise.xy * 6., cos(iTime * 0.1) * 0.5 + 0.1);
  // vec2 mixedValue = mix(uv * 2., noise.xy * 2., cos(iTime ) * 0.5 + 0.5);

  // Slowed down perlin noise
  float perlin = cnoise(vec3(mixedValue, iTime / 3.));

  // Get the perlin noise as temperature so that the probability field is
  // stronger where the noise occurs. Perlin multiplied by 2 create a stronger
  // attraction field for the particles
  float temperature = abs(perlin * 2.);

  // Probability of me changing state
  // Increases if more neighbours are different AND/OR temperature is high
  // 0.8 seemed like a sweet spot - lower I adjusted the value the probability field 
  // was more dense giving this boring monocolor effect
  float probability = pow(different, 0.8 / temperature);

  // Flip the state according to the state - same as the particle to maintain
  // the effect similarity
  float phase = mod(iTime, 32.0);

  // If noise is smaller then probability
  if (noise.x < probability) {
    // When time phase is lesser or equal to 24 draw the state of the particles
    // from perlin noise so that the base red field of the automata stretches
    // according to perlin noise
    if (phase <= 24.0) {
      int which = int(abs(perlin) * 8.);
      // C.r /= near[which];
      C.r = near[which];
    }
    // Otherwise get the particle system trails going into the random directions
    // to create a newly generated red field and probability pattern
    else {
      C.r = B.x;
    }
  }

  // initialize on the 1st frame:
  if (iFrame == 0) {
    C.r = noise.x;
  }

  // Accumulate the probability - Its easier for the particles to track the
  // probability field when it accumulates. Amplified by perlin noise to make
  // the particles move more vividly across the field
  C.g += probability * abs(perlin);
  // Perlin based temperature
  C.b = temperature;
  // Multiply the probability so that the values create a form of gradient
  // 0.97 attracts the particles well and the probability field doesn't dissapear too fast
  C.g *= 0.97;

  fragColor = C * mask;
}