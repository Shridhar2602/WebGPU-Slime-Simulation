import {GUI} from 'https://threejsfundamentals.org/threejs/../3rdparty/dat.gui.module.js';
import {VS} from './shaders/vertex.js';
import {FS} from './shaders/fragment.js';
import {CS} from './shaders/compute.js';
import {presets} from './presets.js';

// Initializing WebGPU (https://webgpufundamentals.org/webgpu/lessons/webgpu-fundamentals.html)
async function start() {
	if (!navigator.gpu) {
	  fail('this browser does not support WebGPU');
	  return;
	}
  
	const adapter = await navigator.gpu.requestAdapter();
	if (!adapter) {
	  fail('this browser supports webgpu but it appears disabled');
	  return;
	}
  
	const device = await adapter?.requestDevice();
	device.lost.then((info) => {
	  console.error(`WebGPU device was lost: ${info.message}`);

	  if (info.reason !== 'destroyed') {
		start();
	  }
	});
	
	main(device);
}

async function main(device) {

	// Get a WebGPU context from the canvas and configure it
	const canvas = document.querySelector('canvas');
	const context = canvas.getContext('webgpu');
	const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
	context.configure({
	  device,
	  format: presentationFormat,
	});
  
	// creating shader module 
	const module = device.createShaderModule({
	  label: 'Vertex + Compute + Fragment Shaders',
	  code: VS + CS + FS,
	});

	var settings = presets.default;
	var current_preset = {preset : presets.preset1};

	const gui = new GUI();

	const controllers = {
		agentMoveSpeed : gui.add(settings, 'agentMoveSpeed', 0, 150).listen(),
		agentTurnSpeed : gui.add(settings, 'agentTurnSpeed', -100, 100).listen(),
		sensorOffsetDist : gui.add(settings, 'sensorOffsetDist', 0, 100).listen(),
		sensorAngleOffset : gui.add(settings, 'sensorAngleOffset', 0, 360).listen(),
		diffuseRate : gui.add(settings, 'diffuseRate', 0, 50).listen(),
		evaporateRate : gui.add(settings, 'evaporateRate', 0, 20).listen(),
		color : gui.addColor(settings, 'color'),
		preset : gui.add(current_preset, 'preset', Object.keys(presets)),
	}
	
	controllers.color.onChange(color => {settings.color = color});
	controllers.preset.onChange(presetName => {
	  	settings = presets[presetName];

		for (var paramName in settings) 
		{
			if(controllers[paramName])
				controllers[paramName].setValue(settings[paramName]);
		}
	  	restart();
	});
	gui.add({ restart: () => restart() }, 'restart');


	const NUM_AGENTS = 1000000;
	const WIDTH = canvas.clientWidth;
	const HEIGHT = canvas.clientHeight;

	var stats = new Stats();
	stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
	document.body.appendChild( stats.dom );

	// A screen sized buffer to store the trail values
	var slimes = new Float32Array(WIDTH * HEIGHT).fill(0);
  	const trailBuffer = device.createBuffer({
    	label: 'trail buffer',
   		size: slimes.byteLength,
    	usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
  	});
  	device.queue.writeBuffer(trailBuffer, 0, slimes);

	// Setting uniforms
	const screenDims = new Uint32Array([WIDTH, HEIGHT]);
	const dimsBuffer = device.createBuffer({
	  	label: 'screen dims buffer',
		size: screenDims.byteLength,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
	});
	device.queue.writeBuffer(dimsBuffer, 0, screenDims);

	const env = new Float32Array([settings.agentMoveSpeed, settings.agentTurnSpeed, settings.sensorOffsetDist, settings.sensorAngleOffset, settings.diffuseRate, settings.evaporateRate, settings.deltaTime, 0, settings.color[0], settings.color[1], settings.color[2]]);
	const envBuffer = device.createBuffer({
	  	label: 'screen dims buffer',
		size: env.byteLength,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
	});
	device.queue.writeBuffer(envBuffer, 0, env);





	// ============================== COMPUTE PIPELINE ================================
	const computePipeline = device.createComputePipeline({
		label: 'Compute pipeline',
		layout: 'auto',
		compute: {
		  module,
		  entryPoint: 'computeSomething',
		},
	});

	// Buffer to store agent info
	var input = create_agents_circleIn(NUM_AGENTS, WIDTH, HEIGHT);
  	const agentBuffer = device.createBuffer({
    	label: 'agent buffer',
   		size: input.byteLength,
    	usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
  	});
  	device.queue.writeBuffer(agentBuffer, 0, input);

  	// create a buffer on the GPU to get a copy of the results
  	const resultBuffer = device.createBuffer({
  	  label: 'result buffer',
  	  size: input.byteLength,
  	  usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
  	});

	// Setup a bindGroup to tell the shader which
  	// buffer to use for the computation
  	const bindGroup = device.createBindGroup({
  	  label: 'bindGroup for work buffer',
  	  layout: computePipeline.getBindGroupLayout(0),
  	  entries: [
  	    { binding: 0, resource: { buffer: agentBuffer } },
  	    { binding: 1, resource: { buffer: trailBuffer } },
  	    { binding: 2, resource: { buffer: dimsBuffer } },
  	    { binding: 3, resource: { buffer: envBuffer } },
  	  ],
  	});
	





	// ============================== COMPUTE PIPELINE ================================

	// Vertex Buffer to draw a quad spanning the whole canvas
	const vertexData = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
	const vertexBuffer = device.createBuffer({
		label: 'vertex buffer vertices',
		size: vertexData.byteLength,
		usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
	});
	device.queue.writeBuffer(vertexBuffer, 0, vertexData);

	const pipeline = device.createRenderPipeline({
		label: 'render pipeline',
		layout: 'auto',
		vertex: {
		  module,
		  entryPoint: 'vs',
		  buffers: [
			  {
				  arrayStride: 2 * 4, // 2 floats, 4 bytes each
				  attributes: [{shaderLocation: 0, offset: 0, format: 'float32x2'}],
			  },
		  ],
		},
		fragment: {
		  module,
		  entryPoint: 'fs',
		  targets: [{ format: presentationFormat }],
		},
	});
	
	const bindGroup2 = device.createBindGroup({
		layout: pipeline.getBindGroupLayout(0),
		entries: [
		  { binding: 0, resource: {buffer: trailBuffer}},
		  { binding: 1, resource: {buffer : dimsBuffer}},
		  { binding: 2, resource: {buffer : envBuffer}},
		],
	});

	const renderPassDescriptor = {
	  label: 'renderPass',
	  colorAttachments: [
		{
		  // view: <- to be filled out when we render
		  clearValue: [0.3, 0.3, 0.3, 1],
		  loadOp: 'clear',
		  storeOp: 'store',
		},
	  ],
	};


	function restart()
	{
		input = create_agents_circleIn(NUM_AGENTS, WIDTH, HEIGHT);
		device.queue.writeBuffer(agentBuffer, 0, input);
		slimes = new Float32Array(WIDTH * HEIGHT).fill(0);
		device.queue.writeBuffer(trailBuffer, 0, slimes);
	}


	// ============================== RENDER FUNCTION ================================

	const deltaTime = 1/60;
	async function render(time) {
		time *= 0.0001;
		stats.begin();

		// update uniforms 
		env.set([
			settings.agentMoveSpeed,
			settings.agentTurnSpeed,
			settings.sensorOffsetDist,
			settings.sensorAngleOffset,
			settings.diffuseRate,
			settings.evaporateRate,
			settings.deltaTime,
			time,
			settings.color[0] / 255,
			settings.color[1] / 255,
			settings.color[2] / 255,
		])

		device.queue.writeBuffer(envBuffer, 0, env);

		// ============================== COMPUTE PASS ================================
		var encoder = device.createCommandEncoder({label: 'slime encoder'});
		var pass = encoder.beginComputePass({label: 'slime compute pass'});
		pass.setPipeline(computePipeline);
		pass.setBindGroup(0, bindGroup);
		var workGroupsNeeded = NUM_AGENTS / 64;
		pass.dispatchWorkgroups(workGroupsNeeded);
		pass.end();
	
		// Encode a command to copy the results to a mappable buffer.
		encoder.copyBufferToBuffer(agentBuffer, 0, resultBuffer, 0, resultBuffer.size);
		
		// Finish encoding and submit the commands
		var commandBuffer = encoder.finish();
		device.queue.submit([commandBuffer]);


		// ============================== RENDER PASS ================================
	  	// Get the current texture from the canvas context and
	  	// set it as the texture to render to.
	  	renderPassDescriptor.colorAttachments[0].view = context.getCurrentTexture().createView();
		  
	  	const renderEncoder = device.createCommandEncoder({label: 'render encoder'});
	  	const renderPass = renderEncoder.beginRenderPass(renderPassDescriptor);
	  	renderPass.setPipeline(pipeline);
	  	renderPass.setBindGroup(0, bindGroup2);
	  	renderPass.setVertexBuffer(0, vertexBuffer);
	  	renderPass.draw(6);  // call our vertex shader 6 times (2 triangles)
	  	renderPass.end();
  
	  	const renderCommandBuffer = renderEncoder.finish();
	  	device.queue.submit([renderCommandBuffer]);

		stats.end();
	  	requestAnimationFrame(render);
	}

  
	// code to resize canvas (https://webgpufundamentals.org/webgpu/lessons/webgpu-fundamentals.html)
	const observer = new ResizeObserver(entries => {
	  for (const entry of entries) {
		const canvas = entry.target;
		const width = entry.contentBoxSize[0].inlineSize;
		const height = entry.contentBoxSize[0].blockSize;
		canvas.width = Math.max(1, Math.min(width, device.limits.maxTextureDimension2D));
		canvas.height = Math.max(1, Math.min(height, device.limits.maxTextureDimension2D));
		// re-render
		render();
	  }
	});

	observer.observe(canvas);
};



function rand(min, max) {
	if (max === undefined) {
	  max = min;
	  min = 0;
	}
	return Math.random() * (max - min) + min;
};



function create_agents_circleOut(agent_size, x, y)
{
	let pos = new Array(agent_size).fill(0).map((_, i) => i);
	pos = new Float32Array(pos.map((_, i) => [x / 2, y / 2, rand(2 * Math.PI), 0]).flat());

	return pos;
}
  
function create_agents_circleIn(agent_size, x, y)
{
	let pos = new Array(agent_size).fill(0).map((_, i) => i);
	let posTex = [];
	pos.forEach(_ => {
		let angle = rand(2 * Math.PI)
		let rad = rand(200);
		posTex.push(x/2 + rad * Math.cos(angle), y/2 + rad * Math.sin(angle), Math.PI + angle, 0);
	})

	return new Float32Array(posTex);
}


function fail(msg) {
	// eslint-disable-next-line no-alert
	alert(msg);
}

start();