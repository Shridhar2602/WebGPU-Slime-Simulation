export const FS = `

@group(0) @binding(0) var<storage, read_write> trailMap: array<f32>;
@group(0) @binding(1) var<uniform> screenDims: vec2<i32>;
@group(0) @binding(2) var<uniform> envFS: Env;

fn getFrag(pos: vec2f) -> u32 {

    return (u32(pos.y) * u32(screenDims.x) + u32(pos.x));
}

@fragment fn fs(@builtin(position) fragCoord: vec4f) -> @location(0) vec4f {

	
	var idx = getFrag(fragCoord.xy);
	var trailVal = trailMap[idx];

	var blur = 0.0;
	for(var i = -1; i <= 1; i++)
	{
		for(var j = -1; j <= 1; j++)
		{
			var tempX = min(screenDims.x - 1, max(0, i32(fragCoord.x) + i));
			var tempY = min(screenDims.y - 1, max(0, i32(fragCoord.y) + j));
			blur += trailMap[getFrag(vec2f(f32(tempX), f32(tempY)))];
		}
	}

	blur /= 9.0;

	var diffuseWeight = saturate(envFS.diffuseRate * envFS.deltaTime);
	var blurred = trailVal * (1 - diffuseWeight) + blur * diffuseWeight;

	// var diffusedVal = mix(trailVal, blur, envFS.diffuseRate * envFS.deltaTime);
	// trailVal = max(0.0, diffusedVal - envFS.evaporateRate * envFS.deltaTime);

	trailMap[idx] = blurred * saturate(1 - envFS.evaporateRate * envFS.deltaTime);
	
	var color = vec3f(envFS.r, envFS.g, envFS.b);
	return vec4f(color * blurred, 1);
  }

`;