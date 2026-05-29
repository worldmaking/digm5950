void mainImage( out vec4 fragColor, in vec2 fragCoord )
{

    vec2 uv = fragCoord/iResolution.xy;
    float mask = 1.-texture(iMask, uv).a;
    
    // mouse zoom
    if(iMouse.z > 0.0) {
        float magnification = 10.;
        uv /= magnification;
        uv += iMouse.xy / ((iResolution.xy + (iResolution.xy / (magnification - 1.0))));
    }
    
    
    vec4 C = texture(iChannel0, uv);
    
    fragColor = C.rgba * mask;
}