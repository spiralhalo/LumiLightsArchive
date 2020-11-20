#include canvas:shaders/internal/process/header.glsl
#include frex:shaders/lib/color.glsl
#include frex:shaders/lib/sample.glsl
#include frex:shaders/lib/math.glsl

/******************************************************
  canvas:shaders/internal/process/reflection_color.frag
******************************************************/
uniform sampler2D _cvu_base;
uniform sampler2D _cvu_extras;
uniform sampler2D _cvu_normal;
uniform sampler2D _cvu_depth;
uniform mat4 cvu_projection;
uniform mat4 cvu_inv_projection;
uniform ivec2 _cvu_size;

varying vec2 _cvv_texcoord;

vec2 uvSpace(vec3 viewPos){
    vec4 clipPos = cvu_projection * vec4(viewPos, 1.0);
    clipPos.xyz /= clipPos.w;
    return clipPos.xy * 0.5 + 0.5;
}

vec3 viewSpace(vec2 uv) {
    vec2 clipPos = 2.0 * uv - 1.0;
    vec4 viewPos = cvu_inv_projection * vec4( clipPos.x, clipPos.y, 2.0 * texture2DLod(_cvu_depth, uv, 0).r - 1.0, 1.0);
    return viewPos.xyz / viewPos.w;
}

vec3 normal(vec2 uv){
    return 2.0 * texture2DLod(_cvu_normal, uv, 0).xyz - 1.0;
}

bool sky(vec2 uv){
    return texture2DLod(_cvu_extras, uv, 0).a == 0.0;
}

// Adds randomness to reflection ray for rough surfaces
// Might look better if world space coordinates are used for seed
vec3 scatter(vec2 uv, float wildness){
    vec3 a  = fract(uv.xyx * vec3(25.9, 25.9, 25.9));
    a += dot(a, a.yxz + 19.19);
    a = fract((a.xxy + a.yxx)*a.zyx);
    return (2.0 * a - 1.0) * wildness;
}

const float startL = 0.5;
const float maxL   = 256.0;

vec2 refine(inout vec3 march, inout float curL, inout vec3 curPos) {
    
    vec2 curTexUv;
    vec3 curTexPos;
    float dz;
    float dzBias;

    while (curL > startL) {
        dz = curTexPos.z - curPos.z;
        dzBias = curL;

        if(dz > 0 && dz < dzBias){
            return curTexUv;
        }

        march *= 0.5;
        curL *= 0.5;

        if (curPos.z > curTexPos.z) {
            curPos += march;
        } else {
            curPos -= march;
        }

        curTexUv = uvSpace(curPos);
        curTexPos = viewSpace(curTexUv);
    }

    return curTexUv;
}

vec2 rayMarch(float reflectance) {

    vec3 curPos = viewSpace(_cvv_texcoord);
    vec3 reflected = reflect(normalize(curPos), normal(_cvv_texcoord));
    vec3 deviation = scatter(_cvv_texcoord, min(0.5, 0.5/curPos.z));
    vec3 march = mix(deviation, vec3(0.0), reflectance) + reflected * startL;

    float curL = startL;
    vec2 curTexUv;
    vec3 curTexPos;
    float dz;
    float dzBias;

    while (curL < maxL) {
        curPos += march;
        curTexUv = uvSpace(curPos);

        curTexPos = viewSpace(curTexUv);

        dz = curTexPos.z - curPos.z;
        dzBias = curL;

        if(dz > 0 && dz < dzBias){
            return refine(march, curL, curPos);
        }

        march *= 2;
        curL *= 2;
    }

    // Sky reflection
    if(sky(curTexUv) && curPos.z < 0){
        return curTexUv;
    }

    return vec2(-1.0);
}

void main() {

    float gloss = 1 - texture2DLod(_cvu_extras, _cvv_texcoord, 0).b;

    if (gloss > 0 && !sky(_cvv_texcoord)){
        vec2 rUv = rayMarch(gloss);

        if (rUv.x < 0) {
            gl_FragData[0] = vec4(0.0, 0.0, 0.0, 1.0);
        } else {
            gl_FragData[0] = smoothstep(0.5, 0.45, abs(rUv.x - 0.5))
                            * smoothstep(0.5, 0.45, abs(rUv.y - 0.5))
                            * texture2D(_cvu_base, rUv);
        }

    } else {
        gl_FragData[0] = vec4(0.0, 0.0, 0.0, 1.0);
    }
}
