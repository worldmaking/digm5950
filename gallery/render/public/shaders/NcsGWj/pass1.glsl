//COMMON: contains multiple constants and functions used throughout code
//functions were sourced from https://alicelab.world/digm5950/glsl.html
//as well as lectures from Graham Wakefield.

//Constant variable for two times pi
const float TWOPI = 6.283185307179586;

//function for sigmoid transition
float sigmoid(float x, float center, float width) {
    //x is a variable that changes the transition around center
    //depending on width
    return 1.0 / (1.0 + exp(-(x-center)*4.0/width));
}


//Gaussian blur function
vec4 blur(sampler2D img, vec2 fragCoord, vec2 resolution, int N, vec2 dir) {
    float sigma = float(N)/3.14;   
    float expFactor = -0.5/(sigma*sigma);
    float weight = 1.;
    vec4 sum = texture(img, fragCoord/resolution) * weight;
    float weightSum = weight;
    for (int i=1; i<=N; i++) {
        vec2 offset = float(i) * dir;
        float weight = exp(float(i*i) * expFactor);
        sum += texture(img, (fragCoord + offset)/resolution) * weight;
        sum += texture(img, (fragCoord - offset)/resolution) * weight;
        weightSum += weight * 2.0;
    
    }
    return sum / weightSum;
}


//Below are multiple pseudorandom number generator functions

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