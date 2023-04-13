'use strict';
import {GUI} from 'https://threejsfundamentals.org/threejs/../3rdparty/dat.gui.module.js';

import {UpdatePositionVS} from "./shaders/updatePositionVS.js";
import {UpdatePositionFS} from "./shaders/updatePositionFS.js";
import {UpdateTrailVS} from "./shaders/updateTrailVS.js";
import {UpdateTrailFS} from "./shaders/updateTrailFS.js";
import {DrawParticlesFS} from "./shaders/drawParticlesFS.js";
import {DrawParticlesVS} from "./shaders/drawParticlesVS.js";
import {ProcessTrailFS} from "./shaders/processTrailFS.js";
import {ProcessTrailVS} from "./shaders/processTrailVS.js";

/* eslint no-alert: 0 */
const settings = {
    AgentMoveSpeed: 110.0,
	AgentTurnSpeed: 34.0,
	SensorOffsetDist: 40.0,
	SensorAngleOffset: 0.2,
	diffuseRate: 10,
	evaporateRate: 0.9,
};

// const startShape = {
//     circleIn: restart,
//     circleOut: restart,
//   };
// let AgentMoveSpeed = 3.0;
let numAgents = 100000;

const gui = new GUI();
gui.add(settings, 'AgentMoveSpeed', 30, 250).listen();
gui.add(settings, 'AgentTurnSpeed', 0.0, 100).listen(); 
gui.add(settings, 'SensorOffsetDist', 0, 50).listen();
gui.add(settings, 'SensorAngleOffset', 0, 6).listen();
gui.add(settings, 'diffuseRate', 0, 20).listen();
gui.add(settings, 'evaporateRate', 0, 5).listen();
// gui.add(settings, 'startShape', Object.keys(startShape)).listen();


function main() {
  	// Get A WebGL context
  	/** @type {HTMLCanvasElement} */
  	const canvas = document.querySelector("#canvas");
  	const gl = canvas.getContext("webgl");
  	if (!gl) {
		return;
  	}
  	init(gl)
	var stats = new Stats();
	stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
	document.body.appendChild( stats.dom );
	webglUtils.resizeCanvasToDisplaySize(gl.canvas);	

	// gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

	const AGENT_SIZE = 600;

	const drawProgram = webglUtils.createProgramFromSources(gl, [DrawParticlesVS, DrawParticlesFS]);
	const updateProgram = webglUtils.createProgramFromSources(gl, [UpdatePositionVS, UpdatePositionFS]);
	const updateTrailProg = webglUtils.createProgramFromSources(gl, [UpdateTrailVS, UpdateTrailFS]);
	const processTrailProg = webglUtils.createProgramFromSources(gl, [ProcessTrailVS, ProcessTrailFS]);

	const updateProgLocs = {
		agentMoveSpeed: gl.getUniformLocation(updateProgram, 'agentSpeed'),
		agentTurnSpeed: gl.getUniformLocation(updateProgram, 'agentTurnSpeed'),
		sensorOffsetDist: gl.getUniformLocation(updateProgram, 'sensorOffsetDist'),
		sensorAngleOffset: gl.getUniformLocation(updateProgram, 'sensorAngleOffset'),
		deltaTime: gl.getUniformLocation(updateProgram, 'deltaTime'),
	};

	const processTrailLocs = {
		diffuseRate: gl.getUniformLocation(processTrailProg, 'diffuseRate'),
		evaporateRate: gl.getUniformLocation(processTrailProg, 'evaporateRate'),
		canvasDims: gl.getUniformLocation(processTrailProg, 'canvasDims'),
		deltaTime: gl.getUniformLocation(processTrailProg, 'deltaTime'),
	}

	const bgBuffer = create_background(gl);
	const drawbgBuffer = create_bgId(gl);
	const AgentIdxBuffer = gl.createBuffer();	

	// create texture for trail map
	let tm = new Array(gl.canvas.width * gl.canvas.height).fill(0).map((_, i) => i);
	const slimes = new Float32Array(tm.map(_ => [0, 0, 0, 0]).flat());
	const trailOldTex = createTexture(gl, slimes, gl.canvas.width, gl.canvas.height)
	const trailNewTex = createTexture(gl, null, gl.canvas.width, gl.canvas.height)

	// create texture for agents info
	let agentPos = create_agents_circleIn(AGENT_SIZE * AGENT_SIZE);
	const agentOldTex = createTexture(gl, agentPos[1], AGENT_SIZE, AGENT_SIZE);
	const agentNewTex = createTexture(gl, null, AGENT_SIZE, AGENT_SIZE);

	// create framebuffer for agents info
	const agentDim = {width: AGENT_SIZE, height: AGENT_SIZE}
	const agentOldFB = createFramebuffer(gl, agentOldTex);
	const agentNewFB = createFramebuffer(gl, agentNewTex);

	// create framebuffer for trail map
	const trailOldFB = createFramebuffer(gl, trailOldTex);
	const trailNewFB = createFramebuffer(gl, trailNewTex);

	let agentOld = {
		fb: agentOldFB,
		tex: agentOldTex
	}

	let agentNew = {
		fb: agentNewFB,
		tex: agentNewTex
	}

	let trailOld = {
		fb: trailOldFB,
		tex: trailOldTex
	}

	let trailNew = {
		fb: trailNewFB,
		tex: trailNewTex
	}

	const deltaTime = 1/60;
  	function render(time) {
		time *= 0.001;
		stats.begin()


		webglUtils.resizeCanvasToDisplaySize(gl.canvas);
		// gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

		// render to agent info
		gl.bindFramebuffer(gl.FRAMEBUFFER, agentNew.fb);
		gl.viewport(0, 0, agentDim.width, agentDim.height);

		gl.bindBuffer(gl.ARRAY_BUFFER, bgBuffer);
		fillAttributeData(gl, updateProgram, "position", 2, 0, 0);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, agentOld.tex);
		gl.activeTexture(gl.TEXTURE0 + 1);
		gl.bindTexture(gl.TEXTURE_2D, trailNew.tex);

		gl.useProgram(updateProgram);


		gl.uniform1i(gl.getUniformLocation(updateProgram, 'agentTex'), 0);
		gl.uniform1i(gl.getUniformLocation(updateProgram, 'trailTex'), 1);
		setUniform2f(gl, updateProgram, "texDims", [AGENT_SIZE, AGENT_SIZE])
		setUniform2f(gl, updateProgram, "canvasDims", [gl.canvas.width, gl.canvas.height])
		gl.uniform1f(updateProgLocs.agentMoveSpeed, settings.AgentMoveSpeed);
		gl.uniform1f(updateProgLocs.agentTurnSpeed, settings.AgentTurnSpeed);
		gl.uniform1f(updateProgLocs.sensorAngleOffset, settings.SensorAngleOffset);
		gl.uniform1f(updateProgLocs.sensorOffsetDist, settings.SensorOffsetDist);
		gl.uniform1f(updateProgLocs.deltaTime, deltaTime);

		gl.drawArrays(gl.TRIANGLES, 0, 6);

		// // setUniform2f(gl, updateProgram, "texDims", [10, 10])
		// setUniform2f(gl, updateProgram, "screenDims", [gl.canvas.width, gl.canvas.height])
		// gl.drawArrays(gl.TRIANGLES, 0, 6);
		
		// var data = new Float32Array(10 * 10 * 4);
		// gl.readPixels(0, 0, 10, 10, gl.RGBA, gl.FLOAT, data);
		// console.log(data)

		// render to trail map
		gl.bindFramebuffer(gl.FRAMEBUFFER, trailNew.fb);
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

		gl.useProgram(updateTrailProg);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, agentNew.tex);

		setUniform2f(gl, updateTrailProg, "agentDims", [AGENT_SIZE, AGENT_SIZE]);
		setUniform2f(gl, updateTrailProg, "canvasDims", [gl.canvas.width, gl.canvas.height])

		bindArrayBuffer(gl, gl.ARRAY_BUFFER, AgentIdxBuffer, agentPos[0], gl.STATIC_DRAW);
		fillAttributeData(gl, updateTrailProg, "position", 1, 0, 0);

		gl.drawArrays(gl.POINTS, 0, AGENT_SIZE * AGENT_SIZE);

		// var data = new Float32Array(10 * 10 * 4);
		// gl.readPixels(0, 0, 10, 10, gl.RGBA, gl.FLOAT, data);
		// console.log(data)
		
		
		// process trail 

		{
			let temp = trailOld;
			trailOld = trailNew;
			trailNew = temp;
		}

		gl.bindFramebuffer(gl.FRAMEBUFFER, trailNew.fb);
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

		gl.useProgram(processTrailProg);

		gl.bindBuffer(gl.ARRAY_BUFFER, bgBuffer);
		fillAttributeData(gl, drawProgram, "position", 2, 0, 0);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, trailOld.tex);

		setUniform2f(gl, processTrailProg, "canvasDims", [gl.canvas.width, gl.canvas.height])
		gl.uniform2f(processTrailLocs.canvasDims, gl.canvas.width, gl.canvas.height);
		gl.uniform1f(processTrailLocs.diffuseRate, settings.diffuseRate);
		gl.uniform1f(processTrailLocs.evaporateRate, settings.evaporateRate);
		gl.uniform1f(processTrailLocs.deltaTime, deltaTime);
		gl.drawArrays(gl.TRIANGLES, 0, 6);

		
		// render trailMap on screen
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

		gl.bindBuffer(gl.ARRAY_BUFFER, bgBuffer);
		fillAttributeData(gl, drawProgram, "position", 2, 0, 0);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, trailNew.tex);

		gl.useProgram(drawProgram);
		setUniform2f(gl, drawProgram, "dimensions", [gl.canvas.width, gl.canvas.height])
		setUniform2f(gl, drawProgram, "canvasDims", [gl.canvas.width, gl.canvas.height])

		gl.drawArrays(gl.TRIANGLES, 0, 6);

		{
			let temp = agentOld;
			agentOld = agentNew;
			agentNew = temp;
		}

		stats.end()
		requestAnimationFrame(render);
 	}	
  	requestAnimationFrame(render);

	function restart(agentsPos, agentsTex)
	{
		gl.clear(gl.COLOR_BUFFER_BIT);
	}
}	

main();

function create_agents_circleOut(agent_size)
{
	let pos = new Array(agent_size).fill(0).map((_, i) => i);
	let posTex = new Float32Array(pos.map((_, i) => [0, 0, rand(2 * Math.PI), 0]).flat());

	return [new Float32Array(pos), posTex];
}

function create_agents_circleIn(agent_size)
{
	let pos = new Array(agent_size).fill(0).map((_, i) => i);

	let posTex = [];
	pos.forEach(_ => {
		let angle = rand(2 * Math.PI)
		let rad = rand(700);
		posTex.push(rad * Math.cos(angle), rad * Math.sin(angle), Math.PI + angle, 0);
	})

	return [new Float32Array(pos), new Float32Array(posTex)];
}

function create_bgId(gl)
{
	const ids = new Array(gl.canvas.width * gl.canvas.height).fill(0).map((_, i) => i);
	const bgBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, bgBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ids), gl.STATIC_DRAW);

	return bgBuffer;
}

function create_background(gl)
{
	const bgBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, bgBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
	  -1, -1,
	   1, -1,
	  -1,  1,
	  -1,  1,
	   1, -1,
	   1,  1,
	]), gl.STATIC_DRAW);

	return bgBuffer;
}

function bindArrayBuffer(gl, type, buffer, data, draw_type=this.gl.DYNAMIC_DRAW)
{
	gl.bindBuffer(type, buffer);
	gl.bufferData(type, data, draw_type);
}

function fillAttributeData(gl, program, attributeName, elementPerAttribute, stride, offset)
{	
	const attr = gl.getAttribLocation(program, attributeName)	
	gl.enableVertexAttribArray(attr);
	gl.vertexAttribPointer(attr, elementPerAttribute, gl.FLOAT, false, stride, offset);
}


function init(gl) {
	// check we can use floating point textures
	const ext1 = gl.getExtension('OES_texture_float');
	if (!ext1) {
	  alert('Need OES_texture_float');
	  return;
	}
	// check we can render to floating point textures
	const ext2 = gl.getExtension('WEBGL_color_buffer_float');
	if (!ext2) {
	  alert('Need WEBGL_color_buffer_float');
	  return;
	}
	// check we can use textures in a vertex shader
	if (gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) < 1) {
	  alert('Can not use textures in vertex shaders');
	  return;
	}
}

function createTexture(gl, data, width, height) {
	const tex = gl.createTexture();

	gl.bindTexture(gl.TEXTURE_2D, tex);
	gl.texImage2D(
		gl.TEXTURE_2D,
		0,        // mip level
		gl.RGBA,  // internal format
		width,
		height,
		0,        // border
		gl.RGBA,  // format
		gl.FLOAT, // type
		data,
	);

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	return tex;
}

function createFramebuffer(gl, tex) {
	const fb = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
	return fb;
}


function setUniform2f(gl, program, uniformName, vec2)
{
	const uniformLocation = gl.getUniformLocation(program, uniformName);;
	gl.uniform2f(uniformLocation, vec2[0], vec2[1]);
}

function rand(min, max) {
	if (max === undefined) {
	  max = min;
	  min = 0;
	}
	return Math.random() * (max - min) + min;
};