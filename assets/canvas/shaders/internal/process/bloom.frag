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

float l2_ssr_getWater(vec2 coords){
	return texture2DLod(_cvu_bloom, coords, 0).a;
}

vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec4 l2_ssr_reflection(float water, float camera){
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
	float sideCoord = _cvv_texcoord.x-(_cvv_texcoord.x-0.5)*(upCoord-groundCoord)*camera*3;
	bool upWater = l2_ssr_getWater(vec2(sideCoord, upCoord)) > 0;
	if(upCoord>1.0 || dist_to_up > maxDist || upWater){
		return vec4(0.0);
	} else {
		return smoothstep(maxDist,0.0,dist_to_up)
			* smoothstep(1.0,0.95,upCoord)
			* smoothstep(1.5,0.95,sideCoord)
			* smoothstep(-0.5,0.05,sideCoord)
			* texture2D(_cvu_base, vec2(sideCoord, upCoord));
	}
}

// Based on approach described by Jorge Jiminez, 2014
// http://www.iryoku.com/next-generation-post-processing-in-call-of-duty-advanced-warfare
void main() {
	vec4 input = texture2DLod(_cvu_bloom, _cvv_texcoord, 0);
	float valueData = input.r;
	float hueData = input.g;
	float cameraData = input.b;
	float water = input.a;

	vec4 base = frx_fromGamma(texture2D(_cvu_base, _cvv_texcoord));

	vec4 bloom = vec4(hsv2rgb(vec3(hueData, 1.0, valueData)), 1.0);

	// chop off very low end to avoid halo banding
	vec3 color = base.rgb + (max(bloom.rgb - vec3(0.01), vec3(0))) / vec3(0.99) * cvu_intensity;

	vec4 bloomResult = clamp(frx_toGamma(vec4(color, 1.0)), 0.0, 1.0);
	if (water > 0){
		gl_FragData[0] = bloomResult + l2_ssr_reflection(water, (cameraData-0.5)*2) * 0.5;
	} else {
		gl_FragData[0] = bloomResult;
	}
}