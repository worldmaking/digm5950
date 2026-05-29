void mainImage( out vec4 fragColor, in vec2 fragCoord ) {

    // normalized coordinate (0.0 to 1.0):
    vec2 uv = fragCoord / iResolution.xy;
    float mask = 1.-texture(iMask, uv).a;
    
    //uv /= 4.;
    
    float magnification = 16.;
    if(iMouse.z > 0.0) {
        uv /= magnification;
        uv += iMouse.xy / ((iResolution.xy + (iResolution.xy / (magnification - 1.0))));
    }
    
    
    // read 1st texture input:
    vec4 ca = texture(iChannel0, uv);
    fragColor = ca.rgaa;
    
    // rock 
    //fragColor = vec4( ca.r * 0.62, ca.r * 0.7, ca.r * 0.75, ca.r * 0.0 );
    
    
    // all chips:
    //fragColor = vec4(ca.r + ca.a * 0.1);
    
    int i = int(uv.x * 16.);
    
    // how to get the bits out:
    //fragColor = vec4(i & 1);
    //fragColor = vec4(i & 2);
    //fragColor = vec4(i & 4);
    //fragColor = vec4(i & 8);
    fragColor *= mask;
}