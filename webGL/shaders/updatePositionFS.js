export const UpdatePositionFS = `

precision highp float;

uniform sampler2D agentTex;
uniform sampler2D trailTex;
uniform vec2 texDims;
uniform vec2 canvasDims;

uniform float agentSpeed;
uniform float agentTurnSpeed;
uniform float sensorOffsetDist;
uniform float sensorAngleOffset;
uniform float deltaTime;

#define PI radians(180.0)

float hash(vec2 p)
{
    vec2 K1 = vec2(
        23.14069263277926, // e^pi (Gelfond's constant)
         2.665144142690225 // 2^sqrt(2) (Gelfondâ€“Schneider constant)
    );
    return fract( cos( dot((p + 1.0) / 2.0, K1) ) * 12345.6789 );
}

float sense(vec3 agent, float sensorAngleOffset)
{
	float sensorAngle = agent.z + sensorAngleOffset;
	vec2 sensorDir = vec2(cos(sensorAngle), sin(sensorAngle));
	vec2 sensorCentre = agent.xy + sensorDir * sensorOffsetDist;

	// vec2 sensorTexCoord = sensorCentre / canvasDims;
	// sensorTexCoord = (sensorTexCoord + 1.0) / 2.0;

	float sum = 0.0;

	for(int i = -1; i <= 1; i++)
	{
		for(int j = -1; j <= 1; j++)
		{
			vec2 temp = (sensorCentre + vec2(i, j)) / canvasDims;
			sum += texture2D(trailTex, (temp + 1.0) / 2.0).x;
		}
	}

	// sum = texture2D(trailTex, sensorTexCoord).x;

	return sum;
}

void main() {
	vec3 coord = texture2D(agentTex, gl_FragCoord.xy / texDims).xyz;

	float random = hash(coord.xy);
	

	// MOVE LOGIC
	float w_forw = sense(coord, 0.0);
	float w_left = sense(coord, sensorAngleOffset);
	float w_right = sense(coord,  -1.0 * sensorAngleOffset);

	if(w_forw > w_right && w_forw > w_left)
	{
		coord.z += 0.0;
	}

	else if(w_forw < w_left && w_forw < w_right)
	{
		coord.z += (random - 0.5) * 2.0 * agentTurnSpeed * deltaTime;
	}

	else if(w_right > w_left)
	{
		coord.z -= random * agentTurnSpeed * deltaTime;
	}

	else if(w_left > w_right)
	{
		coord.z += random * agentTurnSpeed * deltaTime;
	}



	vec2 direction = vec2(cos(coord.z), sin(coord.z));
	coord.xy = coord.xy + direction * agentSpeed * deltaTime;



	// COLLISION DETECTION
	if(coord.x < -1.0 * canvasDims.x || coord.x > canvasDims.x || coord.y < -1.0 * canvasDims.y || coord.y > canvasDims.y)
	{
		coord.x = min(canvasDims.x - 0.01, max(-1.0 * canvasDims.x, coord.x));
		coord.y = min(canvasDims.y - 0.01, max(-1.0 * canvasDims.y, coord.y));
		coord.z = random * 2.0 * PI;
	}

	gl_FragColor = vec4(coord, w_left); 
}

`;