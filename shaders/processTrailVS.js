export const ProcessTrailVS = `

attribute vec2 position;

void main() {

	gl_Position = vec4(position, 0, 1);
	gl_PointSize = 1.0;
}

`;