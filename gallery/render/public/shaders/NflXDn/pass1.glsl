// Buffer A — Lenia multichannel, per-pixel species from nearest particle
//
// iChannel0: self  (Lenia feedback)
// iChannel1: bufC  (trail — .r=intensity, .g=speciesID/9)

mat4 bell(in mat4 x, in mat4 m, in mat4 s) {
    mat4 v = -mult(x-m,x-m)/s/s/2.;
    return mat4(exp(v[0]),exp(v[1]),exp(v[2]),exp(v[3]));
}

mat4 getWeight(float r, mat4 _relR, mat4 _betaLen, mat4 _beta0, mat4 _beta1, mat4 _beta2) {
    mat4 Br = _betaLen / _relR * r;
    ivec4 Br0=ivec4(Br[0]), Br1=ivec4(Br[1]), Br2=ivec4(Br[2]), Br3=ivec4(Br[3]);
    mat4 height = mat4(
        _beta0[0]*vec4(equal(Br0,iv0)) + _beta1[0]*vec4(equal(Br0,iv1)) + _beta2[0]*vec4(equal(Br0,iv2)),
        _beta0[1]*vec4(equal(Br1,iv0)) + _beta1[1]*vec4(equal(Br1,iv1)) + _beta2[1]*vec4(equal(Br1,iv2)),
        _beta0[2]*vec4(equal(Br2,iv0)) + _beta1[2]*vec4(equal(Br2,iv1)) + _beta2[2]*vec4(equal(Br2,iv2)),
        _beta0[3]*vec4(equal(Br3,iv0)) + _beta1[3]*vec4(equal(Br3,iv1)) + _beta2[3]*vec4(equal(Br3,iv2)));
    mat4 mod1 = mat4(mod(Br[0],1.),mod(Br[1],1.),mod(Br[2],1.),mod(Br[3],1.));
    return mult(height, bell(mod1, kmu, ksigma));
}

vec4 getSrc(in vec3 v, in ivec4 srcv) {
    return v.r*vec4(equal(srcv,iv0)) + v.g*vec4(equal(srcv,iv1)) + v.b*vec4(equal(srcv,iv2));
}
float getDst(in mat4 m, in ivec4 ch) {
    return dot(m[0],vec4(equal(dst0,ch))) + dot(m[1],vec4(equal(dst1,ch)))
         + dot(m[2],vec4(equal(dst2,ch))) + dot(m[3],vec4(equal(dst3,ch)));
}
mat4 getVal(in vec2 xy) {
    vec2 txy = mod(xy/iResolution.xy, 1.);
    vec3 val = texture(iChannel0, txy).rgb;
    return mat4(getSrc(val,src0), getSrc(val,src1), getSrc(val,src2), getSrc(val,src3));
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord / iResolution.xy;

    // read species ID from trail (persists after particle moves away)
    vec2 trail = texture(iChannel1, uv).rg;
    int sid = clamp(int(trail.g * 9.0 + 0.5), 0, 9);

    // fetch species-specific kernel parameters
    mat4 _betaLen = sp_betaLen(sid);
    mat4 _beta0   = sp_beta0(sid);
    mat4 _beta1   = sp_beta1(sid);
    mat4 _beta2   = sp_beta2(sid);
    mat4 _relR    = sp_relR(sid);
    mat4 _mu      = sp_mu(sid);
    mat4 _sigma   = sp_sigma(sid);
    mat4 _eta     = sp_eta(sid);

    // convolution
    mat4 sum=mat4(0.), total=mat4(0.);
    float r; mat4 weight; mat4 valSrc;

    r=0.; weight=getWeight(r,_relR,_betaLen,_beta0,_beta1,_beta2);
    valSrc=getVal(fragCoord); sum+=mult(valSrc,weight); total+=weight;

    for (int x=1; x<=intR; x++) {
        r=float(x)/R; weight=getWeight(r,_relR,_betaLen,_beta0,_beta1,_beta2);
        valSrc=getVal(fragCoord+vec2(+x,0)*samplingDist); sum+=mult(valSrc,weight); total+=weight;
        valSrc=getVal(fragCoord+vec2(-x,0)*samplingDist); sum+=mult(valSrc,weight); total+=weight;
        valSrc=getVal(fragCoord+vec2(0,+x)*samplingDist); sum+=mult(valSrc,weight); total+=weight;
        valSrc=getVal(fragCoord+vec2(0,-x)*samplingDist); sum+=mult(valSrc,weight); total+=weight;
    }
    for (int x=1; x<=intR; x++) {
        r=sqrt(2.)*float(x)/R;
        if (r<=1.) {
            weight=getWeight(r,_relR,_betaLen,_beta0,_beta1,_beta2);
            valSrc=getVal(fragCoord+vec2(+x,+x)*samplingDist); sum+=mult(valSrc,weight); total+=weight;
            valSrc=getVal(fragCoord+vec2(+x,-x)*samplingDist); sum+=mult(valSrc,weight); total+=weight;
            valSrc=getVal(fragCoord+vec2(-x,+x)*samplingDist); sum+=mult(valSrc,weight); total+=weight;
            valSrc=getVal(fragCoord+vec2(-x,-x)*samplingDist); sum+=mult(valSrc,weight); total+=weight;
        }
    }
    for (int y=1; y<=intR-1; y++)
    for (int x=y+1; x<=intR; x++) {
        r=sqrt(float(x*x+y*y))/R;
        if (r<=1.) {
            weight=getWeight(r,_relR,_betaLen,_beta0,_beta1,_beta2);
            valSrc=getVal(fragCoord+vec2(+x,+y)*samplingDist); sum+=mult(valSrc,weight); total+=weight;
            valSrc=getVal(fragCoord+vec2(+x,-y)*samplingDist); sum+=mult(valSrc,weight); total+=weight;
            valSrc=getVal(fragCoord+vec2(-x,+y)*samplingDist); sum+=mult(valSrc,weight); total+=weight;
            valSrc=getVal(fragCoord+vec2(-x,-y)*samplingDist); sum+=mult(valSrc,weight); total+=weight;
            valSrc=getVal(fragCoord+vec2(+y,+x)*samplingDist); sum+=mult(valSrc,weight); total+=weight;
            valSrc=getVal(fragCoord+vec2(+y,-x)*samplingDist); sum+=mult(valSrc,weight); total+=weight;
            valSrc=getVal(fragCoord+vec2(-y,+x)*samplingDist); sum+=mult(valSrc,weight); total+=weight;
            valSrc=getVal(fragCoord+vec2(-y,-x)*samplingDist); sum+=mult(valSrc,weight); total+=weight;
        }
    }
    mat4 avg = sum / (total + EPSILON);

    mat4 growth = mult(_eta, bell(avg,_mu,_sigma)*2.-1.);
    vec3 growthDst = vec3(getDst(growth,iv0), getDst(growth,iv1), getDst(growth,iv2));
    vec3 val = texture(iChannel0, uv).rgb;
    vec3 rgb = clamp(dt*growthDst + val, 0., 1.);

    if (iFrame==0 || iMouse.z>0.) {
        float bn = 0.16;
        vec3 noiseRGB = vec3(
            noise(fragCoord/R/samplingDist + mod(iDate.w,1.)*100.),
            noise(fragCoord/R/samplingDist + sin(iDate.w)*100.),
            noise(fragCoord/R/samplingDist + cos(iDate.w)*100.) );
        rgb = bn + noiseRGB;
    }

    fragColor = vec4(rgb, 1.);
}
