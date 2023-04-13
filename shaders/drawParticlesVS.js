export const DrawParticlesVS = `

attribute vec2 position;
uniform vec2 dimensions;

vec4 get2Dfrom1D(float index, vec2 dimensions) {
	float y = (floor(index / dimensions.x) + 0.5) / dimensions.y;
	float x = (mod(index, dimensions.x) + 0.5) / dimensions.x;
	// vec2 coord = (vec2(x, y) + 0.5) / dimensions;
	x = x * 2.0 - 1.0;
	y = y * 2.0 - 1.0;
	return vec4(x, y, 0, 1);
}

void main() {

	gl_Position = vec4(position, 0, 1);
	gl_PointSize = 1.0;
}

`;