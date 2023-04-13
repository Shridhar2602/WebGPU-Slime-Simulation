export const ProcessTrailFS = `

precision highp float;

uniform sampler2D trailTex;
uniform vec2 canvasDims;
uniform float diffuseRate;
uniform float evaporateRate;
uniform float deltaTime;

void main() {

	float trailVal = texture2D(trailTex, gl_FragCoord.xy / canvasDims).x;

	float blur = 0.0;
	for(int i = -1; i <= 1; i++)
	{
		for(int j = -1; j <= 1; j++)
		{
			blur += texture2D(trailTex, (gl_FragCoord.xy + vec2(i, j)) / canvasDims).x;
		}
	}

	blur /= 9.0;

	float diffusedVal = mix(trailVal, blur, diffuseRate * deltaTime);
	trailVal = max(0.0, diffusedVal - evaporateRate * deltaTime);

	gl_FragColor = vec4(vec3(trailVal), 1);
}

`;