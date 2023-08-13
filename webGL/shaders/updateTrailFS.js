export const UpdateTrailFS = `

precision highp float;

uniform sampler2D agentTex;
uniform sampler2D trailTex;
uniform vec2 canvasDims;
uniform vec2 agentDims;

void main() {
	// vec3 coord = texture2D(trailTex, gl_FragCoord.xy / canvasDims).xyz;

	gl_FragColor = vec4(1, 0, 0, 1);
}

`;