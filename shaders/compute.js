export const CS = `

const PI = 3.1415;

struct Agent {
	pos : vec2f,
	angle : f32,
}

struct Env {
	agentMoveSpeed : f32,
	agentTurnSpeed : f32,
	sensorOffsetDist : f32,
	sensorAngleOffset : f32,
	diffuseRate : f32,
	evaporateRate : f32,
	deltaTime : f32,
	time : f32,
	r : f32,
	g : f32, 
	b : f32,
}

// Random float generator between 0-1 (https://stackoverflow.com/a/10625698)
fn rand(pos: vec2f) -> f32 {

    var K1 = vec2f(
        23.14069263277926, // e^pi (Gelfond's constant)
        2.665144142690225 // 2^sqrt(2) (Gelfondâ€“Schneider constant)
    );

    return fract( cos( dot((pos + 1.0) / 2.0, K1) ) * 12345.6789 );
}

@group(0) @binding(0) var<storage, read_write> agents: array<Agent>;
@group(0) @binding(1) var<storage, read_write> trailMapCS: array<f32>;
@group(0) @binding(2) var<uniform> screenDimsCS: vec2<i32>;
@group(0) @binding(3) var<uniform> env: Env;

fn get2Dfrom1D(pos: vec2f) -> u32 {

    return (u32(pos.y) * u32(screenDimsCS.x) + u32(pos.x));
}

fn sense(agent: Agent, sensorAngleOffset: f32) -> f32 {

	var sensorAngle = agent.angle + sensorAngleOffset;
	var sensorDir = vec2f(cos(sensorAngle), sin(sensorAngle));
	var sensorCentre = vec2i(agent.pos.xy + sensorDir * env.sensorOffsetDist);

	var sum = 0.0;
	for(var i = -1; i <= 1; i++)
	{
		for(var j = -1; j <= 1; j++)
		{
			var tempX = min(screenDimsCS.x - 1, max(0, sensorCentre.x + i));
			var tempY = min(screenDimsCS.y - 1, max(0, sensorCentre.y + j));
			sum = sum + trailMapCS[get2Dfrom1D(vec2f(f32(tempX), f32(tempY)))];
		}
	}

	return sum;
}
 
@compute @workgroup_size(32, 1, 1) fn computeSomething(
	@builtin(workgroup_id) workgroup_id : vec3<u32>,
    @builtin(local_invocation_id) local_invocation_id : vec3<u32>,
    // @builtin(global_invocation_id) global_invocation_id : vec3<u32>,
    @builtin(local_invocation_index) local_invocation_index: u32,
    @builtin(num_workgroups) num_workgroups: vec3<u32>) {

		let workgroup_index = workgroup_id.x + workgroup_id.y * num_workgroups.x + workgroup_id.z * num_workgroups.x * num_workgroups.y;
		let i = workgroup_index * 32 + local_invocation_index;

		let random = rand(agents[i].pos);

		// MOVE LOGIC
		var w_forw = sense(agents[i], 0.0);
		var w_left = sense(agents[i], env.sensorAngleOffset * (PI / 180));
		var w_right = sense(agents[i],  -1.0 * env.sensorAngleOffset * (PI / 180));
	
		if(w_forw > w_right && w_forw > w_left)
		{
			agents[i].angle += 0.0;
		}
	
		else if(w_forw < w_left && w_forw < w_right)
		{
			agents[i].angle += (random - 0.5) * 2.0 * env.agentTurnSpeed * 2 * PI * env.deltaTime;
		}
	
		else if(w_right > w_left)
		{
			agents[i].angle -= random * env.agentTurnSpeed * 2 * PI * env.deltaTime;
		}
	
		else if(w_left > w_right)
		{
			agents[i].angle += random * env.agentTurnSpeed * 2 * PI * env.deltaTime;
		}	

		var dir = vec2f(cos(agents[i].angle), sin(agents[i].angle));
		agents[i].pos = agents[i].pos + dir * env.agentMoveSpeed * env.deltaTime;

		var canvasDims = vec2f(screenDimsCS);
		if(agents[i].pos.x <= 0 || agents[i].pos.x >= canvasDims.x || agents[i].pos.y <= 0 || agents[i].pos.y >= canvasDims.y)
		{
			agents[i].pos.x = min(canvasDims.x - 0.01, max(0, agents[i].pos.x));
			agents[i].pos.y = min(canvasDims.y - 0.01, max(0, agents[i].pos.y));
			agents[i].angle = random * 2.0 * PI;
		}

		trailMapCS[get2Dfrom1D(agents[i].pos)] = 1;
}

`;