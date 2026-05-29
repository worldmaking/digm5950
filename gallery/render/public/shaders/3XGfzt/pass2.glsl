/*
Student number: 218179226
Assignment2
Name: Junxi Li
Title: Spiral Particle Cellular Automaton

Buffer A store:
- Each pixel is either EMPTY or contains exactly one particle.
- RGB encodes the particle type using one-hot colors:
  (1,0,0), (0,1,0), or (0,0,1).
- (0,0,0) means no particle here (empty).

Core idea:
1) Create a spiral flow field that rotates and pulls things toward the center.
2) For each pixel, sample the previous frame from an “upstream” spot (uvBack),
   so particles get carried by the flow.
3) Turn the result back into particles (either empty or one particle)
*/

//spiral velocity: rotate around center and drift inward
vec2 spiralVelocity(vec2 uv, float t){
    vec2 c = vec2(0.5);
    vec2 d = uv - c;
    float r = length(d);

    //rotation around center
    vec2 tan = vec2(-d.y, d.x);
    //pull toward center
    vec2 rad = -d;

    //stronger flow closer to center
    float inv = 1.0 / (0.14 + r);

    float rot = 2.2;  // rotation strength
    float inw = 1.7;  // inward pull

    //small wobble so it doesn't look too perfect
    float wob = 0.12*sin(t*0.6) + 0.08*sin(t*1.1);

    vec2 v = (rot*(1.0+wob))*tan + inw*rad;
    v *= inv;

    //cap max speed for stability
    float L = length(v);
    if(L > 7.0) v *= 7.0 / L;
    return v;
}

//pick a particle type based on a mixture probability p
vec3 pickType(vec3 p, float r){
    float s = max(p.x + p.y + p.z, 1e-6);
    vec3 q = p / s;
    if(r < q.x) return vec3(1,0,0);
    if(r < q.x + q.y) return vec3(0,1,0);
    return vec3(0,0,1);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = fragCoord / iResolution.xy;
    vec2 px = 1.0 / iResolution.xy;

    //random values used for decisions this frame
    vec4 n = random4(vec3(fragCoord.xy, iTime));

    //how fast the wobble changes over time
    float t = iTime * 0.25;

    //velocity at this pixel
    vec2 v = spiralVelocity(uv, t);

    //speed control: how far particles move each frame
    float advPix = 0.5;

    //read from where the particle came from last frame
    vec2 uvBack = uv - v * advPix * px;

    //reduces tearing when advecting
    vec2 jit = (n.yz - 0.5) * px * 0.35;

    vec3 p0 = texture(iChannel0, uvBack + jit).rgb;
    vec3 p1 = texture(iChannel0, uvBack + jit + vec2(px.x,0)).rgb;
    vec3 p2 = texture(iChannel0, uvBack + jit + vec2(0,px.y)).rgb;
    vec3 p3 = texture(iChannel0, uvBack + jit + vec2(px.x,px.y)).rgb;

    //mixed upstream value
    vec3 p  = (p0+p1+p2+p3) * 0.25;

    // ---- Stochastic quantization: keep it as particles ----
    //represent the probability that this pixel is occupied by a dot
    float occ = clamp(max(p.x, max(p.y, p.z)), 0.0, 1.0);

    //small boost so particles don't die out
    occ = clamp(occ * 1.35, 0.0, 1.0);

    //minimum density everywhere
    float baseBirth = 0.02;
    occ = max(occ, baseBirth);

    //extra density near center to make vortex core visible
    float rC = length(uv - vec2(0.5));
    occ = max(occ, baseBirth + 0.02 * smoothstep(0.55, 0.15, rC));

    //final occupied or empty decision
    float take = step(n.x, occ);

    //decide particle type:
    //inherit from upstream mixtur, if upstream is basically empty, spawn random type
    vec3 source = p;
    if(source.x + source.y + source.z < 1e-4){
        float rr = n.z;
        source = (rr < 0.333) ? vec3(1,0,0) : (rr < 0.666 ? vec3(0,1,0) : vec3(0,0,1));
    }
    vec3 onehot = pickType(max(source, 0.0), n.w);

    //either empty or one colored dot
    vec3 outRGB = onehot * take;

    //tiny random type flip
    if (take > 0.5 && n.y < 0.02){
        outRGB = pickType(vec3(1,1,1), n.z) * take;
    }

    //start sparse random particles
    if(iFrame == 0){
        float occ0 = step(n.x, 0.03);
        vec3 t0 = (n.y < 0.333) ? vec3(1,0,0) : (n.y < 0.666 ? vec3(0,1,0) : vec3(0,0,1));
        fragColor = vec4(t0 * occ0, 1.0);
        return;
    }

    fragColor = vec4(outRGB, 1.0);
}