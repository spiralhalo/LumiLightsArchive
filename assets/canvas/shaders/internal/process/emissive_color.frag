#include canvas:shaders/internal/process/header.glsl
#include frex:shaders/lib/color.glsl
#include frex:shaders/lib/sample.glsl
#include frex:shaders/lib/math.glsl

/******************************************************
  canvas:shaders/internal/process/emissive_color.frag
******************************************************/
uniform sampler2D _cvu_base;
uniform sampler2D _cvu_emissive;
uniform ivec2 _cvu_size;

varying vec2 _cvv_texcoord;

// vec3 rgb2hsv( vec3 c ) {
//   vec4 K = vec4( 0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0 );
//   vec4 p = mix( vec4( c.bg, K.wz ), vec4( c.gb, K.xy ), step( c.b, c.g ) );
//   vec4 q = mix( vec4( p.xyw, c.r ), vec4( c.r, p.yzx ), step( p.x, c.r ) );

//   float d = q.x - min( q.w, q.y );
//   float e = 1.0e-10;
//   return vec3( abs( q.z + ( q.w - q.y ) / ( 6.0 * d + e ) ), d / ( q.x + e ), q.x );
// }

void main() {
	vec4 e = texture2D(_cvu_emissive, _cvv_texcoord);
	vec4 c = frx_fromGamma(texture2D(_cvu_base, _cvv_texcoord));
	gl_FragData[0] = vec4(c.rgb * e.rrr, e.g);
	// vec3 hsv = rgb2hsv(c.rgb * e.rrr);
	// float waterData = e.g;
	// float cameraData = e.b;
	// float hueData = hsv.r;
	// float valueData = hsv.v;
	// gl_FragData[0] = vec4(valueData, hueData, cameraData, waterData);
}
