#include canvas:shaders/internal/process/header.glsl
#include frex:shaders/lib/color.glsl
#include frex:shaders/lib/sample.glsl
#include frex:shaders/lib/math.glsl

/******************************************************
  canvas:shaders/internal/process/bloom.frag
******************************************************/
uniform sampler2D _cvu_base;
uniform sampler2D _cvu_bloom;
uniform ivec2 _cvu_size;
uniform vec2 _cvu_distance;
uniform float cvu_intensity;

varying vec2 _cvv_texcoord;

const float sampleUp = 0.001;
const float bias = 0.05;
const float maxDist = 0.1;
// const float sampleSideFade = 0.001;
// const float maxSideFade = 0.01;
// const float addSideFade = 0.1;

float l2_ssr_getWater(vec2 coords){
	return texture2DLod(_cvu_bloom, coords, 0).a;
}

vec4 l2_ssr_reflection(float water){
	float dist_to_up = 0;
	vec2 current = _cvv_texcoord;
	while(texture2D(_cvu_bloom, current).a > 0){
		current.y += sampleUp;
		if (current.y > 1.0){
			return vec4(0.0);	
		}
		dist_to_up += sampleUp;
	}
	float upCoord = _cvv_texcoord.y+dist_to_up*2 + bias + dist_to_up*water;
	float groundCoord = _cvv_texcoord.y+dist_to_up;
	// float currentSideFade = 0;
	// float sideFade = 0;
	// while(currentSideFade < maxSideFade){
	// 	sideFade += (l2_ssr_getWater(vec2(_cvv_texcoord.x+currentSideFade, groundCoord)) > 0)?addSideFade:0;
	// 	currentSideFade += sampleSideFade;
	// }
	// currentSideFade = 0;
	// while(currentSideFade > -maxSideFade){
	// 	sideFade += (l2_ssr_getWater(vec2(_cvv_texcoord.x+currentSideFade, groundCoord)) > 0)?addSideFade:0;
	// 	currentSideFade -= sampleSideFade;
	// }
	bool upWater = l2_ssr_getWater(vec2(_cvv_texcoord.x, upCoord)) > 0;
	if(upCoord>1.0 || dist_to_up > maxDist || upWater){
		return vec4(0.0);
	} else {
		return smoothstep(maxDist,0.0,dist_to_up)
			* smoothstep(1.0,0.95,upCoord)
			//* (1-sideFade*smoothstep(0.0,maxDist,dist_to_up))
			* texture2D(_cvu_base, vec2(_cvv_texcoord.x, upCoord));
	}
}

// Based on approach described by Jorge Jiminez, 2014
// http://www.iryoku.com/next-generation-post-processing-in-call-of-duty-advanced-warfare
void main() {
  	float water = l2_ssr_getWater(_cvv_texcoord);

	vec4 base = frx_fromGamma(texture2D(_cvu_base, _cvv_texcoord));

	vec4 bloom = texture2DLod(_cvu_bloom, _cvv_texcoord, 0);

	// chop off very low end to avoid halo banding
	vec3 color = base.rgb + (max(bloom.rgb - vec3(0.01), vec3(0))) / vec3(0.99) * cvu_intensity;

	vec4 bloomResult = clamp(frx_toGamma(vec4(color, 1.0)), 0.0, 1.0);
	if (water > 0){
		gl_FragData[0] = bloomResult + l2_ssr_reflection(water) * 0.5;
	} else {
		gl_FragData[0] = bloomResult;
	}
}