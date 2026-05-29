// PARTICLE TRAILS BUFFER

// Slightly Modified From Lecture
// Graham Wakefield
// https://www.shadertoy.com/view/7ff3RX

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord / iResolution.xy;

  // Get the paticle channel with the positions
  vec4 A = texture(iChannel0, uv);

  // Get the saved copy of the previous frame of particle trails
  vec4 B = texture(iChannel1, uv);

  // Distance between the pixel coordinate and the particle
  float dist = distance(fragCoord, A.xy);
  // Create particles - the step with the 1./dist works too
  float particles = step(0.99, 1. / dist);

  // Accumulate particle trails so the tails are visible
  B += particles;

  // Reduce the intensity of the trails so they can dissapear after some time
  // 0.989 decay factor works the best to keep particle tail visible but 
  // doesn't overwhelm the canvas with it
  B *= 0.989;
  fragColor = B;
}