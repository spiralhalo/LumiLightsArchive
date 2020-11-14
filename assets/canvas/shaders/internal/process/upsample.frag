/*
    Derived from Canvas source code (https://github.com/grondag/canvas/)

    Changes are made to carry a "water" flag into the bloom shader
    to create a screenspace reflection effect (a hack).
*/

#include canvas:shaders/internal/process/header.glsl
#include frex:shaders/lib/sample.glsl

/******************************************************
  canvas:shaders/internal/process/downsample.frag
******************************************************/
uniform sampler2D cvu_input;
uniform sampler2D cvu_prior;
uniform ivec2 _cvu_size;
uniform vec2 _cvu_distance;
uniform int _cvu_lod;

varying vec2 _cvv_texcoord;

void main() {
	float water = texture2D(cvu_input, _cvv_texcoord).a;
	vec4 sample = _cvu_lod == 6 ? vec4(0) : frx_sampleTent(cvu_prior, _cvv_texcoord, _cvu_distance / _cvu_size, _cvu_lod + 1);
  gl_FragData[0] = vec4((texture2DLod(cvu_input, _cvv_texcoord, _cvu_lod) + sample).rgb, water);
  // gl_FragData[0] = texture2DLod(cvu_input, _cvv_texcoord, _cvu_lod) + sample;
}
