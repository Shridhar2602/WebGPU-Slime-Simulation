# WebGPU Physarum (Slime/Mold) Simulation

A Slime Simulator made using WebGPU + Javascript

[Live Demo](https://shridhar2602.github.io/WebGPU-Slime-Simulation/) (1 million agents)

Check [WebGPU browser compatibility list](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API#browser_compatibility) before running the live demo.

- My laptop can run this for up to 7 million particles (agents/slimes) in 1920 x 1080 resolution.

- I first wrote this in WebGL 1.0, which was challenging due to the lack of compute shaders. It can, however, be simulated using the Ping-Pong technique and multiple textures.
The code for my working WebGL 1.0 implementation is there above.

- Porting it all to WebGPU was a simple enough task due to the presence of compute pipelines.


![Screenshot (71)](https://github.com/Shridhar2602/WebGPU-Slime-Simulation/assets/63835433/58339a11-a0d8-40ab-8998-e1c501652734)

![Screenshot (72)](https://github.com/Shridhar2602/WebGPU-Slime-Simulation/assets/63835433/3600d6db-2a4d-4400-86a4-3406cfd87a20)

![Screenshot (76)](https://github.com/Shridhar2602/WebGPU-Slime-Simulation/assets/63835433/bc94c423-3eba-4d8a-be46-ab0fba7fcf61)

![Screenshot (80)](https://github.com/Shridhar2602/WebGPU-Slime-Simulation/assets/63835433/a1683e10-8dba-47c8-83ab-3f0593ad5b9d)

## TODO
1. Dynamic number of agents (In WebGPU buffers/textures cannot be resized).
2. Multiple Species and Evolution.
3. Control agents using image/video bitmasks.

## Related Work 
1. I first came across this through [Sebastian Lague's YouTube channel](https://youtu.be/X-iSQQgOd1A)
3. Sage Jenson's excellent [webpage](https://cargocollective.com/sagejenson/physarum)
2. The underlying [research paper](https://uwe-repository.worktribe.com/output/980579)

## Resources 
1. [WebGPU Fundamentals](https://webgpufundamentals.org/)
2. [WebGL GPGPU](https://webglfundamentals.org/webgl/lessons/webgl-gpgpu.html)
