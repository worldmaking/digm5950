/*
Student number: 218179226
Assignment2
Name: Junxi Li
Title: Spiral Particle Cellular Automaton

Image
-reads particle field from BufferA
-gives each particle a base color and small stable variatio
-adds a small glow by checking neighbor pixels so dots pop visually
*/

vec3 palette(vec3 onehot, vec2 fragCoord){
    //3 base colors
    vec3 c0 = vec3(0.12, 0.78, 0.95);
    vec3 c1 = vec3(0.95, 0.22, 0.58);
    vec3 c2 = vec3(0.94, 0.88, 0.22);

    //choose base by particle type
    vec3 base = (onehot.x > 0.5) ? c0 : ((onehot.y > 0.5) ? c1 : c2);

    //makes particles less uniform
    float h = random2(fragCoord).x;
    float v = random2(fragCoord + 17.3).y;

    //push slightly toward complementary color and brightness variation
    vec3 comp = 1.0 - base;
    base = mix(base, comp, (h - 0.5) * 0.25 + 0.125);
    base *= 0.85 + 0.35 * v;

    return clamp(base, 0.0, 1.0);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = fragCoord / iResolution.xy;

    if(iMouse.z > 0.0) {
        float magnification = 10.0;
        uv /= magnification;
        uv += iMouse.xy / (iResolution.xy + (iResolution.xy / (magnification - 1.0)));
    }

    vec2 px = 1.0 / iResolution.xy;

    //read particle at this pixel
    vec3 c = texture(iChannel0, uv).rgb;

    //check if there's a particle here
    float occ = step(0.5, max(c.x, max(c.y, c.z)));

    float g = 0.0;
    vec3 cx;

    cx = texture(iChannel0, uv + vec2(px.x,0)).rgb;
    g += step(0.5, max(cx.x, max(cx.y, cx.z)));

    cx = texture(iChannel0, uv + vec2(-px.x,0)).rgb;
    g += step(0.5, max(cx.x, max(cx.y, cx.z)));

    cx = texture(iChannel0, uv + vec2(0,px.y)).rgb;
    g += step(0.5, max(cx.x, max(cx.y, cx.z)));

    cx = texture(iChannel0, uv + vec2(0,-px.y)).rgb;
    g += step(0.5, max(cx.x, max(cx.y, cx.z)));

    g = clamp(g / 4.0, 0.0, 1.0);

    //background color
    vec3 col = vec3(0.03);

    //particle color with variation
    vec3 pcol = palette(c, fragCoord);

    //draw dot
    col = mix(col, pcol, occ);

    //add glow if neighbors exist
    col += pcol * (0.18 * g);

    col = pow(col, vec3(0.92));

    fragColor = vec4(col, 1.0);
}