export const DrawParticlesFS = `
precision highp float;

uniform sampler2D trailTex;
uniform vec2 canvasDims;

float hash(vec2 p)
{
    vec2 K1 = vec2(
        23.14069263277926, // e^pi (Gelfond's constant)
         2.665144142690225 // 2^sqrt(2) (Gelfondâ€“Schneider constant)
    );
    return fract( cos( dot((p + 1.0) / 2.0,K1) ) * 12345.6789 );
}

void main() {

	float random = hash(gl_FragCoord.xy);
  	// gl_FragColor = vec4(vec3(random), 1);

	float trailVal = texture2D(trailTex, gl_FragCoord.xy / canvasDims).x;

	// if(texture2D(trailTex, gl_FragCoord.xy / canvasDims).x == 1.0)
	// {
	// 	gl_FragColor = vec4(1, 1, 1, 1);
	// }
	// else
	// {
	// 	gl_FragColor = vec4(0, 0, 0, 1);
	// }

	// if(trailVal > 0.8)
	// {
	// 	gl_FragColor = vec4(0, 0, trailVal, 1);
	// }
	// else
	// {
	// 	gl_FragColor = vec4(0, trailVal * 0.4, trailVal, 1);
	// }

	gl_FragColor = vec4(0, trailVal * 0.4, trailVal, 1);
}

`;