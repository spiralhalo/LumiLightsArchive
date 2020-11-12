#include canvas:shaders/internal/process/header.glsl
#include frex:shaders/lib/sample.glsl

/******************************************************
  canvas:shaders/internal/process/downsample.frag
******************************************************/
uniform sampler2D _cvu_input;
uniform ivec2 _cvu_size;
uniform vec2 _cvu_distance;
uniform int _cvu_lod;

varying vec2 _cvv_texcoord;

void main() {
  float water = texture2D(_cvu_input, _cvv_texcoord).a;
	gl_FragData[0] = vec4(frx_sample13(_cvu_input, _cvv_texcoord, _cvu_distance / _cvu_size, _cvu_lod).rgb, water);
}
