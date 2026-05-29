//BUFFER D: Takes image data from buffers B (particles) and C (attractor) and
//Combines them into one image so that the image can be processed by the image
//buffer.

void mainImage( out vec4 fragColor, in vec2 fragCoord) {
    
    //takes current coordinate and scales it to (0,0)-(1,1), aka normalize
    vec2 uv = (fragCoord / iResolution.xy);
    float mask = 1.-texture(iMask, uv).a;
    
    //Gets data from buffer B
    vec4 B = texture(iChannel1, uv);
    //Gets data from buffer C
    vec4 C = texture(iChannel2, uv);
    
    //Adds data from C to the buffer's fragColor, taking only the red data
    //and modifying it so that its appearance will be ready for the image buffer
    //to make it appear like a membrane.
    fragColor = C * vec4(0.5, 0, 0, 0);
    
    //Adds data from buffer B to the buffer's fragColor, taking only the red
    //and blue data and modifying them, so that the CA of the image buffer will
    //make them look like blue creatures with pink spacesuit membranes.
    fragColor += (B * vec4(0.25, 0, 0.25, 0));
    
    fragColor *= mask;
}