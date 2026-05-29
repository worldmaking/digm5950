//BUFFER C: The attractor

//The basis for this code is from https://www.shadertoy.com/view/7fl3zH
//By Graham Wakefield, with my changes.

//This buffer creates the \"air pocket\" that can be controlled by clicking and
//holding anywhere on the screen. It creates pressure that attracts the agents
//towards it so that they can have a breath of fresh air.

//Gaussian blur matrix
mat3 gaussBlur = mat3(
        1, 2, 1,
        2, 4, 2,
        1, 2, 1
    ) * 1.0/16.0;

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {

    //takes current coordinate and scales it to (0,0)-(1,1), aka normalize
    vec2 uv = (fragCoord / iResolution.xy);
    float mask = 1.-texture(iMask, uv).a;
    
    //Creates a vec4 C that takes data from the previous frame
    vec4 C = texture(iChannel2, uv);
    
    //Previous frame is given a gaussian blur
    vec4 N = texture(iChannel2, (fragCoord + vec2(0, 1))/iResolution.xy);
    vec4 S = texture(iChannel2, (fragCoord + vec2(0, -1))/iResolution.xy);
    vec4 E = texture(iChannel2, (fragCoord + vec2(1, 0))/iResolution.xy);
    vec4 W = texture(iChannel2, (fragCoord + vec2(-1, 0))/iResolution.xy);
    vec4 NE = texture(iChannel2, (fragCoord + vec2(1, 1))/iResolution.xy);
    vec4 SE = texture(iChannel2, (fragCoord + vec2(1, -1))/iResolution.xy);
    vec4 NW = texture(iChannel2, (fragCoord + vec2(-1, 1))/iResolution.xy);
    vec4 SW = texture(iChannel2, (fragCoord + vec2(-1, -1))/iResolution.xy);
    C = ((NE+SE+NW+SW) + 2.*(N+E+S+W) + 4.*C)/16.;
    
    //decay of C so that the attractor (which appears as a membrane) does
    //not stay on the screen forever
    C = C * 0.9;

    //Checks if mouse is held on the screen
    //if (iMouse.z > 0.0) 
    {
        //saves mouse position
        float a = iTime * -0.1;
        float b = a * 3.141;
        vec2 p = iResolution.xy * (vec2(sin(b), cos(b))*0.2 + vec2(sin(a), cos(a))*vec2(0.4, 0.7)+vec2(0.5, 0.6));//iMouse.xy;
        //saves distance from current coordinate to mouse coordinate
        float d = distance(fragCoord, p);
        //generates a diffused light based on distance, similar to the agents,
        //except much larger halo and larger actual light, which will create
        //a different appearance when the other CA system takes it over
        if (d < 150.){
            //Adds it to C as well
            C += vec4((5./d)*1.,(5./d)*1.,(5./d)*1.,(5./d)*1.);
        }
    }
    
    //C is clamped from 0 to 1
    C = clamp(C, 0., 1.);
    
    //C is added to the fragColor of the buffer
    fragColor = C * mask;
}