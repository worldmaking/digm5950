/*

218802405
Final Project
Gianluca Sabatini
Explosive Skies

Interactions:
By clicking down on the mouse, the viewer can zoom in on the system. By moving the mouse while it is held down, the visible
area in the viewer window is changed.

Description:
"Explosive Skies" is a system of conflicting forces moving in opposite directions. Each of these forces is represented by a
group of cells. One of these groups take the form of dark blobs, almost resembling clouds, gliding and contorting from the
top right to the bottom left of the visible area. The other major group is more akin to explosions, encapsulating the system's 
dark spaces into a blinding light. These cells combust as they move, never taking up as much space as the blobs in the overall
system, almost creating a light show. Colour-wise, the system most potently focuses on black and white, but the darker spaces
have a subtle green hue, while the bright explosions turn blue as they fizzle out. The system is a clash of forces, and a
visual spectacle as a result. Its unique sets of cells are very dynamic in their movement and interactions, as opposed to
simpler automota developed in Shadertoy.

Technical Realization:
For this assignment, the a novel, complex system, with a major focus on its behaviours rather than soley its visuals. Unlike
previous designs in Shadertoy, for this task, I started from scratch, figuring it would be the best way to develop a design
intended to have a high level of complexity. As I developed the system further, I added additional buffers that would create
the "heat map" and "voltage" systems. Both systems help to enhance the potentness of the explosions, with Buffer B expanding
their reach and Buffer C drastically increasing the brightness. All together, this created the striking visials present in the
system, and led to it really clicking for me. Looking at it now, its flow and colour reminds me of a Y2K aesthetic, to the
point where I can picture techno music playing over it.

*/

// Defined values for use accross the common tab (use cases are self-explanitory from title)
#define FLOW_STRENGTH    1.5
#define ELECTRIC_FORCE   1.2
#define TURBULENCE       0.3
#define DIFFUSION_RATE   1.2
#define DECAY_RATE       0.96

// Establishes the float 'hash' for use in the rest of the common tab
float hash(vec2 p)
{
    return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123);
}

// Establishes float 'noise' for use accross the common tab
float noise(vec2 p)
{
    // Establishes vec2s 'i' and 'f', manipulations on the vec2 attributed to the float ('p')
    vec2 i = floor(p);
    vec2 f = fract(p);
    
    // Establishes floats 'a', 'b', 'c', and 'd' by manipulating the previously established vec2, 'i'
    float a = hash(i);
    float b = hash(i + vec2(1.0,0.0));
    float c = hash(i + vec2(0.0,1.0));
    float d = hash(i + vec2(1.0,1.0));
    
    // Establishes vec2 'u' by using multiplications of the previously established vec2, 'f'
    vec2 u = f*f*(3.0-2.0*f);

    return mix(a,b,u.x)
         + (c-a)*u.y*(1.0-u.x)
         + (d-b)*u.x*u.y;
}

// Establishes float 'fbm', that creates fractal noise, allowing for the richer motion present in the system
float fbm(vec2 p)
{
    // Establishes floats 'v' and 'a' that are altered in an upcoming for loop
    float v = 0.0;
    float a = 0.5;
    
    // For loop that alters 'v', 'a', and the vec2 attributed to the float ('p')
    for(int i = 0; i < 4; i++)
    {
        v += a * noise(p);
        p *= 2.0;
        a *= 0.5;
    }
    // Returns the float 'v' as a value whenever the float 'fbm' is called
    return v;
}

// Establiahes float 'sampleR', that utilizes texture and 'uv' for use across the rest of the common tab
float sampleR(sampler2D tex, vec2 uv)
{
    return texture(tex, uv).r;
}

// Establishes vec2 'gradient' that is a core component in Buffer A
vec2 gradient(sampler2D tex, vec2 uv, vec2 px)
{
    // Establishes 'gradient' on the x axis
    float gx = sampleR(tex, uv + vec2(px.x,0.0)) -
               sampleR(tex, uv - vec2(px.x,0.0));

    // Establishes 'gradient' on the y axis
    float gy = sampleR(tex, uv + vec2(0.0,px.y)) -
               sampleR(tex, uv - vec2(0.0,px.y));
    
    // Returns 'gx' and 'gy' in a coordinate-esque structure as the vec2 value whenever the vec2 'gradient' is called
    return vec2(gx, gy);
}

// Establishes float 'laplacian' that is used as a core component of all 3 Buffers
float laplacian(sampler2D tex, vec2 uv, vec2 px)
{
    // Establishes float 'sum' for use within the laplacian float
    float sum = 0.0;
    
    // For loop that is used as a grid-esque setup
    for(int x=-1; x<=1; x++)
    for(int y=-1; y<=1; y++)
    {
        // Establishes vec2 'o' for use within the loop
        vec2 o = vec2(x,y) * px;
        
        // Establishes float 'n' that utilizes float 'sampleR' to run through its motions while modifying 'uv' by adding
        // the previously established vec2 'o'
        float n = sampleR(tex, uv + o);
        
        // Establishes a value for float 'sum' if the loop is in its first position
        if(x == 0 && y == 0)
            sum -= 8.0 * n;
        else
            sum += n;
    }
    
    // Returns 'sum' divided by 8.0 whenever the float 'laplacian' is called
    return sum / 8.0;
}