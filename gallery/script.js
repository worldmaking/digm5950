
// duratin of each shader in seconds:
let duration = 60

// preload all images
const imageUrls = [
	"0a40562379b63dfb89227e6d172f39fdce9022cba76623f1054a2c83d6c0ba5d.png", "0c7bf5fe9462d5bffbd11126e82908e39be3ce56220d900f633d58fb432e56f5.png", "1f7dca9c22f324751f2a5a59c9b181dfe3b5564a04b724c657732d0bf09c99db.jpg", "08b42b43ae9d3c0605da11d0eac86618ea888e62cdd9518ee8b9097488b31560.png", "8de3a3924cb95bd0e95a443fff0326c869f9d4979cd1d5b6e94e2a01f5be53e9.jpg", "10eb4fe0ac8a7dc348a2cc282ca5df1759ab8bf680117e4047728100969e7b43.jpg", "52d2a8f514c4fd2d9866587f4d7b2a5bfa1a11a0e772077d7682deb8b3b517e5.jpg", "85a6d68622b36995ccb98a89bbb119edf167c914660e4450d313de049320005c.png", "92d7758c402f0927011ca8d0a7e40251439fba3a1dac26f5b8b62026323501aa.jpg", "95b90082f799f48677b4f206d856ad572f1d178c676269eac6347631d4447258.jpg", "3083c722c0c738cad0f468383167a0d246f91af2bfa373e9c5c094fb8c8413e0.png", "3871e838723dd6b166e490664eead8ec60aedd6b8d95bc8e2fe3f882f0fd90f0.jpg", "79520a3d3a0f4d3caa440802ef4362e99d54e12b1392973e4ea321840970a88a.jpg", "8979352a182bde7c3c651ba2b2f4e0615de819585cc37b7175bcefbca15a6683.jpg", "ad56fba948dfba9ae698198c109e71f118a54d209c0ea50d77ea546abad89c57.png", "bd6464771e47eed832c5eb2cd85cdc0bfc697786b903bfd30f890f9d4fc36657.jpg", "cb49c003b454385aa9975733aff4571c62182ccdda480aaba9a8d250014f00ec.png", "cbcbb5a6cfb55c36f8f021fbb0e3f69ac96339a39fa85cd96f2017a2192821b5.png", "cd4c518bc6ef165c39d4405b347b51ba40f8d7a065ab0e8d2e4f422cbc1e8a43.jpg", "e6e5631ce1237ae4c05b3563eda686400a401df4548d0f9fad40ecac1659c46c.jpg", "f735bee5b64ef98879dc618b016ecf7939a5756040c2cde21ccb15e69a6e1cfb.png", "fb918796edc3d2221218db0811e240e72e340350008338b0c07a52bd353666a6.jpg"]

const preloadedImages = {}

const loadImages = (urls) => {
	return Promise.all(urls.map(filename => {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => resolve(img);
			img.onerror = reject;
			img.src = "images/" + filename;
			preloadedImages[filename] = img
		});
	}));
};

// TODO:
const resolutionScale = 1;

// null until loaded:
let shadertoy = null

let lasttime = performance.now() / 1000;


const title = document.getElementById('title');

const canvas = document.getElementById('gl');
const totalScreenWidth = canvas.clientWidth;
const totalScreenHeight = canvas.clientHeight;

const gl = canvas.getContext("webgl2");
{
	const ext = gl.getExtension('EXT_color_buffer_float');
	if (!ext) {
		alert('Rendering to floating point textures is not supported');
	}
}
{
	const ext = gl.getExtension('OES_texture_float_linear');
	if (!ext) {
		alert('OES_texture_float_linear not supported');
	}
}

const mouse = {
	down: false,
	click: [0, 0],
	pos: [0, 0],
};
canvas.addEventListener("pointerdown", (e) => {
	const rect = canvas.getBoundingClientRect();
	mouse.down = true
	mouse.click = [(e.clientX - rect.left) / canvas.width, 1 - (e.clientY - rect.top) / canvas.height];
})
canvas.addEventListener("pointerup", (e) => {
	mouse.down = false
	mouse.click = [0, 0];
})
canvas.addEventListener("pointermove", (e) => {
	if (mouse.down) {
		const rect = canvas.getBoundingClientRect();
		mouse.pos = [(e.clientX - rect.left) / canvas.width, 1 - (e.clientY - rect.top) / canvas.height];
	}
});

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(
	gl.ARRAY_BUFFER,
	new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
	gl.STATIC_DRAW,
);

const vs = `#version 300 es
in vec2 position;
void main() {
    gl_Position = vec4(position, 0.0, 1.0);
}`;

const output_fs = `#version 300 es
precision highp float;
out vec4 fragColor;

uniform vec3      iResolution;           // viewport resolution (in pixels)
uniform sampler2D iChannel0;          
uniform float fade;

void main() {
	vec3 color = texture(iChannel0, gl_FragCoord.xy / iResolution.xy).rgb;
	color = clamp(color, vec3(0), vec3(1));
	fragColor = vec4(color * fade, 1.);
  //fragColor.rg = gl_FragCoord.xy / iResolution.xy;
}
`

function createProgram(fs) {
	const program = gl.createProgram();
	const vertexShader = gl.createShader(gl.VERTEX_SHADER);
	const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

	gl.shaderSource(vertexShader, vs);
	gl.shaderSource(fragmentShader, fs);
	gl.compileShader(vertexShader);
	if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
		console.error(
			"Vertex shader compilation error:",
			gl.getShaderInfoLog(vertexShader),
		);
		console.error("Vertex shader source:", vs);
	}
	gl.compileShader(fragmentShader);
	if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
		console.error(
			"Fragment shader compilation error:",
			gl.getShaderInfoLog(fragmentShader),
		);
		console.error("Fragment shader source:", fs);
	}
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	const programValid = gl.getProgramParameter(program, gl.LINK_STATUS);
	if (!programValid) {
		console.error("Program linking error:", gl.getProgramInfoLog(program));
	}

	gl.deleteShader(vertexShader)
	gl.deleteShader(fragmentShader)

	return program
}

function createTexture(width, height) {
	// let texture = gl.createTexture();
	// gl.bindTexture(gl.TEXTURE_2D, texture);
	// gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, null);

	const texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, null);
	// Mandatory for sampling: linear filtering requires extension OES_texture_float_linear
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	return texture
}


function createBuffer(width, height) {
	// create 2 textures for ping-ponging so we can read & write to the same buffer
	let texture = createTexture(width, height)
	let write_texture = createTexture(width, height)

	let id = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, id);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, write_texture, 0);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	return {
		width, height, id, texture, write_texture,

		begin: function () {
			gl.bindFramebuffer(gl.FRAMEBUFFER, this.id);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.write_texture, 0);
			gl.viewport(0, 0, this.width, this.height);
			gl.clearColor(0, 1, 0, 1)
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			return this;
		},

		end: function () {
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			let tmp = this.texture
			this.texture = this.write_texture
			this.write_texture = tmp
			return this;
		},
	};
}


let output_program = createProgram(output_fs)

/////////////////////////////////////////////



function makeShadertoy(json) {


	const width = Math.floor(totalScreenWidth)
	const height = Math.floor(totalScreenHeight)

	canvas.width = canvas.clientWidth;
	canvas.height = canvas.clientHeight;


	let info = json.info

	let Common = json.renderpass.find(pass => pass.name == "Common");

	let header = `#version 300 es
	precision highp float;
	out vec4 fragColor;

	uniform vec3      iResolution;           // viewport resolution (in pixels)
	uniform float     iTime;                 // shader playback time (in seconds)
	uniform vec4      iDate;                 // (year, month, day, time in seconds)
	uniform int       iFrame;                // shader playback frame
	uniform vec4      iMouse;                // mouse pixel coords. xy: current (if MLB down), zw: click
	uniform float     iTimeDelta;            // render time (in seconds)
	uniform float     iFrameRate;            // shader frame rate

	uniform sampler2D iChannel0;          
	uniform sampler2D iChannel1;          
	uniform sampler2D iChannel2;         
	uniform sampler2D iChannel3;     

	// TODO
	//uniform vec3      iChannelResolution[4]; // channel resolution (in pixels)   
	//uniform float     iChannelTime[4];       // channel playback time (in seconds)
	//uniform float     iSampleRate;           // sound sample rate (i.e., 44100)

	${Common ? Common.code : ""}

	`

	let footer = `

	void main() {
		mainImage(fragColor,gl_FragCoord.xy);
	}`;

	let Shadertoy = {
		time: 0,
		frame: 0,
		dt: 1 / 60,

		info,

		passes: [],

		// lookup table of FBOs and textures
		textures: {},

		makePass: function (pass) {
			if (!pass) return;

			// create an output FBO & texture
			let output_name = pass.outputs[0].id

			pass.program = createProgram(header + pass.code + footer)
			pass.buffer = createBuffer(width, height)
			this.textures[output_name] = pass.buffer

			if (pass.type == "image") this.finaltexture = pass.buffer

			// loop over the inputs and create textures for any media files:
			for (let input of pass.inputs) {
				if (input.type == "texture") {

					// remove any leading "/" characters
					let filepath = input.filepath.split('\\').pop().split('/').pop();

					let image = preloadedImages[filepath]
					if (!image) console.error(filepath, "not preloaded")

					let { width, height } = image

					let texture = createTexture(width, height)
					gl.bindTexture(gl.TEXTURE_2D, texture);
					gl.texImage2D(
						gl.TEXTURE_2D,
						0,                // Mip level
						gl.RGBA,          // Internal format
						gl.RGBA,          // Source format
						gl.UNSIGNED_BYTE, // Type
						image             // Image element
					);
					// 4. Generate Mipmaps if needed
					gl.generateMipmap(gl.TEXTURE_2D);

					this.textures[input.id] = { width, height, texture, }
				}
			}

			this.passes.push(pass)
		},

		render: function () {
			const now = new Date();
			const iDateValue = [
				now.getFullYear(),
				now.getMonth() + 1,
				now.getDate(),
				now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds(),
			];
			let mousestate = [mouse.pos[0] * width, mouse.pos[1] * height, mouse.click[0] * width, mouse.click[1] * height]
			//console.log(mousestate)

			// Buffer passes:
			//for (let name of ["BufferA", "BufferB", "BufferC", "BufferD", "Image"]) {
			//	let pass = Shadertoy[name]
			//	if (!pass) continue;
			for (let pass of this.passes) {

				let { program, buffer } = pass
				buffer.begin()
				{
					// bind input textures:
					for (let i = 0; i < 4; i++) {
						let input = pass.inputs[i]
						if (!input) continue;

						let id = input.id
						let texture = this.textures[id]
						if (!texture) continue;

						let channel = input.channel
						let filter = input.sampler.filter
						let wrap = input.sampler.wrap
						//console.log(i, input.id, filter, wrap, textures[id])
						//if (i != channel) console.log(name, i, channel)

						gl.activeTexture(gl.TEXTURE0 + channel);
						gl.bindTexture(gl.TEXTURE_2D, texture.texture);
						gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter == "nearest" ? gl.NEAREST : gl.LINEAR);
						gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter == "nearest" ? gl.NEAREST : filter == "mipmap" ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
						gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap == "repeat" ? gl.REPEAT : wrap == "clamp" ? gl.CLAMP_TO_EDGE : gl.CLAMP_TO_EDGE);
						gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap == "repeat" ? gl.REPEAT : wrap == "clamp" ? gl.CLAMP_TO_EDGE : gl.CLAMP_TO_EDGE);

						// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); 
						// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); 

					}

					gl.useProgram(program);
					gl.uniform3f(gl.getUniformLocation(program, "iResolution"), width, height, 1.0);
					gl.uniform1f(gl.getUniformLocation(program, "iTime"), this.time);
					gl.uniform1f(gl.getUniformLocation(program, "iTimeDelta"), this.dt);
					gl.uniform1i(gl.getUniformLocation(program, "iFrame"), this.frame);
					gl.uniform4f(gl.getUniformLocation(program, "iMouse"), ...mousestate);
					gl.uniform1f(gl.getUniformLocation(program, "iFrameRate"), 1. / this.dt);
					gl.uniform4f(gl.getUniformLocation(program, "iDate"), ...iDateValue);
					gl.uniform1i(gl.getUniformLocation(program, "iChannel0"), 0);
					gl.uniform1i(gl.getUniformLocation(program, "iChannel1"), 1);
					gl.uniform1i(gl.getUniformLocation(program, "iChannel2"), 2);
					gl.uniform1i(gl.getUniformLocation(program, "iChannel3"), 3);

					const positionLocation = gl.getAttribLocation(program, "position");
					gl.enableVertexAttribArray(positionLocation);
					gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
					gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
				}
				buffer.end()
			}

			// update timing at end of frame, so that 1st frame has frame=0, time=0, etc.
			let newtime = performance.now() / 1000
			this.dt = newtime - lasttime;
			this.time += this.dt;
			this.frame++;
			lasttime = newtime;
		},

		freeMemory: function () {
			// free up memory for all allocated resources:
			for (let pass of this.passes) {
				// program
				gl.deleteProgram(pass.program)

				// buffer
				gl.deleteFramebuffer(pass.buffer.id)
				gl.deleteTexture(pass.buffer.texture)
				gl.deleteTexture(pass.buffer.write_texture)

			}

			for (let texture of Object.values(this.textures)) {

				gl.deleteTexture(texture.texture)
			}

		}
	}


	Shadertoy.makePass(json.renderpass.find(pass => pass.name == "Buffer A"))
	Shadertoy.makePass(json.renderpass.find(pass => pass.name == "Buffer B"))
	Shadertoy.makePass(json.renderpass.find(pass => pass.name == "Buffer C"))
	Shadertoy.makePass(json.renderpass.find(pass => pass.name == "Buffer D"))
	Shadertoy.makePass(json.renderpass.find(pass => pass.name == "Image"))

	title.innerText = `${Shadertoy.info.name} - ${Shadertoy.info.username}`

	//console.log(Shadertoy)

	return Shadertoy

}





function render() {

	// const displayWidth = width; //canvas.clientWidth * resolutionScale;
	// const displayHeight = height; //canvas.clientHeight * resolutionScale;
	// if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
	//   canvas.width = displayWidth;
	//   canvas.height = displayHeight;
	// }

	if (shadertoy) {
		shadertoy.render()

		let { width, height } = canvas

		let fade = Math.min(shadertoy.time * 2, (duration - shadertoy.time) / 2)
		fade = Math.min(fade, 1)

		{
			gl.viewport(0, 0, width, height);
			gl.clearColor(0, 0, 0, 1);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

			gl.activeTexture(gl.TEXTURE0 + 0);
			gl.bindTexture(gl.TEXTURE_2D, shadertoy.finaltexture.texture);

			let program = output_program
			gl.useProgram(program);
			gl.uniform3f(gl.getUniformLocation(program, "iResolution"), canvas.width, canvas.height, 1.0);
			gl.uniform1i(gl.getUniformLocation(program, "iChannel0"), 0);
			gl.uniform1f(gl.getUniformLocation(program, "fade"), fade);

			const positionLocation = gl.getAttribLocation(program, "position");
			gl.enableVertexAttribArray(positionLocation);
			gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
		}
	}

	if (shadertoy && shadertoy.time > duration) {
		loadNextShadertoy();
	}

	requestAnimationFrame(render);
}