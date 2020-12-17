#include frex:shaders/api/fragment.glsl
#include frex:shaders/api/world.glsl
#include frex:shaders/lib/noise/noise3d.glsl

const mat4 _bump_tRotm = mat4(
0,  0, -1,  0,
0,  1,  0,  0,
1,  0,  0,  0,
0,  0,  0,  1 );

vec3 _bump_tangentMove(vec3 normal)
{
    vec3 aaNormal = vec3(normal.x + 0.01, 0, normal.z + 0.01);
        aaNormal = normalize(aaNormal);
    return (_bump_tRotm * vec4(aaNormal, 0.0)).xyz;
}

vec3 _bump_bitangentMove(vec3 normal, vec3 tangent)
{
    return cross(normal, tangent);
}

float ww_noise(vec3 pos, vec3 move, float invScale, float amplitude, float stretch)
{
	vec3 noisePos = vec3(pos.x * invScale * stretch, pos.y * invScale, pos.z * invScale) + move;
    return (snoise(noisePos) * 0.5 + 0.5) * amplitude;
}

vec3 ww_normals(vec3 up, vec3 samplePos, float waveSpeed, float scale, float amplitude, float stretch, vec3 moveSpeed)
{
	float microSample = 0.01 * scale;
	float invScale = 1 / scale;
	vec3  waveMove = moveSpeed * frx_renderSeconds() * waveSpeed;
		  waveMove.xz *= abs(up.y);

	vec3 tmove = _bump_tangentMove(up);
	vec3 bmove = _bump_bitangentMove(up, tmove) * microSample;
		 tmove *= microSample;
	
	vec3 origin = ww_noise(samplePos, waveMove, invScale, amplitude, stretch) * up;
	vec3 tangent = tmove + ww_noise(samplePos + tmove, waveMove, invScale, amplitude, stretch) * up - origin;
	vec3 bitangent = bmove + ww_noise(samplePos + bmove, waveMove, invScale, amplitude, stretch) * up - origin;

	vec3 noisyNormal = normalize(cross(tangent, bitangent));
	return noisyNormal;
}

void frx_startFragment(inout frx_FragmentData fragData) {	
	/* HACK */
	fragData.light.y += 0.077 * smoothstep(1.0, 0.99, fragData.vertexNormal.y);
	fragData.light.y = min(0.96875, fragData.light.y);

	/* LUMI PARAMS */
	ww_specular = 500.0;

	/* WATER RECOLOR */
	vec3 desat = vec3(frx_luminance(fragData.vertexColor.rgb));
	fragData.vertexColor.rgb = mix(fragData.vertexColor.rgb, desat, 0.7);

	float maxc = max(fragData.spriteColor.r, max(fragData.spriteColor.g, fragData.spriteColor.b)); 
	fragData.spriteColor.rgb *= fragData.spriteColor.rgb * fragData.spriteColor.rgb * 2.0;
	
	/* WAVY NORMALS */
	float waveSpeed = 1;
	float scale = 1.5;
	float amplitude = 0.01;
	float stretch = 2;
	// wave movement doesn't necessarily follow flow direction for the time being
	vec3 moveSpeed = vec3(0.5, 1.5, -0.5);
	// const float texAmplitude = 0.005;
    vec3 up = fragData.vertexNormal.xyz;// * (1.0 + texAmplitude);
	vec3 samplePos = frx_var0.xyz;
	// samplePos = floor(samplePos) + floor(fract(samplePos) * 16) / 16;
	fragData.vertexNormal = ww_normals(up, samplePos, waveSpeed, scale, amplitude, stretch, moveSpeed);
}
