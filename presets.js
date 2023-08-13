const pre1 = {
	agentMoveSpeed: 30.0,
	agentTurnSpeed: 33.0,
	sensorOffsetDist: 35.0,
	sensorAngleOffset: 30,
	diffuseRate: 3,
	evaporateRate: 0.2,
	deltaTime: 1 / 60,
	color : [255, 255, 255]
};

const pre2 = {
		agentMoveSpeed: 30.0,
		agentTurnSpeed: -3.0,
		sensorOffsetDist: 20.0,
		sensorAngleOffset: 112,
		diffuseRate: 5,
		evaporateRate: 0.75,
		deltaTime: 1 / 60,
		color: [255 *  0.10588236, 255 * 0.6240185, 255 * 0.83137256],
	};

const pre3 = {
		agentMoveSpeed: 30.0,
		agentTurnSpeed: -3.0,
		sensorOffsetDist: 20.0,
		sensorAngleOffset: 20,
		diffuseRate: 5,
		evaporateRate: 0.5,
		deltaTime: 1 / 60,
		color : [255, 0.06132078 * 255, 0.1610105 * 255]
		// color: [0, 255, 255 * 0.31496],
	};


const pre4 = {
		agentMoveSpeed: 50.0,
		agentTurnSpeed: 9.0,
		sensorOffsetDist: 5.0,
		sensorAngleOffset: 20,
		diffuseRate: 2,
		evaporateRate: 0.5,
		deltaTime: 1 / 60,
		// color: [0.47160125 * 255, 0.8301887 * 255, 0.105731584 * 255],
		color: [0, 255, 255 * 0.31496],
	};

// const pre5 = {
// 		agentMoveSpeed: 70.0,
// 		agentTurnSpeed: 30.0,
// 		sensorOffsetDist: 20.0,
// 		sensorAngleOffset: 60,
// 		diffuseRate: 3,
// 		evaporateRate: 0.5,
// 		deltaTime: 1 / 60,
// 		color: [0.53608304 * 255, 0.062745094 * 255, 1 * 255]
// 	};

// const pre6 = {
// 		agentMoveSpeed: 50.0,
// 		agentTurnSpeed: -90.0,
// 		sensorOffsetDist: 30.0,
// 		sensorAngleOffset: 112,
// 		diffuseRate: 3,
// 		evaporateRate: 0.5,
// 		deltaTime: 1 / 60,
// 		color: [0, 255, 255 * 0.31496],
// 	};

// const pre7 = {
// 		agentMoveSpeed: 50.0,
// 		agentTurnSpeed: 50.0,
// 		sensorOffsetDist: 30.0,
// 		sensorAngleOffset: 70,
// 		diffuseRate: 3,
// 		evaporateRate: 0.5,
// 		deltaTime: 1 / 60,
// 		color: [255 * 0.47160125, 255 * 0.8301887, 255 * 0.105731584]
// 	};

export const presets = {
	default : pre1,
	preset1 : pre1,
	preset2 : pre2,
	preset3 : pre3,
	preset4 : pre4,
	// preset5 : pre5,
	// preset6 : pre6,
	// preset7 : pre7,
};