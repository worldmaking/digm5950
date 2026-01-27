# A quick introduction to fragment shaders in GLSL

## What is a Fragment Shader?

A program you write in GLSL, whose output is the "fragments" of an image ("pixels", or the "texels" of a "texture").  The program you write defines the operation for a single fragment (pixel), and this program runs in parallel on the GPU over all the fragments (pixels) in your image. 

The fragment shader is a program that runs separately for each fragment (think of it as a pixel). The main output of the fragment shader is a pixel colour, as a `vec4` representing red, green, blue and alpha (opacity) components, between 0 and 1.  

Sample code:

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec4 yellow = vec4(1, 1, 0, 1); // red, green, blue, alpha
    
    fragColor = yellow;
}
```

For the most part, GLSL here looks a lot like C, Java, and similar procedural, typed languages.  You can think of the main function here as defining a program that runs per pixel (per fragment actually) of the output image. In this case, we set all pixels to a single color. 

One slightly unusual feature is the `out` keyword: a function can have arguments that you can modify. In this case, the output pixel color. 

## Vector types

The output pixel is a `vec4`, which means it has four values, for Red, Green, Blue, and Alpha (opacity).  `vec4` is a built in type in GLSL, along with `vec2` and `vec3`. 

There are a few slightly idisyncratic GLSL language features of vectors. You can index their components in a few different ways, including swizzling (re-ordering) them, 

```glsl
    vec4 v = vec4(1, 0.5, 0.2, 0);

    // these two are the same:
    fragColor = vec4(v.x, v.y, v.z, v.w);    
    fragColor = v.xyzw;

    // these two are the same:
    fragColor = vec4(v.w, v.z, v.y, v.x);
    fragColor = v.wxyz; 

    // these two are the same:
    fragColor = vec4(v.x, v.x, v.x, v.x);    
    fragColor = v.xxxx; 

    // .r .g .b .a == .x .y .z .w 
    // these two are the same:
    fragColor = v.xxxx; 
    fragColor = v.rrrr;  

    // compound a vec4 from vec3's, vec2's, and floats:
    // these two are the same:
    fragColor = vec4(v.xy, v.z, 1);
    fragColor = vec4(v.rgb, 1);

    // we can also create a vec4 from a single float like this:
    // these two are the same:
    fragColor = vec4(1, 1, 1, 1);
    fragColor = vec4(1);
```

## Pixel and Texture Coordinates

The `vec2 fragCoord` argument is the pixel location in integer pixel numbers, starting at the bottom-left.  To turn that into a *normalized* coordinate, that goes from `vec2(0.0, 0.0)` at the bottom left, to `vec2(1.0, 1.0)` at the top right, we can divide by the image resolution.  Shadertoy gives us the image resolution in the variable `iResolution.xy`.

```glsl
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;

    // visualize X coordinate in red, Y coordinate in green:
    fragColor = vec4(uv, 0, 1);
```

So now we can use the normalized coordinate to make a pattern over space. Essentially here we are defining a field function, that maps a `vec2` position into a `vec4` color. 

For example, here's a repeating sinusoidal surface:

```glsl 
    const float PI = 3.141592653589793;
    vec2 grid = cos(10.0 * PI * uv);
    fragColor = vec4(grid, 0, 1);
```

Notice how the `cos` function is quite happy to accept a `vec2` and produce a `vec2` result. This is true for most math functions in GLSL. 

Or we consider the pixel's distance from the center:

```glsl
    vec2 centre = vec2(0.5, 0.5);
    float dist = distance(uv, centre);  
    // equivalent: length(uv - centre);
    fragColor = vec4(dist); 
```

We can also turn this into a distance-from-circle, simply by subtracting the circle's radius from the distance.  

```glsl
    vec2 centre = vec2(0.5, 0.5);
    float radius = 0.2;
    float dist = distance(uv, centre) - radius;
    fragColor = vec4(dist); 
    
	// or to draw a smooth edge:
    float sharpness = 50.0;
    float spot = exp(-dist * sharpness);
    //fragColor = vec4(spot);
```

Notice how odd this is: we are drawing a shape not by geometry, but by specifying a function of a field.  We didn't trace a line, we didn't do any geometry really, we just defined a function of space that maps a 2D position into a color, using only the principle of *signed distance*. This method of drawing by 'distance function' can be surprisingly powerful.

With this kind of thing, we might want to use "signed normalized" coordinates, which run from `vec2(-1, -1)` to `vec2(1, 1)`, so that the center of the image is at `vec2(0, 0)`. We might even want to stretch this to take into account the aspect ratio of the screen. Here's how:

```
	// signed normalized pixel coordinates (from -1 to 1)
    vec2 suv = uv*2.0 - 1.0;

    // to take into account aspect ratio:
    suv.x *= iResolution.x / iResolution.y;
```

## Built-in 'Uniforms'

We used the `iResolution` uniform before to get the canvas size. (The "Uniform" terminology here really means an input parameter to the shader. It is "uniform" because the parameter has the same value for all pixels.) Shadertoy also gives us a few more uniforms to play with:

```glsl
uniform vec3      iResolution;           // viewport resolution (in pixels)
uniform float     iTime;                 // shader playback time (in seconds)
uniform float     iTimeDelta;            // render time (in seconds)
uniform float     iFrameRate;            // shader frame rate
uniform int       iFrame;                // shader playback frame
uniform float     iChannelTime[4];       // channel playback time (in seconds)
uniform vec3      iChannelResolution[4]; // channel resolution (in pixels)
uniform vec4      iMouse;                // mouse pixel coords. xy: current (if MLB down), zw: click
uniform samplerXX iChannel0..3;          // input channel. XX = 2D/Cube
uniform vec4      iDate;                 // (year, month, day, time in seconds)
```

So for example, we can use iMouse.xy to move the circle, and iTime to change its size:

```glsl
    vec2 centre = iMouse.xy;
    float radius = 100. * abs(sin(iTime));
```

## Procedural Images

There's a lot you can do with math to procedurally generate images as functions of space (and time). Here's a more colourful example of a field varying in time:

```glsl
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;

    // Time varying pixel color
    vec3 col = 0.5 + 0.5*cos(iTime + uv.xyx+vec3(0,2,4));

    // Output to screen
    fragColor = vec4(col, 1.0);
```

### Random/Noise

One thing GLSL doesn't provide is a noise or random number generator. Some people have worked around this by finding mathematical functions that are pseudo-random -- noisy enough and cheap enough for many simple use cases. 

This is generic library code -- you can put this directly into the top of your shader, or in Shadertoy you can click the + to add a "Common" tab, in which you can place library code like this that will be visible to all shaders.

```glsl
#define RANDOM_SCALE vec4(.1031, .1030, .0973, .1099)

vec2 random2(float p) {
    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.xx + p3.yz) * p3.zy);
}

vec2 random2(vec2 p) {
    vec3 p3 = fract(p.xyx * RANDOM_SCALE.xyz);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.xx + p3.yz) * p3.zy);
}

vec2 random2(vec3 p3) {
    p3 = fract(p3 * RANDOM_SCALE.xyz);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.xx + p3.yz) * p3.zy);
}

vec3 random3(float p) {
    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.xxy + p3.yzz) * p3.zyx); 
}

vec3 random3(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * RANDOM_SCALE.xyz);
    p3 += dot(p3, p3.yxz + 19.19);
    return fract((p3.xxy + p3.yzz) * p3.zyx);
}

vec3 random3(vec3 p) {
    p = fract(p * RANDOM_SCALE.xyz);
    p += dot(p, p.yxz + 19.19);
    return fract((p.xxy + p.yzz) * p.zyx);
}

vec4 random4(float p) {
    vec4 p4 = fract(p * RANDOM_SCALE);
    p4 += dot(p4, p4.wzxy + 19.19);
    return fract((p4.xxyz + p4.yzzw) * p4.zywx);   
}

vec4 random4(vec2 p) {
    vec4 p4 = fract(p.xyxy * RANDOM_SCALE);
    p4 += dot(p4, p4.wzxy + 19.19);
    return fract((p4.xxyz + p4.yzzw) * p4.zywx);
}

vec4 random4(vec3 p) {
    vec4 p4 = fract(p.xyzx * RANDOM_SCALE);
    p4 += dot(p4, p4.wzxy + 19.19);
    return fract((p4.xxyz + p4.yzzw) * p4.zywx);
}

vec4 random4(vec4 p4) {
    p4 = fract(p4  * RANDOM_SCALE);
    p4 += dot(p4, p4.wzxy + 19.19);
    return fract((p4.xxyz + p4.yzzw) * p4.zywx);
}
```

Try out a quick example: 

```glsl
    vec4 noise = random4(vec3(fragCoord.xy, iTime));
    fragColor = vec4(noise);
```

Note that this is not a very good pseudo-random generator, and sometimes you will see patterns. Better generators are more expensive. Here is a good example: https://www.shadertoy.com/view/ftsfDf  

## External image inputs (texture sampling)

We can also pull in external images into a shader to process them, including videos, webcam streams, and so on.  Click on the `iChannel0` box under the editor and choose an image or stream to use.  We can then access this using the `texture` function:

```glsl
    vec4 image = texture(iChannel0, uv);
    
    fragColor = image;
```

So now we can do all kinds of math on that image for classic webcam effects:

```glsl
    // invert
    fragColor = 1.-image;
    // recolor:
    fragColor = image.gbra;
    // a kind of saturation:
    fragColor = smoothstep(0., 1., image);
    // a kind of saturation:
    fragColor = smoothstep(0.4, 0.6, image);
    // simple greyscale:
    fragColor = image.ggga;
    // threshold:
    fragColor = smoothstep(0.4, 0.41, image.ggga); 
    // brightness:
    fragColor = pow(image, vec4(sin(iTime)+1.5));
```

### Common color manipulations

Some more library code for common image manipulations: 

```glsl
vec3 desaturate(in vec3 v, in float a ) {
    return mix(v, vec3(dot(vec3(.3, .59, .11), v)), a);
}
vec4 desaturate(in vec4 v, in float a ) { return vec4(desaturate(v.rgb, a), v.a); }

float brightnessContrast( float v, float b, float c ) { return ( v - 0.5 ) * c + 0.5 + b; }
vec3 brightnessContrast( vec3 v, float b, float c ) { return ( v - 0.5 ) * c + 0.5 + b; }
vec4 brightnessContrast( vec4 v, float b, float c ) { return vec4(( v.rgb - 0.5 ) * c + 0.5 + b, v.a); }

float rgb2luma(const in vec3 rgb) { return dot(rgb, vec3(0.2126, 0.7152, 0.0722)); }
float rgb2luma(const in vec4 rgb) { return rgb2luma(rgb.rgb); }

vec3 hue2rgb(const in float hue) {
    float R = abs(hue * 6.0 - 3.0) - 1.0;
    float G = 2.0 - abs(hue * 6.0 - 2.0);
    float B = 2.0 - abs(hue * 6.0 - 4.0);
    return clamp(vec3(R,G,B), 0., 1.);
}

vec3 hsv2rgb(const in vec3 hsv) { return ((hue2rgb(hsv.x) - 1.0) * hsv.y + 1.0) * hsv.z; }
vec4 hsv2rgb(const in vec4 hsv) { return vec4(hsv2rgb(hsv.rgb), hsv.a); }

vec3 rgb2hsv(const in vec3 c) {
    vec4 K = vec4(0., -0.33333333333333333333, 0.6666666666666666666, -1.0);
    vec4 p = c.g < c.b ? vec4(c.bg, K.wz) : vec4(c.gb, K.xy);
    vec4 q = c.r < p.x ? vec4(p.xyw, c.r) : vec4(c.r, p.yzx);
    float d = q.x - min(q.w, q.y);
    return vec3(abs(q.z + (q.w - q.y) / (6. * d + 1e-10)), 
                d / (q.x + 1e-10), 
                q.x);
}
vec4 rgb2hsv(const in vec4 c) { return vec4(rgb2hsv(c.rgb), c.a); }
```

## Spatial image sampling

Obviously, some of these image effects can also use the coordinate to transform them, to create for example vignette effects. 

```glsl
    fragColor *= exp(-length(suv));
```

The `texture` function needs the specific "sampler" input to sample from (in this case, `iChannel0` which Shadertoy provides), as well as a vec2 normalized coordinate for where in the image to sample it. That means of course, we can sample from different places, not only the current location! 

```glsl
    vec2 coord = 0.5 + (suv)*sin(iTime);
    //vec2 coord = 0.5 + (suv)*exp(-length(suv));
    //vec2 coord = 0.5 + (suv)*exp(sin(iTime)*length(suv));
    //vec2 coord = 0.5 + 0.5*mix(suv, suv*sin(iTime), 1.-length(suv));
    //vec2 coord = uv + 0.1*(noise.xy-0.5)*length(suv);  // a little noise can be a bit like a blur
    vec4 image = texture(iChannel0, coord);
```

### Sampling neighboring pixels

Often we may want to target a specific pixel, such as "the pixel to the East" -- we need this for many cellular automata such as the Game of Life.  If we are starting from the pixel location (`fragCoord`), we can modify this pixel location before we convert to the normalized coordinates that `texture()` needs:

```glsl
	// get the 8 neighboring pixel values:
	vec4 E  = texture(iChannel0, (fragCoord + vec2( 1, 0))/iResolution.xy);
	vec4 W  = texture(iChannel0, (fragCoord + vec2(-1, 0))/iResolution.xy);
	vec4 N  = texture(iChannel0, (fragCoord + vec2( 0, 1))/iResolution.xy);
	vec4 S  = texture(iChannel0, (fragCoord + vec2( 0,-1))/iResolution.xy);
	vec4 NE = texture(iChannel0, (fragCoord + vec2( 1, 1))/iResolution.xy);
	vec4 NW = texture(iChannel0, (fragCoord + vec2(-1, 1))/iResolution.xy);
	vec4 SE = texture(iChannel0, (fragCoord + vec2( 1,-1))/iResolution.xy);
	vec4 SW = texture(iChannel0, (fragCoord + vec2(-1,-1))/iResolution.xy);
```

Or, if we start from a `uv` coordinate, we can do it according to the size of one texel:

```glsl

	vec2 oneTexel = 1.0/vec2(textureSize(iChannel0, 0));

	vec4 E  = texture(iChannel0, uv + vec2( 1, 0)*oneTexel);
	vec4 W  = texture(iChannel0, uv + vec2(-1, 0)*oneTexel);
	vec4 N  = texture(iChannel0, uv + vec2( 0, 1)*oneTexel);
	vec4 S  = texture(iChannel0, uv + vec2( 0,-1)*oneTexel);
	vec4 NE = texture(iChannel0, uv + vec2( 1, 1)*oneTexel);
	vec4 NW = texture(iChannel0, uv + vec2(-1, 1)*oneTexel);
	vec4 SE = texture(iChannel0, uv + vec2( 1,-1)*oneTexel);
	vec4 SW = texture(iChannel0, uv + vec2(-1,-1)*oneTexel);
```

### 3x3 Convolution kernels

We can also do this in a more data-driven way.  In fact, sampling over the nearest pixels is the basis for many common types of image effect including blur, sharpen, erode, edge highlight, etc.  These are called [convolution filters](https://en.wikipedia.org/wiki/Kernel_(image_processing)). Convolution simply means multiplying several pairs of terms together and summing the results. In image processing, this is usually means multiplying a square (or rectangular) region of an image with a "kernel" matrix.  

We can use the GLSL `mat3` type to represent the kernel, for the relative weights of the neighboring pixels. Then we loop over these pixels, sampling the image at each point, and multiplying it with the corresponding kernel weight, summing up the results. 

```glsl
    // some example kernels:

    mat3 identity = mat3(
        0, 0, 0,
        0, 1, 0,
        0, 0, 0,
    );

    mat3 edge0 = mat3(
         1,  0, -1,
         0,  0,  0,
        -1,  0,  1,
    );

    mat3 edge1 = mat3(
         0, -1,  0,
        -1,  4, -1,
         0, -1,  0
    );

    mat3 edge2 = mat3(
        -1, -1, -1,
        -1,  8, -1,
        -1, -1, -1
    );
    mat3 sharpen = mat3(
         0, -1,  0,
        -1,  5, -1,
         0, -1,  0
    );

    mat3 emboss = mat3(
        -2, -1,  0, 
        -1,  1,  1, 
         0,  1,  2
    );

    mat3 boxBlur = mat3(
        1, 1, 1,
        1, 1, 1,
        1, 1, 1
    ) * 1.0/9.0;

    mat3 gaussBlur = mat3(
        1, 2, 1,
        2, 4, 2,
        1, 2, 1
    ) * 1.0/16.0;

    kernel = identity;
    
    vec2 oneTexel = 1./iResolution.xy;
    
    // loop over a 3x3 region, summing results:
    vec4 sum = vec4(0.0);
    for (int i = -1; i <= 1; i++) {
        for (int j = -1; j <= 1; j++) {
            // get the texture coordinate offset for this texel:
            vec2 offset = vec2(float(i), float(j)) * oneTexel;
            // get the image at this texel:
            vec4 pixelColor = texture(iChannel0, uv + offset);
            // Apply kernel weight and sum:
            sum += pixelColor * kernel[i+1][j+1]; 
        }
    }

    fragColor = sum;
```

There are some other spatial image processes that are similar to convolution, but not using summation (so they are not strictly convolution), which you could explore:

- Erode searches surrounding pixels looking for minimum values
- Dilate searches surrounding pixels looking for maximum values
- Frosted Glass can blend together several local pixels in a non-standard pattern

## Coordinate transformations with mat2 and mat3

We can also use mat objects to perform spatial transformations of the image. Here's a rotation matrix:

```glsl
mat2 rotateMat2(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat2(
        c,  s,
        -s,  c
    );
}
```

If we apply this to our `uv` coordinate, we can rotate the image:

```glsl
    uv = rotate(iTime) * uv;
```

We can also scale using a mat2:

```glsl
mat2 scaleMat2(float s) {
    return mat2(
        s,  0,
        0,  s
    );
}
```

If we wanted to *translate* however, we need to use `mat3`.  The idea is simple: we assume that there is a 3rd coordinate to the input vector, equvalent to `uv3 = vec3(uv, 1)`, so that we can then multiply this with the `mat3`.  Then our transforms look like this:

```glsl
mat3 translateMat3(float x, float y) {
    return mat3(
        1, 0, 0,        // First column (accessed as m[0])
        0, 1, 0,        // Second column (accessed as m[1])
        x, y, 1         // Third column (accessed as m[2])
  );
}

mat3 rotateMat3(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat3(
        c,  s, 0,
        -s, c, 0,
        0,  0, 1
    );
}

mat3 scaleMat3(float s) {
    return mat2(
        s, 0, 0,
        0, s, 0,
        0, 0, 1
    );
}
```

With these we can create quite complex transformations:

```glsl
    // convert to a vec3:
    uv3 = vec3(uv, 1.);
    // apply several transformations:
    uv3 = translateMat3(-0.5) * scaleMat3(sin(iTime)) * rotateMat3(iTime) * translateMat3(0.5) * uv3;
    // convert back to vec2:
    uv = uv3.xy;
```

## Video feedback

In shadertoy we can do this by adding a "Buffer" stage. Again, use the **+** button, and select "Buffer A".  Now in the Buffer A tab, let's set up **iChannel0** input to also be "Buffer A", so that it can read its own previous frame. 

In the Image tab, which defines what we actually see, let's also set up **iChannel0** input to also be "Buffer A", and display it:

```glsl
    // in Image tab, show the Buffer A content from iChannel0
    vec2 uv = fragCoord/iResolution.xy;
    fragColor = texture(iChannel0, uv);
```

Back in the Buffer A tab, first let's set it up to display its own last frame:

```glsl
    vec2 uv = fragCoord/iResolution.xy;
    fragColor = texture(iChannel0, uv);
```

Now we can add something to this to see the feedback:

```glsl

    vec4 noise = random4(vec3(fragCoord.xy, iTime));
    // add a white dot if the noise function is >= 0.999:
    fragColor = fragColor + vec4(step(0.999, noise.x));
```

This will gradually fill up the image. We can also let the image decay:

```glsl
    vec4 noise = random4(vec3(fragCoord.xy, iTime));
    float decay = 0.99;
    fragColor = fragColor*decay + vec4(step(0.999, noise.x));
```

And for something more intersting, intead of feeding back the same pixel, we could read from the pixel above it:

```glsl
    vec2 uv = fragCoord/iResolution.xy;
    fragColor = texture(iChannel0, uv + vec2(0., 0.01));
```

Another common pattern here is to set up an initialization on the first frame, by using `iFrame == 0`, and the Rewind button on the shader view to reset this to zero:

```glsl
    vec2 uv = fragCoord/iResolution.xy;
    fragColor = texture(iChannel0, uv + vec2(0., 0.01));
    
    vec4 noise = random4(vec3(fragCoord.xy, iTime));
    
    // initialize:
    if (iFrame == 0) {
        fragColor = noise;
    }
```

Notice it blurring over time? That's because we are using linear interpolation on the iChannel0 settings. Change the filter to "nearest" and it will not blur. 

Try doing some spatial transforms on the image in a feedback loop!

## Game of Life

Feedback is also essential for making simulations of complex systems. 

We now have enough to write a cellular automaton, such as the [Game of Life](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life):

```glsl
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // get self state
    vec4 C  = texture(iChannel0, (fragCoord+vec2( 0, 0))/iResolution.xy);
    // am I alive?
    int alive = int(C.x > 0.5);
    
    // get state of all neighbour pixels:
    vec4 E  = texture(iChannel0, (fragCoord+vec2( 1, 0))/iResolution.xy);
    vec4 W  = texture(iChannel0, (fragCoord+vec2(-1, 0))/iResolution.xy);
    vec4 N  = texture(iChannel0, (fragCoord+vec2( 0, 1))/iResolution.xy);
    vec4 S  = texture(iChannel0, (fragCoord+vec2( 0,-1))/iResolution.xy);
    vec4 NE = texture(iChannel0, (fragCoord+vec2( 1, 1))/iResolution.xy);
    vec4 NW = texture(iChannel0, (fragCoord+vec2(-1, 1))/iResolution.xy);
    vec4 SE = texture(iChannel0, (fragCoord+vec2( 1,-1))/iResolution.xy);
    vec4 SW = texture(iChannel0, (fragCoord+vec2(-1,-1))/iResolution.xy);

    // count number of living neighbours:
    int neighbours = int(E.x > 0.5) + int(W.x > 0.5) 
                   + int(NE.x > 0.5) + int(NW.x > 0.5) 
                   + int(SE.x > 0.5) + int(SW.x > 0.5) 
                   + int(N.x > 0.5) + int(S.x > 0.5);
                
    // should I live on?
    int liveon = alive; 
    // the rules (see https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life)
    if (alive == 1) {
        // die by loneliness or overcrowding:
        if (neighbours < 2 || neighbours > 3) liveon = 0;
    } else {
        // birth:
        if (neighbours == 3) liveon = 1;
    }
    
    // update my state:
    fragColor = vec4(float(liveon));
    // or for a more colourful variant:
    // fragColor = vec4(liveon, int(alive != liveon), alive, 1);
    
    vec4 noise = random4(fragCoord.xy);
    
    // initialize:
    if (iFrame == 0) {
        fragColor = vec4(step(0.8, noise.x));
    }
    
    // add some noise near the mouse:
    if (iMouse.z > 0.0) {
        // if the mouse is held, randomize some pixels near the mouse
        if (distance(fragCoord, iMouse.xy) < 10.0) {
            fragColor = vec4(step(0.8, noise.x));
        }
    } 
}
```


## Larger convolutions

A large and symmetric kernel convolution is sometimes desired, e.g. for a large blur, but this can be terribly expensive. Instead, a faster solution to apply the kernel in two passes; one horizontally, the next vertically. 

### Gaussian blur

For example, a blur of up to 7 pixels in each direction calls for a 13x13 pixel kernel, which is **169** texture lookups per pixel of the image! 

Instead, a common technique is to turn this into a multi-pass effect, e.g. using two Buffers in Shadertoy. The first pass applies a 13x1 blur horizontally, and the second pass applies a 1x13 pass vertically.  This is a total of only **26** texture lookups -- much cheaper, and the result is essentially the same. 

To make it easier, you can define the blur operation as a function (stored in the "Common" section in Shadertoy), and re-use this function in each buffer, passing in the desired axis to use. 

```glsl
// Gaussian blur
// img is e.g. iChannel0, iChannel1, etc.
// resolution is the resolution of the img, e.g. iResolution.xy
// texel is the coordinate within that resolution
// axis is vec2(1, 0) for horizontal or vec2(0, 1) for vertical
// radius is the number of pixels to blur in each direction (larger is more expensive)
// e.g. for horizontal 
// blur(iChannel 0, fragCoord, iResolution.xy, vec2(1, 0), 2);
vec4 gaussianBlurOneAxis(sampler2D img, vec2 resolution, vec2 texel, vec2 axis, int radius) 
{   
    vec4 result = texture(img, texel/resolution);
    float weightSum = 1.;    
    float sigma = float(radius)*0.5;
    for(int i = 1; i <= radius; i++) {
        float weight = exp(-0.5 * float(i * i) / (sigma * sigma));
        vec2 offset = float(i) * axis;
        result += texture(img, (texel + offset)/resolution) * weight;
        result += texture(img, (texel - offset)/resolution) * weight;
        weightSum += 2.0 * weight;
    }
    // normalize kernel to make it mass-preserving
    return result / weightSum;
}
```


## Keyboard input

Shadertoy offers a keyboard input type for the iChannel texture inputs. 

Here's how to detect a "spacebar" key for example:

```glsl

	// The ASCII/Unicode value for "spacebar" is 32. 
	const int KEY_SPACE = 32;
	bool spacePressed = texelFetch(iChannel1, ivec2(KEY_SPACE, 0), 0).r > 0.;
```

For other commonly useful keys:

```glsl
	const int KEY_LEFT  = 37;
    const int KEY_UP    = 38;
    const int KEY_RIGHT = 39;
    const int KEY_DOWN  = 40;
```

## Mouse input

Painting noise into the output:

```glsl
	// add some noise near the mouse:
    if (iMouse.z > 0.0) {
        // if the mouse is held, randomize some pixels near the mouse
        if (distance(fragCoord, iMouse.xy) < 10.0) {
            fragColor = vec4(step(0.8, noise.x));
        }
    } 
```

A common trick is a "mouse down to zoom in", which is really easy to do just by manipulating `uv` coordinates:

```glsl
    if(iMouse.z > 0.0) {
		float magnification = 10.;
        uv /= magnification;
        uv += iMouse.xy / ((iResolution.xy + (iResolution.xy / (magnification - 1.0))));
    }
```


## Links for learning more

- https://thebookofshaders.com/

### Exploring math:

- https://www.desmos.com/calculator
- https://graphtoy.com/
- https://www.3blue1brown.com/

If you want to go much deeper into this, you may eventually start to want to explore compute shaders (GPGPU). There's a site similar to Shadertoy for this: https://compute.toys/


