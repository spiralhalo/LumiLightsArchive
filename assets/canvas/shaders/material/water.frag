#include frex:shaders/api/fragment.glsl
#include frex:shaders/api/world.glsl
#include frex:shaders/lib/math.glsl
#include frex:shaders/lib/noise/noise3d.glsl

/******************************************************
  canvas:shaders/material/water.frag
******************************************************/

float waterNoiseFunc(vec3 aPos, float renderTime, float scale, float amplitude)
{
    float invScale = 1 / scale;
    return (snoise(vec3(aPos.x * invScale, aPos.z * invScale, renderTime)) * 0.5 + 0.5) * amplitude;
}

vec3 waterNormal(vec3 pos, float renderTime, float speed, float scale, float amplitude){
    // Inferred parameter
    float time = renderTime * speed;
    float microSample = 0.01 * scale;

    // Heights for base, tangent, and bitangent
    float noise = waterNoiseFunc(pos, time, scale, amplitude);
    float noiseT = waterNoiseFunc(pos + vec3(microSample, 0, 0), time, scale, amplitude);
    float noiseB = waterNoiseFunc(pos + vec3(0, 0, -microSample), time, scale, amplitude);

    // Normal recalculation using height map
    vec3 noiseOrigin = vec3(0, noise, 0);
    vec3 noiseTangent = vec3(microSample, noiseT, 0) - noiseOrigin;
    vec3 noiseBitangent = vec3(0, noiseB, -microSample) - noiseOrigin;

    return normalize(cross(noiseTangent, noiseBitangent));
}

void frx_startFragment(inout frx_FragmentData fragData) {
    // Right now roughness can't be 0 because it will make the skybox glossy
    fragData.roughness = 0.01;

    // Only apply waves to top surface
    if(fragData.vertexNormal.y >= 0.95){
        fragData.vertexNormal = waterNormal(frx_modelOriginWorldPos().xyz + frx_var0.xyz,
                                                frx_renderSeconds(), 1.0, 2.0, 0.0625);
    }
}
