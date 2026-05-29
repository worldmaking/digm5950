/*
STUDENT NUMBER: 220016416
ASSIGNMENT: Final Project
NAME: Hiromune Kubayashi
TITLE: Party Lights

INTERACTION:
- Click the mouse to zoom into the simulation.
- Refresh to reset and observe different emergent behaviors.
- Each particle has a unique personality, so results vary every run.

CONCEPT:
This project explores a particle system interacting with a dynamic "sugar landscape" field.
Particles move, sense their environment, and leave trails, creating a feedback loop between
agents (particles), memory (trails), and environment (field).

Each particle has its own parameters (speed, wandering, sensing distance) and a "mood"
value that affects its behavior. Calm particles follow the field, while excited particles
move more chaotically.

The system produces emergent behaviors such as clustering, flowing motion, and glowing
patterns. It demonstrates how simple local interactions can generate complex global visuals.

TECHNICAL:
- Multi-buffer system:
  iChannel0 = particles (position, direction, mood)
  iChannel1 = trails (decay + accumulation)
  iChannel2 = field (diffusion + energy sources)

- Key techniques:
  - Nearest particle tracking (5x5 neighborhood)
  - Sensor-based steering (front / left / right)
  - Per-particle noise (consistent behavior)
  - Mood-driven dynamics
  - Field diffusion and decay

REFERENCES:
- AI-assisted: code structure, comments, and parameter tuning suggestions generated 
with ChatGPT (OpenAI).
- Inspired by and partially based on lecture examples from Professor Graham (Lab 8):
  “Building agents from a nearest-particle tracking system”
  https://www.shadertoy.com/view/7fl3zH

FUTURE WORK:
- Add reaction-diffusion behavior
- Enable user interaction (inject energy with mouse)
- Audio-reactive visuals
- Application to projection / immersive installation
*/


// Each pixel tracks a single particle (agent)
// A.xy = particle position (pixel coordinates)
// A.z  = direction it is facing (radians)
// A.w  = memory / mood (excitement level)

// Function that selects the "closest particle" by comparing surrounding pixels
vec4 getNearestParticle(vec4 A, vec2 fragCoord, vec2 offset) {
    // Get particle data from a neighboring pixel
    vec4 N = texture(iChannel0, (fragCoord + offset) / iResolution.xy);

    // Compare distance between current particle and neighbor particle
    float d1 = distance(fragCoord, A.xy);
    float d2 = distance(fragCoord, N.xy);

    // Return the closer particle
    return (d2 < d1) ? N : A;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    // Normalized coordinates (0–1)
    vec2 uv = fragCoord / iResolution.xy;

    // Get particle data from previous frame
    vec4 A = texture(iChannel0, uv);

    // ===== Find the nearest particle =====
    // Search within a 5×5 neighborhood
    for (int x = -2; x <= 2; x++) {
        for (int y = -2; y <= 2; y++) {
            A = getNearestParticle(A, fragCoord, vec2(float(x), float(y)));
        }
    }

    // ===== Random values (particle-based) =====
    // Generate noise based on particle position instead of pixel
    // → Important so pixels tracking the same particle behave consistently
    vec4 noise = random4(vec3(A.xy * 0.01, iTime * 0.3));

    // Personality noise fixed per particle
    vec4 idNoise = random4(vec3(floor(A.xy / 30.0), 1.234));

    // ===== Per-particle personality =====
    float baseSpeed    = mix(25.0, 90.0, idNoise.x); // base speed
    float wander       = mix(0.05, 1.2, idNoise.y);  // tendency to wander
    float turnfactor   = mix(0.08, 0.7, idNoise.z);  // ease of turning
    float sensorLength = mix(6.0, 22.0, idNoise.w);  // sensing distance

    // ===== Mood (excitement level) =====
    float mood = A.w;

    // ===== Forward sensors =====
    // Rotation matrix based on particle direction
    mat2 rot = rotate2d(A.z);

    // Three sensors: forward, front-left, front-right
    vec2 sensor0 = vec2(12.0,  0.0) * sensorLength;
    vec2 sensor1 = vec2(12.0,  0.7) * sensorLength;
    vec2 sensor2 = vec2(12.0, -0.7) * sensorLength;

    // Compute sensor positions
    vec2 s0 = A.xy + rot * sensor0;
    vec2 s1 = A.xy + rot * sensor1;
    vec2 s2 = A.xy + rot * sensor2;

    // Sample environment (field)
    vec4 F  = texture(iChannel2, s0 / iResolution.xy);
    vec4 FL = texture(iChannel2, s1 / iResolution.xy);
    vec4 FR = texture(iChannel2, s2 / iResolution.xy);

    // ===== Field intensity =====
    float f  = F.x;   // front
    float fl = FL.x;  // left
    float fr = FR.x;  // right

    // Average RGB energy
    float energyAhead = dot(F.rgb, vec3(0.333));

    // Left-right difference (bias)
    float asym = fl - fr;

    // ===== Mood update =====
    // Excited by strong fields
    mood += energyAhead * 0.03;

    // Small random spikes (twitch-like motion)
    mood += smoothstep(0.96, 1.0, noise.x) * 0.08;

    // Gradual calming (decay)
    mood *= 0.985;

    // Clamp to [0,1]
    mood = clamp(mood, 0.0, 1.0);

    // ===== Direction control =====
    // Higher mood → more chaotic
    float chaos = mix(0.0, 1.5, mood);

    if (f > fl && f > fr) {
        // Forward is strongest → keep going
    } else if (f < fl && f < fr) {
        // No clear direction → random jitter
        A.z += wander * (noise.z - 0.5) * (1.0 + chaos);
    } else if (fl < fr) {
        // Right is stronger → turn right
        A.z += turnfactor * (1.0 + 0.7 * chaos);
    } else if (fr < fl) {
        // Left is stronger → turn left
        A.z -= turnfactor * (1.0 + 0.7 * chaos);
    }

    // ===== Field obedience (mood-dependent) =====
    // calm → follow field
    // excited → resist field
    A.z += asym * mix(-0.12, 0.15, mood);

    // ===== Small quirks (natural variation) =====
    A.z += 0.07 * sin(iTime * 0.9 + idNoise.x * TWOPI);

    // ===== Speed =====
    float speed = baseSpeed;

    // More excited → faster
    speed *= (1.0 + 1.8 * mood);

    // Also influenced by forward energy
    speed *= mix(0.8, 1.25, smoothstep(0.02, 0.25, energyAhead));

    // ===== Movement =====
    rot = rotate2d(A.z);
    vec2 vel = rot * vec2(speed, 0.0);

    // Update position
    A.xy += vel * iTimeDelta;

    // ===== Screen edge handling =====
    // Soft avoidance near edges
    float margin = 20.0;
    if (A.x < margin)                  A.z += 0.08 + 0.12 * noise.y;
    if (A.x > iResolution.x - margin)  A.z -= 0.08 + 0.12 * noise.y;
    if (A.y < margin)                  A.z += 0.08 + 0.12 * noise.x;
    if (A.y > iResolution.y - margin)  A.z -= 0.08 + 0.12 * noise.x;

    // Reflect if out of bounds
    vec2 b = clamp(A.xy, vec2(0.0), iResolution.xy);
    if (A.x != b.x) { A.z = TWOPI * 0.5 - A.z; }
    if (A.y != b.y) { A.z = TWOPI - A.z; }
    A.xy = b;

    // Keep angle within 0–2π
    A.z = mod(A.z, TWOPI);

    // Save mood
    A.w = mood;

    // ===== Initialization =====
    if (iFrame == 0 || (noise.x < 0.01 && noise.y < 0.01) ) {
        float N = 50.;

        // Initial position (grid-based)
        A.xy = round(fragCoord / N) * N;

        vec4 initNoise = random4(vec3(A.xy * 0.01, 0.0));

        // Initial direction
        A.z = initNoise.z * TWOPI;

        // Initial mood (low)
        A.w = initNoise.x * 0.2;
    }

    // Output particle data for next frame
    fragColor = A;
}