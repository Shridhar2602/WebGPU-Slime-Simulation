export const UpdateTrailVS = `

// precision highp float;
attribute float position;
uniform sampler2D agentTex;
uniform vec2 canvasDims;
uniform vec2 agentDims;


vec4 get2Dfrom1D(float index, vec2 dimensions) {
	float y = (floor(index / dimensions.x) + 0.5) / dimensions.y;
	float x = (mod(index, dimensions.x) + 0.5) / dimensions.x;
	// x = x * 2.0 - 1.0;
	// y = y * 2.0 - 1.0;

	return vec4(x, y, 0, 1);
}

void main() {

	vec2 coord = texture2D(agentTex, get2Dfrom1D(position, agentDims).xy).xy / canvasDims.xy;
	// coord.xy = coord.xy * 2.0 - 1.0;
	gl_Position = vec4(coord, 0, 1);

	// gl_Position = get2Dfrom1D(position, canvasDims);
	gl_PointSize = 1.0;

}

`;