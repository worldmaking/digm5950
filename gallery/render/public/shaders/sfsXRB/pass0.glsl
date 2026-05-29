/*
Student Number: 219029677
Assignment: A4
Name: Santiago Bucio-Cano
Title: Ecology of Disturbance

Interactions:
- Clicking the mouse adds local resources and
  temporarily calms disturbed regions.
- Resetting the shader can produce different
  long-term outcomes due to random initial states.
- Key parameters include agent speed, sensor length,
  nutrient diffusion, disturbance strength, and
  orbit phase speed.
- The system is best viewed over time, as behavior
  emerges through cycles rather than a static frame.

System Idea:
This project explores an artificial ecosystem built from multiple interacting systems. It combines a
nearest-particle agent simulation, a trail and nutrient field, and a dynamic cellular substrate that behaves like a living membrane.

Agents are divided into multiple castes with different responses to food, substrate stability, and zones of change. An orbiting source alternates
between feeding and disruption phases, making the environment continuously unstable.

The substrate actively participates in the system by shaping both agent behavior and environmental conditions such as nutrient growth, disturbance,
and trail persistence. Instead of acting as a passive background, it becomes part of the ecology, influencing where regions become stable, unstable,
or resource-rich.

Interesting Behaviors:
The three behavioral castes produce visibly different movement patterns. Foragers converge on resource-rich zones, settlers prefer stable
regions, and disruptors move toward unstable or changing areas.

Because these castes coexist, the system produces mixed regions of clustering, circulation, avoidance, and interference rather than a single
uniform pattern.

The orbiting source creates cyclical behavior. During feeding phases, agents cluster and build dense trails. During disruption phases, agents
scatter and reorganize. This creates repeating cycles of growth, collapse, and redistribution.

Technical Realization:
The project uses multiple buffers. One stores agent state (position, direction, caste seed). Another stores trail accumulation. A third stores
the attractor field (nutrient, disturbance, phase glow). A fourth implements a cellular substrate using a stochastic neighbor-copying
process inspired by Ising systems.

Agents use directional sensing to guide movement based on environmental signals. Each caste applies different weights to food, stability, and change.
The orbiting source modifies the environment, which indirectly changes agent behavior.

The Ising-based substrate was extended beyond a visual or steering influence to directly modify the environment. It affects nutrient accumulation,
disturbance intensity, and trail persistence, allowing it to act as an ecological regulator.

The substrate evolves continuously, creating regions of stability, activity, and transition. These regions influence both agent movement and
environmental fields, producing feedback between motion, memory, and environmental change.

Sources / Credits:
- Nearest-particle tracking and trail movement
  from course material and Lab 9.
- Cellular substrate logic from course material
  and Lab 4.
- Integration, caste behavior, swim motion, and
  ecological system design are original extensions.

Future Extensions:
Future work could allow castes to directly modify the substrate, creating long-term environmental memory. 
Introducing reproduction or competition could allow the system to evolve over time. Additional orbiting sources or irregular phase
patterns could produce more complex dynamics.
*/

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord / iResolution.xy;

    if (iMouse.z > 0.0)
    {
        float magnification = 4.0;
        uv /= magnification;
        uv += iMouse.xy / (iResolution.xy + (iResolution.xy / (magnification - 1.0)));
    }

    vec4 A = texture(iChannel0, uv);
    vec4 B = texture(iChannel1, uv);
    vec4 C = texture(iChannel2, uv);
    vec4 D = texture(iChannel3, uv);

    float d = distance(uv * iResolution.xy, A.xy);
    float p = smoothstep(2.0, 0.0, d);

    // Reconstruct the moving circle source from Buffer C so it is clearly visible.
    float a = iTime * 0.18;
    float r = iResolution.y / 3.0;
    vec2 center = iResolution.xy * 0.5 + vec2(cos(a), sin(a)) * r;
    float dCircle = distance(fragCoord, center);

    // Bright cyan core with a white ring for contrast.
    float circleCore = smoothstep(60.0, 0.0, dCircle);
    float circleEdge = smoothstep(110.0, 90.0, dCircle);

   // Deep blue -> bright cyan circle
    vec3 circleCol = mix(
        vec3(0.0, 0.08, 0.28),
        vec3(0.0, 0.75, 1.0),
        circleCore
    ) * 1.7;

    // Cyan edge ring
    circleCol += vec3(0.15, 0.85, 1.0) * circleEdge * 1.1;

    // Soft inner glow
    circleCol += vec3(0.0, 0.45, 0.9) * pow(circleCore, 2.0) * 0.45;

    // Pulse
    circleCol *= 1.0 + 0.12 * sin(iTime * 2.0);

    vec3 membrane = mix(
        vec3(0.03, 0.05, 0.10),
        vec3(0.12, 0.35, 0.55),
        D.r
    );

    // Recently changed membrane glows a little teal.
    membrane += vec3(0.0, 0.35, 0.45) * D.a * 0.35;

    float sugarVal = C.r;
    float disturbVal = C.g;
    float phaseGlow = C.b;

    // Food = warm amber/orange
    vec3 sugar = vec3(0.85, 0.42, 0.08) * sugarVal * 0.65;
    sugar += vec3(1.0, 0.55, 0.12) * pow(sugarVal, 2.0) * 0.35;

    // Disturbance = purple/magenta
    vec3 disturbance = vec3(0.55, 0.08, 0.70) * disturbVal * 0.95;
    disturbance += vec3(0.85, 0.18, 0.90) * phaseGlow * 0.22;

    // Trails = darker cool blue
    vec3 trails = B.rgb * vec3(0.22, 0.50, 0.72) * 0.75;

    vec3 agentColor;

    if (A.w > 0.42 && A.w < 0.58)
        agentColor = vec3(0.65, 0.88, 1.0);   // hybrid = pale cyan
    else if (A.w < 0.333)
        agentColor = vec3(1.0, 0.72, 0.18);   // forager = amber
    else if (A.w < 0.666)
        agentColor = vec3(0.18, 0.95, 0.45);  // settler = green
    else
        agentColor = vec3(0.95, 0.18, 0.72);  // disruptor = magenta

    vec3 agents = agentColor * p * 0.9;

    vec3 col = membrane * 0.85 + sugar + disturbance + trails + agents + circleCol;

    // Lower exposure so highlights do not wash out.
    col = 1.0 - exp(-col * 1.02);

    fragColor = vec4(col, 1.0);
}