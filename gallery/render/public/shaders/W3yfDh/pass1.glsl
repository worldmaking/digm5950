//  Taken from Lecture Slides
//  Graham Wakefield
//  https://alicelab.world/digm5950/glsl.html#randomnoise

#define RANDOM_SCALE vec4(.1031, .1030, .0973, .1099)

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

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
  p4 = fract(p4 * RANDOM_SCALE);
  p4 += dot(p4, p4.wzxy + 19.19);
  return fract((p4.xxyz + p4.yzzw) * p4.zywx);
}

//  Taken from Lecture Shader
//  Graham Wakefield
//  https://www.shadertoy.com/view/t3dfR2
float sigmoid(float x, float center, float width) {
  return 1.0 / (1.0 + exp(-(x - center) * 4.0 / width));
}