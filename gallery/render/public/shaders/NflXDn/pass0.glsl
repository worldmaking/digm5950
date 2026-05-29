// Image — Lenia + species trail + particle dots
//
// iChannel0: bufA  (Lenia)
// iChannel1: bufB  (particle state)
// iChannel2: bufC  (trail: .r=intensity, .g=speciesID/9)

// Multiple kernels coexist in the field, suppressing the unlimited growth of any single species.
// Future work: use particle interactions to model coexistence, competition, and evolutionary dynamics between species.

vec3 speciesColor(float s) {
    float h = s / 10.0;
    vec3 rgb = clamp(abs(mod(h*6.0 + vec3(0.,4.,2.), 6.)-3.)-1., 0., 1.);
    return mix(vec3(1.), rgb, 0.85);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord / iResolution.xy;
    float mask = 1.-texture(iMask, uv).a;

    vec3 lenia = texture(iChannel0, uv).rgb;
    vec4 A     = texture(iChannel1, uv);          // particle
    vec2 trail = texture(iChannel2, uv).rg;       // .r=intensity .g=speciesNorm

    vec3 trailColor = speciesColor(trail.g * 9.0);

    vec3 col = lenia;

    // species trail glow
    // ---------------------------------------
    //uncomment this line to show trails
    //col += trailColor * trail.r * 0.5;

    // particle dot colored by species
    float d  = distance(fragCoord, A.xy);
    vec3  sc = speciesColor(A.w);
    
    // ----------------------------------------
    //uncomment this line to show particles
    //col += sc * smoothstep(3., 0., d);

    fragColor = vec4(clamp(col, 0., 1.), 1.) * mask;
}
