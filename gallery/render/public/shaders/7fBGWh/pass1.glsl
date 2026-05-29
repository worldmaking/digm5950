// BUFFER TO CONTROL PARTICLE POSITIONS

// Modified From Particle Shader from the
// Graham Wakefield
// https://www.shadertoy.com/view/7ff3RX

// Track particles distances between pixel and distances between particles to
// return which is closer
vec4 trackParticles(vec4 currentPixel, vec2 coordinates, vec2 offset) {
  // Get the particle neighbour
  vec4 neighbour = texture(iChannel0, (coordinates + offset) / iResolution.xy);

  // Calculated distances between pixel coordinate and particle location
  float distanceA = distance(coordinates, currentPixel.xy);
  float distanceB = distance(coordinates, neighbour.xy);

  // Check which particle is closer
  if (distanceB > distanceA) {
    return currentPixel;
  } else {
    return neighbour;
  }
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord / iResolution.xy;

  // Get the previous state of the particles
  vec4 A = texture(iChannel0, uv);
  vec4 B = texture(iChannel2, uv);

  // Loop to see what particles are the closest to the follower pixel
  for (int i = -3; i < 3; i++) {
    for (int j = -3; j < 3; j++) {
      A = trackParticles(A, fragCoord, vec2(i, j));
    }
  }

  // Initialize the noise based on the particle coordinates
  vec4 noise = random4(vec3(A.xy, iTime));

  // Particles parameters initialization
  float speed = 50.;
  float turn = 0.;
  float wander = 0.8;
  float turnfactor = 0.5;

  // Length of the particle sensing
  float sensor_length = 10.;
  // float sensor_length = 20.;

  // Set up our antennae:
  mat2 rot = rotate2d(A.z);
  vec2 sensor0 = vec2(1, 0) * sensor_length;
  vec2 sensor1 = vec2(1, 1) * sensor_length;
  vec2 sensor2 = vec2(1, -1) * sensor_length;
  vec2 sensor0_in_world = rot * sensor0 + A.xy;
  vec2 sensor1_in_world = rot * sensor1 + A.xy;
  vec2 sensor2_in_world = rot * sensor2 + A.xy;

  // Get the trail field where our antennae are:
  vec4 F = texture(iChannel1, sensor0_in_world / iResolution.xy);
  vec4 FL = texture(iChannel1, sensor1_in_world / iResolution.xy);
  vec4 FR = texture(iChannel1, sensor2_in_world / iResolution.xy);

  // Get the phase of the particle movement based on the 32. seconds interval
  float phase = mod(iTime, 32.0);

  // When mod >= 24 (8 seconds)turn the particles into the wandering mode
  // This mode writes into the CA buffer to create generative random probability
  // The wandering of the particles goes into the random directions giving the
  // growth simulated effect
  if (phase >= 24.0) {
    // Wander randomly into the noise direction
    A.z += wander * (noise.z - 0.5);
    // Slower Speed gives better growth effect
    speed = 25.;
    // speed = 45.;
    //  Higer turn factor gives more wandering effect
    turnfactor = 0.5;
  }
  // For a longer time (24 seconds) follow the density field of the probability from the
  // Ising automata buffer and attached to it perlin noise
  else {
    // Faster speed of automata gives faster patch tracking effect as well as
    // follow perlin noise outbreaks better
    speed = 80.;
    // speed = 20.;
    //  Lower turn factor gives more controll to the particles to follow the
    //  probability field
    turnfactor = 0.1;

    // If Middle Antenae sensing the strongest signal from the probability field
    if (F.g > FL.g && F.g > FR.g) {
    }
    // If Middle Antenae is sensing lower then left and right antenae signal
    // wander randomly
    else if (F.g < FL.g && F.g < FR.g) {
      A.z += wander * (noise.z - 0.5);
    }
    // If right antenae is sensing stronger signal then turn
    else if (FL.g < FR.g) {
      A.z += turnfactor;
    }
    // If left antenae is sensing stronger signal then turn the other way
    else if (FR.g < FL.g) {
      A.z -= turnfactor;
    }
  }

  // Move the particle
  // Get the xy velocity from the A.z direction
  rot = rotate2d(A.z);

  // Polar to cartesian
  vec2 vel = rot * vec2(speed, 0);

  // Integrate velocity to position
  A.xy += vel * iTimeDelta;

  // Get the bounded position within the screen image
  vec2 b = clamp(A.xy, vec2(0), iResolution.xy);

  // Compare the bounded and actual positions -- if they are different, reflect
  if (A.x != b.x) {
    A.z = TWOPI * 0.5 - A.z;
  }
  // Reflect in Y axis
  if (A.y != b.y) {
    A.z = TWOPI - A.z;
  }
  // Reflect in X axis
  A.xy = b.xy;

  // Initialize the particle grid
  if (iFrame == 0) {
    // Create a grid system for each particle - 15px for each particle
    // vec2 grid = round(fragCoord / 20.) * 20.;
    // vec2 grid = round(fragCoord / 50.) * 50.;
    vec2 grid = round(fragCoord / 15.) * 15.;
    // Save XY in the red and green channel
    A.xy = grid;
    // Save rotation in the blue channel
    A.z = noise.x * TWOPI;
  }

  fragColor = vec4(A);
}