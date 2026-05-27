const data = [
	{
		"ver": "0.1",
		"renderpass": [
			{
				"outputs": [
					{
						"channel": 0,
						"id": "4dfGRr"
					}
				],
				"inputs": [
					{
						"channel": 0,
						"type": "buffer",
						"id": "4dXGR8",
						"filepath": "/media/previz/buffer00.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "void mainImage( out vec4 fragColor, in vec2 fragCoord ) {\n\n    // --------------------------------------------------\n    // Normalized coordinates\n    // --------------------------------------------------\n    vec2 uv = fragCoord / iResolution.xy;\n\n    // --------------------------------------------------\n    // Zoom interaction (unchanged)\n    // --------------------------------------------------\n    if (iMouse.z > 0.0) {\n        float magnification = 4.0;\n        uv /= magnification;\n        uv += iMouse.xy /\n              (iResolution.xy + (iResolution.xy / (magnification - 1.0)));\n    }\n\n    // --------------------------------------------------\n    // Read CA state from Buffer A\n    // --------------------------------------------------\n    float state = texture(iChannel0, uv).r;\n\n    // --------------------------------------------------\n    // Compute local density (neighbor average)\n    // --------------------------------------------------\n    float density = 0.0;\n\n    for (int x = -1; x <= 1; x++) {\n        for (int y = -1; y <= 1; y++) {\n           vec2 offsetUV = uv + vec2(x, y) / iResolution.xy;\n           density += step(0.9, texture(iChannel0, offsetUV).r);\n        }\n    }\n\n    density /= 9.0; // normalize to [0,1]\n\n    // --------------------------------------------------\n    // Map state + density to color\n    // --------------------------------------------------\n    vec3 color = mix(\n        vec3(0.1, 0.2, 0.6),   // low-density/dead: blue\n        vec3(1.0, 0.4, 0.1),   // high-density/active: orange\n        density\n    );\n\n    // subtle glow based on current state\n    color += state * vec3(0.6, 0.6, 0.4);\n\n    fragColor = vec4(color, 1.0);\n}\n\n",
				"name": "Image",
				"description": "",
				"type": "image"
			},
			{
				"outputs": [
					{
						"channel": 0,
						"id": "4dXGR8"
					}
				],
				"inputs": [
					{
						"channel": 0,
						"type": "buffer",
						"id": "4dXGR8",
						"filepath": "/media/previz/buffer00.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "/*\n------------------------------------------------------------\nStudent Number: 219029677\nName: Santiago Bucio-Cano\nTitle: Big Bang Cellular Automaton\n\nBuffers:\n- Buffer A: Stores the persistent cellular state (feedback buffer)\n- Image: Displays the state stored in Buffer A\n\nInteractions / Parameters:\n- Mouse Interaction where it clears space\n- The system is stochastic: resetting the shader will produce\n  slightly different long-term behaviors due to rare random sparks.\n- Interesting parameters to modify:\n    * decay            – controls how slowly cells fade through phases\n    * neighbour limits – birth condition sensitivity\n    * noise threshold  – frequency of spontaneous activation\n    * initial blob radius (currently 20 pixels)\n\nSystem Description:\nThis system is a modified cellular automaton inspired by Conway’s\nGame of Life, but extended with a continuous-valued state rather\nthan binary alive/dead cells. Cells are born at full intensity (1.0),\nthen decay through several discrete \"phases\" before becoming dead.\n\nRather than strict Life rules, birth occurs when a small number of\nneighbors are active, and death is gradual rather than immediate.\nRare spontaneous activations introduce long-term variation and\nprevent the system from settling into static patterns.\n\nThe result is a randomly evolving, organic-looking field that can\nsupport growth, decay, and re-ignition over long timescales.\n\nSources / Inspiration:\n- Conway’s Game of Life (John Conway)\n- Course notes on feedback buffers in Shadertoy\n- Noise function adapted from common GLSL hash patterns\n\nTechnical Realization:\nThe system uses a feedback buffer (iChannel0) to store state between\nframes. Each pixel samples its 8 neighbors, counts active cells, and\nupdates its state based on decay rules and neighborhood conditions.\nMultiple phase thresholds are used to create visually distinct decay\nbands.\n\nFuture Extensions:\n- Color mapping based on phase instead of grayscale\n- Directional bias or flow fields\n- Larger neighborhood kernels or continuous diffusion\n------------------------------------------------------------\n*/\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord)\n{\n    // --------------------------------------------------\n    // Normalized pixel coordinates (0–1)\n    // --------------------------------------------------\n    vec2 uv = fragCoord / iResolution.xy;\n\n    // --------------------------------------------------\n    // Read previous frame state from feedback buffer\n    // --------------------------------------------------\n    vec4 previousState = texture(iChannel0, uv);\n    float cellState = previousState.r;\n\n    // --------------------------------------------------\n    // Initialization (first frame only)\n    // Create a circular seed in the center of the screen\n    // --------------------------------------------------\n    if (iFrame == 0)\n    {\n        vec2 screenCenter = iResolution.xy * 0.5;\n        float distanceFromCenter = length(fragCoord - screenCenter);\n\n        // Cells inside radius start fully alive\n        cellState = (distanceFromCenter < 20.0) ? 2.0 : 0.0;\n    }\n\n    // --------------------------------------------------\n    // Sample Moore neighborhood (8 surrounding pixels)\n    // --------------------------------------------------\n    vec2 pixel = 1.0 / iResolution.xy;\n\n    vec4 east      = texture(iChannel0, uv + vec2( 1.0,  0.0) * pixel);\n    vec4 west      = texture(iChannel0, uv + vec2(-1.0,  0.0) * pixel);\n    vec4 north     = texture(iChannel0, uv + vec2( 0.0,  1.0) * pixel);\n    vec4 south     = texture(iChannel0, uv + vec2( 0.0, -1.0) * pixel);\n    vec4 northeast = texture(iChannel0, uv + vec2( 1.0,  1.0) * pixel);\n    vec4 northwest = texture(iChannel0, uv + vec2(-1.0,  1.0) * pixel);\n    vec4 southeast = texture(iChannel0, uv + vec2( 1.0, -1.0) * pixel);\n    vec4 southwest = texture(iChannel0, uv + vec2(-1.0, -1.0) * pixel);\n\n    // --------------------------------------------------\n    // Count how many neighboring cells are \"alive\"\n    // A threshold is used since state is continuous\n    // --------------------------------------------------\n    int neighbourCount =\n          int(east.x      > 0.5)\n        + int(west.x      > 0.5)\n        + int(north.x     > 0.5)\n        + int(south.x     > 0.5)\n        + int(northeast.x > 0.5)\n        + int(northwest.x > 0.5)\n        + int(southeast.x > 0.5)\n        + int(southwest.x > 0.5);\n\n    // --------------------------------------------------\n    // Phase-based decay and birth rules\n    // --------------------------------------------------\n    float decayRate = 0.03;   // Smaller values slow evolution\n    float nextState = cellState;\n    float globalDecay = decayRate + float(iFrame) * 0.0001;\n\n    // Fully alive → slowly decay but clamp to phase floor\n    if (cellState > 0.9)\n    {\n        nextState = max(0.66, cellState - globalDecay);\n\n    }\n    // Mid-phase decay\n    else if (cellState > 0.5)\n    {\n        nextState = max(0.33, cellState - decayRate);\n    }\n    // Final fading phase\n    else if (cellState > 0.1)\n    {\n        nextState = max(0.0, cellState - decayRate);\n    }\n    else\n    {\n        // --------------------------------------------------\n        // Dead cell logic:\n        // - Can be born from neighbors\n        // - Or rarely sparked by noise\n        // --------------------------------------------------\n\n        // Simple pseudorandom hash-based noise for randomness\n        vec4 noise = random4(fragCoord.xy);\n\n        // Birth condition similar to Game of Life\n        if (neighbourCount == 3)\n        {\n            nextState = 1.0;\n        }\n    \n    }\n\n    // --------------------------------------------------\n    // Mouse interaction: energy injection\n    // --------------------------------------------------\n    if (iMouse.z > 0.0) // left mouse button\n    {\n        vec2 mouseUV = iMouse.xy / iResolution.xy;\n        float d = distance(uv, mouseUV);\n\n        float radius   = 0.05;  // brush size\n        float strength = 1.2;   // injected energy\n\n        float influence = smoothstep(radius, 0.0, d);\n\n        // Additive injection (respects decay phases)\n        nextState = max(nextState, influence * strength);\n    }\n    \n    // --------------------------------------------------\n    // Output grayscale color based on cell state\n    // --------------------------------------------------\n    \n    fragColor = vec4(nextState, nextState, nextState, 1.0);\n}\n\n\n",
				"name": "Buffer A",
				"description": "",
				"type": "buffer"
			},
			{
				"outputs": [],
				"inputs": [],
				"code": "#define RANDOM_SCALE vec4(.1031, .1030, .0973, .1099)\n\nvec2 random2(float p) {\n    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec2 random2(vec2 p) {\n    vec3 p3 = fract(p.xyx * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec2 random2(vec3 p3) {\n    p3 = fract(p3 * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec3 random3(float p) {\n    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xxy + p3.yzz) * p3.zyx); \n}\n\nvec3 random3(vec2 p) {\n    vec3 p3 = fract(vec3(p.xyx) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yxz + 19.19);\n    return fract((p3.xxy + p3.yzz) * p3.zyx);\n}\n\nvec3 random3(vec3 p) {\n    p = fract(p * RANDOM_SCALE.xyz);\n    p += dot(p, p.yxz + 19.19);\n    return fract((p.xxy + p.yzz) * p.zyx);\n}\n\nvec4 random4(float p) {\n    vec4 p4 = fract(p * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);   \n}\n\nvec4 random4(vec2 p) {\n    vec4 p4 = fract(p.xyxy * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec3 p) {\n    vec4 p4 = fract(p.xyzx * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec4 p4) {\n    p4 = fract(p4  * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}",
				"name": "Common",
				"description": "",
				"type": "common"
			}
		],
		"flags": {
			"mFlagVR": false,
			"mFlagWebcam": false,
			"mFlagSoundInput": false,
			"mFlagSoundOutput": false,
			"mFlagKeyboard": false,
			"mFlagMultipass": true,
			"mFlagMusicStream": false
		},
		"info": {
			"id": "tXyyz3",
			"date": "1769551978",
			"viewed": 38,
			"name": "Big Bang Cellular Automaton",
			"username": "Santiago Bucio-Cano",
			"description": "The aesthetic focuses on random, organic change rather than sharp on/off states, so the system feels more natural and alive than mechanical. I wanted to kind of create an explosion of life, sort of like the big bang in a way",
			"likes": 1,
			"published": 1,
			"flags": 32,
			"usePreview": 0,
			"tags": [
				"datt4950"
			],
			"hasliked": 0,
			"parentid": "",
			"parentname": ""
		}
	},
	{
		"ver": "0.1",
		"renderpass": [
			{
				"outputs": [
					{
						"channel": 0,
						"id": "4dfGRr"
					}
				],
				"inputs": [
					{
						"channel": 0,
						"type": "buffer",
						"id": "4dXGR8",
						"filepath": "/media/previz/buffer00.png",
						"sampler": {
							"filter": "linear",
							"wrap": "repeat",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "void mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n\n    vec2 uv = fragCoord/iResolution.xy;\n    \n    // mouse zoom\n    if(iMouse.z > 0.0) {\n        float magnification = 10.;\n        uv /= magnification;\n        uv += iMouse.xy / ((iResolution.xy + (iResolution.xy / (magnification - 1.0))));\n    }\n    \n    \n    vec4 C = texture(iChannel0, uv);\n    \n    fragColor = C.rgba;\n}",
				"name": "Image",
				"description": "",
				"type": "image"
			},
			{
				"outputs": [],
				"inputs": [],
				"code": "#define RANDOM_SCALE vec4(.1031, .1030, .0973, .1099)\n\nvec2 random2(float p) {\n    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec2 random2(vec2 p) {\n    vec3 p3 = fract(p.xyx * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec2 random2(vec3 p3) {\n    p3 = fract(p3 * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec3 random3(float p) {\n    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xxy + p3.yzz) * p3.zyx); \n}\n\nvec3 random3(vec2 p) {\n    vec3 p3 = fract(vec3(p.xyx) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yxz + 19.19);\n    return fract((p3.xxy + p3.yzz) * p3.zyx);\n}\n\nvec3 random3(vec3 p) {\n    p = fract(p * RANDOM_SCALE.xyz);\n    p += dot(p, p.yxz + 19.19);\n    return fract((p.xxy + p.yzz) * p.zyx);\n}\n\nvec4 random4(float p) {\n    vec4 p4 = fract(p * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);   \n}\n\nvec4 random4(vec2 p) {\n    vec4 p4 = fract(p.xyxy * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec3 p) {\n    vec4 p4 = fract(p.xyzx * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec4 p4) {\n    p4 = fract(p4  * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}",
				"name": "Common",
				"description": "",
				"type": "common"
			},
			{
				"outputs": [
					{
						"channel": 0,
						"id": "4dXGR8"
					}
				],
				"inputs": [
					{
						"channel": 0,
						"type": "buffer",
						"id": "4dXGR8",
						"filepath": "/media/previz/buffer00.png",
						"sampler": {
							"filter": "linear",
							"wrap": "repeat",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "/*\nAssignment 1: Cellular Automata\nBy Gavin Johnstone\n217100033\n\nTitle: Greasefire\n\nInstructions: \n\n    Left mouse button to zoom in.\n    \n    Reset time to generate a new instance.\n\n    **Once you've enjoyed the aesthetic version, remove the \"-\" from the \"wobble\" variable \n    to add chaos!**\n    \n    You can also change the speed (fps) and number of ants (antFreq).\n    \nDescription:\n    This system is based on the Brian's Brain cellular automata. During our lab, we played with creating a \n    more gradual decay for the cells and I discovered that setting the decay really low creates a really \n    interesting and beautiful pattern, so I decided to use that as a starting point.\n    \n    The system consists of two different modified \"Brain\" systems, one that is blue and one that is red.\n    The blue one is the default but has a limited chance to regenerate, resulting in this really cool \"decay\"\n    effect. In order to keep it from dissapearing, traveling green pixels spawn a red \"brain\" system which \n    regenerates much easier and can reignite dying blue cells. The limiting factor for the red cells is that \n    they die when crowded out by blue cells. The optional wobble feature for the green cells is based on a\n    randomized Langton's Ant.\n\n    Individually, I believe the blue rule exhibits Class 1 long-term behaviour (it dies out) and the red rule \n    is Class 4 (without blue, red fills the screen with a complex pattern that may or may not oscilate).\n    However, when they are put together we end up with this seemingly endless dance whereing the blue \n    consumes red, preventing its growth while perpetually dying. The red trails spawned by the green cells \n    only grow when they hit the blue clouds because the default structure formed suffocates itself with \n    generated blue cells. With enough green cells spawned in, this will go on effectively infinitely, though \n    I think there is theoretically always an extremely small chance that the green cells will all fail to \n    start a new reaction before the last blue cloud dies, meaning the system will become cyclic given \n    infinite time. When the random movement is intoduced however, two green cells colliding could always\n    restart the reaction.\n    \n    Originially, my idea for this project was based the idea of objects in flowing water creating wakes. The\n    oscillation of the modified Brian's Brain looks a lot like flowing water when you remove one side of it's\n    neighborhood. I found though, that interrupting this pattern doesn't look all that interesting and gets a\n    bit lost in the chaotic patterns, which is when I came up with the idea of a second rule in another colour.\n    The beautiful behaviour that emerged was pretty much just something I discovered when playing with the \n    many parameters and countering behaviours I didn't want; when red filled the screen I made blue able to \n    kill it, when blue was limiting the potential for reactions I made new reds delete blues. Interestingly,\n    I thought having newly spawned blues delete reds \n    \n    A posible future extension could be finding other interesting ways to perpetuate the cycle, instead of\n    the green cells. Perhaps new structures could spawn when a large enough section is dead, or at set \n    intervals in random locations. One thing I would like to improve is the green cell generation, as the \n    random function will occasionally result in too few cells being created.\n\nCode sources:\nBrian's Brain - Author: grrrwaaa - https://www.shadertoy.com/view/t3tcDN\nLangton's Ant - Author: grrrwaaa - https://www.shadertoy.com/view/W33yRS\nFPS Limiter - Author: TrevallionJ - https://www.shadertoy.com/view/wtscDj\n\n\n*/\n\n\nfloat fps = 30.0; // change speed (must be a factor of 60)\nfloat wobble = 0.01; // Remove \"-\" to make the ants wiggle!\nfloat antFreq = 0.0001; // change the number of ants (default 0.0001)\n\nfloat activated = 1.0;\nfloat off = 0.0;\nfloat decay = 0.04;\nfloat minimum = 0.1;\nint bluePop = 5; \nint redPop = 3;\nint crowding = 5;\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord)\n{\n    vec2 uv = fragCoord/iResolution.xy;\n    \n    // generate noise\n    vec4 noise = random4(vec3(fragCoord, iTime));\n    \n    vec4 C = texture(iChannel0, (fragCoord / iResolution.xy));\n    \n    // get the 8 neighbouring pixel values:\n    vec4 E  = texture(iChannel0, (fragCoord + vec2( 1, 0))/iResolution.xy);\n    vec4 W  = texture(iChannel0, (fragCoord + vec2(-1, 0))/iResolution.xy);\n    vec4 N  = texture(iChannel0, (fragCoord + vec2( 0, 1))/iResolution.xy);\n    vec4 S  = texture(iChannel0, (fragCoord + vec2( 0,-1))/iResolution.xy);\n    vec4 NE = texture(iChannel0, (fragCoord + vec2( 1, 1))/iResolution.xy);\n    vec4 NW = texture(iChannel0, (fragCoord + vec2(-1, 1))/iResolution.xy);\n    vec4 SE = texture(iChannel0, (fragCoord + vec2( 1,-1))/iResolution.xy);\n    vec4 SW = texture(iChannel0, (fragCoord + vec2(-1,-1))/iResolution.xy);\n    \n    // get alive blue neighbour total\n    int total = int(E.b > minimum) + int(W.b > minimum) \n                + int(N.b > minimum) + int(S.b > minimum) \n                + int(NE.b > minimum) + int(NW.b > minimum) \n                + int(SE.b > minimum) + int(SW.b > minimum);\n    // get alive red neighbour total\n    int rtotal = int(E.r > minimum) + int(W.r > minimum) \n                + int(N.r > minimum) + int(S.r > minimum) \n                + int(NE.r > minimum) + int(NW.r > minimum) \n                + int(SE.r > minimum) + int(SW.r > minimum);\n\n    \n    // if ant is coming west\n    if (E.g == 1.0) { \n        // minor chance of changing direction\n        if (noise.w < wobble) {\n            C.g = 0.95;\n        } else if (noise.w > 1.0-wobble){\n            C.g = 0.9;\n        } else {\n            C.g = 1.0;\n        }\n        \n    // if ant is coming southwest\n    } else if (NE.g == 0.95) { \n        // minor chance of changing direction\n        if (noise.w < wobble) {\n            C.g = 1.0;\n        } else if (noise.w > 1.0-wobble){\n            C.g = 0.9;\n        } else {\n            C.g = 0.95;\n        }\n        \n    // if ant is coming northwest\n    } else if (SE.g == 0.9) { \n        // minor chance of changing direction\n        if (noise.w < wobble) {\n            C.g = 0.95;\n        } else if (noise.w > 1.0-wobble){\n            C.g = 1.0;\n        } else {\n            C.g = 0.9;\n        }\n    \n    // if not an ant\n    } else {\n        \n        C.g = 0.0; // delete ant\n\n        //if blue channel is alive\n        if(C.b >= minimum) { \n            // decay over time\n            C.b -= decay; \n        // if there's blue neighbors, activate\n        } else if (C.b < minimum && total == bluePop) { \n            C.b = activated;\n        // if touching red, activate\n        } else if (rtotal == 3) { \n            C.b = activated;\n        } else { // die\n            C.b = off;\n        }\n\n        //if red channel is alive\n        if(C.r >= minimum) { \n            // decay over time\n            C.r -= decay; \n        // if touching red and not crowded by blue, activate red and kill blue\n        } else if (C.r < minimum && rtotal == redPop && total < crowding) { \n            C.r = activated;\n            C.b = off;\n        // if behind ant, activate and kill blue\n        } else if ( W.g > minimum || NW.g > minimum || SW.g > minimum ){\n            C.r = activated;\n            C.b = off;\n        } else { // die\n            C.r = off;\n        }\n    }\n    \n    // reset \n    if (iFrame == 0) {\n        // generate random blue\n        C = vec4(noise.x);\n        C.r = 0.0;\n        C.g = 0.0;\n\n        \n        // spawn ants randomly\n        if (noise.y < 0.5 && noise.y > 0.5 - antFreq) { \n            C.g = 1.0;\n        }\n    }\n    \n    // limit FPS (credit to https://www.shadertoy.com/view/wtscDj)\n    if(mod(float(iFrame), 60.0 / fps) == 0.0){\n        fragColor = C.rgba;\n        \n    } else { // keep previous frame\n        fragColor = texture(iChannel0, uv);\n    }\n    \n}",
				"name": "Buffer A",
				"description": "",
				"type": "buffer"
			}
		],
		"flags": {
			"mFlagVR": false,
			"mFlagWebcam": false,
			"mFlagSoundInput": false,
			"mFlagSoundOutput": false,
			"mFlagKeyboard": false,
			"mFlagMultipass": true,
			"mFlagMusicStream": false
		},
		"info": {
			"id": "WXGcDm",
			"date": "1769309913",
			"viewed": 32,
			"name": "Greasefire",
			"username": "Gavin Johnstone",
			"description": "Greasefire - Cellular Automata",
			"likes": 1,
			"published": 1,
			"flags": 32,
			"usePreview": 0,
			"tags": [
				"datt4950"
			],
			"hasliked": 0,
			"parentid": "",
			"parentname": ""
		}
	},
	{
		"ver": "0.1",
		"renderpass": [
			{
				"outputs": [
					{
						"channel": 0,
						"id": "4dfGRr"
					}
				],
				"inputs": [
					{
						"channel": 0,
						"type": "buffer",
						"id": "4dXGR8",
						"filepath": "/media/previz/buffer00.png",
						"sampler": {
							"filter": "nearest",
							"wrap": "repeat",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "void mainImage( out vec4 fragColor, in vec2 fragCoord ) {\n\n    // normalized coordinate (0.0 to 1.0):\n    vec2 uv = fragCoord / iResolution.xy;\n    \n    //uv /= 4.;\n    \n    float magnification = 16.;\n    if(iMouse.z > 0.0) {\n        uv /= magnification;\n        uv += iMouse.xy / ((iResolution.xy + (iResolution.xy / (magnification - 1.0))));\n    }\n    \n    // read 1st texture input:\n    vec4 ca = texture(iChannel0, uv);\n    fragColor = ca.rgaa;\n    \n    // rock \n    //fragColor = vec4( ca.r * 0.62, ca.r * 0.7, ca.r * 0.75, ca.r * 0.0 );\n    \n    \n    // all chips:\n    //fragColor = vec4(ca.r + ca.a * 0.1);\n    \n    int i = int(uv.x * 16.);\n    \n    // how to get the bits out:\n    //fragColor = vec4(i & 1);\n    //fragColor = vec4(i & 2);\n    //fragColor = vec4(i & 4);\n    //fragColor = vec4(i & 8);\n}",
				"name": "Image",
				"description": "",
				"type": "image"
			},
			{
				"outputs": [
					{
						"channel": 0,
						"id": "4dXGR8"
					}
				],
				"inputs": [
					{
						"channel": 0,
						"type": "buffer",
						"id": "4dXGR8",
						"filepath": "/media/previz/buffer00.png",
						"sampler": {
							"filter": "nearest",
							"wrap": "repeat",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 3,
						"type": "keyboard",
						"id": "4dXGRr",
						"filepath": "/presets/tex00.jpg",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "/*\nAssignment 1: Cellular Automata\nBy Gavin Johnstone\n217100033\n\nTitle: Mossflower\n\nInstructions: \n\n    Left mouse button to zoom in.\n    \n    You can play with the gravity or region variables to yield other results.\n\nDescription:\n\n    My initial vision was to solve three self-made goals regarding Langton's Ant (using initial code from \n    Termites: https://www.shadertoy.com/view/33cyRS). The three goals were: implement a system for influencing \n    the random movement, solve the problem of two ants entering the same space and one getting deleted, and \n    make the the alive state additive so cells could carry different levels of brightness. The first ended up \n    being an attraction system like gravity and the second is a system where intended direction is encoded into \n    either the first, second, third, or fourth digit of the blue channel. Unfortunnately, after a tremendous\n    amount of effort I think the last one was completely impossible within my design. Best as I can understand\n    it, it didn't work due to trying to read from an additive loop affected by floating point rounding errors.\n    \n    What I ended up with is a cellular automata that wanders randomly, but is drawn toward other cells, and can \n    pass through other cells without interference (so clusters don't shrink). The red channel reflects the \n    density of green pixels, but only updates when a green cell leaves its space, leaving some really cool \n    patterns. For an earlier version with even cooler patterns, check out https://www.shadertoy.com/view/WXKBR3.\n    \n    A future extension might be redesigning the system to implement the variable green data, but I'd probably \n    have to make a completely different system at a fundamental level. I also got some comments saying that it\n    dies on Mac, possibly due to float errors so that's also something to fix.\n\n\n*/\n// red channel = generated cloud\n// green channel = cell is present\n// blue channel = cell direction \n// north = 1.0\n// south = 2.0\n// east = 4.0\n// west = 8.0\n\nint Nb = 1;\nint Sb = 2;\nint Eb = 4;\nint Wb = 8;\n\n// how strongly the cells attract each other\nfloat gravity = 0.8;\n\n// dimensions of the region that the cell will look in to calculate attraction\n// playing with these values can manipulate the structures generated (or blow up your computer).\nint regionH = 20;\nint regionW = 20;\n// if your computer is already going to blow up, try:\n// int regionH = 10;\n// int regionW = 10;\n\nfloat north = 0.0;\nfloat south = 0.0;\nfloat east = 0.0;\nfloat west = 0.0;\nfloat Prob = 1.0;\nvec2 coord = vec2(0,0);\n\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n        // normalized coordinate (0.0 to 1.0):\n    vec2 uv = fragCoord / iResolution.xy;\n    \n    int regionH = int(mix(2., 50., uv.y));\n    int regionW = int(mix(2., 100., uv.x));\n    \n    vec4 noise = random4(vec3(fragCoord, iTime));\n\n        // get self state\n    vec4 C  = texture(iChannel0, (fragCoord+vec2( 0, 0))/iResolution.xy);\n    \n    \n        // get state of all neighbour pixels:\n    vec4 E  = texture(iChannel0, (fragCoord+vec2( 1, 0))/iResolution.xy);\n    vec4 W  = texture(iChannel0, (fragCoord+vec2(-1, 0))/iResolution.xy);\n    vec4 N  = texture(iChannel0, (fragCoord+vec2( 0, 1))/iResolution.xy);\n    vec4 S  = texture(iChannel0, (fragCoord+vec2( 0,-1))/iResolution.xy);\n   \n    \n        // cell leaves\n    C.g = 0.;\n    C.b = 0.;\n        // relevant directional values of neighbors\n    int north = int(S.b) & Nb; //mod(S.b, 2.)\n    int south = int(N.b) & Sb; //floor(mod(N.b / 10.0, 10.0));\n    int east =  int(W.b) & Eb; //floor(mod(W.b / 100.0, 10.0));\n    int west =  int(E.b) & Wb; //floor(mod(E.b / 1000.0, 10.0));\n    \n    int outdir = 0;\n    \n        // cell coming west\n    if (E.g > 0. && west > 0) {\n            // cell is alive\n        C.g = 1.;\n        \n        float Ntotal = 1.;\n        float Stotal = 1.;\n            // calculate number of cells above and below\n        for (int i = -regionH/2; i <= regionH/2; i++) {\n            for (int j = -regionW/2; j <= regionW/2; j++) {\n                if (i < 0) {\n                    Ntotal += texture(iChannel0, (fragCoord+vec2(i,j))/iResolution.xy).g;\n                } else if (i > 0) {\n                    Stotal += texture(iChannel0, (fragCoord+vec2(i,j))/iResolution.xy).g;\n                }\n            }\n        }\n        \n            // brightness of red channel reflects how full the region is\n        C.r = (Ntotal+Stotal)/float(regionH*regionW);\n        \n            // calculate ratio of north cells to south cells\n        Prob = (Ntotal/(Ntotal+Stotal));\n            // gravity affects strength of effect\n        Prob = ((Prob - 0.5) * gravity) + 0.5;\n        \n            // if there are more north, north is more likely, \n            // or if there is also a cell coming east go north (to avoid two going the same way)\n        if (noise.x < Prob || east > 0) { \n                // send it north\n            //C.b += 1.;\n            outdir += Nb;\n        } else { \n            //C.b += 10.0; \n            outdir += Sb;\n        } // send it south\n\n\n    }\n        // cell coming east\n    if (W.g > 0. && east > 0) {\n            // cell is alive\n        C.g = 1.;\n        float Ntotal = 1.;\n        float Stotal = 1.;\n            // calculate number of cells above and below\n        for (int i = -regionH/2; i <= regionH/2; i++) {\n            for (int j = -regionW/2; j <= regionW/2; j++) {\n                if (i < 0) {\n                    Ntotal += texture(iChannel0, (fragCoord+vec2(i,j))/iResolution.xy).g;\n                } else if (i > 0) {\n                    Stotal += texture(iChannel0, (fragCoord+vec2(i,j))/iResolution.xy).g;\n                }\n            }\n        }\n            // brightness of red channel reflects how full the region is\n        C.r = (Ntotal+Stotal)/float(regionH*regionW);\n            // calculate ratio of north cells to south cells\n        Prob = (Ntotal/(Ntotal+Stotal));\n            // gravity\n        Prob = ((Prob - 0.5) * gravity) + 0.5;\n            // if there are more north, south is less likely, \n            // or if there is also a cell coming west go south (to avoid two going the same way)\n        if (noise.x > Prob || west > 0) { \n                // send it south\n            outdir += Sb;\n        } else { \n            outdir += Nb;//C.b += 1.; \n        } // send it north\n    }\n        // cell coming north\n    if (S.g > 0. && north > 0) {\n            // cell is alive\n        C.g = 1.;\n        float Wtotal = 1.;\n        float Etotal = 1.;\n            // calculate number of cells above and below\n        for (int i = -regionH/2; i <= regionH/2; i++) {\n            for (int j = -regionW/2; j <= regionW/2; j++) {\n                if (j < 0) {\n                    Wtotal += texture(iChannel0, (fragCoord+vec2(i,j))/iResolution.xy).g;\n                } else if (i > 0) {\n                    Etotal += texture(iChannel0, (fragCoord+vec2(i,j))/iResolution.xy).g;\n                }\n            }\n        }\n            // brightness of red channel reflects how full the region is\n        C.r = (Wtotal+Etotal)/float(regionH*regionW);\n            // calculate ratio of north cells to south cells\n        Prob = (Wtotal/(Wtotal+Etotal));\n            // gravity\n        Prob = ((Prob - 0.5) * gravity) + 0.5;\n            // if there are more west, west is more likely, \n            // or if there is also a cell coming north go west\n        if (noise.x < Prob || south > 0) { \n                // send it west\n            outdir += Wb;\n        } else { outdir += Eb; } // send it east\n    }\n         // cell coming north\n    if (N.g > 0. && south > 0) {\n            // cell is alive\n        C.g = 1.;\n        \n        float Wtotal = 1.;\n        float Etotal = 1.;\n            // calculate number of cells above and below\n        for (int i = -regionH/2; i <= regionH/2; i++) {\n            for (int j = -regionW/2; j <= regionW/2; j++) {\n                if (j < 0) {\n                    Wtotal += texture(iChannel0, (fragCoord+vec2(i,j))/iResolution.xy).g;\n                } else if (i > 0) {\n                    Etotal += texture(iChannel0, (fragCoord+vec2(i,j))/iResolution.xy).g;\n                }\n            }\n        }\n            // brightness of red channel reflects how full the region is\n        C.r = (Wtotal+Etotal)/float(regionH*regionW);\n            // calculate ratio of north cells to south cells\n        Prob = (Wtotal/(Wtotal+Etotal));\n            // gravity\n        Prob = ((Prob - 0.5) * gravity) + 0.5;\n            // if there are more west, east is less likely, \n            // or if there is also a cell coming south go east\n        if (noise.x > Prob || north > 0) { \n                // send it east\n            outdir += Eb;\n        } else { outdir += Wb; } // send it west\n    }\n    \n    C.b = float(outdir);\n\n    fragColor = vec4(C);\n    \n    // initialize -- spacebar or rewind:\n    // The ASCII/Unicode value for \"spacebar\" is 32. \n    bool spacePressed = texelFetch(iChannel3, ivec2(32, 0), 0).r > 0.;\n    if (iFrame == 0 || spacePressed) { \n        fragColor = vec4(0);\n        \n        noise = random4(vec3(fragCoord, iDate.w));\n        \n            // a random scattering of cells:\n        fragColor = vec4(\n            0,\n            noise.z < 0.2 ? 0.5 : 0., // ant here?\n            noise.z < 0.2 ? 1.0 : 0., // ant direction\n            0);\n\n        \n        /*\n        if (uv.x < 0.6 && uv.x > 0.4) {\n            fragColor = vec4(0,1,noise.x,0);\n        } else {\n            fragColor = vec4(0);\n        }\n        */\n    } \n}",
				"name": "Buffer A",
				"description": "",
				"type": "buffer"
			},
			{
				"outputs": [],
				"inputs": [],
				"code": "const float PI = 3.141592653589793;\n\n#define RANDOM_SCALE vec4(.1031, .1030, .0973, .1099)\n\nvec2 random2(float p) {\n    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec2 random2(vec2 p) {\n    vec3 p3 = fract(p.xyx * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec2 random2(vec3 p3) {\n    p3 = fract(p3 * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec3 random3(float p) {\n    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xxy + p3.yzz) * p3.zyx); \n}\n\nvec3 random3(vec2 p) {\n    vec3 p3 = fract(vec3(p.xyx) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yxz + 19.19);\n    return fract((p3.xxy + p3.yzz) * p3.zyx);\n}\n\nvec3 random3(vec3 p) {\n    p = fract(p * RANDOM_SCALE.xyz);\n    p += dot(p, p.yxz + 19.19);\n    return fract((p.xxy + p.yzz) * p.zyx);\n}\n\nvec4 random4(float p) {\n    vec4 p4 = fract(p * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);   \n}\n\nvec4 random4(vec2 p) {\n    vec4 p4 = fract(p.xyxy * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec3 p) {\n    vec4 p4 = fract(p.xyzx * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec4 p4) {\n    p4 = fract(p4  * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nfloat hash11(float p)\n{\n    p = fract(p * .1031);\n    p *= p + 33.33;\n    p *= p + p;\n    return fract(p);\n}\n\n//----------------------------------------------------------------------------------------\n//  1 out, 2 in...\nfloat hash12(vec2 p)\n{\n\tvec3 p3  = fract(vec3(p.xyx) * .1031);\n    p3 += dot(p3, p3.yzx + 33.33);\n    return fract((p3.x + p3.y) * p3.z);\n}\n\n//----------------------------------------------------------------------------------------\n//  1 out, 3 in...\nfloat hash13(vec3 p3)\n{\n\tp3  = fract(p3 * .1031);\n    p3 += dot(p3, p3.zyx + 33.33);\n    return fract((p3.x + p3.y) * p3.z);\n}\n//----------------------------------------------------------------------------------------\n// 1 out 4 in...\nfloat hash14(vec4 p4)\n{\n\tp4 = fract(p4  * vec4(.1031, .1030, .0973, .1099));\n    p4 += dot(p4, p4.wzxy+33.33);\n    return fract((p4.x + p4.y) * (p4.z + p4.w));\n}\n\n//----------------------------------------------------------------------------------------\n//  2 out, 1 in...\nvec2 hash21(float p)\n{\n\tvec3 p3 = fract(vec3(p) * vec3(.1031, .1030, .0973));\n\tp3 += dot(p3, p3.yzx + 33.33);\n    return fract((p3.xx+p3.yz)*p3.zy);\n\n}\n\n//----------------------------------------------------------------------------------------\n///  2 out, 2 in...\nvec2 hash22(vec2 p)\n{\n\tvec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));\n    p3 += dot(p3, p3.yzx+33.33);\n    return fract((p3.xx+p3.yz)*p3.zy);\n\n}\n\n//----------------------------------------------------------------------------------------\n///  2 out, 3 in...\nvec2 hash23(vec3 p3)\n{\n\tp3 = fract(p3 * vec3(.1031, .1030, .0973));\n    p3 += dot(p3, p3.yzx+33.33);\n    return fract((p3.xx+p3.yz)*p3.zy);\n}\n\n//----------------------------------------------------------------------------------------\n//  3 out, 1 in...\nvec3 hash31(float p)\n{\n   vec3 p3 = fract(vec3(p) * vec3(.1031, .1030, .0973));\n   p3 += dot(p3, p3.yzx+33.33);\n   return fract((p3.xxy+p3.yzz)*p3.zyx); \n}\n\n\n//----------------------------------------------------------------------------------------\n///  3 out, 2 in...\nvec3 hash32(vec2 p)\n{\n\tvec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));\n    p3 += dot(p3, p3.yxz+33.33);\n    return fract((p3.xxy+p3.yzz)*p3.zyx);\n}\n\n//----------------------------------------------------------------------------------------\n///  3 out, 3 in...\nvec3 hash33(vec3 p3)\n{\n\tp3 = fract(p3 * vec3(.1031, .1030, .0973));\n    p3 += dot(p3, p3.yxz+33.33);\n    return fract((p3.xxy + p3.yxx)*p3.zyx);\n\n}\n\n//----------------------------------------------------------------------------------------\n// 4 out, 1 in...\nvec4 hash41(float p)\n{\n\tvec4 p4 = fract(vec4(p) * vec4(.1031, .1030, .0973, .1099));\n    p4 += dot(p4, p4.wzxy+33.33);\n    return fract((p4.xxyz+p4.yzzw)*p4.zywx);\n    \n}\n\n//----------------------------------------------------------------------------------------\n// 4 out, 2 in...\nvec4 hash42(vec2 p)\n{\n\tvec4 p4 = fract(vec4(p.xyxy) * vec4(.1031, .1030, .0973, .1099));\n    p4 += dot(p4, p4.wzxy+33.33);\n    return fract((p4.xxyz+p4.yzzw)*p4.zywx);\n\n}\n\n//----------------------------------------------------------------------------------------\n// 4 out, 3 in...\nvec4 hash43(vec3 p)\n{\n\tvec4 p4 = fract(vec4(p.xyzx)  * vec4(.1031, .1030, .0973, .1099));\n    p4 += dot(p4, p4.wzxy+33.33);\n    return fract((p4.xxyz+p4.yzzw)*p4.zywx);\n}\n\n//----------------------------------------------------------------------------------------\n// 4 out, 4 in...\nvec4 hash44(vec4 p4)\n{\n\tp4 = fract(p4  * vec4(.1031, .1030, .0973, .1099));\n    p4 += dot(p4, p4.wzxy+33.33);\n    return fract((p4.xxyz+p4.yzzw)*p4.zywx);\n}",
				"name": "Common",
				"description": "",
				"type": "common"
			}
		],
		"flags": {
			"mFlagVR": false,
			"mFlagWebcam": false,
			"mFlagSoundInput": false,
			"mFlagSoundOutput": false,
			"mFlagKeyboard": true,
			"mFlagMultipass": true,
			"mFlagMusicStream": false
		},
		"info": {
			"id": "scf3WB",
			"date": "1773267971",
			"viewed": 59,
			"name": "Mossflower",
			"username": "Gavin Johnstone",
			"description": "A2 Cellular Automata II, modified from a class project by Gavin Jonstone",
			"likes": 2,
			"published": 1,
			"flags": 48,
			"usePreview": 0,
			"tags": [
				"datt4950",
				"termite"
			],
			"hasliked": 0,
			"parentid": "tXVBWG",
			"parentname": "Final A2"
		}
	},
	{
		"ver": "0.1",
		"renderpass": [
			{
				"outputs": [
					{
						"channel": 0,
						"id": "4dfGRr"
					}
				],
				"inputs": [
					{
						"channel": 0,
						"type": "buffer",
						"id": "4dXGR8",
						"filepath": "/media/previz/buffer00.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "/*\nStudent number: 218179226\nAssignment2\nName: Junxi Li\nTitle: Spiral Particle Cellular Automaton\n\nImage\n-reads particle field from BufferA\n-gives each particle a base color and small stable variatio\n-adds a small glow by checking neighbor pixels so dots pop visually\n*/\n\nvec3 palette(vec3 onehot, vec2 fragCoord){\n    //3 base colors\n    vec3 c0 = vec3(0.12, 0.78, 0.95);\n    vec3 c1 = vec3(0.95, 0.22, 0.58);\n    vec3 c2 = vec3(0.94, 0.88, 0.22);\n\n    //choose base by particle type\n    vec3 base = (onehot.x > 0.5) ? c0 : ((onehot.y > 0.5) ? c1 : c2);\n\n    //makes particles less uniform\n    float h = random2(fragCoord).x;\n    float v = random2(fragCoord + 17.3).y;\n\n    //push slightly toward complementary color and brightness variation\n    vec3 comp = 1.0 - base;\n    base = mix(base, comp, (h - 0.5) * 0.25 + 0.125);\n    base *= 0.85 + 0.35 * v;\n\n    return clamp(base, 0.0, 1.0);\n}\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord)\n{\n    vec2 uv = fragCoord / iResolution.xy;\n\n    if(iMouse.z > 0.0) {\n        float magnification = 10.0;\n        uv /= magnification;\n        uv += iMouse.xy / (iResolution.xy + (iResolution.xy / (magnification - 1.0)));\n    }\n\n    vec2 px = 1.0 / iResolution.xy;\n\n    //read particle at this pixel\n    vec3 c = texture(iChannel0, uv).rgb;\n\n    //check if there's a particle here\n    float occ = step(0.5, max(c.x, max(c.y, c.z)));\n\n    float g = 0.0;\n    vec3 cx;\n\n    cx = texture(iChannel0, uv + vec2(px.x,0)).rgb;\n    g += step(0.5, max(cx.x, max(cx.y, cx.z)));\n\n    cx = texture(iChannel0, uv + vec2(-px.x,0)).rgb;\n    g += step(0.5, max(cx.x, max(cx.y, cx.z)));\n\n    cx = texture(iChannel0, uv + vec2(0,px.y)).rgb;\n    g += step(0.5, max(cx.x, max(cx.y, cx.z)));\n\n    cx = texture(iChannel0, uv + vec2(0,-px.y)).rgb;\n    g += step(0.5, max(cx.x, max(cx.y, cx.z)));\n\n    g = clamp(g / 4.0, 0.0, 1.0);\n\n    //background color\n    vec3 col = vec3(0.03);\n\n    //particle color with variation\n    vec3 pcol = palette(c, fragCoord);\n\n    //draw dot\n    col = mix(col, pcol, occ);\n\n    //add glow if neighbors exist\n    col += pcol * (0.18 * g);\n\n    col = pow(col, vec3(0.92));\n\n    fragColor = vec4(col, 1.0);\n}",
				"name": "Image",
				"description": "",
				"type": "image"
			},
			{
				"outputs": [],
				"inputs": [],
				"code": "/*\nStudent number: 218179226\nAssignment2\nName: Junxi Li\nTitle: Spiral Particle Cellular Automaton\n\nGlobal parameters in BufferA:\n- Change parameters for different results:\n  advPix (motion per frame), baseBirth (particle density), rot/inw (swirl strength)\n\nDescription:\nThis system is a cellular automaton based on the particle. Each pixel is either EMPTY or contains a single “particle”.\nParticles are pushed by a spiral flow that rotates inward toward the center so the whole pattern looks like\na swirling vortex made of tiny dots.\n\nTechnical realization:\n- A  small random library for stable pseudo-random numbers (hash-based).\n- BufferA uses these random functions to decide which pixels become particles each frame.\n- Image uses random variation to make colors richer.\n\nFuture extensions:\n- Add multiple vortex centers, or make the center move over time.\n\nCredits:\nThe ideas and code I hinted and learned from came from the classlab：\nhttps://www.shadertoy.com/view/33yyzc DATT4950 lab 4 \nhttps://www.shadertoy.com/view/wXyyR3 DATT4950 forest fire variant \n\n*/\n\n\n\n#define RANDOM_SCALE vec4(.1031, .1030, .0973, .1099)\n\n//random Functions: return repeatable pseudo random values from input.\nvec2 random2(float p) {\n    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec2 random2(vec2 p) {\n    vec3 p3 = fract(p.xyx * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec2 random2(vec3 p3) {\n    p3 = fract(p3 * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec3 random3(float p) {\n    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xxy + p3.yzz) * p3.zyx); \n}\n\nvec3 random3(vec2 p) {\n    vec3 p3 = fract(vec3(p.xyx) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yxz + 19.19);\n    return fract((p3.xxy + p3.yzz) * p3.zyx);\n}\n\nvec3 random3(vec3 p) {\n    p = fract(p * RANDOM_SCALE.xyz);\n    p += dot(p, p.yxz + 19.19);\n    return fract((p.xxy + p.yzz) * p.zyx);\n}\n\nvec4 random4(float p) {\n    vec4 p4 = fract(p * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);   \n}\n\nvec4 random4(vec2 p) {\n    vec4 p4 = fract(p.xyxy * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec3 p) {\n    vec4 p4 = fract(p.xyzx * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec4 p4) {\n    p4 = fract(p4  * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}",
				"name": "Common",
				"description": "",
				"type": "common"
			},
			{
				"outputs": [
					{
						"channel": 0,
						"id": "4dXGR8"
					}
				],
				"inputs": [
					{
						"channel": 0,
						"type": "buffer",
						"id": "4dXGR8",
						"filepath": "/media/previz/buffer00.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "/*\nStudent number: 218179226\nAssignment2\nName: Junxi Li\nTitle: Spiral Particle Cellular Automaton\n\nBuffer A store:\n- Each pixel is either EMPTY or contains exactly one particle.\n- RGB encodes the particle type using one-hot colors:\n  (1,0,0), (0,1,0), or (0,0,1).\n- (0,0,0) means no particle here (empty).\n\nCore idea:\n1) Create a spiral flow field that rotates and pulls things toward the center.\n2) For each pixel, sample the previous frame from an “upstream” spot (uvBack),\n   so particles get carried by the flow.\n3) Turn the result back into particles (either empty or one particle)\n*/\n\n//spiral velocity: rotate around center and drift inward\nvec2 spiralVelocity(vec2 uv, float t){\n    vec2 c = vec2(0.5);\n    vec2 d = uv - c;\n    float r = length(d);\n\n    //rotation around center\n    vec2 tan = vec2(-d.y, d.x);\n    //pull toward center\n    vec2 rad = -d;\n\n    //stronger flow closer to center\n    float inv = 1.0 / (0.14 + r);\n\n    float rot = 2.2;  // rotation strength\n    float inw = 1.7;  // inward pull\n\n    //small wobble so it doesn't look too perfect\n    float wob = 0.12*sin(t*0.6) + 0.08*sin(t*1.1);\n\n    vec2 v = (rot*(1.0+wob))*tan + inw*rad;\n    v *= inv;\n\n    //cap max speed for stability\n    float L = length(v);\n    if(L > 7.0) v *= 7.0 / L;\n    return v;\n}\n\n//pick a particle type based on a mixture probability p\nvec3 pickType(vec3 p, float r){\n    float s = max(p.x + p.y + p.z, 1e-6);\n    vec3 q = p / s;\n    if(r < q.x) return vec3(1,0,0);\n    if(r < q.x + q.y) return vec3(0,1,0);\n    return vec3(0,0,1);\n}\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord)\n{\n    vec2 uv = fragCoord / iResolution.xy;\n    vec2 px = 1.0 / iResolution.xy;\n\n    //random values used for decisions this frame\n    vec4 n = random4(vec3(fragCoord.xy, iTime));\n\n    //how fast the wobble changes over time\n    float t = iTime * 0.25;\n\n    //velocity at this pixel\n    vec2 v = spiralVelocity(uv, t);\n\n    //speed control: how far particles move each frame\n    float advPix = 0.5;\n\n    //read from where the particle came from last frame\n    vec2 uvBack = uv - v * advPix * px;\n\n    //reduces tearing when advecting\n    vec2 jit = (n.yz - 0.5) * px * 0.35;\n\n    vec3 p0 = texture(iChannel0, uvBack + jit).rgb;\n    vec3 p1 = texture(iChannel0, uvBack + jit + vec2(px.x,0)).rgb;\n    vec3 p2 = texture(iChannel0, uvBack + jit + vec2(0,px.y)).rgb;\n    vec3 p3 = texture(iChannel0, uvBack + jit + vec2(px.x,px.y)).rgb;\n\n    //mixed upstream value\n    vec3 p  = (p0+p1+p2+p3) * 0.25;\n\n    // ---- Stochastic quantization: keep it as particles ----\n    //represent the probability that this pixel is occupied by a dot\n    float occ = clamp(max(p.x, max(p.y, p.z)), 0.0, 1.0);\n\n    //small boost so particles don't die out\n    occ = clamp(occ * 1.35, 0.0, 1.0);\n\n    //minimum density everywhere\n    float baseBirth = 0.02;\n    occ = max(occ, baseBirth);\n\n    //extra density near center to make vortex core visible\n    float rC = length(uv - vec2(0.5));\n    occ = max(occ, baseBirth + 0.02 * smoothstep(0.55, 0.15, rC));\n\n    //final occupied or empty decision\n    float take = step(n.x, occ);\n\n    //decide particle type:\n    //inherit from upstream mixtur, if upstream is basically empty, spawn random type\n    vec3 source = p;\n    if(source.x + source.y + source.z < 1e-4){\n        float rr = n.z;\n        source = (rr < 0.333) ? vec3(1,0,0) : (rr < 0.666 ? vec3(0,1,0) : vec3(0,0,1));\n    }\n    vec3 onehot = pickType(max(source, 0.0), n.w);\n\n    //either empty or one colored dot\n    vec3 outRGB = onehot * take;\n\n    //tiny random type flip\n    if (take > 0.5 && n.y < 0.02){\n        outRGB = pickType(vec3(1,1,1), n.z) * take;\n    }\n\n    //start sparse random particles\n    if(iFrame == 0){\n        float occ0 = step(n.x, 0.03);\n        vec3 t0 = (n.y < 0.333) ? vec3(1,0,0) : (n.y < 0.666 ? vec3(0,1,0) : vec3(0,0,1));\n        fragColor = vec4(t0 * occ0, 1.0);\n        return;\n    }\n\n    fragColor = vec4(outRGB, 1.0);\n}",
				"name": "Buffer A",
				"description": "",
				"type": "buffer"
			}
		],
		"flags": {
			"mFlagVR": false,
			"mFlagWebcam": false,
			"mFlagSoundInput": false,
			"mFlagSoundOutput": false,
			"mFlagKeyboard": false,
			"mFlagMultipass": true,
			"mFlagMusicStream": false
		},
		"info": {
			"id": "3XGfzt",
			"date": "1771982093",
			"viewed": 54,
			"name": "Spiral Particle Cellular Automaton",
			"username": "Junxi Li",
			"description": "Junxi Li 218179226",
			"likes": 6,
			"published": 1,
			"flags": 32,
			"usePreview": 0,
			"tags": [
				"a2"
			],
			"hasliked": 0,
			"parentid": "",
			"parentname": ""
		}
	},
	{
		"ver": "0.1",
		"renderpass": [
			{
				"outputs": [
					{
						"channel": 0,
						"id": "4dfGRr"
					}
				],
				"inputs": [
					{
						"channel": 0,
						"type": "buffer",
						"id": "4dXGR8",
						"filepath": "/media/previz/buffer00.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 1,
						"type": "buffer",
						"id": "XsXGR8",
						"filepath": "/media/previz/buffer01.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "/*\nSTUDENT NUMBER: 215907876\n\nASSIGNMENT NUMBER : FA/DATT4950M / GS/DIGM5950M Assignment 02\n\nNAME: PHILIP MICHALOWSKI\n\nTITLE: DANCING IN THE SMOKE - AUTOMATA\n\nINTERACTIONS: The project aims mostly to showcase how 2 systems intereact with\neach other. There is none interaction from human perspective but there are quite\na few changes to get a different results (commented code in the shader next to the optimized implementaion).\n- The smoke disapear factor can be altered - See buffer A\n- a1 and a2 rules can be uncommented - Buffer B\n- In Image bloom can have colorful smoke effects or basic black and white - Image Tab\n\nDESCRIPTION:The automata I produced aimes to show how fully\ncontinuous automata and smoke simulation can coexist and influence each other.\nThe smoke is moving around in the fluid way curling and dissapearing over time.\nThe automata produces new smoke and follows the old one's velocity map giving\ninteresting patterns and flow to the cells. In addition the neon/bloom effect\ngives interesting look of saturated colors of the velocity map colored over the\ncells. Its interesting to see 2 entities to cooperate with each other. It definitely is interesting\nto see how computer simulations work especially the fluid in depth. The work doesnt support \nany long therm behaviours - its momentary change.\n\nTECHNICAL REALIZATION : Before the continuous automata I saw different cursor\nanimation techniques with fluid simulation (https://lusion.co/). I started my\nautomata with the smoke simulation since smoke behaves quite similarly to fluid.\nSmoke is a fluid simulation in Buffer A based on 3 sources (Sebastian Lague,\nhttps://www.youtube.com/watch?v=Q78wvrQ9xsU&t=872s)(Gonkee,\nhttps://www.youtube.com/watch?v=qsYE1wMEMPA) (Graham\nWakefield,https://www.shadertoy.com/view/WcccDf). I tried Gonkee tutorial\nhowever I couldnt get the interpolation desired effect in the shader (ive got just waves on the screen). \nI went over the shadertoy and found Professor Wakefield's fluid simulation. The interpolation of\nthe previous velocities were made in a very different and simple way by sampling\nneighbours offseted by a vector. I additionally watched Lague tutorial to understand math formulas better and partially recoded math\ngradient pressure formulas to match his tutorial approach. After that fluid simulation started working correctly.\n\nThen I added automata from class (Graham\nWakefield,https://www.shadertoy.com/view/t3dfR2 )in Buffer B. In smoke Buffer A I added life cells as smoke values in the if statement \non top of the smoke simulation, similarly to perlin noize in the previous\nassignment (Philip Michalowski, https://www.shadertoy.com/view/3X3cDs). \nThe cells then produced smoke but there is no deeper intreaction on\nthe automata side. I mixed Buffer B automata life and death variables with smoke velocity to add some\ninteraction. Somewhat it changes the autmata death and birth rate but it wasnt\nquite visible. I tried to also mix delta time with smoke velocity and density and still its slightly visible but\nnot that apparent. I decided to move towards moving the cells along the smoke velocity map. \nI wanted to shift the automata central pixel orientation in neighbourhood\nto shifted coordinate based on the smokes force. Knowing that in GLSL its impossible to \nassign pixels to the other then current corrdiantes I figured that the best way to do is to sample \nfrom offseted neighbourhood just like I did in the other project where I selected vec2\n(0,2) instead of (0,1)(Philip Michalowski,https://www.shadertoy.com/view/3X3cDs) but sample from the neighbourhood shifted\nover velocity of the smoke. This way the pixel that is lets say\nempty on the former frame and have alive agent 2.5 pixels away in the left direction \n(where smokes travels perfectly on the x axis normalized vec(1,0))\nsampling from this 2.5 pixel shifted alive neighbourhood. \nThen the empty pixel will be populated instead of the middle one in the alive cell.\nTo get the direction I had to normalize the smoke xy vector\nand becaues the sampling is made on uv values I need to translate the\ncoordinates to uv texels. Because the vector will point in the smoke direction I\nwant to sample from the opposite upstream direction that why I substract from the the\nuv.\n\nThe last part was to figure out the the neon blur and particle colors based on\nthe velocity map. The velocities colors on the cells were quite straight forward. I know I had a\nvelocities mapped as xy channel and its length gives an idea how fast the smoke\nis traveling in the pixel therefore I tried couple methods (raw length, mix and\nsmoothstep) to mix the cell color of red and green over speed. Smoothstep gave\nthe best visual quality transition over the speeds. Lastly I mixed color with the\ngrayscale density values depending on life values of automata to keep both entities. It gives the\ncolor values not only from the velocity map but also smoke density therefore despite\ninteresting effect it doesnt give accuarate velocity map results.\n\nFor the bloom I had to do the research about that and I found this blog post\n(David Lettier,\nhttps://lettier.github.io/3d-game-shaders-for-beginners/bloom.html). It gave me\naccurate formula to create a simple bloom and after the adjustemnt to rely of the\nlife.x values and adding it to the cellColor rather then entire fragColor mix to\navoid smoke bloom everything worked well.\n\nFUTURE EXTENSIONS: It would be very interesting to see some cursor enagagement\nwith automata and fluid simulation. Maybe something related to cursor speed\ninteracting with smoke so that automata can survive- kinda like micro organisms\nsimulation Definitely 3D implementation would be intresting to see where fluid\nis beign created by automata.\n*/\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord)\n\n{\n  vec2 uv = fragCoord / iResolution.xy;\n  // Smoke vector\n  vec4 smoke = texture(iChannel0, uv);  \n  // Automata vector\n  vec4 life = texture(iChannel1, uv);   \n\n  // Take the smoothstep of the velocy vector length\n  // It produces the valus between 0 and 1\n  // The velocity values arent very high therefore length has to be multiplied\n  // to crete a meaningful transition rather then all green \n  // Mix also works but produces sharp transitions \n  // float speed = mix(0.0, 1.0,(length(smoke.xy) * 20000.0));\n  float speed = smoothstep(0.0, 1.0, (length(smoke.xy) * 20000.0));\n\n  // The length here works well however the colors were a little off so i\n  // desided to firstly mix it based on the trehshold and then used smoothstep\n  // to make the transition softer\n  // vec3 cellCol = mix(vec3(0,1,0), vec3(1,0,0), length(smoke.xy) * 20000.0);\n  // Its interesting because it visualizes the velocity map when pluged into\n  // fragColor\n  vec3 cellColor = mix(vec3(0, 1, 0), vec3(1, 0, 0), speed);\n\n  // I mix the texture of smoke with color made of velocities based on the life\n  // values. If there is life then show life texture color and when there is no\n  // life show smoke. The color is dilluted with smoke grey based on the cell\n  // life however it doesnt affect the overall looks it just creates more\n  // vibrant and less vibrant colors (with bloom effect barely noticible)\n  vec3 base = mix(vec3(smoke.w), cellColor, life.x);\n\n  // Below - Bloom\n  // Taken from David Lettier\n  // https://lettier.github.io/3d-game-shaders-for-beginners/bloom.html\n\n  // Size - amount of blur\n  int size = 4;\n  // Separation - blur spread\n  float separation = 1.5;\n  // Threshold - controls the pixels contrubuting to blur\n  float threshold = .35;\n  // Amount - blur output amount\n  float amount = 2.5;\n\n  // Sum and count of pixels in the size - similar to the neighbouring pixels\n  // counting\n  float sum = 0.0;\n  float count = 0.0;\n\n  // Traverse throuh blur size\n  for (int i = -size; i <= size; i++) {\n    for (int j = -size; j <= size; j++) {\n      // Take the texture pixels from life automata time separation over\n      // resolution since life has values in channel x I dont need to convert\n      // values to greyscale to discard it in the treshhold if statement\n      float value = texture(iChannel1,\n                       (fragCoord + vec2(i, j) * separation) / iResolution.xy)\n                    .x;\n\n      // Do not contribute pixels values below the treshhold\n      if (value < threshold) value = 0.0;\n\n      // Add together the b values (life.x with offset) per tutorial\n      sum += value;\n      // Count number of iterations\n      count += 1.0;\n    }\n  }\n\n  // Apply the bloom as per tutorial but over cellColor so the smoke is not\n  // affected\n  vec3 bloom = cellColor * ((sum / count) * amount);\n  \n  // Black and white smoke bloom\n  // vec3 bloom = smoke.aaa * ((sum / count) * amount);\n\n  // Other version of bloom where smoke is affected or it creates smoke effect\n  // vec3 bloom = cellCol * ((sum / count) + amount);\n  // vec3 bloom = cellCol + ((sum / count) * amount);\n\n  fragColor = vec4(base + bloom, 1.0);\n\n  // When bloom produced with smoke vec3\n  // fragColor = vec4(  bloom , 1.0);\n  // fragColor = vec4(smoke.aaaa);\n}",
				"name": "Image",
				"description": "",
				"type": "image"
			},
			{
				"outputs": [],
				"inputs": [],
				"code": "//  Taken from Lecture Slides\n//  Graham Wakefield\n//  https://alicelab.world/digm5950/glsl.html#randomnoise\n\n#define RANDOM_SCALE vec4(.1031, .1030, .0973, .1099)\n\nfloat random(vec2 st) {\n  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);\n}\n\nvec2 random2(float p) {\n  vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);\n  p3 += dot(p3, p3.yzx + 19.19);\n  return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec2 random2(vec2 p) {\n  vec3 p3 = fract(p.xyx * RANDOM_SCALE.xyz);\n  p3 += dot(p3, p3.yzx + 19.19);\n  return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec2 random2(vec3 p3) {\n  p3 = fract(p3 * RANDOM_SCALE.xyz);\n  p3 += dot(p3, p3.yzx + 19.19);\n  return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec3 random3(float p) {\n  vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);\n  p3 += dot(p3, p3.yzx + 19.19);\n  return fract((p3.xxy + p3.yzz) * p3.zyx);\n}\n\nvec3 random3(vec2 p) {\n  vec3 p3 = fract(vec3(p.xyx) * RANDOM_SCALE.xyz);\n  p3 += dot(p3, p3.yxz + 19.19);\n  return fract((p3.xxy + p3.yzz) * p3.zyx);\n}\n\nvec3 random3(vec3 p) {\n  p = fract(p * RANDOM_SCALE.xyz);\n  p += dot(p, p.yxz + 19.19);\n  return fract((p.xxy + p.yzz) * p.zyx);\n}\n\nvec4 random4(float p) {\n  vec4 p4 = fract(p * RANDOM_SCALE);\n  p4 += dot(p4, p4.wzxy + 19.19);\n  return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec2 p) {\n  vec4 p4 = fract(p.xyxy * RANDOM_SCALE);\n  p4 += dot(p4, p4.wzxy + 19.19);\n  return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec3 p) {\n  vec4 p4 = fract(p.xyzx * RANDOM_SCALE);\n  p4 += dot(p4, p4.wzxy + 19.19);\n  return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec4 p4) {\n  p4 = fract(p4 * RANDOM_SCALE);\n  p4 += dot(p4, p4.wzxy + 19.19);\n  return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\n//  Taken from Lecture Shader\n//  Graham Wakefield\n//  https://www.shadertoy.com/view/t3dfR2\nfloat sigmoid(float x, float center, float width) {\n  return 1.0 / (1.0 + exp(-(x - center) * 4.0 / width));\n}",
				"name": "Common",
				"description": "",
				"type": "common"
			},
			{
				"outputs": [
					{
						"channel": 0,
						"id": "4dXGR8"
					}
				],
				"inputs": [
					{
						"channel": 0,
						"type": "buffer",
						"id": "4dXGR8",
						"filepath": "/media/previz/buffer00.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 1,
						"type": "buffer",
						"id": "XsXGR8",
						"filepath": "/media/previz/buffer01.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "// SMOKE BUFFER\n\n/*\n Previously I tried with this code based on the this youtube tutorial\n Gonkee\n https://www.youtube.com/watch?v=qsYE1wMEMPA&t=51s\n\n\nvec2 f = fragCoord - C.rg * dt;\n    f = clamp(f, vec2(0.0), iResolution.xy - vec2(2.0));\n    vec2 i = floor(f);\n    vec2 j = fract(f);\n\n    vec4 iO = texture(iChannel0,(i+vec2(0.0,0.0))/iResolution.xy);\n    vec4 iE = texture(iChannel0, (i+vec2(1.0,0.0))/iResolution.xy);\n    vec4 iN = texture(iChannel0, (i+vec2(0.0,1.0))/iResolution.xy);\n    vec4 iNE = texture(iChannel0, (i+vec2(1.0,1.0))/iResolution.xy);\n\n      //Get the NSWE coordinates\n    vec4 N = texture(iChannel0, (fragCoord+vec2(0.0,1.0))/iResolution.xy);\n    vec4 S = texture(iChannel0, (fragCoord+vec2(0.0,-1.0))/iResolution.xy);\n    vec4 W = texture(iChannel0, (fragCoord+vec2(-1.0,0.0))/iResolution.xy);\n    vec4 E = texture(iChannel0, (fragCoord+vec2(1.0,0.0))/iResolution.xy);\n\n    float z1 = mix (iO.b,iE.b,j.x);\n    float z2 = mix (iN.b,iNE.b,j.x);\n    float zt = mix (z1,z2,j.y);\n\nIt didnt give the smoke effect just a random noize therefore I moved to other solution\n*/\n\n// Interpolation Taken From\n// Graham Wakefield\n// https://www.shadertoy.com/view/WcccDf\n\n// Interpolated coordinate looking back in previous velocities\n// I figured more times you interpolate faster the smoke effect moves\nvec2 prev_coord(vec2 coord, float dt) {\n  coord -= texture(iChannel0, coord).xy * dt;\n  coord -= texture(iChannel0, coord).xy * dt;\n  coord -= texture(iChannel0, coord).xy * dt;\n  coord -= texture(iChannel0, coord).xy * dt;\n  coord -= texture(iChannel0, coord).xy * dt;\n  coord -= texture(iChannel0, coord).xy * dt;\n  coord -= texture(iChannel0, coord).xy * dt;\n  coord -= texture(iChannel0, coord).xy * dt;\n  coord -= texture(iChannel0, coord).xy * dt;\n  coord -= texture(iChannel0, coord).xy * dt;\n  coord -= texture(iChannel0, coord).xy * dt;\n  coord -= texture(iChannel0, coord).xy * dt;\n  coord -= texture(iChannel0, coord).xy * dt;\n  coord -= texture(iChannel0, coord).xy * dt;\n  coord -= texture(iChannel0, coord).xy * dt;\n  coord -= texture(iChannel0, coord).xy * dt;\n  coord -= texture(iChannel0, coord).xy * dt;\n  coord -= texture(iChannel0, coord).xy * dt;\n  coord -= texture(iChannel0, coord).xy * dt;\n  coord -= texture(iChannel0, coord).xy * dt;\n  return coord;\n}\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n\n  // Texel code\n  // Graham Wakefield\n  // https://www.shadertoy.com/view/WcccDf\n  vec2 oneTexel = 1.0 / iResolution.xy;\n  vec2 uv = fragCoord / iResolution.xy;\n\n  // Added flexible dt value\n  // In the interpolation formula the previous frame is offset by the vector * DT\n  float dt = 1.0;\n\n  // Take Automata Values\n  // It gives the x channel of life\n  float life = texture(iChannel1, uv).x;\n\n\n  // Modified From Smoke Shader\n  // Graham Wakefield\n  // https://www.shadertoy.com/view/WcccDf\n  // Take the previous neighbouring pixel values.\n  vec4 me = texture(iChannel0, prev_coord(uv, dt));\n  vec4 E = texture(iChannel0, prev_coord(uv + vec2(1, 0) * oneTexel, dt));\n  vec4 W = texture(iChannel0, prev_coord(uv - vec2(1, 0) * oneTexel, dt));\n  vec4 N = texture(iChannel0, prev_coord(uv + vec2(0, 1) * oneTexel, dt));\n  vec4 S = texture(iChannel0, prev_coord(uv - vec2(0, 1) * oneTexel, dt));\n\n  /* DOESNT MAKE A DIFFERENCE IN EFFECT\n  Learned and coded from Gonkee\n  https://www.youtube.com/watch?v=qsYE1wMEMPA&t=51s\n  I tried to make it work because on the Graham Wakefield\n  shader there was a average taken - in the other approach it not applicable\n    // Average\n    // Diffusion\n    float k = 1.0;\n    float average = (N.b+S.b+W.b+E.b)/2.0;\n    float current = (me.b + k * average);\n    float density = current/(1.0 + k);\n\n    me.b = density;\n  */\n\n\n  // Divergence, Pressure and Gradient Pressure Learned and Adjusted from Sebastian Lague\n  // https://www.youtube.com/watch?v=Q78wvrQ9xsU\n  // and\n  // Gonkee\n  // https://www.youtube.com/watch?v=qsYE1wMEMPA&t=51s\n\n  // Divergence - calculates how much of the fluid is spreading\n  // or sucking based on the x and y velocity of neighbour pixels.\n  float divergenceX = E.x - W.x;\n  float divergenceY = N.y - S.y;\n  float divergence = (divergenceX + divergenceY) / 2.0;\n\n  // Calculate Pressure based on divergence and add it to the b channel\n  // Its called pressure solver on the other youtube video (Sebastian Lague, https://www.youtube.com/watch?v=Q78wvrQ9xsU)\n  // that neutralizes the pressure to cancel out the divergence\n  float pressure = ((W.b + E.b + S.b + N.b) - divergence) / 4.0;\n  me.b = pressure;\n\n  // Gradient Pressure - Calculates which neighbour pixel has the higher\n  // pressure and subtract it as velocity to the xy channels so flow moves from\n  // high pressure to low pressure\n  vec2 gradientPressure = vec2((E.b - W.b) / 2.0, (N.b - S.b) / 2.0);\n  // The xy channel as a velocity values\n  me.xy -= gradientPressure;\n\n  // Boundaries Taken From\n  // Graham Wakefield\n  // https://www.shadertoy.com/view/WcccDf\n  // Adds 0 speed on the boundaries eg resolution of the screen creating a\n  // swirling effect on the edges It was fun to witness when the whole screen is\n  // covered in smoke, the whole smoke density was moving upwards in the bouncy\n  // way illustrating the connections in the pressure field between pressure and\n  // movement speed\n  if (fragCoord.x < 1. || fragCoord.y < 1. ||\n      fragCoord.x > iResolution.x - 1. || fragCoord.y > iResolution.y - 1.) {\n    me.xy = vec2(0);\n  }\n\n  // Based on the previous noise created in the yeast automata (Philip Michalowski, https://www.shadertoy.com/view/3X3cDs) I figured\n  // I can spawn smoke in the location of continuous automata\n  if (life > 0.55) {\n    // Add smoke in the life position - alpha channel illustrates smoke density\n    me.w = life;\n    // I also wanted to stop smoke so that the swirls can go around the cells\n    // but it stops the smoke propagation - Also probably because the birth and death depends on\n    // the fluid speed If the fluid is repelled by cells then there is no speed therefore no\n    // spawn or death\n    //  me.xy = vec2(0);\n  }\n\n  // Gravity Taken From\n  // Graham Wakefield\n  // https://www.shadertoy.com/view/WcccDf\n\n  // Adds a little drag to the y speed so that fluid is going down and its\n  // dependant on smoke density More smoke more pull. This value is optimal -\n  // higher value makes smoke to merge too fast and it creates blobs and lower\n  // just stalls smoke to perform as system\n  me.y -= 0.0000002 * me.w;\n\n  // I also wanted to introduce some smoke diffusion/dilute effect - it will dissapear over\n  // time so that swirls and pressure field can have some space for new smoke\n  // produced by the automata cells - its interesting to play with the values\n  // There is a never ending smoke when commented. When the values is higher\n  // the cells has that ghost feeling. and when 0.002 the smoke is balanced so\n  // that cells produce a good amount to keep it going and swirling but not\n  // overwhealming\n\n  // tail effect\n  //  me.w -= 0.02;\n\n  // optimized smoke\n  me.w -= 0.002;\n\n  fragColor = me;\n}",
				"name": "Buffer A",
				"description": "",
				"type": "buffer"
			},
			{
				"outputs": [
					{
						"channel": 0,
						"id": "XsXGR8"
					}
				],
				"inputs": [
					{
						"channel": 0,
						"type": "buffer",
						"id": "XsXGR8",
						"filepath": "/media/previz/buffer01.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 1,
						"type": "buffer",
						"id": "4dXGR8",
						"filepath": "/media/previz/buffer00.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "// AUTOMATA BUFFER\n\n// Modified Fully Continuous Automata Taken From Lecture Shader\n// Graham Wakefield\n// https://www.shadertoy.com/view/t3dfR2\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n  // Uv coordinates\n  vec2 uv = fragCoord / iResolution.xy;\n  // Previous State of Automata\n  vec4 A = texture(iChannel0, uv);\n  // Smoke state to get velocity values\n  vec4 smoke = texture(iChannel1, uv);\n\n  // Inner and Outer radius of the circles\n  float outer_radius = 8.0;\n  float inner_radius = 3.;\n\n  // Values of the life and death\n  // I wanted to make the life and death conditions dependent on the smoke velocity\n  // I mix the values previously provided based on the smoke y velocity\n  float b1 = mix(0.245, 0.45, smoke.y);\n  float b2 = b1 + 0.08;\n\n  float d1 = mix(0.365, 0.45, smoke.y);\n  float d2 = d1 + 0.18;\n\n  // sigmoid transition widths (alpha)\n  // I tried to adjust widths and mix it with smoke density however I feel its\n  // more aesthetically when automata cells are somewhat separated rather than\n  // clumped together this way the smoke distribution works better\n  \n  float a1 = 0.028;\n  float a2 = 0.15;\n  // float a1 = mix(0.015, 0.020, smoke.a);\n  // float a2 = mix(0.010, 0.015, smoke.a);\n  // Mix of cell speed based on the smoke x velocity\n  float dt = mix(0.35, 0.4, smoke.x);  // between .2 and .4\n\n  // sum up all the pixels in the outer & inner radius:\n  float inner_sum = 0.0;\n  float outer_sum = 0.0;\n  for (float x = -outer_radius; x <= outer_radius; x++) {\n    for (float y = -outer_radius; y <= outer_radius; y++) {\n      vec2 pixel = vec2(x, y);\n      vec2 texel = pixel / iResolution.xy;\n\n      // I wanted to make automata to move to the smoke direction.\n      // I normalized the smoke velocity to get only the direction of movement\n      // and then\n      // translate that shift over 2.5 pixel in the uv coordinate\n      // This will create a shift vector that will allow to offset the sampling\n      // per the smoke velocity\n      vec2 shift = normalize(smoke.xy) * (2.5 / iResolution.xy);\n\n      // Assigned offset will sample from previous frame pixel but not from the\n      // neighbourhood around the pixel but offset via the smoke vector\n      // position \n      // Empty pixel will scan neighbourhood 2.5 pixels away in the opposite to smoke direction \n      // (subtract the shift vector rather than add) and fill itself when it has the alive agent there.\n\n      float life = texture(iChannel0, uv + texel - shift).x;\n\n      // exclude this pixel, if it is too far away\n      float dist = length(pixel);\n      float outer_w = 1.0 - sigmoid(dist, outer_radius, 1.);\n      outer_sum += life * outer_w;\n      float inner_w = 1.0 - sigmoid(dist, inner_radius, 1.);\n      inner_sum += life * inner_w;\n    }\n  }\n\n  // Rest is the same as the Continuous Automata\n  // Graham Wakefield\n  // https://www.shadertoy.com/view/t3dfR2\n\n  // Calculation of the inner radius area PI * R ^ 2\n  float inner_area = 3.14159 * inner_radius * inner_radius;\n  // Calculation of inner area density based on the pixel sum (pixels over the\n  // area)\n  float inner_density = inner_sum / inner_area;\n\n  // Calculation of the outer area PI * R ^ 2\n  float outer_area = 3.14159 * outer_radius * outer_radius;\n  // Calculation of the outer area - its a big area - small area to get only the\n  // outer ring\n  float outer_density = (outer_sum - inner_sum) / (outer_area - inner_area);\n\n  // Cellular automata rules based on sigmoid probability for survival\n  float notlonely = sigmoid(outer_density, d1, a1);\n  float notcrowded = 1.0 - sigmoid(outer_density, d2, a1);\n  float survive = notlonely * notcrowded;\n\n  // Cellular automata birth rules based on sigmoid probability\n  float enough = sigmoid(outer_density, b1, a1);\n  float nottoomuch = 1.0 - sigmoid(outer_density, b2, a1);\n  float birth = enough * nottoomuch;  // logical AND\n\n  // Liveness is inner life density\n  float liveness = sigmoid(inner_density, 0.5, a2);\n  // Based on the inside of the radius density make transition between birth and survive\n  float transition = mix(birth, survive, liveness);\n\n  // convert to a -1..+1 direction:\n  float change = transition * 2.0 - 1.0;\n  // apply change gradually:\n  A.x += dt * change;\n\n  // safety:\n  A = clamp(A, 0.0, 1.0);\n\n  // initialize:\n  if (iFrame == 0) {\n    A = random4(vec3(fragCoord, iFrame)).xxxx;\n  }\n  if (iFrame == 1) {\n    if (A.x < 0.8) {\n      A = vec4(0.);\n    }\n  }\n\n  fragColor = A;\n}",
				"name": "Buffer B",
				"description": "",
				"type": "buffer"
			}
		],
		"flags": {
			"mFlagVR": false,
			"mFlagWebcam": false,
			"mFlagSoundInput": false,
			"mFlagSoundOutput": false,
			"mFlagKeyboard": false,
			"mFlagMultipass": true,
			"mFlagMusicStream": false
		},
		"info": {
			"id": "W3yfDh",
			"date": "1771882205",
			"viewed": 82,
			"name": "Dancing in the Smoke",
			"username": "Philip Michalowski",
			"description": "Smoke + Automata",
			"likes": 7,
			"published": 1,
			"flags": 32,
			"usePreview": 0,
			"tags": [
				"fluidsimulation"
			],
			"hasliked": 0,
			"parentid": "tXtBRB",
			"parentname": "Fork Fluid Simu ajemphilip 317"
		}
	},
	{
		"ver": "0.1",
		"renderpass": [
			{
				"outputs": [
					{
						"channel": 0,
						"id": "4dfGRr"
					}
				],
				"inputs": [
					{
						"channel": 0,
						"type": "buffer",
						"id": "4dXGR8",
						"filepath": "/media/previz/buffer00.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 1,
						"type": "buffer",
						"id": "XsXGR8",
						"filepath": "/media/previz/buffer01.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 2,
						"type": "buffer",
						"id": "4sXGR8",
						"filepath": "/media/previz/buffer02.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "/*\nSTUDENT NUMBER: 215907876\n\nASSIGNMENT NUMBER : FA/DATT4950M / GS/DIGM5950M Assignment 03\n\nNAME: PHILIP MICHALOWSKI\n\nTITLE: OVERGROWN\n\nINTERACTIONS: The shader mostly illustrates particles and Ising automata\ncollaborative potential. There is no interaction to be made by human however\nthere are quite a few possible modifications\n- speed modifications on the particle side\n- modification of uv values and timing in the automata buffer\n- modification of self state in the automata buffer\n- rotation matrix in common to get more unexpected particle turns\n- different buffer outputs in the image buffer\n\nDESCRIPTION: Overgrown - Modified Lecture Particle system (Wakefield,\nhttps://www.shadertoy.com/view/7ff3RX) and Ising cellular automata model\n(Wakefield, https://www.shadertoy.com/view/33yyzc) aim to show an ability how\ntwo systems can modify each other with the states creating generative textures\nbased on their internal states and randomness. The particle system follows the\nprobability map of the Ising model morphed by the perlin noise (Gustavson,\nhttps://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83). The automata\nbased on the timing records random values of the wandering particles saved in\nthe texture and use it to create a new generated by the particles probability\nfield. This cycle of generative texture loops over.\n\nIt's definitely interesting to see the particle, perlin noise and automata\ninteractions. Each phase the particles wander around the static probability\nfield and then are being sucked by the perlin noise field to once again get on\nthe probability field tracks. Then the random overgrowth happens and the\nparticles form a new probability field by randomly wandering around. When I was\ndoing this work it was resembling a blood vessels in the leaf (new way to create\na heart tissue)(National Geographic, https://www.youtube.com/watch?v=x4KS6NyFo3Y) \nThe growth is similar to some of the plant growth timelapses that I was watching \nbefore the project (timelapselop, https://www.youtube.com/shorts/6rr6xd9-Ad4). \nThe system doesn't create a long term behaviour but rather generative texture \nwithin the 32 seconds phase. Despite that the effect is quite different after the initial phase.\n\nTECHNICAL REALIZATION : I started with the particle shader (Wakefield,\nhttps://www.shadertoy.com/view/7ff3RX) and I tried to modify speed, turn\nparameters and particle generation code to understand how it works. After\nunderstanding how particles are being attracted to colors on the textures, I\nused the lecture Ising cellular automata (Wakefield,\nhttps://www.shadertoy.com/view/33yyzc) because it seemed to be interesting when\nit creates a green probability path between the patches of red values combined\nwith temperature. Same as the circle on the particles lecture shader\n(Wakefield, https://www.shadertoy.com/view/7ff3RX) I tried to attract the\nparticle to perlin noise emphasized probability as a morph the temperature\nparameter result and stretch of the red channel boundaries. This created a nice\neffect but the particles didn't have any result on the automata system and follow\nthe perlin generated map.\n\nTo address that I created a phase period when the particles are wandering over 8\nseconds and they are attracted to probability field for 24 seconds. In the grown\nperiod the automata gets the values from the particle trail buffer and saves it\nto create a new pattern in the red channel. Then that pattern morphed by the\nperlin noise and used as a density attractor field.\n\nWhat didn't work is - I tried to create a perlin noise attraction based on the\nparticles forces. I tried to reduce the speed of the particle based on the noise\nto cluster them together. I tried to count particles in the region to attract\nmore particles to that spot but none of those worked - so I stuck to the\nperlin noise.\n\nFUTURE EXTENSIONS: It would be interesting to see the particles density based on\nthe regional count to replace perlin noise. I believe that it's interesting to\neliminate all of the external forces and use what we have in the system. Also\nother idea is to adjust the system so that particles behave more fluid like so they\nfollow the trails to the noise - like being sucked in to the external force and\nthen released. It's easily achievable with perlin but using the particles system\nforce and its attraction is quite a challenge as well as a good idea for the\nfuture.\n\n*/\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n  vec2 uv = fragCoord / iResolution.xy;\n  // Particle Control\n  vec4 A = texture(iChannel0, uv);\n  // Particle Traces\n  vec4 B = texture(iChannel1, uv);\n  // Ising Automata\n  vec4 C = texture(iChannel2, uv);\n\n  // Output to screen\n  // Multiplication by 0.15 of the automata channel gives nice transparency\n  // and give room for particle to show its movement\n  fragColor = 0.15 * C * B;\n  // Another variant with stronger colors\n  // fragColor = 0.15*C*0.15*C*B;\n  // To check how the probability field changes\n  // fragColor = C;\n}",
				"name": "Image",
				"description": "",
				"type": "image"
			},
			{
				"outputs": [
					{
						"channel": 0,
						"id": "4dXGR8"
					}
				],
				"inputs": [
					{
						"channel": 0,
						"type": "buffer",
						"id": "4dXGR8",
						"filepath": "/media/previz/buffer00.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 1,
						"type": "buffer",
						"id": "4sXGR8",
						"filepath": "/media/previz/buffer02.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 2,
						"type": "buffer",
						"id": "XsXGR8",
						"filepath": "/media/previz/buffer01.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "// BUFFER TO CONTROL PARTICLE POSITIONS\n\n// Modified From Particle Shader from the\n// Graham Wakefield\n// https://www.shadertoy.com/view/7ff3RX\n\n// Track particles distances between pixel and distances between particles to\n// return which is closer\nvec4 trackParticles(vec4 currentPixel, vec2 coordinates, vec2 offset) {\n  // Get the particle neighbour\n  vec4 neighbour = texture(iChannel0, (coordinates + offset) / iResolution.xy);\n\n  // Calculated distances between pixel coordinate and particle location\n  float distanceA = distance(coordinates, currentPixel.xy);\n  float distanceB = distance(coordinates, neighbour.xy);\n\n  // Check which particle is closer\n  if (distanceB > distanceA) {\n    return currentPixel;\n  } else {\n    return neighbour;\n  }\n}\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n  vec2 uv = fragCoord / iResolution.xy;\n\n  // Get the previous state of the particles\n  vec4 A = texture(iChannel0, uv);\n  vec4 B = texture(iChannel2, uv);\n\n  // Loop to see what particles are the closest to the follower pixel\n  for (int i = -3; i < 3; i++) {\n    for (int j = -3; j < 3; j++) {\n      A = trackParticles(A, fragCoord, vec2(i, j));\n    }\n  }\n\n  // Initialize the noise based on the particle coordinates\n  vec4 noise = random4(vec3(A.xy, iTime));\n\n  // Particles parameters initialization\n  float speed = 50.;\n  float turn = 0.;\n  float wander = 0.8;\n  float turnfactor = 0.5;\n\n  // Length of the particle sensing\n  float sensor_length = 10.;\n  // float sensor_length = 20.;\n\n  // Set up our antennae:\n  mat2 rot = rotate2d(A.z);\n  vec2 sensor0 = vec2(1, 0) * sensor_length;\n  vec2 sensor1 = vec2(1, 1) * sensor_length;\n  vec2 sensor2 = vec2(1, -1) * sensor_length;\n  vec2 sensor0_in_world = rot * sensor0 + A.xy;\n  vec2 sensor1_in_world = rot * sensor1 + A.xy;\n  vec2 sensor2_in_world = rot * sensor2 + A.xy;\n\n  // Get the trail field where our antennae are:\n  vec4 F = texture(iChannel1, sensor0_in_world / iResolution.xy);\n  vec4 FL = texture(iChannel1, sensor1_in_world / iResolution.xy);\n  vec4 FR = texture(iChannel1, sensor2_in_world / iResolution.xy);\n\n  // Get the phase of the particle movement based on the 32. seconds interval\n  float phase = mod(iTime, 32.0);\n\n  // When mod >= 24 (8 seconds)turn the particles into the wandering mode\n  // This mode writes into the CA buffer to create generative random probability\n  // The wandering of the particles goes into the random directions giving the\n  // growth simulated effect\n  if (phase >= 24.0) {\n    // Wander randomly into the noise direction\n    A.z += wander * (noise.z - 0.5);\n    // Slower Speed gives better growth effect\n    speed = 25.;\n    // speed = 45.;\n    //  Higer turn factor gives more wandering effect\n    turnfactor = 0.5;\n  }\n  // For a longer time (24 seconds) follow the density field of the probability from the\n  // Ising automata buffer and attached to it perlin noise\n  else {\n    // Faster speed of automata gives faster patch tracking effect as well as\n    // follow perlin noise outbreaks better\n    speed = 80.;\n    // speed = 20.;\n    //  Lower turn factor gives more controll to the particles to follow the\n    //  probability field\n    turnfactor = 0.1;\n\n    // If Middle Antenae sensing the strongest signal from the probability field\n    if (F.g > FL.g && F.g > FR.g) {\n    }\n    // If Middle Antenae is sensing lower then left and right antenae signal\n    // wander randomly\n    else if (F.g < FL.g && F.g < FR.g) {\n      A.z += wander * (noise.z - 0.5);\n    }\n    // If right antenae is sensing stronger signal then turn\n    else if (FL.g < FR.g) {\n      A.z += turnfactor;\n    }\n    // If left antenae is sensing stronger signal then turn the other way\n    else if (FR.g < FL.g) {\n      A.z -= turnfactor;\n    }\n  }\n\n  // Move the particle\n  // Get the xy velocity from the A.z direction\n  rot = rotate2d(A.z);\n\n  // Polar to cartesian\n  vec2 vel = rot * vec2(speed, 0);\n\n  // Integrate velocity to position\n  A.xy += vel * iTimeDelta;\n\n  // Get the bounded position within the screen image\n  vec2 b = clamp(A.xy, vec2(0), iResolution.xy);\n\n  // Compare the bounded and actual positions -- if they are different, reflect\n  if (A.x != b.x) {\n    A.z = TWOPI * 0.5 - A.z;\n  }\n  // Reflect in Y axis\n  if (A.y != b.y) {\n    A.z = TWOPI - A.z;\n  }\n  // Reflect in X axis\n  A.xy = b.xy;\n\n  // Initialize the particle grid\n  if (iFrame == 0) {\n    // Create a grid system for each particle - 15px for each particle\n    // vec2 grid = round(fragCoord / 20.) * 20.;\n    // vec2 grid = round(fragCoord / 50.) * 50.;\n    vec2 grid = round(fragCoord / 15.) * 15.;\n    // Save XY in the red and green channel\n    A.xy = grid;\n    // Save rotation in the blue channel\n    A.z = noise.x * TWOPI;\n  }\n\n  fragColor = vec4(A);\n}",
				"name": "Buffer A",
				"description": "",
				"type": "buffer"
			},
			{
				"outputs": [],
				"inputs": [],
				"code": "// Rotation Matrix taken from class\n// Graham Wakefield\n// https://www.shadertoy.com/view/7ff3RX\n\nmat2 rotate2d(float angle) {\n    float s = sin(angle);\n    float c = cos(angle);\n    /*return mat2(\n        -c, -s, \n        -s, -c\n    ); */ \n     return mat2(\n        c, -s, \n        s, c\n    ); \n}\n\n//\tClassic Perlin 2D Noise \n//\tby Stefan Gustavson\n//  https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83\n\nvec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }\nvec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }\nvec3 fade(vec3 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }\n\nfloat cnoise(vec3 P)\n{\n    vec3 Pi0 = floor(P); // Integer part for indexing\n    vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1\n    Pi0 = mod(Pi0, 289.0);\n    Pi1 = mod(Pi1, 289.0);\n    vec3 Pf0 = fract(P); // Fractional part for interpolation\n    vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0\n    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);\n    vec4 iy = vec4(Pi0.yy, Pi1.yy);\n    vec4 iz0 = Pi0.zzzz;\n    vec4 iz1 = Pi1.zzzz;\n\n    vec4 ixy = permute(permute(ix) + iy);\n    vec4 ixy0 = permute(ixy + iz0);\n    vec4 ixy1 = permute(ixy + iz1);\n\n    vec4 gx0 = ixy0 / 7.0;\n    vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;\n    gx0 = fract(gx0);\n    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);\n    vec4 sz0 = step(gz0, vec4(0.0));\n    gx0 -= sz0 * (step(0.0, gx0) - 0.5);\n    gy0 -= sz0 * (step(0.0, gy0) - 0.5);\n\n    vec4 gx1 = ixy1 / 7.0;\n    vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;\n    gx1 = fract(gx1);\n    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);\n    vec4 sz1 = step(gz1, vec4(0.0));\n    gx1 -= sz1 * (step(0.0, gx1) - 0.5);\n    gy1 -= sz1 * (step(0.0, gy1) - 0.5);\n\n    vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);\n    vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);\n    vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);\n    vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);\n    vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);\n    vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);\n    vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);\n    vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);\n\n    vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));\n    g000 *= norm0.x;\n    g010 *= norm0.y;\n    g100 *= norm0.z;\n    g110 *= norm0.w;\n    vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));\n    g001 *= norm1.x;\n    g011 *= norm1.y;\n    g101 *= norm1.z;\n    g111 *= norm1.w;\n\n    float n000 = dot(g000, Pf0);\n    float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));\n    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));\n    float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));\n    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));\n    float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));\n    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));\n    float n111 = dot(g111, Pf1);\n\n    vec3 fade_xyz = fade(Pf0);\n    vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);\n    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);\n    float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); \n    \n    return 2.2 * n_xyz;\n}\n\n//  Taken from Lecture Slides\n//  Graham Wakefield\n//  https://alicelab.world/digm5950/glsl.html#randomnoise\n\nfloat TWOPI = 6.28318530718;\n#define RANDOM_SCALE vec4(.1031, .1030, .0973, .1099)\n\nvec2 random2(float p) {\n    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec2 random2(vec2 p) {\n    vec3 p3 = fract(p.xyx * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec2 random2(vec3 p3) {\n    p3 = fract(p3 * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec3 random3(float p) {\n    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xxy + p3.yzz) * p3.zyx); \n}\n\nvec3 random3(vec2 p) {\n    vec3 p3 = fract(vec3(p.xyx) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yxz + 19.19);\n    return fract((p3.xxy + p3.yzz) * p3.zyx);\n}\n\nvec3 random3(vec3 p) {\n    p = fract(p * RANDOM_SCALE.xyz);\n    p += dot(p, p.yxz + 19.19);\n    return fract((p.xxy + p.yzz) * p.zyx);\n}\n\nvec4 random4(float p) {\n    vec4 p4 = fract(p * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);   \n}\n\nvec4 random4(vec2 p) {\n    vec4 p4 = fract(p.xyxy * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec3 p) {\n    vec4 p4 = fract(p.xyzx * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec4 p4) {\n    p4 = fract(p4  * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}",
				"name": "Common",
				"description": "",
				"type": "common"
			},
			{
				"outputs": [
					{
						"channel": 0,
						"id": "XsXGR8"
					}
				],
				"inputs": [
					{
						"channel": 0,
						"type": "buffer",
						"id": "4dXGR8",
						"filepath": "/media/previz/buffer00.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 1,
						"type": "buffer",
						"id": "XsXGR8",
						"filepath": "/media/previz/buffer01.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "// PARTICLE TRAILS BUFFER\n\n// Slightly Modified From Lecture\n// Graham Wakefield\n// https://www.shadertoy.com/view/7ff3RX\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n  vec2 uv = fragCoord / iResolution.xy;\n\n  // Get the paticle channel with the positions\n  vec4 A = texture(iChannel0, uv);\n\n  // Get the saved copy of the previous frame of particle trails\n  vec4 B = texture(iChannel1, uv);\n\n  // Distance between the pixel coordinate and the particle\n  float dist = distance(fragCoord, A.xy);\n  // Create particles - the step with the 1./dist works too\n  float particles = step(0.99, 1. / dist);\n\n  // Accumulate particle trails so the tails are visible\n  B += particles;\n\n  // Reduce the intensity of the trails so they can dissapear after some time\n  // 0.989 decay factor works the best to keep particle tail visible but \n  // doesn't overwhelm the canvas with it\n  B *= 0.989;\n  fragColor = B;\n}",
				"name": "Buffer B",
				"description": "",
				"type": "buffer"
			},
			{
				"outputs": [
					{
						"channel": 0,
						"id": "4sXGR8"
					}
				],
				"inputs": [
					{
						"channel": 0,
						"type": "buffer",
						"id": "4sXGR8",
						"filepath": "/media/previz/buffer02.png",
						"sampler": {
							"filter": "nearest",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 1,
						"type": "buffer",
						"id": "4dXGR8",
						"filepath": "/media/previz/buffer00.png",
						"sampler": {
							"filter": "nearest",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 2,
						"type": "buffer",
						"id": "XsXGR8",
						"filepath": "/media/previz/buffer01.png",
						"sampler": {
							"filter": "nearest",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "// ISING AUTOMATA\n\n// Modified From Lecture\n// Graham Wakefield\n// https://www.shadertoy.com/view/33yyzc\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n  vec2 uv = fragCoord / iResolution.xy;\n\n  // Get the Particle Possitions Channel\n  vec4 A = texture(iChannel1, uv);\n  // Get the Particle Trails Channel\n  vec4 B = texture(iChannel2, uv);\n\n  // Get self state\n  vec4 C = texture(iChannel0, (fragCoord + vec2(0, 0)) / iResolution.xy);\n  // vec4 C = texture(iChannel0, (A.xy + vec2(0, 0)) / iResolution.xy);\n\n  // Get state of all neighbour pixels:\n  vec4 E = texture(iChannel0, (fragCoord + vec2(1, 0)) / iResolution.xy);\n  vec4 W = texture(iChannel0, (fragCoord + vec2(-1, 0)) / iResolution.xy);\n  vec4 N = texture(iChannel0, (fragCoord + vec2(0, 1)) / iResolution.xy);\n  vec4 S = texture(iChannel0, (fragCoord + vec2(0, -1)) / iResolution.xy);\n  vec4 NE = texture(iChannel0, (fragCoord + vec2(1, 1)) / iResolution.xy);\n  vec4 NW = texture(iChannel0, (fragCoord + vec2(-1, 1)) / iResolution.xy);\n  vec4 SE = texture(iChannel0, (fragCoord + vec2(1, -1)) / iResolution.xy);\n  vec4 SW = texture(iChannel0, (fragCoord + vec2(-1, -1)) / iResolution.xy);\n\n  // Put all of my neighbor states into an array:\n  float near[8] = float[8](N.r, S.r, E.r, W.r, NW.r, NE.r, SW.r, SE.r);\n\n  // How many of my neighbours have different states:\n  int different_states = int(C.r != N.r) + int(C.r != S.r) + int(C.r != E.r) +\n                         int(C.r != W.r) + int(C.r != NE.r) + int(C.r != NW.r) +\n                         int(C.r != SE.r) + int(C.r != SW.r);\n\n  // Initialize the random noise. Time is slowed down so the changes are more subtle\n  vec4 noise = random4(vec3(fragCoord, iTime / 3.));\n\n  // Calculate different average state of the particle\n  float different = float(different_states) / 8.0;\n\n  // Mix the value of the uv and noise so that the perlin noise will switch\n  // between random values of noise and perlin patches - to ensure that the\n  // process is repetitive I use cos and slow down the time - Initially I wanted\n  // to make cos in the 0-1 range however I tested couple other values and this\n  // pattern (0.1 for time to get -0.4 to 0.6 range) seems to amplify the perlin and random noise effect combination\n  // I also multiply uv and noise by 6 to create more points on the perlin noise\n  // rather then one big patch\n  vec2 mixedValue = mix(uv * 6., noise.xy * 6., cos(iTime * 0.1) * 0.5 + 0.1);\n  // vec2 mixedValue = mix(uv * 2., noise.xy * 2., cos(iTime ) * 0.5 + 0.5);\n\n  // Slowed down perlin noise\n  float perlin = cnoise(vec3(mixedValue, iTime / 3.));\n\n  // Get the perlin noise as temperature so that the probability field is\n  // stronger where the noise occurs. Perlin multiplied by 2 create a stronger\n  // attraction field for the particles\n  float temperature = abs(perlin * 2.);\n\n  // Probability of me changing state\n  // Increases if more neighbours are different AND/OR temperature is high\n  // 0.8 seemed like a sweet spot - lower I adjusted the value the probability field \n  // was more dense giving this boring monocolor effect\n  float probability = pow(different, 0.8 / temperature);\n\n  // Flip the state according to the state - same as the particle to maintain\n  // the effect similarity\n  float phase = mod(iTime, 32.0);\n\n  // If noise is smaller then probability\n  if (noise.x < probability) {\n    // When time phase is lesser or equal to 24 draw the state of the particles\n    // from perlin noise so that the base red field of the automata stretches\n    // according to perlin noise\n    if (phase <= 24.0) {\n      int which = int(abs(perlin) * 8.);\n      // C.r /= near[which];\n      C.r = near[which];\n    }\n    // Otherwise get the particle system trails going into the random directions\n    // to create a newly generated red field and probability pattern\n    else {\n      C.r = B.x;\n    }\n  }\n\n  // initialize on the 1st frame:\n  if (iFrame == 0) {\n    C.r = noise.x;\n  }\n\n  // Accumulate the probability - Its easier for the particles to track the\n  // probability field when it accumulates. Amplified by perlin noise to make\n  // the particles move more vividly across the field\n  C.g += probability * abs(perlin);\n  // Perlin based temperature\n  C.b = temperature;\n  // Multiply the probability so that the values create a form of gradient\n  // 0.97 attracts the particles well and the probability field doesn't dissapear too fast\n  C.g *= 0.97;\n\n  fragColor = C;\n}",
				"name": "Buffer C",
				"description": "",
				"type": "buffer"
			}
		],
		"flags": {
			"mFlagVR": false,
			"mFlagWebcam": false,
			"mFlagSoundInput": false,
			"mFlagSoundOutput": false,
			"mFlagKeyboard": false,
			"mFlagMultipass": true,
			"mFlagMusicStream": false
		},
		"info": {
			"id": "7fBGWh",
			"date": "1774133905",
			"viewed": 90,
			"name": "Overgrown",
			"username": "Philip Michalowski",
			"description": "Overgrown Project - Ising model CA + Particles System",
			"likes": 3,
			"published": 1,
			"flags": 32,
			"usePreview": 0,
			"tags": [
				"particles"
			],
			"hasliked": 0,
			"parentid": "ffS3RD",
			"parentname": "Fork ParticlesT ajemphilip 027"
		}
	},
	{
		"ver": "0.1",
		"renderpass": [
			{
				"outputs": [
					{
						"channel": 0,
						"id": "4dfGRr"
					}
				],
				"inputs": [
					{
						"channel": 0,
						"type": "buffer",
						"id": "4dXGR8",
						"filepath": "/media/previz/buffer00.png",
						"sampler": {
							"filter": "nearest",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 1,
						"type": "buffer",
						"id": "XsXGR8",
						"filepath": "/media/previz/buffer01.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 2,
						"type": "buffer",
						"id": "4sXGR8",
						"filepath": "/media/previz/buffer02.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 3,
						"type": "buffer",
						"id": "XdfGR8",
						"filepath": "/media/previz/buffer03.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "/*\nStudent Number: 219461854\n\nAssignment Number: A3\n\nYour Name: Robin Tarnocai\n\n**Title**: Wall of Fire\n\n**Interactions**\nThe main interaction this project supports is clicking to trigger group 2 of agents to eat. By clicking \nand holding the left mouse button the second group of agents (the gray ones without a trail) will eat the \nfire that is moving across the screen. To get it to do this automatically without the need for mouse input,\nuncomment the section between lines 50-58 in Buffer C which has this occur periodically for a fixed amount \nof time. \n\n**Description**\nThe idea I had that led to this system was the interaction of two groups of agents. I made one group that\nhas antennae and chases fire and eats the fire slowly when it touches it, and a second group of agents that\nare attracted to the agents in the first group via changes in smell on each subsequent frame.The fire \nunderneath is a bar of orange that moves down the screen and fades out very slowly. The agents in the \nsecond group, while not attracted to the fire directly, eat the fire at a much quicker rate than the first\ngroup of agents. I was hoping to implement a more conditional cellular automata as opposed to a \nconsistently changing environment. Long term, the behaviour remains fairly similar. Without interaction\nor the automatic feeding enabled, the fire takes over the screen and the agents struggle to eat through it.\nOtherwise, the agents consistently eat away the fire and it replenishes itself. One note about \nfunctionality is that when you leave the page and return to it, the amount of agents seems to diminish.\n\n**Sources**\nI referenced Lab materials primarily from weeks 1, 8 and 9. \nhttps://www.shadertoy.com/view/7fl3zH , Lab 8 by Graham Wakefield\nhttps://www.shadertoy.com/view/tcVfW3 , Lab 1 by Graham Wakefield\nhttps://www.shadertoy.com/view/7fl3zH , Lab 9 by Graham Wakefield\n\n**Technical Realization**\nThe regeneration and edges of the fire are influenced by a gaussian blur that is applied to all eight of \nits neighbours. The movement across the screen is inspired by the game of life variation applied in lab 2\nwhere the concentration of noise increases across a sine wave variation. Here, the probability of noise \ninfluences the replication of the cellular automata and the gradual decay affects its destruction. Before\ngetting to this version, I started with the circle movement from Lab 8. Then I tried randomizing the\nmovement pattern, but that offered few opportunities for the agents to successfully converge on their \ntargets, resulting in a more disjointed appearance in the final product. The slower movement of a larger\ntarget is inherently simpler, but produces a more visually interesting aesthetic.\nA future extension I would love to implement would be improving the unpredictability of the cellular\nautomata underneath as I described above.\n\n*/\n\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord ) {\n    vec2 uv = (fragCoord / iResolution.xy);\n\n    \n    /*\n    // zoom in\n    if (iMouse.z > 0.0) {\n        float magnification = 6.;\n        uv /= magnification;\n        uv += iMouse.xy / ((iResolution.xy + (iResolution.xy / (magnification - 1.0))));\n    }\n    */\n    \n    // get our cell\n    vec4 A = texture(iChannel0, uv);\n    vec4 B = texture(iChannel1, uv);\n    vec4 C = texture(iChannel2, uv);\n    vec4 D = texture(iChannel3, uv);\n    \n    // get distance from this pixel to the particle it is tracking for group 1\n    float d1 = distance(uv * iResolution.xy, A.xy);\n    // get distance from this pixel to the particle it is tracking for group 2\n    float d2 = distance(uv * iResolution.xy, D.xy);\n    \n    // rendering of agents in group 1\n    float p1 = smoothstep(2., 0., d1);\n    // rendering of agents in group 2\n    float p2 = smoothstep(2., 0., d2);\n    \n    \n    // fire: add to canvas\n    fragColor = C * vec4(1, 0.5, 0, 0);\n    // trails: add to canvas\n    fragColor += B * vec4(1, 0.5, 1, 0.5);\n    // agents group 1: add to canvas\n    fragColor += vec4(p1) * vec4(1, 0.5, 1, 0.5);\n    // agents group 2: add to canvaas\n    fragColor += vec4(p2) * vec4(0.2, 0.2, 0.2, 0.2);\n   \n}",
				"name": "Image",
				"description": "",
				"type": "image"
			},
			{
				"outputs": [],
				"inputs": [],
				"code": "const float TWOPI = 6.283185307179586;\n\n// create a 2D rotation matrix from an angle in radians:\nmat2 rotate2d(float angle) {\n    float s = sin(angle);\n    float c = cos(angle);\n    return mat2(\n        c, -s, // cos(2), -sin(2)\n        s, c   // sin(2), cos(2)\n    );\n}\n\n// make a sigmoid transition of x around center with given width\nfloat sigmoid(float x, float center, float width) {\n    return 1.0 / (1.0 + exp(-(x-center)*4.0/width));\n}\n\n\n// Gaussian blur\nvec4 blur(sampler2D img, vec2 fragCoord, vec2 resolution, int N, vec2 dir) {\n    // N/2 .. N/4\n    float sigma = float(N)/3.14;   \n    float expFactor = -0.5/(sigma*sigma);\n    float weight = 1.;\n    vec4 sum = texture(img, fragCoord/resolution) * weight;\n    float weightSum = weight;\n    for (int i=1; i<=N; i++) {\n        vec2 offset = float(i) * dir;\n        float weight = exp(float(i*i) * expFactor);\n        sum += texture(img, (fragCoord + offset)/resolution) * weight;\n        sum += texture(img, (fragCoord - offset)/resolution) * weight;\n        weightSum += weight * 2.0;\n    \n    }\n    return sum / weightSum;\n}\n\n\n\n\n#define RANDOM_SCALE vec4(.1031, .1030, .0973, .1099)\n\nvec2 random2(float p) {\n    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec2 random2(vec2 p) {\n    vec3 p3 = fract(p.xyx * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec2 random2(vec3 p3) {\n    p3 = fract(p3 * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec3 random3(float p) {\n    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xxy + p3.yzz) * p3.zyx); \n}\n\nvec3 random3(vec2 p) {\n    vec3 p3 = fract(vec3(p.xyx) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yxz + 19.19);\n    return fract((p3.xxy + p3.yzz) * p3.zyx);\n}\n\nvec3 random3(vec3 p) {\n    p = fract(p * RANDOM_SCALE.xyz);\n    p += dot(p, p.yxz + 19.19);\n    return fract((p.xxy + p.yzz) * p.zyx);\n}\n\nvec4 random4(float p) {\n    vec4 p4 = fract(p * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);   \n}\n\nvec4 random4(vec2 p) {\n    vec4 p4 = fract(p.xyxy * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec3 p) {\n    vec4 p4 = fract(p.xyzx * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec4 p4) {\n    p4 = fract(p4  * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}",
				"name": "Common",
				"description": "",
				"type": "common"
			},
			{
				"outputs": [
					{
						"channel": 0,
						"id": "4dXGR8"
					}
				],
				"inputs": [
					{
						"channel": 0,
						"type": "buffer",
						"id": "4dXGR8",
						"filepath": "/media/previz/buffer00.png",
						"sampler": {
							"filter": "nearest",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 2,
						"type": "buffer",
						"id": "4sXGR8",
						"filepath": "/media/previz/buffer02.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "// BUFFER A: Group 1 of agents\n// each pixel tracks an agent\n// .xy is the agent location (in pixels)\n// .z is the agent direction (in radians)\n// .w is the agent's memory\n\n// given current particle \"A\" at pixel `fragCoord`\n// is the particle at `fragCoord+offset` nearer? if so return that.\nvec4 getNearestParticle(vec4 A, vec2 fragCoord, vec2 offset) {\n    // get by neighbour pixel\n    vec4 N = texture(iChannel0, (fragCoord+offset)/iResolution.xy);\n    // distance from my pixel to the particle I'm tracking:\n    float d1 = distance(fragCoord, A.xy);\n    // distance from my pixel to the particle my neighbor is tracking:\n    float d2 = distance(fragCoord, N.xy);\n    // if my neighbor's particle is nearer, track that instead! \n    if (d2 < d1) { return N; } else { return A; }\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord) {\n    // convert pixel coordinate to normalize texture coord\n    vec2 uv = fragCoord / iResolution.xy;\n    // our previous state\n    vec4 A = texture(iChannel0, uv);\n    \n    // make sure we are tracking the nearest particle by testing\n    // each of our nearest pixels to see if their particle is nearer\n    for (int x=-2; x<=2; x++) {\n        for (int y=-2; y<=2; y++) {\n            A = getNearestParticle(A, fragCoord, vec2(x, y));\n        }\n    }\n    \n    // set initial speed, direction and sensor length\n    float speed = 50.;\n    float turn = 0.;\n    float sensorLength = 12.;\n    \n    mat2 rot = rotate2d(A.z);\n    vec2 sensor0 = vec2(1, 0) * sensorLength;\n    vec2 sensor1 = vec2(1, 1) * sensorLength;\n    vec2 sensor2 = vec2(1, -1) * sensorLength;\n    vec2 sensor0InWorld = rot * sensor0 + A.xy; //apply rotation to the sensor and add that to our agent's location\n    vec2 sensor1InWorld = rot * sensor1 + A.xy;\n    vec2 sensor2InWorld = rot * sensor2 + A.xy;\n    \n    // get trail field where the antennae are\n    vec4 F = texture(iChannel2, sensor0InWorld / iResolution.xy);\n    vec4 FL = texture(iChannel2, sensor1InWorld / iResolution.xy);\n    vec4 FR = texture(iChannel2, sensor2InWorld / iResolution.xy);\n    \n    // make noise\n    vec4 noise = random4(vec3(A.xy, iTime));\n\n    // make trails AND follow those trails\n    if (F.x > FL.x && F.x > FR.x) {\n        // no change to heading\n        \n    } else if (F.x < FL.x && F.x < FR.x) {\n        // rotate randomly left or right\n        A.z += (noise.z - 0.5); // only get noise values between -0.5 -> 0.5 (same num above and below 0 to balance)\n    } else if (FL.x < FR.x) {\n        // rotate right\n        A.z += 1.;\n    } else if (FR.x < FL.x) {\n        // rotate left\n        A.z -= 1.;\n    }\n\n    // Apply the turn\n    A.z += turn; // * (noise.x*2. - 1.);\n    \n    // move the particle to the location determined by the velocity (gotten from A.z direction)\n    // convert polar to cartesian coordinates\n    vec2 vel = rot * vec2(speed, 0);\n    \n    // integrate velocity with position\n    A.xy += vel * iTimeDelta;\n    \n    // get the bounded position within the screen image\n    vec2 b = clamp(A.xy, vec2(0), iResolution.xy);\n    // compare the bounded and actual positions; if they are different reflect their orientations\n    if (A.x != b.x) { A.z = TWOPI*0.5 - A.z; } // reflect in Y axis\n    if (A.y != b.y) { A.z = TWOPI - A.z; } // reflect in X axis\n    // clamp the position on screen\n    A.xy = b.xy; \n    \n    \n    // initialize:\n    if (iFrame == 0) {\n        //A.xy = iResolution.xy * noise.xy;\n        // every pixel in a NxN square is tracking the same particle\n        // round the position to the nearest \"N\"\n        float N = 30.;\n        A.xy = round(fragCoord/N) * N;\n        // we have to seed the random generator using the particle's\n        // location, not the pixel location, so that all pixels agree\n        vec4 noise = random4(vec3(A.xy, iFrame));\n                \n        // set the direction of the agents\n        A.z = noise.z * TWOPI;\n    }\n    \n    fragColor = A;\n}",
				"name": "Buffer A",
				"description": "",
				"type": "buffer"
			},
			{
				"outputs": [
					{
						"channel": 0,
						"id": "XsXGR8"
					}
				],
				"inputs": [
					{
						"channel": 0,
						"type": "buffer",
						"id": "4dXGR8",
						"filepath": "/media/previz/buffer00.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 1,
						"type": "buffer",
						"id": "XsXGR8",
						"filepath": "/media/previz/buffer01.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 2,
						"type": "buffer",
						"id": "XdfGR8",
						"filepath": "/media/previz/buffer03.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "// BUFFER B: Trails of all agents\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord ) {\n    // convert pixel coordinate to normalize texture coordinate\n    vec2 uv = fragCoord / iResolution.xy;\n    \n    // our previous state\n    vec4 A = texture(iChannel0, uv); // the particles\n    vec4 B = texture(iChannel1, uv); // the trails\n    \n    \n    // decay:\n    B *= 0.98;\n       \n    // get distance from this pixel to the particle it is tracking:\n    float d = distance(fragCoord, A.xy);\n    // draw the particle\n    float p = smoothstep(1., 0., d);\n    \n    \n    B += vec4(p);\n    \n    fragColor = B;\n}",
				"name": "Buffer B",
				"description": "",
				"type": "buffer"
			},
			{
				"outputs": [
					{
						"channel": 0,
						"id": "4sXGR8"
					}
				],
				"inputs": [
					{
						"channel": 0,
						"type": "buffer",
						"id": "4dXGR8",
						"filepath": "/media/previz/buffer00.png",
						"sampler": {
							"filter": "linear",
							"wrap": "repeat",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 1,
						"type": "buffer",
						"id": "XdfGR8",
						"filepath": "/media/previz/buffer03.png",
						"sampler": {
							"filter": "linear",
							"wrap": "repeat",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 2,
						"type": "buffer",
						"id": "4sXGR8",
						"filepath": "/media/previz/buffer02.png",
						"sampler": {
							"filter": "linear",
							"wrap": "repeat",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "// BUFFER C: Field of Fire\n\nmat3 gaussBlur = mat3(\n        1, 2, 1,\n        2, 4, 2,\n        1, 2, 1\n    ) * 1.0/16.0;\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord ) {\n    vec2 uv = (fragCoord / iResolution.xy);\n    \n    vec4 C = texture(iChannel2, uv); // the previous frame\n    \n    // gaussian blurred previous frame:\n    vec4 N = texture(iChannel2, (fragCoord + vec2(0, 1))/iResolution.xy);\n    vec4 S = texture(iChannel2, (fragCoord + vec2(0, -1))/iResolution.xy);\n    vec4 E = texture(iChannel2, (fragCoord + vec2(1, 0))/iResolution.xy);\n    vec4 W = texture(iChannel2, (fragCoord + vec2(-1, 0))/iResolution.xy);\n    vec4 NE = texture(iChannel2, (fragCoord + vec2(1, 1))/iResolution.xy);\n    vec4 SE = texture(iChannel2, (fragCoord + vec2(1, -1))/iResolution.xy);\n    vec4 NW = texture(iChannel2, (fragCoord + vec2(-1, 1))/iResolution.xy);\n    vec4 SW = texture(iChannel2, (fragCoord + vec2(-1, -1))/iResolution.xy);\n    \n    // apply the blur to the neighbourhood\n    C = ((NE+SE+NW+SW) + 2.*(N+E+S+W) + 4.*C)/16.;\n    \n    vec4 noise = random4(vec3(fragCoord, iTime));\n\n    // am I being eaten?\n    vec4 A = texture(iChannel0, uv); // the closest agent from group 1\n    vec4 D = texture(iChannel1, uv); // the closest agent from group 2\n    float distToAgent1 = distance(A.xy, fragCoord); // distance to agents in group 1\n    float distToAgent2 = distance(D.xy, fragCoord); // distance to agents in grroup 2\n    \n    // if an agent from group 1 is close to the food\n    if (distToAgent1 < 1.) { \n        // decay some food around the agent to simulate it being eaten\n        C *= 0.5; // lower value = more eaten\n        \n    }\n    \n    // probability that the agents will start eating\n    float probability = 0.1;\n    \n    // if an agent from group 2 is close to the food and the mouse is pressed\n    if (iMouse.z > 0.0 && distToAgent2 < 1.) {\n        // decay the food around the agent to simulate it being eaten\n        C *= 0.15;\n    }\n\n    /*\n    // make it eat every every few seconds\n    float timer = mod(iTime, 6.0);     \n    if (timer > 3.0) {\n        if (distToAgent2 < 1.) {\n            C *= 0.15;\n        }\n    }\n    */\n    \n    // background noise\n    C += 0.1*(noise.z - 0.5);\n\n    // move the wall across the screen\n    if (noise.w < 0.1 *pow(abs(sin(iTime * 0.1 + uv.y*2.)), 50.)) { \n        C += vec4(0.5); // move down the screen according to iTime\n    }\n\n    // keep it in the range of 0.-> 1.:\n    C = clamp(C, 0., 1.5);\n    \n    fragColor = C * (0, 0, 0, 1.);\n}",
				"name": "Buffer C",
				"description": "",
				"type": "buffer"
			},
			{
				"outputs": [
					{
						"channel": 0,
						"id": "XdfGR8"
					}
				],
				"inputs": [
					{
						"channel": 0,
						"type": "buffer",
						"id": "XdfGR8",
						"filepath": "/media/previz/buffer03.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 1,
						"type": "buffer",
						"id": "4dXGR8",
						"filepath": "/media/previz/buffer00.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 2,
						"type": "buffer",
						"id": "4sXGR8",
						"filepath": "/media/previz/buffer02.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 3,
						"type": "buffer",
						"id": "XsXGR8",
						"filepath": "/media/previz/buffer01.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "// BUFFER D: Group 2 of agents\n\n// each pixel tracks an agent\n// .xy is the agent location (in pixels)\n// .z is the agent direction (in radians)\n// .w is the agent's memory\n\n// D is group 2 of agents They chase the agents from group 1 in Buffer A\n\n// given current particle \"A\" at pixel `fragCoord`\n// is the particle at `fragCoord+offset` nearer? if so return that.\nvec4 getNearestParticle(vec4 A, vec2 fragCoord, vec2 offset) {\n    // get by neighbour pixel\n    vec4 N = texture(iChannel0, (fragCoord+offset)/iResolution.xy);\n    // distance from my pixel to the particle I'm tracking:\n    float d1 = distance(fragCoord, A.xy);\n    // distance from my pixel to the particle my neighbor is tracking:\n    float d2 = distance(fragCoord, N.xy);\n    // if my neighbor's particle is nearer, track that instead! \n    if (d2 < d1) { return N; } else { return A; }\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord) {\n    // convert pixel coordinate to normalize texture coord\n    vec2 uv = fragCoord / iResolution.xy;\n    \n    // our previous states\n    vec4 D = texture(iChannel0, uv);\n    \n    // See which pixel is closest to each agent\n    for (int x=-2; x<=2; x++) {\n        for (int y=-2; y<=2; y++) {\n            D = getNearestParticle(D, fragCoord, vec2(x, y));\n        }\n    }\n       \n    // set initial speed and direction\n    float speed = 700.;\n    float turn = 0.;\n    \n    // sense the agents in buffer A:\n    vec4 B = texture(iChannel1, D.xy / iResolution.xy);\n    float smell = B.g;\n    \n    // compare the current smell to my memory of the smell from the last frame\n    float memory = D.w;\n    \n    // is my life getting better?\n    if (smell > memory) {\n        // if the smell here is better than the previous frame, keep going straight and go really slow\n        turn = 0.01;\n        speed = 3.;\n    } else {\n        // if the smell is not better, try another direction and move really quickly\n        turn = 1.;\n        speed = 100.; \n    }\n    \n    // Apply the turn at a pseudorandom angle\n    vec4 noise = random4(vec3(D.xy, iTime));\n    D.z += turn * (noise.x*2. - 1.);\n    \n    // move the particle to the location determined by the velocity (gotten from A.z direction)\n    // convert polar to cartesian coordinates\n    vec2 vel = vec2(cos(D.z), sin(D.z)) * speed;\n    \n    // integrate velocity with position\n    D.xy += vel * iTimeDelta;\n    \n    // get the bounded position within the screen image\n    vec2 b = clamp(D.xy, vec2(0), iResolution.xy);\n    // compare the bounded and actual positions; if they are different reflect their orientations\n    if (D.x != b.x) { D.z = TWOPI*0.5 - D.z; } // reflect in Y axis\n    if (D.y != b.y) { D.z = TWOPI - D.z; } // reflect in X axis\n    // clamp the position on screen\n    D.xy = b.xy; \n    \n    // log current smell to compare to the smell in the next frame\n    D.w = smell;\n    \n    // initialize\n    if (iFrame == 0) {\n        // every pixel in a NxN square is tracking the same particle\n        // round the position to the nearest \"N\"\n        float N = 8.;\n        D.xy = round(fragCoord/N) * N;\n        // we have to seed the random generator using the particle's\n        // location, not the pixel location, so that all pixels agree\n        vec4 noise = random4(vec3(D.xy, iFrame));\n                \n        // set the direction of the agents\n        D.z = noise.z * TWOPI;\n    }\n    \n    fragColor = D;\n}",
				"name": "Buffer D",
				"description": "",
				"type": "buffer"
			}
		],
		"flags": {
			"mFlagVR": false,
			"mFlagWebcam": false,
			"mFlagSoundInput": false,
			"mFlagSoundOutput": false,
			"mFlagKeyboard": false,
			"mFlagMultipass": true,
			"mFlagMusicStream": false
		},
		"info": {
			"id": "fc2GRw",
			"date": "1773863762",
			"viewed": 48,
			"name": "Wall of Fire",
			"username": "Robin Tarnocai",
			"description": "interactions between 2 multi-agent systems and a simple cellular automata",
			"likes": 5,
			"published": 1,
			"flags": 32,
			"usePreview": 0,
			"tags": [
				"datt4950"
			],
			"hasliked": 0,
			"parentid": "7cBGRW",
			"parentname": "A3.9"
		}
	},
	{
		"ver": "0.1",
		"renderpass": [
			{
				"outputs": [
					{
						"channel": 0,
						"id": "4dfGRr"
					}
				],
				"inputs": [
					{
						"channel": 0,
						"type": "buffer",
						"id": "4dXGR8",
						"filepath": "/media/previz/buffer00.png",
						"sampler": {
							"filter": "nearest",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 1,
						"type": "buffer",
						"id": "XsXGR8",
						"filepath": "/media/previz/buffer01.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "// Rotation matrix\nmat2 rot(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a)); }\n\n// Fractal Space Folding: Generating Extremely Complex Patterns\nvec2 getFractalUV(vec2 uv) {\n    uv = (uv - 0.5) * 2.0;\n    uv.x *= iResolution.x / iResolution.y;\n    \n    // Iterative Folding (IFS)\n    for(int i = 0; i < 5; i++) {\n        uv = abs(uv); // mirror\n        if (uv.x < uv.y) uv = uv.yx; // Diagonal flip\n        uv *= 1.5; // zoom in\n        uv -= vec2(0.5, 0.8); // Offset\n        uv *= rot(0.2 + iTime * 0.02); // Rotate slowly\n    }\n    return uv;\n}\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 baseUV = fragCoord / iResolution.xy;\n    \n    if (iMouse.z > 0.) {\n        float mag = 10.;\n        baseUV /= mag;\n        baseUV += iMouse.xy / ((iResolution.xy + (iResolution.xy / (mag - 1.))));\n    }\n    \n    \n    // 1. Obtain the extremely complex kaleidoscope coordinates\n    vec2 uv = getFractalUV(baseUV);\n    \n    // 2. Sampling a particle field\n    vec4 A = texture(iChannel0, mod(uv * 0.1, 1.0));\n  //  float d = distance(uv * 50.0, A.xy * 0.1);\n    float d = distance(uv, A.xy/iResolution.xy);\n    \n    // 3. Texture Detail Layer\n    // Domain-warped noise, creating a fibrous texture\n    float f = abs(sin(uv.x * 5.0 + iTime)) * abs(cos(uv.y * 5.0));\n    float wave = sin(length(uv) * 10.0 - iTime * 3.0);\n    \n    // 4. Precise color schemes\n    vec3 colBlue = vec3(0.0, 0.5, 1.0); // Electric blue\n    vec3 colGold = vec3(1.0, 0.6, 0.1); // Gold\n    vec3 colBlack = vec3(0.02, 0.01, 0.05);\n    \n    // 5. Color blending logic\n    // Alternate colors based on spatial position and particle identity\n    float colorMixer = smoothstep(-1.0, 1.0, sin(uv.x + uv.y + iTime));\n    vec3 baseCol = mix(colGold, colBlue, colorMixer * A.w);\n    \n    // Overlay dynamic light field\n    float glow = exp(-d);\n    vec3 finalCol = mix(colBlack, baseCol, glow * (0.5 + 0.5 * f));\n    \n    // Increase the electric blue core pulse\n    float pulse = pow(glow, 4.0);\n    finalCol += colBlue * pulse * 2.0;\n    \n    // Add details to the edges of the gold and fire\n    float edge = smoothstep(0.4, 0.5, f);\n    finalCol += colGold * edge * glow;\n\n    // 6. Black outline (stained glass effect)\n    float lines = smoothstep(0.0, 0.05, abs(uv.x * uv.y));\n    finalCol *= mix(0.2, 1.0, lines);\n\n    // Increase contrast in post-processing\n    finalCol = pow(finalCol, vec3(1.1)) * 1.5;\n    // Very slight vignetting, maintaining a full-screen look\n    finalCol *= smoothstep(2.0, 0.5, length(baseUV - 0.5));\n\n\n\n    fragColor = vec4(finalCol, 1.0);\n}",
				"name": "Image",
				"description": "",
				"type": "image"
			},
			{
				"outputs": [],
				"inputs": [],
				"code": "// Thanks for Dr. Graham Wakefield's help for fixing some bugs.\n\nconst float TWOPI = 6.283185307179586;\n\nvec4 hash4(vec2 p) {\n    vec4 p4 = fract(p.xyxy * vec4(.1031, .1030, .0973, .1099));\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\n\n// make a sigmoid transition of x around center with given width\nfloat sigmoid(float x, float center, float width) {\n    return 1.0 / (1.0 + exp(-(x-center)*4.0/width));\n}\n\n\n// Gaussian blur\nvec4 blur(sampler2D img, vec2 fragCoord, vec2 resolution, int N, vec2 dir) {\n    // N/2 .. N/4\n    float sigma = float(N)/3.14;   \n    float expFactor = -0.5/(sigma*sigma);\n    float weight = 1.;\n    vec4 sum = texture(img, fragCoord/resolution) * weight;\n    float weightSum = weight;\n    for (int i=1; i<=N; i++) {\n        vec2 offset = float(i) * dir;\n        float weight = exp(float(i*i) * expFactor);\n        sum += texture(img, (fragCoord + offset)/resolution) * weight;\n        sum += texture(img, (fragCoord - offset)/resolution) * weight;\n        weightSum += weight * 2.0;\n    \n    }\n    return sum / weightSum;\n}\n\n\n#define RANDOM_SCALE vec4(.1031, .1030, .0973, .1099)\n\nvec2 random2(float p) {\n    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec2 random2(vec2 p) {\n    vec3 p3 = fract(p.xyx * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec2 random2(vec3 p3) {\n    p3 = fract(p3 * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec3 random3(float p) {\n    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xxy + p3.yzz) * p3.zyx); \n}\n\nvec3 random3(vec2 p) {\n    vec3 p3 = fract(vec3(p.xyx) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yxz + 19.19);\n    return fract((p3.xxy + p3.yzz) * p3.zyx);\n}\n\nvec3 random3(vec3 p) {\n    p = fract(p * RANDOM_SCALE.xyz);\n    p += dot(p, p.yxz + 19.19);\n    return fract((p.xxy + p.yzz) * p.zyx);\n}\n\nvec4 random4(float p) {\n    vec4 p4 = fract(p * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);   \n}\n\nvec4 random4(vec2 p) {\n    vec4 p4 = fract(p.xyxy * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec3 p) {\n    vec4 p4 = fract(p.xyzx * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec4 p4) {\n    p4 = fract(p4  * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}",
				"name": "Common",
				"description": "",
				"type": "common"
			},
			{
				"outputs": [
					{
						"channel": 0,
						"id": "4dXGR8"
					}
				],
				"inputs": [
					{
						"channel": 0,
						"type": "buffer",
						"id": "4dXGR8",
						"filepath": "/media/previz/buffer00.png",
						"sampler": {
							"filter": "nearest",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 1,
						"type": "buffer",
						"id": "XsXGR8",
						"filepath": "/media/previz/buffer01.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "// Generate a high-density cluster of dynamic energy points\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy;\n    vec4 A = texture(iChannel0, uv);\n    \n    if (iFrame < 5 || length(A.xy) < 0.1) {\n        float gridSize = 20.0; // A very dense grid to ensure the screen is completely filled\n        A.xy = (floor(fragCoord / gridSize) + 0.5) * gridSize;\n        A.z = fract(sin(dot(A.xy, vec2(12.9, 78.2))) * 437.5) * 6.28;\n        A.w = fract(sin(A.z) * 123.4);\n    }\n    \n    // Search for the nearest particle \n    for (int x = -1; x <= 1; x++) {\n        for (int y = -1; y <= 1; y++) {\n            vec4 N = texture(iChannel0, (fragCoord + vec2(x,y)*4.0) / iResolution.xy);\n            if (distance(fragCoord, N.xy) < distance(fragCoord, A.xy)) A = N;\n        }\n    }\n    \n    // [Fluid Motion Logic]\n    // 1. Read the “fractal wind direction” at the current particle's position from Buffer B\n    vec2 fieldVelocity = texture(iChannel1, A.xy / iResolution.xy).xy;\n    \n    // 2. Combine the original basic motion with fractal field motion\n    vec2 baseMotion = vec2(cos(A.z + iTime*0.3), sin(A.z + iTime*0.3)) * 10.0; // Reduce the intensity of the basic exercises\n    A.xy += (baseMotion + fieldVelocity) * iTimeDelta; \n    \n    A.xy = mod(A.xy, iResolution.xy); // Loop coordinates, never go black\n    A.xy = clamp(A.xy, vec2(0), iResolution.xy);\n    \n    fragColor = A;\n}",
				"name": "Buffer A",
				"description": "",
				"type": "buffer"
			},
			{
				"outputs": [
					{
						"channel": 0,
						"id": "XsXGR8"
					}
				],
				"inputs": [
					{
						"channel": 0,
						"type": "buffer",
						"id": "4dXGR8",
						"filepath": "/media/previz/buffer00.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 1,
						"type": "buffer",
						"id": "XsXGR8",
						"filepath": "/media/previz/buffer01.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "// Reuse the rotation matrix from your Image\nmat2 rot(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a)); }\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy;\n    vec2 p = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n    \n    // Generate a fractal arena (based on a variation of your original getFractalUV logic)\n    vec2 flow = p;\n    for(int i = 0; i < 4; i++) {\n        flow = abs(flow);\n        if (flow.x < flow.y) flow = flow.yx;\n        flow *= 1.5;\n        flow -= vec2(0.5, 0.8);\n        flow *= rot(0.2 + iTime * 0.05); \n    }\n    \n    // Convert the fractal coordinates into a two-dimensional velocity vector\n    vec2 velocity = normalize(flow) * 30.0; // 30.0 is the flow field intensity\n    \n    // Retrieve the particle state at the current position (Buffer A) - Space reserved here for interaction\n    vec4 particleData = texture(iChannel0, uv);\n    \n    // Time smoothing (reading the buffer B from the previous frame) makes the flow field changes smoother and less abrupt\n    vec4 prevField = texture(iChannel1, uv);\n    vec2 smoothedVelocity = mix(velocity, prevField.xy, 0.9);\n    \n    // Output flow field velocity\n    fragColor = vec4(smoothedVelocity, 0.0, 1.0);\n}",
				"name": "Buffer B",
				"description": "",
				"type": "buffer"
			}
		],
		"flags": {
			"mFlagVR": false,
			"mFlagWebcam": false,
			"mFlagSoundInput": false,
			"mFlagSoundOutput": false,
			"mFlagKeyboard": false,
			"mFlagMultipass": true,
			"mFlagMusicStream": false
		},
		"info": {
			"id": "Nf2GRm",
			"date": "1773805983",
			"viewed": 41,
			"name": "Kaleidoscope",
			"username": "Jingwen Zhang",
			"description": "Did you ever play with a kaleidoscope when you were a kid?\nStep into the World of the Kaleidoscope",
			"likes": 3,
			"published": 1,
			"flags": 32,
			"usePreview": 0,
			"tags": [
				"datt4950",
				"digm5950"
			],
			"hasliked": 0,
			"parentid": "7fB3Rw",
			"parentname": "Fork Fork Fork  catsnowyi 262"
		}
	},
	{
		"ver": "0.1",
		"renderpass": [
			{
				"outputs": [
					{
						"channel": 0,
						"id": "4dfGRr"
					}
				],
				"inputs": [
					{
						"channel": 0,
						"type": "buffer",
						"id": "4dXGR8",
						"filepath": "/media/previz/buffer00.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 1,
						"type": "buffer",
						"id": "XsXGR8",
						"filepath": "/media/previz/buffer01.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 2,
						"type": "buffer",
						"id": "4sXGR8",
						"filepath": "/media/previz/buffer02.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "// Image — Lenia + species trail + particle dots\n//\n// iChannel0: bufA  (Lenia)\n// iChannel1: bufB  (particle state)\n// iChannel2: bufC  (trail: .r=intensity, .g=speciesID/9)\n\n// Multiple kernels coexist in the field, suppressing the unlimited growth of any single species.\n// Future work: use particle interactions to model coexistence, competition, and evolutionary dynamics between species.\n\nvec3 speciesColor(float s) {\n    float h = s / 10.0;\n    vec3 rgb = clamp(abs(mod(h*6.0 + vec3(0.,4.,2.), 6.)-3.)-1., 0., 1.);\n    return mix(vec3(1.), rgb, 0.85);\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    vec2 uv = fragCoord / iResolution.xy;\n\n    vec3 lenia = texture(iChannel0, uv).rgb;\n    vec4 A     = texture(iChannel1, uv);          // particle\n    vec2 trail = texture(iChannel2, uv).rg;       // .r=intensity .g=speciesNorm\n\n    vec3 trailColor = speciesColor(trail.g * 9.0);\n\n    vec3 col = lenia;\n\n    // species trail glow\n    // ---------------------------------------\n    //uncomment this line to show trails\n    //col += trailColor * trail.r * 0.5;\n\n    // particle dot colored by species\n    float d  = distance(fragCoord, A.xy);\n    vec3  sc = speciesColor(A.w);\n    \n    // ----------------------------------------\n    //uncomment this line to show particles\n    //col += sc * smoothstep(3., 0., d);\n\n    fragColor = vec4(clamp(col, 0., 1.), 1.);\n}\n",
				"name": "Image",
				"description": "",
				"type": "image"
			},
			{
				"outputs": [
					{
						"channel": 0,
						"id": "4dXGR8"
					}
				],
				"inputs": [
					{
						"channel": 0,
						"type": "buffer",
						"id": "4dXGR8",
						"filepath": "/media/previz/buffer00.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 1,
						"type": "buffer",
						"id": "4sXGR8",
						"filepath": "/media/previz/buffer02.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "// Buffer A — Lenia multichannel, per-pixel species from nearest particle\n//\n// iChannel0: self  (Lenia feedback)\n// iChannel1: bufC  (trail — .r=intensity, .g=speciesID/9)\n\nmat4 bell(in mat4 x, in mat4 m, in mat4 s) {\n    mat4 v = -mult(x-m,x-m)/s/s/2.;\n    return mat4(exp(v[0]),exp(v[1]),exp(v[2]),exp(v[3]));\n}\n\nmat4 getWeight(float r, mat4 _relR, mat4 _betaLen, mat4 _beta0, mat4 _beta1, mat4 _beta2) {\n    mat4 Br = _betaLen / _relR * r;\n    ivec4 Br0=ivec4(Br[0]), Br1=ivec4(Br[1]), Br2=ivec4(Br[2]), Br3=ivec4(Br[3]);\n    mat4 height = mat4(\n        _beta0[0]*vec4(equal(Br0,iv0)) + _beta1[0]*vec4(equal(Br0,iv1)) + _beta2[0]*vec4(equal(Br0,iv2)),\n        _beta0[1]*vec4(equal(Br1,iv0)) + _beta1[1]*vec4(equal(Br1,iv1)) + _beta2[1]*vec4(equal(Br1,iv2)),\n        _beta0[2]*vec4(equal(Br2,iv0)) + _beta1[2]*vec4(equal(Br2,iv1)) + _beta2[2]*vec4(equal(Br2,iv2)),\n        _beta0[3]*vec4(equal(Br3,iv0)) + _beta1[3]*vec4(equal(Br3,iv1)) + _beta2[3]*vec4(equal(Br3,iv2)));\n    mat4 mod1 = mat4(mod(Br[0],1.),mod(Br[1],1.),mod(Br[2],1.),mod(Br[3],1.));\n    return mult(height, bell(mod1, kmu, ksigma));\n}\n\nvec4 getSrc(in vec3 v, in ivec4 srcv) {\n    return v.r*vec4(equal(srcv,iv0)) + v.g*vec4(equal(srcv,iv1)) + v.b*vec4(equal(srcv,iv2));\n}\nfloat getDst(in mat4 m, in ivec4 ch) {\n    return dot(m[0],vec4(equal(dst0,ch))) + dot(m[1],vec4(equal(dst1,ch)))\n         + dot(m[2],vec4(equal(dst2,ch))) + dot(m[3],vec4(equal(dst3,ch)));\n}\nmat4 getVal(in vec2 xy) {\n    vec2 txy = mod(xy/iResolution.xy, 1.);\n    vec3 val = texture(iChannel0, txy).rgb;\n    return mat4(getSrc(val,src0), getSrc(val,src1), getSrc(val,src2), getSrc(val,src3));\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    vec2 uv = fragCoord / iResolution.xy;\n\n    // read species ID from trail (persists after particle moves away)\n    vec2 trail = texture(iChannel1, uv).rg;\n    int sid = clamp(int(trail.g * 9.0 + 0.5), 0, 9);\n\n    // fetch species-specific kernel parameters\n    mat4 _betaLen = sp_betaLen(sid);\n    mat4 _beta0   = sp_beta0(sid);\n    mat4 _beta1   = sp_beta1(sid);\n    mat4 _beta2   = sp_beta2(sid);\n    mat4 _relR    = sp_relR(sid);\n    mat4 _mu      = sp_mu(sid);\n    mat4 _sigma   = sp_sigma(sid);\n    mat4 _eta     = sp_eta(sid);\n\n    // convolution\n    mat4 sum=mat4(0.), total=mat4(0.);\n    float r; mat4 weight; mat4 valSrc;\n\n    r=0.; weight=getWeight(r,_relR,_betaLen,_beta0,_beta1,_beta2);\n    valSrc=getVal(fragCoord); sum+=mult(valSrc,weight); total+=weight;\n\n    for (int x=1; x<=intR; x++) {\n        r=float(x)/R; weight=getWeight(r,_relR,_betaLen,_beta0,_beta1,_beta2);\n        valSrc=getVal(fragCoord+vec2(+x,0)*samplingDist); sum+=mult(valSrc,weight); total+=weight;\n        valSrc=getVal(fragCoord+vec2(-x,0)*samplingDist); sum+=mult(valSrc,weight); total+=weight;\n        valSrc=getVal(fragCoord+vec2(0,+x)*samplingDist); sum+=mult(valSrc,weight); total+=weight;\n        valSrc=getVal(fragCoord+vec2(0,-x)*samplingDist); sum+=mult(valSrc,weight); total+=weight;\n    }\n    for (int x=1; x<=intR; x++) {\n        r=sqrt(2.)*float(x)/R;\n        if (r<=1.) {\n            weight=getWeight(r,_relR,_betaLen,_beta0,_beta1,_beta2);\n            valSrc=getVal(fragCoord+vec2(+x,+x)*samplingDist); sum+=mult(valSrc,weight); total+=weight;\n            valSrc=getVal(fragCoord+vec2(+x,-x)*samplingDist); sum+=mult(valSrc,weight); total+=weight;\n            valSrc=getVal(fragCoord+vec2(-x,+x)*samplingDist); sum+=mult(valSrc,weight); total+=weight;\n            valSrc=getVal(fragCoord+vec2(-x,-x)*samplingDist); sum+=mult(valSrc,weight); total+=weight;\n        }\n    }\n    for (int y=1; y<=intR-1; y++)\n    for (int x=y+1; x<=intR; x++) {\n        r=sqrt(float(x*x+y*y))/R;\n        if (r<=1.) {\n            weight=getWeight(r,_relR,_betaLen,_beta0,_beta1,_beta2);\n            valSrc=getVal(fragCoord+vec2(+x,+y)*samplingDist); sum+=mult(valSrc,weight); total+=weight;\n            valSrc=getVal(fragCoord+vec2(+x,-y)*samplingDist); sum+=mult(valSrc,weight); total+=weight;\n            valSrc=getVal(fragCoord+vec2(-x,+y)*samplingDist); sum+=mult(valSrc,weight); total+=weight;\n            valSrc=getVal(fragCoord+vec2(-x,-y)*samplingDist); sum+=mult(valSrc,weight); total+=weight;\n            valSrc=getVal(fragCoord+vec2(+y,+x)*samplingDist); sum+=mult(valSrc,weight); total+=weight;\n            valSrc=getVal(fragCoord+vec2(+y,-x)*samplingDist); sum+=mult(valSrc,weight); total+=weight;\n            valSrc=getVal(fragCoord+vec2(-y,+x)*samplingDist); sum+=mult(valSrc,weight); total+=weight;\n            valSrc=getVal(fragCoord+vec2(-y,-x)*samplingDist); sum+=mult(valSrc,weight); total+=weight;\n        }\n    }\n    mat4 avg = sum / (total + EPSILON);\n\n    mat4 growth = mult(_eta, bell(avg,_mu,_sigma)*2.-1.);\n    vec3 growthDst = vec3(getDst(growth,iv0), getDst(growth,iv1), getDst(growth,iv2));\n    vec3 val = texture(iChannel0, uv).rgb;\n    vec3 rgb = clamp(dt*growthDst + val, 0., 1.);\n\n    if (iFrame==0 || iMouse.z>0.) {\n        float bn = 0.16;\n        vec3 noiseRGB = vec3(\n            noise(fragCoord/R/samplingDist + mod(iDate.w,1.)*100.),\n            noise(fragCoord/R/samplingDist + sin(iDate.w)*100.),\n            noise(fragCoord/R/samplingDist + cos(iDate.w)*100.) );\n        rgb = bn + noiseRGB;\n    }\n\n    fragColor = vec4(rgb, 1.);\n}\n",
				"name": "Buffer A",
				"description": "",
				"type": "buffer"
			},
			{
				"outputs": [
					{
						"channel": 0,
						"id": "XsXGR8"
					}
				],
				"inputs": [
					{
						"channel": 0,
						"type": "buffer",
						"id": "4dXGR8",
						"filepath": "/media/previz/buffer00.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 1,
						"type": "buffer",
						"id": "XsXGR8",
						"filepath": "/media/previz/buffer01.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "// Buffer B — Particle state\n// Each pixel stores the state of the nearest particle:\n//   .xy = particle position (pixels)\n//   .z  = heading angle (radians)\n//   .w  = species ID (0–9, stored as float)\n//\n// Role of particles in the ecosystem:\n//   Particles do NOT directly overwrite cell values.\n//   Instead, their trails (bufC) carry species information that\n//   bufA reads to select which kernel to apply at each location.\n//   This means particles only shape the *surrounding kernel environment*\n//   of living cells — they act as \"gardeners\" steering growth rules,\n//   not bulldozers that destroy existing life.\n//\n//   Without steering, a particle moving in a straight line through a colony\n//   stamps its species trail across the interior, flipping the kernel and\n//   killing the cells it crosses.  Steering keeps particles on the edges.\n//\n// Particle–cell relationship:\n//   - In regions where cells have already grown (high Lenia luminance),\n//     particles are attracted toward the bright boundary edges.\n//     They orbit or skirt around established colonies rather than\n//     cutting straight through, preserving the active kernel zone.\n//   - When a particle does pass near a living region, its species trail\n//     may shift the local kernel — but only gradually, because trail\n//     diffusion and decay (bufC) smooth out abrupt transitions.\n//   - The net effect: particles continuously sculpt the kernel landscape\n//     around cell colonies, enabling new growth patterns to emerge at\n//     the periphery while leaving the interior ecology intact.\n\n// iChannel0: self   (particle feedback)\n// iChannel1: bufA   (Lenia field for attraction)\n\n\nvec4 getNearestParticle(vec4 A, vec2 fragCoord, vec2 offset) {\n    vec4 N = texture(iChannel1, (fragCoord+offset)/iResolution.xy);\n    return (distance(fragCoord,N.xy) < distance(fragCoord,A.xy)) ? N : A;\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    vec2 uv = fragCoord / iResolution.xy;\n    vec4 A  = texture(iChannel1, uv);\n\n    // nearest-particle propagation\n    for (int x=-2; x<=2; x++)\n    for (int y=-2; y<=2; y++)\n        A = getNearestParticle(A, fragCoord, vec2(x,y));\n\n    vec4 rnd = random4(vec3(A.xy, iTime));\n\n    float speed        = 60.;\n    float wander       = 0.4;\n    float turnfactor   = 0.6;\n    float sensor_length = 18.;\n\n    mat2 rot = rotate2d(A.z);\n    vec2 s0  = rot * vec2(1., 0.) * sensor_length + A.xy;\n    vec2 s1  = rot * vec2(1., 1.) * sensor_length + A.xy;\n    vec2 s2  = rot * vec2(1.,-1.) * sensor_length + A.xy;\n\n    // use overall luminance as attraction field\n    vec3 c0 = texture(iChannel0, s0/iResolution.xy).rgb;\n    vec3 c1 = texture(iChannel0, s1/iResolution.xy).rgb;\n    vec3 c2 = texture(iChannel0, s2/iResolution.xy).rgb;\n    float F  = dot(c0, vec3(0.333));\n    float FL = dot(c1, vec3(0.333));\n    float FR = dot(c2, vec3(0.333));\n\n    if (F>=FL && F>=FR)   A.z += wander*(rnd.z-0.5)*0.3;\n    else if (FL>=FR)      A.z += turnfactor;\n    else                  A.z -= turnfactor;\n\n    rot   = rotate2d(A.z);\n    A.xy += rot * vec2(speed,0.) * iTimeDelta;\n\n    vec2 b = clamp(A.xy, vec2(0.), iResolution.xy);\n    if (A.x!=b.x) A.z = TWOPI*0.5 - A.z;\n    if (A.y!=b.y) A.z = TWOPI     - A.z;\n    A.xy = b;\n\n    if (iFrame==0) {\n        float N = 60.;\n        A.xy = round(fragCoord/N)*N;\n        vec4 r0 = random4(vec3(A.xy, 0.));\n        A.z  = r0.z * TWOPI;\n        A.w  = floor(r0.w * 10.);   // species 0-9\n    }\n\n    fragColor = A;\n}\n",
				"name": "Buffer B",
				"description": "",
				"type": "buffer"
			},
			{
				"outputs": [
					{
						"channel": 0,
						"id": "4sXGR8"
					}
				],
				"inputs": [
					{
						"channel": 1,
						"type": "buffer",
						"id": "XsXGR8",
						"filepath": "/media/previz/buffer01.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 2,
						"type": "buffer",
						"id": "4sXGR8",
						"filepath": "/media/previz/buffer02.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "// Buffer C — Particle trail\n// .r = trail intensity   .g = species ID / 9.0 (preserved across diffusion)\n//\n// iChannel1: bufB  (particle state)\n// iChannel2: self  (trail feedback)\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    vec2 uv = fragCoord / iResolution.xy;\n\n    // diffuse trail (4-neighbour weighted average)\n    vec4 C  = texture(iChannel2, uv);\n    vec4 N  = texture(iChannel2, (fragCoord+vec2( 0, 1))/iResolution.xy);\n    vec4 S  = texture(iChannel2, (fragCoord+vec2( 0,-1))/iResolution.xy);\n    vec4 E  = texture(iChannel2, (fragCoord+vec2( 1, 0))/iResolution.xy);\n    vec4 W  = texture(iChannel2, (fragCoord+vec2(-1, 0))/iResolution.xy);\n\n    // intensity diffuses normally\n    float intensity = mix(C.r, (N.r+S.r+E.r+W.r)*0.25, 0.12);\n    intensity *= 0.997;   // decay\n\n    // species ID: take from the brightest neighbour (species \"dominates\" into surroundings)\n    vec4 best = C;\n    if (N.r > best.r) best = N;\n    if (S.r > best.r) best = S;\n    if (E.r > best.r) best = E;\n    if (W.r > best.r) best = W;\n    float speciesNorm = best.g;   // inherit species from brightest neighbour\n\n    // deposit from nearest particle\n    vec4  A = texture(iChannel1, uv);\n    float d = distance(fragCoord, A.xy);\n    float deposit = exp(-d*d*0.005);   // ~14px glow radius\n\n    if (deposit > intensity) {\n        intensity    = deposit;\n        speciesNorm  = A.w / 9.0;   // overwrite species where particle is strong\n    }\n\n    fragColor = vec4(intensity, speciesNorm, 0., 1.);\n}\n",
				"name": "Buffer C",
				"description": "",
				"type": "buffer"
			},
			{
				"outputs": [],
				"inputs": [],
				"code": "// maximum 16 kernels by using 4x4 matrix\n#define EPSILON 0.000001\n#define mult matrixCompMult\n\nconst float samplingDist = 1.;\n\nconst ivec4 iv0 = ivec4(0);\nconst ivec4 iv1 = ivec4(1);\nconst ivec4 iv2 = ivec4(2);\nconst ivec4 iv3 = ivec4(3);\nconst vec4 v0 = vec4(0.);\nconst vec4 v1 = vec4(1.);\nconst mat4 m0 = mat4(v0, v0, v0, v0);\nconst mat4 m1 = mat4(v1, v1, v1, v1);\n\n// fixed: all species use R=12, T=2 (species3 originally R=10 but approximated)\nconst float R    = 12.;\nconst float T    = 2.;\nconst int   intR = int(ceil(R));\nconst float dt   = 1./T;\n\nconst vec4 kmv    = vec4(0.5);\nconst mat4 kmu    = mat4(kmv, kmv, kmv, kmv);\nconst vec4 ksv    = vec4(0.15);\nconst mat4 ksigma = mat4(ksv, ksv, ksv, ksv);\n\n// channel routing — identical for all 10 species\nconst mat4 src = mat4(0.,0.,0.,1., 1.,1.,2.,2., 2.,0.,0.,1., 1.,2.,2.,0.);\nconst mat4 dst = mat4(0.,0.,0.,1., 1.,1.,2.,2., 2.,1.,2.,0., 2.,0.,1.,0.);\nconst ivec4 src0=ivec4(src[0]), src1=ivec4(src[1]), src2=ivec4(src[2]), src3=ivec4(src[3]);\nconst ivec4 dst0=ivec4(dst[0]), dst1=ivec4(dst[1]), dst2=ivec4(dst[2]), dst3=ivec4(dst[3]);\n\n// ---- Per-species parameter getters (species 0-9) ----\n// mat4 is column-major: mat4(col0, col1, col2, col3), each col = 4 floats\n\nmat4 sp_betaLen(int s) {\n    if (s==0) return mat4(1.,1.,2.,2., 1.,2.,1.,1., 1.,2.,2.,2., 1.,2.,1.,0.);\n    if (s==1) return mat4(1.,1.,2.,2., 1.,2.,1.,1., 1.,2.,2.,2., 1.,2.,1.,0.);\n    if (s==2) return mat4(1.,1.,1.,2., 1.,2.,1.,1., 1.,1.,1.,2., 1.,1.,2.,0.);\n    if (s==3) return mat4(2.,3.,1.,2., 3.,1.,2.,3., 1.,0.,0.,0., 0.,0.,0.,0.);\n    if (s==4) return mat4(1.,1.,2.,2., 1.,2.,1.,1., 1.,2.,2.,1., 1.,2.,1.,0.);\n    if (s==5) return mat4(1.,1.,2.,2., 1.,2.,1.,1., 1.,2.,2.,2., 1.,3.,1.,0.);\n    if (s==6) return mat4(1.,1.,2.,2., 1.,2.,1.,1., 1.,2.,2.,2., 1.,2.,1.,0.);\n    if (s==7) return mat4(1.,1.,2.,2., 1.,2.,1.,1., 1.,2.,2.,2., 1.,2.,1.,0.);\n    if (s==8) return mat4(1.,1.,2.,2., 1.,2.,1.,1., 1.,2.,2.,2., 1.,2.,1.,0.);\n    /*s==9*/  return mat4(1.,1.,1.,2., 1.,2.,1.,1., 1.,1.,1.,3., 1.,1.,2.,0.);\n}\n\nmat4 sp_beta0(int s) {\n    if (s==0) return mat4(1.,1.,1.,0., 1.,.8333,1.,1., 1.,.9167,.75,.9167, 1.,.1667,1.,0.);\n    if (s==1) return mat4(1.,1.,1.,0., 1.,.75,1.,1.,   1.,.9167,.75,1.,    1.,.25,1.,0.);\n    if (s==2) return mat4(1.,1.,1.,.0833, 1.,.8333,1.,1., 1.,1.,1.,1.,     1.,1.,1.,0.);\n    if (s==3) return mat4(.25,1.,1.,.25, 1.,1.,.25,1., 1.,0.,0.,0.,         0.,0.,0.,0.);\n    if (s==4) return mat4(1.,1.,1.,0., 1.,.8333,1.,1., 1.,.9167,.75,1.,    1.,.1667,1.,0.);\n    if (s==5) return mat4(1.,1.,1.,0., 1.,.8333,1.,1., 1.,.9167,.75,.9167, 1.,.1667,1.,0.);\n    if (s==6) return mat4(1.,1.,1.,0., 1.,.75,1.,1.,   1.,.9167,.8333,1.,  1.,.25,1.,0.);\n    if (s==7) return mat4(1.,1.,1.,0., 1.,.8333,1.,1., 1.,.9167,.75,1.,    1.,.1667,1.,0.);\n    if (s==8) return mat4(1.,1.,1.,0., 1.,.75,1.,1.,   1.,.9167,.75,1.,    1.,.1667,1.,0.);\n    /*s==9*/  return mat4(1.,1.,1.,.0833, 1.,.8333,1.,1., 1.,1.,1.,1.,     1.,1.,1.,0.);\n}\n\nmat4 sp_beta1(int s) {\n    if (s==0) return mat4(0.,0.,.25,1., 0.,1.,0.,0., 0.,1.,1.,1.,    0.,1.,0.,0.);\n    if (s==1) return mat4(0.,0.,.25,1., 0.,1.,0.,0., 0.,1.,1.,.9167, 0.,1.,0.,0.);\n    if (s==2) return mat4(0.,0.,0.,1.,  0.,1.,0.,0., 0.,0.,0.,.9167, 1.,0.,0.,0.);\n    if (s==3) return mat4(1.,.75,0.,1., .75,0.,1.,.75, 0.,0.,0.,0.,  0.,0.,0.,0.);\n    if (s==4) return mat4(0.,0.,.25,1., 0.,1.,0.,0., 0.,1.,1.,0.,    0.,1.,0.,0.);\n    if (s==5) return mat4(0.,0.,.25,1., 0.,1.,0.,0., 0.,1.,1.,1.,    0.,1.,0.,0.);\n    if (s==6) return mat4(0.,0.,.25,1., 0.,1.,0.,0., 0.,1.,1.,.9167, 0.,1.,0.,0.);\n    if (s==7) return mat4(0.,0.,.25,1., 0.,1.,0.,0., 0.,1.,1.,.9167, 0.,1.,0.,0.);\n    if (s==8) return mat4(0.,0.,.25,1., 0.,1.,0.,0., 0.,1.,1.,.9167, 0.,1.,0.,0.);\n    /*s==9*/  return mat4(0.,0.,0.,1.,  0.,1.,0.,0., 0.,0.,0.,.9167, 0.,0.,.0833,0.);\n}\n\nmat4 sp_beta2(int s) {\n    if (s==3) return mat4(0.,.75,0.,0., .75,0.,0.,.75, 0.,0.,0.,0., 0.,0.,0.,0.);\n    return mat4(0.,0.,0.,0., 0.,0.,0.,0., 0.,0.,0.,0., 0.,0.,0.,0.);\n}\n\nmat4 sp_mu(int s) {\n    if (s==0) return mat4(.272,.349,.2,.114,    .447,.247,.21,.462,  .446,.327,.476,.379, .262,.412,.201,0.);\n    if (s==1) return mat4(.175,.382,.231,.123,  .398,.224,.193,.512, .427,.286,.508,.372, .196,.371,.246,0.);\n    if (s==2) return mat4(.118,.174,.244,.114,  .374,.222,.306,.449, .498,.295,.43,.353,  .238,.39,.1,0.);\n    if (s==3) return mat4(.16,.22,.28,.16,      .22,.28,.16,.22,     .28,0.,0.,0.,        0.,0.,0.,0.);\n    if (s==4) return mat4(.204,.359,.176,.128,  .386,.229,.181,.466, .466,.37,.447,.391,  .299,.398,.183,0.);\n    if (s==5) return mat4(.282,.354,.197,.164,  .406,.251,.259,.517, .455,.264,.472,.417, .208,.395,.184,0.);\n    if (s==6) return mat4(.272,.337,.129,.132,  .429,.239,.25,.497,  .486,.276,.425,.352, .21,.381,.244,0.);\n    if (s==7) return mat4(.242,.375,.194,.122,  .413,.221,.192,.492, .426,.361,.464,.361, .235,.381,.216,0.);\n    if (s==8) return mat4(.22,.351,.177,.126,   .437,.234,.179,.489, .419,.341,.469,.369, .219,.385,.208,0.);\n    /*s==9*/  return mat4(.168,.1,.265,.111,    .327,.223,.293,.465, .606,.404,.377,.297, .319,.483,.1,0.);\n}\n\nmat4 sp_sigma(int s) {\n    if (s==0) return mat4(.0595,.1585,.0332,.0528, .0777,.0342,.0617,.1192, .1793,.1408,.0995,.0697, .0877,.1101,.0786,1.);\n    if (s==1) return mat4(.0682,.1568,.034,.0484,  .0816,.0376,.063,.1189,  .1827,.1422,.1079,.0724, .0934,.1107,.0712,1.);\n    if (s==2) return mat4(.0639,.159,.0287,.0469,  .0822,.0294,.0775,.124,  .1836,.1373,.0999,.0954, .0995,.1094,.0601,1.);\n    if (s==3) return mat4(.025,.042,.025,.025,     .042,.025,.025,.042,     .025,1.,1.,1.,           1.,1.,1.,1.);\n    if (s==4) return mat4(.0574,.152,.0314,.0545,  .0825,.0348,.0657,.1224, .1789,.1372,.1064,.0644, .0891,.1065,.0773,1.);\n    if (s==5) return mat4(.0646,.1584,.0359,.056,  .0738,.0383,.0665,.1164, .1806,.1437,.0939,.0666, .0815,.1049,.0748,1.);\n    if (s==6) return mat4(.0674,.1576,.0382,.0514, .0813,.0409,.0691,.1166, .1751,.1344,.1026,.0797, .0921,.1056,.0813,1.);\n    if (s==7) return mat4(.061,.1553,.0361,.0531,  .0774,.0365,.0649,.1219, .1759,.1381,.1044,.0686, .0924,.1118,.0748,1.);\n    if (s==8) return mat4(.0628,.1539,.0333,.0525, .0797,.0369,.0653,.1213, .1775,.1388,.1054,.0721, .0898,.1102,.0749,1.);\n    /*s==9*/  return mat4(.062,.1495,.0488,.0555,  .0763,.0333,.0724,.1345, .1807,.1413,.1136,.0701, .1038,.1185,.0571,1.);\n}\n\nmat4 sp_eta(int s) {\n    if (s==0) return mat4(.19,.66,.39,.38,    .74,.92,.59,.37,  .94,.51,.77,.92,  .71,.59,.41,0.);\n    if (s==1) return mat4(.138,.544,.326,.256, .544,.544,.442,.198, .58,.282,.396,.618, .382,.374,.376,0.);\n    if (s==2) return mat4(.082,.462,.496,.27,  .518,.576,.324,.306, .544,.374,.33,.528, .498,.43,.26,0.);\n    if (s==3) return mat4(.666,.666,.666,.666, .666,.666,.666,.666, .666,0.,0.,0.,      0.,0.,0.,0.);\n    if (s==4) return mat4(.116,.448,.332,.392, .398,.614,.448,.224, .624,.352,.342,.634, .362,.472,.242,0.);\n    if (s==5) return mat4(.082,.544,.26,.294,  .508,.56,.326,.21,   .638,.346,.384,.748, .44,.366,.294,0.);\n    if (s==6) return mat4(.15,.474,.342,.192,  .524,.598,.426,.348, .62,.338,.314,.608,  .292,.426,.346,0.);\n    if (s==7) return mat4(.144,.506,.332,.3,   .502,.58,.344,.268,  .582,.326,.418,.642, .39,.378,.294,0.);\n    if (s==8) return mat4(.174,.46,.31,.242,   .508,.566,.406,.27,  .588,.294,.388,.62,  .348,.436,.39,0.);\n    /*s==9*/  return mat4(.076,.562,.548,.306,  .568,.598,.396,.298, .59,.396,.156,.426,  .558,.388,.132,0.);\n}\n\nmat4 sp_relR(int s) {\n    if (s==0) return mat4(.91,.62,.5,.97,  .72,.8,.96,.56,  .78,.79,.5,.72,  .68,.55,.82,1.);\n    if (s==1) return mat4(.78,.56,.6,.84,  .76,.82,1.,.68,  .99,.72,.56,.65, .85,.54,.82,1.);\n    if (s==2) return mat4(.85,.61,.5,.81,  .85,.93,.88,.74, .97,.92,.56,.56, .95,.59,.58,1.);\n    if (s==3) return mat4(1.,1.,1.,1.,     1.,1.,1.,1.,     1.,1.,1.,1.,     1.,1.,1.,1.);\n    if (s==4) return mat4(.93,.59,.58,.97, .79,.87,1.,.64,  .67,.68,.5,.85,  .69,.87,.66,1.);\n    if (s==5) return mat4(.85,.62,.69,.84, .82,.86,1.,.5,   .78,.6,.5,.7,    .67,.6,.8,1.);\n    if (s==6) return mat4(.87,.65,.67,.98, .77,.83,1.,.7,   .99,.69,.7,.57,  .89,.84,.76,1.);\n    if (s==7) return mat4(.98,.59,.5,.93,  .73,.88,.93,.61, .84,.7,.57,.73,  .74,.87,.72,1.);\n    if (s==8) return mat4(.87,.52,.58,.89, .78,.79,1.,.64,  .96,.66,.69,.61, .81,.81,.71,1.);\n    /*s==9*/  return mat4(.58,.68,.5,.87,  1.,1.,.88,.88,   .86,.98,.63,.53, 1.,.89,.59,1.);\n}\n\n// ---- Simplex noise (iq) ----\nvec2 _nh(vec2 p) {\n    p = vec2(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)));\n    return -1.0 + 2.0*fract(sin(p)*43758.5453123);\n}\nfloat noise(in vec2 p) {\n    const float K1=0.366025404, K2=0.211324865;\n    vec2 i=floor(p+(p.x+p.y)*K1);\n    vec2 a=p-i+(i.x+i.y)*K2;\n    float m=step(a.y,a.x);\n    vec2 o=vec2(m,1.-m), b=a-o+K2, c=a-1.+2.*K2;\n    vec3 h=max(.5-vec3(dot(a,a),dot(b,b),dot(c,c)),0.);\n    return dot(h*h*h*h*vec3(dot(a,_nh(i)),dot(b,_nh(i+o)),dot(c,_nh(i+1.))), vec3(70.));\n}\n\n// ---- Particle utilities ----\nconst float TWOPI = 6.283185307179586;\n\nmat2 rotate2d(float a) {\n    float s=sin(a), c=cos(a);\n    return mat2(c,-s,s,c);\n}\n\n#define RANDOM_SCALE vec4(.1031,.1030,.0973,.1099)\n\nvec4 random4(vec3 p) {\n    vec4 p4=fract(p.xyzx*RANDOM_SCALE);\n    p4+=dot(p4,p4.wzxy+19.19);\n    return fract((p4.xxyz+p4.yzzw)*p4.zywx);\n}\n",
				"name": "Common",
				"description": "",
				"type": "common"
			}
		],
		"flags": {
			"mFlagVR": false,
			"mFlagWebcam": false,
			"mFlagSoundInput": false,
			"mFlagSoundOutput": false,
			"mFlagKeyboard": false,
			"mFlagMultipass": true,
			"mFlagMusicStream": false
		},
		"info": {
			"id": "NflXDn",
			"date": "1775327248",
			"viewed": 25,
			"name": "Lenia Multi-Species Particle",
			"username": "Xingbang Tang",
			"description": "reference: https://www.shadertoy.com/view/7lsGDr\nhttps://chakazul.github.io/lenia.html\nThis project extends Lenia by integrating a particle system that allows multiple species to coexist and interact within the same environment.",
			"likes": 2,
			"published": 1,
			"flags": 32,
			"usePreview": 0,
			"tags": [
				"lenia"
			],
			"hasliked": 0,
			"parentid": "",
			"parentname": ""
		}
	},
	{
		"ver": "0.1",
		"renderpass": [
			{
				"outputs": [
					{
						"channel": 0,
						"id": "4dfGRr"
					}
				],
				"inputs": [
					{
						"channel": 0,
						"type": "buffer",
						"id": "4dXGR8",
						"filepath": "/media/previz/buffer00.png",
						"sampler": {
							"filter": "nearest",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 1,
						"type": "buffer",
						"id": "XsXGR8",
						"filepath": "/media/previz/buffer01.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 2,
						"type": "buffer",
						"id": "4sXGR8",
						"filepath": "/media/previz/buffer02.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "void mainImage( out vec4 fragColor, in vec2 fragCoord ) {\n    vec2 uv = fragCoord / iResolution.xy;\n    \n    // --- 1. 电影级特效：色散采样 (Chromatic Aberration) ---\n    // 模拟真实镜头在边缘产生的色彩偏移，消除空洞感\n    float aberration = 0.004 * length(uv - 0.5);\n    float rV = texture(iChannel1, uv + vec2(aberration, 0)).g;\n    float gV = texture(iChannel1, uv).g;\n    float bV = texture(iChannel1, uv - vec2(aberration, 0)).g;\n    float v = (rV + gV + bV) / 3.0; // 用于计算亮度的平均浓度\n    \n    float dataB = texture(iChannel1, uv).b; // 用于调色的 phase\n\n    // --- 2. 法线提取与菲涅尔效应 ---\n    vec2 eps = vec2(2.0 / iResolution.x, 0.0);\n    float v_n = texture(iChannel1, uv + eps.yx).g;\n    float v_s = texture(iChannel1, uv - eps.yx).g;\n    float v_e = texture(iChannel1, uv + eps.xy).g;\n    float v_w = texture(iChannel1, uv - eps.xy).g;\n    \n    // 计算梯度法线，0.05 是凹凸深度因子\n    vec3 normal = normalize(vec3(v_w - v_e, v_s - v_n, 0.05));\n    \n    // 菲涅尔：模拟生物发光，边缘发光强烈，中心透明，制造有机果冻质感\n    float fresnel = pow(1.0 - max(dot(normal, vec3(0, 0, 1)), 0.0), 3.0);\n    \n    // --- 3. 基础色彩映射 ---\n    vec3 baseCol = getAurora(dataB * 0.5 + iTime * 0.05);\n    \n    // --- 4. 混合最终视觉 ---\n    // 用 v (浓度) 作为遮罩，结合次表面散色和生物荧光\n    vec3 col = baseCol * v * 0.3; // 内部弱光\n    col += baseCol * fresnel * gV * 2.5; // 边缘强烈的生物荧光\n    \n    // 增加边缘轮廓，让画面更锐利\n    float edge = smoothstep(0.01, 0.03, length(vec2(v_e - v_w, v_n - v_s)));\n    col += edge * baseCol * fresnel * 0.8;\n\n    // --- 5. 渲染深邃背景与体积焦散 ---\n    // 深海基色\n    vec3 bgCol = vec3(0.002, 0.005, 0.01);\n    \n    // 模拟上方透射下来的流动光斑 (Caustics)\n    float lightPattern = fbm2D(uv * 1.5 + iTime * 0.03, iTime * 0.02);\n    lightPattern += smoothstep(0.5, 0.8, fbm2D(uv * 3.0 - iTime * 0.05, iTime * 0.01));\n    bgCol += vec3(0.02, 0.06, 0.08) * lightPattern;\n    \n    // 混合背景与主体\n    vec3 finalCol = mix(bgCol, col, smoothstep(0.01, 0.3, gV));\n    \n    // --- 6. 最后的电影化处理 ---\n    // 增加细微的胶片颗粒感 (Film Grain) 消除数字感\n    finalCol += (random2(uv + iTime).x - 0.5) * 0.02;\n\n    // 暗角 (Vignette)\n    finalCol *= smoothstep(1.3, 0.5, length(uv - 0.5));\n    \n    fragColor = vec4(clamp(finalCol, 0.0, 1.0), 1.0);\n}",
				"name": "Image",
				"description": "",
				"type": "image"
			},
			{
				"outputs": [],
				"inputs": [],
				"code": "const float TWOPI = 6.283185307179586;\n\nmat2 rotate2d(float angle) {\n    float s = sin(angle);\n    float c = cos(angle);\n    return mat2(c, -s, s, c); \n}\n\n#define RANDOM_SCALE vec4(.1031, .1030, .0973, .1099)\n\n// --- 基础随机与噪声函数 ---\nvec2 random2(float p) {\n    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\nvec2 random2(vec2 p) {\n    vec3 p3 = fract(p.xyx * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\nvec2 random2(vec3 p3) {\n    p3 = fract(p3 * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\nvec3 random3(vec2 p) {\n    vec3 p3 = fract(vec3(p.xyx) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yxz + 19.19);\n    return fract((p3.xxy + p3.yzz) * p3.zyx);\n}\nvec4 random4(vec3 p) {\n    vec4 p4 = fract(p.xyzx * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nfloat smoothNoise2D(vec2 p) {\n    vec2 i = floor(p);\n    vec2 f = fract(p);\n    f = f*f*(3.0-2.0*f); \n    float a = fract(sin(dot(i, vec2(12.9898, 78.233))) * 43758.5453);\n    float b = fract(sin(dot(i + vec2(1.0, 0.0), vec2(12.9898, 78.233))) * 43758.5453);\n    float c = fract(sin(dot(i + vec2(0.0, 1.0), vec2(12.9898, 78.233))) * 43758.5453);\n    float d = fract(sin(dot(i + vec2(1.0, 1.0), vec2(12.9898, 78.233))) * 43758.5453);\n    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);\n}\n\nfloat fbm2D(vec2 p, float time) { \n    float v = 0.0;\n    float a = 0.5;\n    mat2 rot = rotate2d(0.5);\n    for (int i = 0; i < 4; ++i) {\n        v += a * smoothNoise2D(p);\n        p = rot * p * 2.0 + time * 0.1; \n        a *= 0.5;\n    }\n    return v;\n}\n\n// --- 色彩处理函数 ---\n\nvec3 getAurora(float t) {\n    // a 决定了基础亮度（中值）\n    vec3 a = vec3(0.5, 0.5, 0.6); \n    // b 决定了色彩的鲜艳程度（振幅）\n    vec3 b = vec3(0.5, 0.4, 0.4); \n    vec3 c = vec3(1.0, 1.0, 1.0);\n    vec3 d = vec3(0.0, 0.33, 0.67); \n    return a + b * cos(TWOPI * (c * t + d));\n}",
				"name": "Common",
				"description": "",
				"type": "common"
			},
			{
				"outputs": [
					{
						"channel": 0,
						"id": "4dXGR8"
					}
				],
				"inputs": [
					{
						"channel": 0,
						"type": "buffer",
						"id": "4dXGR8",
						"filepath": "/media/previz/buffer00.png",
						"sampler": {
							"filter": "nearest",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 2,
						"type": "buffer",
						"id": "4sXGR8",
						"filepath": "/media/previz/buffer02.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "// JFA 风格的最邻近粒子追踪\nvec4 getNearestParticle(vec4 A, vec2 fragCoord, vec2 offset) {\n    vec4 N = texture(iChannel0, (fragCoord+offset)/iResolution.xy);\n    float d1 = distance(fragCoord, A.xy);\n    float d2 = distance(fragCoord, N.xy);\n    if (d2 < d1) { return N; } else { return A; }\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy;\n    vec4 A = texture(iChannel0, uv);\n    \n    // --- 1. 物理追踪与种群维持 ---\n    for (int x=-2; x<=2; x++) {\n        for (int y=-2; y<=2; y++) {\n            A = getNearestParticle(A, fragCoord, vec2(x, y));\n        }\n    }\n    \n    float myDist = distance(fragCoord, A.xy);\n    // 维持种群密度，如果某处空了，就在本地诞生新生物\n    if (myDist > 25.0) {\n        A.xy = fragCoord + (random2(fragCoord + iTime) - 0.5) * 10.0;\n        A.z = random2(fragCoord + iTime + 1.0).x * TWOPI;\n        A.w = 0.0; // 初始为黯淡状态\n    }\n\n    // --- 2. 智能行为逻辑 ---\n    vec4 noise = random4(vec3(A.xy, iTime));\n    \n    float baseSpeed = 50. + noise.y * 20.0; \n    float speed = baseSpeed;\n    float turnfactor = 0.3; \n    float sensor_length = 25.; \n    \n    mat2 rot = rotate2d(A.z);\n    // 三个前向传感器\n    vec2 sensorF_pos = rot * vec2(1, 0) * sensor_length + A.xy;\n    vec2 sensorL_pos = rot * vec2(1, 1) * sensor_length + A.xy; \n    vec2 sensorR_pos = rot * vec2(1, -1) * sensor_length + A.xy;\n    \n    // 采样栖息地 V 浓度 (来自 Buffer B)\n    float habF = texture(iChannel1, sensorF_pos / iResolution.xy).g;\n    float habL = texture(iChannel1, sensorL_pos / iResolution.xy).g;\n    float habR = texture(iChannel1, sensorR_pos / iResolution.xy).g;\n    float maxHab = max(habF, max(habL, habR));\n\n    // 采样鼠标诱饵 (来自 Buffer C)\n    float lureF = texture(iChannel2, sensorF_pos / iResolution.xy).r;\n    float lureL = texture(iChannel2, sensorL_pos / iResolution.xy).r;\n    float lureR = texture(iChannel2, sensorR_pos / iResolution.xy).r;\n    float maxLure = max(lureF, max(lureL, lureR));\n\n    // 基础漫游转向\n    A.z += (noise.x - 0.5) * 0.15;\n\n    // --- 决策树 ---\n    if (maxLure > 0.1) {\n        // A. 优先级最高：响应鼠标诱饵 (掠食/逃跑模式)\n        if (lureF > lureL && lureF > lureR) { /* 直行 */ } \n        else if (lureL > lureR) { A.z += turnfactor * 1.5; } \n        else { A.z -= turnfactor * 1.5; }\n        speed = baseSpeed * 2.5; // 兴奋加速\n    } \n    else if (maxHab > 0.05) {\n        // B. 优先级中等：趋生行为 (游向有机质浓度高的地方)\n        if (habF > habL && habF > habR) { A.z += (noise.x-0.5)*0.05; } // 在物质中轻微晃动游动\n        else if (habL > habR) { A.z += turnfactor * 0.5; } \n        else { A.z -= turnfactor * 0.5; }\n        speed = baseSpeed * (1.0 + maxHab); // 有食物时加速\n    }\n    else {\n        // C. 空旷地带：洋流漂移与随机漫游\n        if (iMouse.z > 0.0) {\n            // 鼠标点击时的全局召唤\n            vec2 dirToMouse = normalize(iMouse.xy - A.xy);\n            float angleToMouse = atan(dirToMouse.y, dirToMouse.x);\n            A.z = mix(A.z, angleToMouse, 0.05);\n            speed = baseSpeed * 1.5;\n        } else {\n            // 随洋流漂移\n            float flowAngle = fbm2D(A.xy * 0.003, iTime * 0.05) * TWOPI * 2.0; \n            A.z = mix(A.z, flowAngle, 0.08);\n            speed = baseSpeed * 0.6; // 节能模式\n        }\n    }\n    \n    // --- 3. 运动学更新 ---\n    vec2 vel = rot * vec2(speed, 0);\n    A.xy += vel * iTimeDelta;\n    \n    // 边界反弹\n    vec2 b = clamp(A.xy, vec2(0), iResolution.xy);\n    if (A.x != b.x) { A.z = TWOPI*0.5 - A.z; A.xy.x = b.x;}\n    if (A.y != b.y) { A.z = TWOPI - A.z; A.xy.y = b.y;}\n    \n    // --- 4. 生命反馈 (A.w 代表光亮强度) ---\n    // 生物在有机质丰富的地方会变得明亮健康，在空旷处黯淡\n    A.w = mix(A.w, smoothstep(0.02, 0.5, maxHab) * 1.2, 0.05);\n    if(maxLure > 0.5) A.w = 1.5; // 被诱饵激活时发出强光\n\n    // 初始化\n    if (iFrame < 5) {\n        A.xy = random2(fragCoord).xy * iResolution.xy;\n        A.z = random2(fragCoord).y * TWOPI; \n        A.w = 1.0; \n    }\n    \n    fragColor = A;\n}",
				"name": "Buffer A",
				"description": "",
				"type": "buffer"
			},
			{
				"outputs": [
					{
						"channel": 0,
						"id": "XsXGR8"
					}
				],
				"inputs": [
					{
						"channel": 0,
						"type": "buffer",
						"id": "4dXGR8",
						"filepath": "/media/previz/buffer00.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 1,
						"type": "buffer",
						"id": "XsXGR8",
						"filepath": "/media/previz/buffer01.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 2,
						"type": "buffer",
						"id": "4sXGR8",
						"filepath": "/media/previz/buffer02.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "void mainImage( out vec4 fragColor, in vec2 fragCoord ) {\n    vec2 uv = fragCoord / iResolution.xy;\n    vec2 texel = 1.0 / iResolution.xy;\n\n    // --- 1. 空间异质性参数 (生物群落调制) ---\n    // 用噪声调制 F 和 K，创造出“生物多样性”，打破全屏均匀感\n    float variantNoise = fbm2D(uv * 1.8 + iTime * 0.01, iTime * 0.005);\n    float variantNoise2 = smoothNoise2D(uv * 3.5 - iTime * 0.02);\n    \n    // F 控制“喂食率”，K 控制“消亡率”\n    // 在噪声高的区域产生斑点(Dots)，低区域产生迷宫线条(Stripes)\n    float baseF = 0.03, baseK = 0.06;\n    float F = mix(baseF - 0.005, baseF + 0.02, variantNoise); \n    float K = mix(baseK - 0.002, baseK + 0.008, variantNoise2);\n    \n    float Du = 0.2, Dv = 0.1; // 扩散速率\n\n    // --- 2. 拉普拉斯算子 ---\n    vec4 n = texture(iChannel1, uv + vec2(0,1)*texel);\n    vec4 s = texture(iChannel1, uv - vec2(0,1)*texel);\n    vec4 e = texture(iChannel1, uv + vec2(1,0)*texel);\n    vec4 w = texture(iChannel1, uv - vec2(1,0)*texel);\n    vec4 cur = texture(iChannel1, uv);\n    vec4 lap = n + s + e + w - 4.0 * cur;\n\n    // --- 3. Gray-Scott 公式更新 ---\n    float u = cur.r;\n    float v = cur.g;\n    float reaction = u * v * v;\n    \n    float nextU = u + (Du * lap.r - reaction + F * (1.0 - u));\n    float nextV = v + (Dv * lap.g + reaction - (F + K) * v);\n\n    // --- 4. 生物交互 (Buffer A 注入活性物质 V) ---\n    vec4 A = texture(iChannel0, uv);\n    float dist = distance(fragCoord, A.xy);\n    // 鱼群经过的地方会强烈激发反应，产生物质 V，A.w 控制强度\n    float injection = smoothstep(3.0, 0.0, dist) * A.w;\n    nextV += injection * 0.4;\n\n    // --- 5. 洋流漂移 (让生成的线随洋流动起来) ---\n    float flowNoise = fbm2D(uv * 1.0, iTime * 0.02);\n    vec2 drift = vec2(cos(flowNoise * TWOPI), sin(flowNoise * TWOPI)) * 0.0006;\n    vec4 advectedState = texture(iChannel1, uv - drift); \n    \n    // 结合新计算的状态与漂移状态\n    nextU = mix(clamp(nextU, 0.0, 1.0), advectedState.r, 0.05);\n    nextV = mix(clamp(nextV, 0.0, 1.0), advectedState.g, 0.05);\n\n    // B 通道存储色彩相位，随时间缓慢增长，并受活性 V 调制\n    float phase = advectedState.b + 0.001 + nextV * 0.01;\n\n    fragColor = vec4(nextU, nextV, phase, 1.0);\n    \n    // 初始化 (全屏充满 U)\n    if(iFrame < 10) fragColor = vec4(1.0, 0.0, 0.0, 1.0);\n}",
				"name": "Buffer B",
				"description": "",
				"type": "buffer"
			},
			{
				"outputs": [
					{
						"channel": 0,
						"id": "4sXGR8"
					}
				],
				"inputs": [
					{
						"channel": 0,
						"type": "buffer",
						"id": "4dXGR8",
						"filepath": "/media/previz/buffer00.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 1,
						"type": "buffer",
						"id": "XsXGR8",
						"filepath": "/media/previz/buffer01.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 2,
						"type": "buffer",
						"id": "4sXGR8",
						"filepath": "/media/previz/buffer02.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "void mainImage( out vec4 fragColor, in vec2 fragCoord ) {\n    vec2 uv = fragCoord / iResolution.xy;\n    vec4 C = texture(iChannel2, uv);\n    \n    // --- 1. 扩散与淡出 ---\n    vec2 eps = 1.0 / iResolution.xy;\n    vec4 avg = (\n        texture(iChannel2, uv + vec2(0,eps.y)) +\n        texture(iChannel2, uv - vec2(0,eps.y)) +\n        texture(iChannel2, uv + vec2(eps.x,0)) +\n        texture(iChannel2, uv - vec2(eps.x,0))\n    ) * 0.25;\n    \n    // 混合扩散并快速淡出，形成瞬时的诱饵场\n    C = mix(C, avg, 0.2) * 0.96;\n    \n    // --- 2. 鼠标点击画下诱饵 ---\n    if(iMouse.z > 0.0) {\n        float d = distance(fragCoord, iMouse.xy);\n        C.r += smoothstep(25.0, 0.0, d) * 0.5;\n    }\n    \n    fragColor = clamp(C, 0.0, 1.0);\n}",
				"name": "Buffer C",
				"description": "",
				"type": "buffer"
			}
		],
		"flags": {
			"mFlagVR": false,
			"mFlagWebcam": false,
			"mFlagSoundInput": false,
			"mFlagSoundOutput": false,
			"mFlagKeyboard": false,
			"mFlagMultipass": true,
			"mFlagMusicStream": false
		},
		"info": {
			"id": "NcXSzr",
			"date": "1775606353",
			"viewed": 59,
			"name": "Abyssal Symbiosis",
			"username": "Jingwen Zhang",
			"description": "“Abyssal Symbiosis: Bioluminescent Swarm” is an interactive generative art piece that simulates a self-organizing biological system in the extreme environment of the deep sea.",
			"likes": 4,
			"published": 1,
			"flags": 32,
			"usePreview": 0,
			"tags": [
				"datt4950",
				"digm5950"
			],
			"hasliked": 0,
			"parentid": "ffB3D3",
			"parentname": "Fork Fork Fork  catsnowyi 963"
		}
	},
	{
		"ver": "0.1",
		"renderpass": [
			{
				"outputs": [
					{
						"channel": 0,
						"id": "4dfGRr"
					}
				],
				"inputs": [
					{
						"channel": 0,
						"type": "buffer",
						"id": "4dXGR8",
						"filepath": "/media/previz/buffer00.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 1,
						"type": "buffer",
						"id": "XsXGR8",
						"filepath": "/media/previz/buffer01.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 2,
						"type": "buffer",
						"id": "4sXGR8",
						"filepath": "/media/previz/buffer02.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "// Establishes vec2 'applyZoom' that contains the zoom-in interaction\nvec2 applyZoom(vec2 uv)\n{\n    // Establishes vec2 'm' for use in the zoom-in interaction\n    vec2 m = iMouse.xy / iResolution.xy;\n\n    // The statment and following lines create the zoom-in interaction\n    if(iMouse.z <= 0.0)\n        m = vec2(0.5);\n    float zoom = (iMouse.z > 0.0) ? 2.5 : 1.0;\n    uv = (uv - m) / zoom + m;\n    return uv;\n}\n\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord)\n{\n    // Normalized pixel coordinates (from 0 to 1), keeping the image in view based on the resolution size\n    vec2 uv = fragCoord / iResolution.xy;\n    uv = applyZoom(uv);\n    \n    // Establishes vec4 'state' and floats 'chem' and 'voltage to visualize Buffer A, B, and C\n    vec4 state = texture(iChannel0, uv);\n    float chem = texture(iChannel1, uv).r;\n    float voltage = texture(iChannel2, uv).r;\n    \n    // Establishes floats 'd', 'e', and 'p' for use elsewhere in the Buffer    \n    float d = state.r;\n    float e = state.g;\n    float p = state.b;\n\n    // Establishes vec3 'col' that creates the system's colour palette\n    vec3 col = vec3(\n        0.3 + 0.2 * d,\n        0.2 + 0.8 * e,\n        0.5 + 0.5 * sin(p * 6.283)\n    );\n    \n    // Adds \"chemical\" glow through Buffer B\n    col += vec3(1.0, 0.5, 0.2) * chem * 0.8;\n\n    // Alters 'col' to stablize colours\n    col *= smoothstep(0.0, 0.8, d);\n    \n    // Alters 'col' to apply the bright \"electric\" glow\n    col += vec3(0.3, 0.8, 1.5) * voltage * 1.2;\n\n    // Sets fragColor so the system is visible\n    fragColor = vec4(col, 1.0);\n}",
				"name": "Image",
				"description": "",
				"type": "image"
			},
			{
				"outputs": [
					{
						"channel": 0,
						"id": "4dXGR8"
					}
				],
				"inputs": [
					{
						"channel": 0,
						"type": "buffer",
						"id": "4dXGR8",
						"filepath": "/media/previz/buffer00.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 1,
						"type": "buffer",
						"id": "XsXGR8",
						"filepath": "/media/previz/buffer01.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 2,
						"type": "buffer",
						"id": "4sXGR8",
						"filepath": "/media/previz/buffer02.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "void mainImage(out vec4 fragColor, in vec2 fragCoord)\n{\n    // Normalized pixel coordinates (from 0 to 1), keeping the image in view based on the resolution size\n    vec2 uv = fragCoord / iResolution.xy;\n    vec2 px = 1.0 / iResolution.xy;\n    \n    // Establishes vec4 'state' to represent the previous location/state of a given cell\n    vec4 state = texture(iChannel0, uv);\n    float chem = texture(iChannel1, uv).r;\n\n    // Establishes floats 'd', 'e', and 'p' for use elsewhere in the Buffer\n    float d = state.r;\n    float e = state.g;\n    float p = state.b;\n    \n    // Establishes float 'voltage', representing Buffer C\n    float voltage = texture(iChannel2, uv).r;\n\n    // Establishes float 'lap' which uses the laplacian float established in the common tab to represent the current Buffer\n    float lap = laplacian(iChannel0, uv, px);\n\n    // Establishes vec2 'grad' which uses the gradient vec2 established in the common tab to represent Buffer B\n    vec2 grad = gradient(iChannel1, uv, px);\n\n    // Establishes vec2 'flow' that dictates the movement of the system\n    vec2 flow = normalize(grad) * 0.1;\n    \n    // Establishes vec2 'eGrad', which uses the \"electric\" system established in Buffer C\n    vec2 eGrad = gradient(iChannel2, uv, px);\n    \n    // Establishes float 'chaosMask' for use in altering the 'flow' vec2\n    float chaosMask = noise(uv * 8.0 + iTime);\n    \n    // Applies an alteration of 'grad' and 'eGrad' to flow\n    flow += grad * mix(-0.5, 1.0, chaosMask);\n    flow += eGrad * mix(-1.0, 1.5, noise(uv * 6.0 - iTime));\n    \n    // Establishes floats related to advection, which leads to the overlapping movement found within the system\n    float advectStrength = 5.0 + 10.0 * noise(uv * 4.0 + iTime);\n    float advected = texture(iChannel0, uv - flow * px * advectStrength).r;\n\n    // Uses float 'd' in combination with the above floats to allow the system to move as it does\n    d = mix(d, advected, 0.75);\n   \n    // Establishes and utilizes floats 'pressure' and 'tension' to make the explosions more \"rough\" for lack of a better word\n    float pressure = d * d;\n    float tension  = -lap * 0.3;\n    d += pressure * 0.04;\n    d += tension;\n\n    // Establishes and utilizes 'jitter' float. Without it, the system would just be a static white after a few seconds\n    float jitter = (noise((uv) * 50.0 + iTime * 3.0) - 0.5) * 0.05;\n    d += jitter;\n\n    // Establishes and utilizes 'regrow' float that makes the bright, explosion-like cells more prevalent\n    float regrow = smoothstep(0.0, 0.2, 0.25 - d) * 0.01;\n    d += regrow;\n    \n    // Establishes 'intake', 'growth', and 'decay' floats to be used in the cell-spawning process\n    float intake = chem * 0.25;\n    float growth = d * (1.0 - d) * 0.25;\n    float decay  = 0.08 * d;\n    \n    // Alters float 'e', with the above established floats\n    e += growth + intake - decay;\n    e = clamp(e, 0.05, 1.0);\n\n    // An if statement that changes the values of 'd' and 'e' depending on their values following the above alterations\n    if(e > 0.9 && d > 0.75)\n    {\n        d *= 0.7;\n        e *= 0.7;\n    }\n\n    // The float 'p' is altered using the current state of 'd'\n    p += 0.03 + d * 0.15;\n    \n    // The float 'd' is altered to keep the system running\n    d = clamp(d, 0.0, 1.0);\n\n    // Establishes floats 'cluster' and 'spawn' for use in the current Buffer\n    float cluster = fbm((uv) * 6.0 + iTime * 0.2);\n    float spawn = smoothstep(0.75, 0.85, cluster) * step(0.9, noise(uv * 20.0 + iTime));\n    d += spawn * 0.5;\n    \n    // Establishes 'burst' float for use in the upcoming 'flow' modification\n    float burst = step(0.85, noise(uv * 3.0 + floor(iTime * 2.0)));\n    flow += vec2(\n        noise(uv * 40.0 + iTime * 5.0),\n        noise(uv * 40.0 - iTime * 5.0)\n    ) * burst * 1.5;\n    \n    // Sets fragColor so the system is visible\n    fragColor = vec4(d, e, fract(p), 1.0);\n\n}",
				"name": "Buffer A",
				"description": "",
				"type": "buffer"
			},
			{
				"outputs": [
					{
						"channel": 0,
						"id": "XsXGR8"
					}
				],
				"inputs": [
					{
						"channel": 0,
						"type": "buffer",
						"id": "XsXGR8",
						"filepath": "/media/previz/buffer01.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 1,
						"type": "buffer",
						"id": "4dXGR8",
						"filepath": "/media/previz/buffer00.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 2,
						"type": "buffer",
						"id": "4sXGR8",
						"filepath": "/media/previz/buffer02.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "void mainImage(out vec4 fragColor, in vec2 fragCoord)\n{\n    // Normalized pixel coordinates (from 0 to 1), keeping the image in view based on the resolution size\n    vec2 uv = fragCoord / iResolution.xy;\n    vec2 px = 1.0 / iResolution.xy;\n\n    // Establishes float 'heat' represent the previous location/state of a given cell, in this case, being used for the heat map\n    float heat = texture(iChannel0, uv).r;\n    float lap = laplacian(iChannel0, uv, px);\n\n    // Establishes float 'blurred' for use elsewhere in the Buffer\n    float blurred = heat + lap * 0.5;\n\n    // Establishes float 'decay', which destroys the bright cells as they move\n    float decay = 0.98;\n    blurred *= decay;\n\n    // Establishes floats 'cellDensity' and 'heatAdd' that work with Buffer A\n    float cellDensity = texture(iChannel1, uv).r;\n    float heatAdd = cellDensity * 0.05;\n    blurred += heatAdd;\n\n    // Alters 'blurred' so it is limited to a value between 0.0 and 1.0\n    blurred = clamp(blurred, 0.0, 1.0);\n\n    // Sets fragColor so the system is visible\n    fragColor = vec4(blurred,0.0,0.0,1.0);\n}",
				"name": "Buffer B",
				"description": "",
				"type": "buffer"
			},
			{
				"outputs": [
					{
						"channel": 0,
						"id": "4sXGR8"
					}
				],
				"inputs": [
					{
						"channel": 0,
						"type": "buffer",
						"id": "4sXGR8",
						"filepath": "/media/previz/buffer02.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 1,
						"type": "buffer",
						"id": "4dXGR8",
						"filepath": "/media/previz/buffer00.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "void mainImage(out vec4 fragColor, in vec2 fragCoord)\n{\n    // Normalized pixel coordinates (from 0 to 1), keeping the image in view based on the resolution size\n    vec2 uv = fragCoord / iResolution.xy;\n    vec2 px = 1.0 / iResolution.xy;\n    \n    // Establishes vec4 'state' to represent the previous location/state of a given cell\n    vec4 state = texture(iChannel0, uv);\n    \n    // Establishes floats 'v' and 'r' that represent the metaphorical \"voltage\" and \"revovery\" systems found within the Buffer\n    float v = state.r; // voltage\n    float r = state.g; // recovery\n\n    // Establishes float 'lap' which uses the laplacian float established in the common tab to represent the current Buffer\n    float lap = laplacian(iChannel0, uv, px);\n\n    // Establishes floats 'cellDensity' that works with Buffer A\n    float cellDensity = texture(iChannel1, uv).r;\n\n    // Establishes float 'stimulus' that triggers when density is in a \"sweet spot\"\n    float stimulus = smoothstep(0.3, 0.6, cellDensity) * 0.8;\n\n    // Establishes floats 'diffusion', 'excite', and 'recover' that are used to alter 'v' and 'r' later in the system\n    float diffusion = 1.2;\n    float excite    = 1.5;\n    float recover   = 0.8;\n\n    // Alters 'v' using the aboce floats\n    v += diffusion * lap;\n    v += excite * stimulus * (1.0 - r);\n\n    // Establishes natural, constant \"decay\" within 'v'\n    v *= 0.96;\n\n    // Makes 'r' increases when active\n    r += v * 0.05;\n\n    // Establishes natural, constant \"decay\" within 'r'\n    r *= 0.97;\n\n    // Clamps both 'v' and 'r' to make sure their values are between 0.0 and 1.0\n    v = clamp(v, 0.0, 1.0);\n    r = clamp(r, 0.0, 1.0);\n    \n    // Sets fragColor so the system is visible\n    fragColor = vec4(v, r, 0.0, 1.0);\n}",
				"name": "Buffer C",
				"description": "",
				"type": "buffer"
			},
			{
				"outputs": [],
				"inputs": [],
				"code": "/*\n\n218802405\nFinal Project\nGianluca Sabatini\nExplosive Skies\n\nInteractions:\nBy clicking down on the mouse, the viewer can zoom in on the system. By moving the mouse while it is held down, the visible\narea in the viewer window is changed.\n\nDescription:\n\"Explosive Skies\" is a system of conflicting forces moving in opposite directions. Each of these forces is represented by a\ngroup of cells. One of these groups take the form of dark blobs, almost resembling clouds, gliding and contorting from the\ntop right to the bottom left of the visible area. The other major group is more akin to explosions, encapsulating the system's \ndark spaces into a blinding light. These cells combust as they move, never taking up as much space as the blobs in the overall\nsystem, almost creating a light show. Colour-wise, the system most potently focuses on black and white, but the darker spaces\nhave a subtle green hue, while the bright explosions turn blue as they fizzle out. The system is a clash of forces, and a\nvisual spectacle as a result. Its unique sets of cells are very dynamic in their movement and interactions, as opposed to\nsimpler automota developed in Shadertoy.\n\nTechnical Realization:\nFor this assignment, the a novel, complex system, with a major focus on its behaviours rather than soley its visuals. Unlike\nprevious designs in Shadertoy, for this task, I started from scratch, figuring it would be the best way to develop a design\nintended to have a high level of complexity. As I developed the system further, I added additional buffers that would create\nthe \"heat map\" and \"voltage\" systems. Both systems help to enhance the potentness of the explosions, with Buffer B expanding\ntheir reach and Buffer C drastically increasing the brightness. All together, this created the striking visials present in the\nsystem, and led to it really clicking for me. Looking at it now, its flow and colour reminds me of a Y2K aesthetic, to the\npoint where I can picture techno music playing over it.\n\n*/\n\n// Defined values for use accross the common tab (use cases are self-explanitory from title)\n#define FLOW_STRENGTH    1.5\n#define ELECTRIC_FORCE   1.2\n#define TURBULENCE       0.3\n#define DIFFUSION_RATE   1.2\n#define DECAY_RATE       0.96\n\n// Establishes the float 'hash' for use in the rest of the common tab\nfloat hash(vec2 p)\n{\n    return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123);\n}\n\n// Establishes float 'noise' for use accross the common tab\nfloat noise(vec2 p)\n{\n    // Establishes vec2s 'i' and 'f', manipulations on the vec2 attributed to the float ('p')\n    vec2 i = floor(p);\n    vec2 f = fract(p);\n    \n    // Establishes floats 'a', 'b', 'c', and 'd' by manipulating the previously established vec2, 'i'\n    float a = hash(i);\n    float b = hash(i + vec2(1.0,0.0));\n    float c = hash(i + vec2(0.0,1.0));\n    float d = hash(i + vec2(1.0,1.0));\n    \n    // Establishes vec2 'u' by using multiplications of the previously established vec2, 'f'\n    vec2 u = f*f*(3.0-2.0*f);\n\n    return mix(a,b,u.x)\n         + (c-a)*u.y*(1.0-u.x)\n         + (d-b)*u.x*u.y;\n}\n\n// Establishes float 'fbm', that creates fractal noise, allowing for the richer motion present in the system\nfloat fbm(vec2 p)\n{\n    // Establishes floats 'v' and 'a' that are altered in an upcoming for loop\n    float v = 0.0;\n    float a = 0.5;\n    \n    // For loop that alters 'v', 'a', and the vec2 attributed to the float ('p')\n    for(int i = 0; i < 4; i++)\n    {\n        v += a * noise(p);\n        p *= 2.0;\n        a *= 0.5;\n    }\n    // Returns the float 'v' as a value whenever the float 'fbm' is called\n    return v;\n}\n\n// Establiahes float 'sampleR', that utilizes texture and 'uv' for use across the rest of the common tab\nfloat sampleR(sampler2D tex, vec2 uv)\n{\n    return texture(tex, uv).r;\n}\n\n// Establishes vec2 'gradient' that is a core component in Buffer A\nvec2 gradient(sampler2D tex, vec2 uv, vec2 px)\n{\n    // Establishes 'gradient' on the x axis\n    float gx = sampleR(tex, uv + vec2(px.x,0.0)) -\n               sampleR(tex, uv - vec2(px.x,0.0));\n\n    // Establishes 'gradient' on the y axis\n    float gy = sampleR(tex, uv + vec2(0.0,px.y)) -\n               sampleR(tex, uv - vec2(0.0,px.y));\n    \n    // Returns 'gx' and 'gy' in a coordinate-esque structure as the vec2 value whenever the vec2 'gradient' is called\n    return vec2(gx, gy);\n}\n\n// Establishes float 'laplacian' that is used as a core component of all 3 Buffers\nfloat laplacian(sampler2D tex, vec2 uv, vec2 px)\n{\n    // Establishes float 'sum' for use within the laplacian float\n    float sum = 0.0;\n    \n    // For loop that is used as a grid-esque setup\n    for(int x=-1; x<=1; x++)\n    for(int y=-1; y<=1; y++)\n    {\n        // Establishes vec2 'o' for use within the loop\n        vec2 o = vec2(x,y) * px;\n        \n        // Establishes float 'n' that utilizes float 'sampleR' to run through its motions while modifying 'uv' by adding\n        // the previously established vec2 'o'\n        float n = sampleR(tex, uv + o);\n        \n        // Establishes a value for float 'sum' if the loop is in its first position\n        if(x == 0 && y == 0)\n            sum -= 8.0 * n;\n        else\n            sum += n;\n    }\n    \n    // Returns 'sum' divided by 8.0 whenever the float 'laplacian' is called\n    return sum / 8.0;\n}",
				"name": "Common",
				"description": "",
				"type": "common"
			}
		],
		"flags": {
			"mFlagVR": false,
			"mFlagWebcam": false,
			"mFlagSoundInput": false,
			"mFlagSoundOutput": false,
			"mFlagKeyboard": false,
			"mFlagMultipass": true,
			"mFlagMusicStream": false
		},
		"info": {
			"id": "fcsSRM",
			"date": "1775516777",
			"viewed": 56,
			"name": "Explosive Skies",
			"username": "Gianluca Sabatini",
			"description": "GS/DIGM 5950 Final Project",
			"likes": 0,
			"published": 1,
			"flags": 32,
			"usePreview": 0,
			"tags": [
				"finalproject"
			],
			"hasliked": 0,
			"parentid": "",
			"parentname": ""
		}
	},
	{
		"ver": "0.1",
		"renderpass": [
			{
				"outputs": [
					{
						"channel": 0,
						"id": "4dfGRr"
					}
				],
				"inputs": [
					{
						"channel": 0,
						"type": "buffer",
						"id": "4dXGR8",
						"filepath": "/media/previz/buffer00.png",
						"sampler": {
							"filter": "nearest",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 1,
						"type": "buffer",
						"id": "XsXGR8",
						"filepath": "/media/previz/buffer01.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 2,
						"type": "buffer",
						"id": "4sXGR8",
						"filepath": "/media/previz/buffer02.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "void mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    vec2 uv = fragCoord / iResolution.xy;\n    vec2 m = iMouse.xy / iResolution.xy;\n\n    // zoom\n    if (iMouse.z > 0.0) {\n        float magnification = 10.0;\n        uv /= magnification;\n        uv += iMouse.xy / (iResolution.xy + (iResolution.xy / (magnification - 1.0)));\n    }\n\n    vec4 A = texture(iChannel0, uv);\n    vec4 B = texture(iChannel1, uv);\n    vec4 C = texture(iChannel2, uv);\n\n    // distance from tracked particle\n    float d = distance(uv * iResolution.xy, A.xy);\n\n    // sharper core + soft halo\n    float core = smoothstep(4.0, 0.0, d);\n    float halo = exp(-0.03 * d * d);\n\n    // trails / fields\n    float trail = length(B.rgb);\n    float sugar = length(C.rgb);\n\n    // animated palette\n    vec3 palette = 0.5 + 0.5 * cos(\n        vec3(0.0, 2.0, 4.0)\n        + iTime * 9.0\n        + sugar * 7.2\n        + trail * 1.0\n    );\n\n    // radial glow pulse\n    float pulse = 0.5 + 1.5 * sin(iTime * 12.0 - d * 0.08);\n\n    // slight screen warp from sugar field\n    vec2 warp = (C.xy - 0.5) * 0.15;\n    vec3 warpedTrail = texture(iChannel2, uv + warp).rgb;\n\n    // background nebula feel\n    vec3 bg = 0.08 + 0.05 * cos(vec3(0.0, 1.5, 3.0) + iTime + uv.xyx * 8.0);\n\n    vec3 col = bg;\n\n    // trails become iridescent\n    col += warpedTrail * palette * 1.8;\n\n    // particle body\n    col += vec3(0.0, 1.95, 0.9) * core * 6.8;\n\n    // mouse proximity \"divine spotlight\"\n    float md = distance(uv, m);\n    col += vec3(0.2, 0.4, 1.0) * exp(-20.0 * md) * 0.4;\n\n\n    fragColor = vec4(col, 1.0);\n}",
				"name": "Image",
				"description": "",
				"type": "image"
			},
			{
				"outputs": [],
				"inputs": [],
				"code": "const float TWOPI = 6.283185307179586;\n\n// create a 2D rotation matrix from an angle in radians:\nmat2 rotate2d(float angle) {\n    float s = sin(angle);\n    float c = cos(angle);\n    return mat2(\n        c, -s, \n        s, c\n    ); \n}\n\n// make a sigmoid transition of x around center with given width\nfloat sigmoid(float x, float center, float width) {\n    return 1.0 / (1.0 + exp(-(x-center)*4.0/width));\n}\n\n\n// Gaussian blur\nvec4 blur(sampler2D img, vec2 fragCoord, vec2 resolution, int N, vec2 dir) {\n    // N/2 .. N/4\n    float sigma = float(N)/3.14;   \n    float expFactor = -0.5/(sigma*sigma);\n    float weight = 1.;\n    vec4 sum = texture(img, fragCoord/resolution) * weight;\n    float weightSum = weight;\n    for (int i=1; i<=N; i++) {\n        vec2 offset = float(i) * dir;\n        float weight = exp(float(i*i) * expFactor);\n        sum += texture(img, (fragCoord + offset)/resolution) * weight;\n        sum += texture(img, (fragCoord - offset)/resolution) * weight;\n        weightSum += weight * 2.0;\n    \n    }\n    return sum / weightSum;\n}\n\n\n#define RANDOM_SCALE vec4(.1031, .1030, .0973, .1099)\n\nvec2 random2(float p) {\n    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec2 random2(vec2 p) {\n    vec3 p3 = fract(p.xyx * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec2 random2(vec3 p3) {\n    p3 = fract(p3 * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec3 random3(float p) {\n    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xxy + p3.yzz) * p3.zyx); \n}\n\nvec3 random3(vec2 p) {\n    vec3 p3 = fract(vec3(p.xyx) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yxz + 19.19);\n    return fract((p3.xxy + p3.yzz) * p3.zyx);\n}\n\nvec3 random3(vec3 p) {\n    p = fract(p * RANDOM_SCALE.xyz);\n    p += dot(p, p.yxz + 19.19);\n    return fract((p.xxy + p.yzz) * p.zyx);\n}\n\nvec4 random4(float p) {\n    vec4 p4 = fract(p * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);   \n}\n\nvec4 random4(vec2 p) {\n    vec4 p4 = fract(p.xyxy * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec3 p) {\n    vec4 p4 = fract(p.xyzx * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec4 p4) {\n    p4 = fract(p4  * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}",
				"name": "Common",
				"description": "",
				"type": "common"
			},
			{
				"outputs": [
					{
						"channel": 0,
						"id": "4dXGR8"
					}
				],
				"inputs": [
					{
						"channel": 0,
						"type": "buffer",
						"id": "4dXGR8",
						"filepath": "/media/previz/buffer00.png",
						"sampler": {
							"filter": "nearest",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 2,
						"type": "buffer",
						"id": "4sXGR8",
						"filepath": "/media/previz/buffer02.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "/*\nSTUDENT NUMBER: 220016416\nASSIGNMENT: Final Project\nNAME: Hiromune Kubayashi\nTITLE: Party Lights\n\nINTERACTION:\n- Click the mouse to zoom into the simulation.\n- Refresh to reset and observe different emergent behaviors.\n- Each particle has a unique personality, so results vary every run.\n\nCONCEPT:\nThis project explores a particle system interacting with a dynamic \"sugar landscape\" field.\nParticles move, sense their environment, and leave trails, creating a feedback loop between\nagents (particles), memory (trails), and environment (field).\n\nEach particle has its own parameters (speed, wandering, sensing distance) and a \"mood\"\nvalue that affects its behavior. Calm particles follow the field, while excited particles\nmove more chaotically.\n\nThe system produces emergent behaviors such as clustering, flowing motion, and glowing\npatterns. It demonstrates how simple local interactions can generate complex global visuals.\n\nTECHNICAL:\n- Multi-buffer system:\n  iChannel0 = particles (position, direction, mood)\n  iChannel1 = trails (decay + accumulation)\n  iChannel2 = field (diffusion + energy sources)\n\n- Key techniques:\n  - Nearest particle tracking (5x5 neighborhood)\n  - Sensor-based steering (front / left / right)\n  - Per-particle noise (consistent behavior)\n  - Mood-driven dynamics\n  - Field diffusion and decay\n\nREFERENCES:\n- AI-assisted: code structure, comments, and parameter tuning suggestions generated \nwith ChatGPT (OpenAI).\n- Inspired by and partially based on lecture examples from Professor Graham (Lab 8):\n  “Building agents from a nearest-particle tracking system”\n  https://www.shadertoy.com/view/7fl3zH\n\nFUTURE WORK:\n- Add reaction-diffusion behavior\n- Enable user interaction (inject energy with mouse)\n- Audio-reactive visuals\n- Application to projection / immersive installation\n*/\n\n\n// Each pixel tracks a single particle (agent)\n// A.xy = particle position (pixel coordinates)\n// A.z  = direction it is facing (radians)\n// A.w  = memory / mood (excitement level)\n\n// Function that selects the \"closest particle\" by comparing surrounding pixels\nvec4 getNearestParticle(vec4 A, vec2 fragCoord, vec2 offset) {\n    // Get particle data from a neighboring pixel\n    vec4 N = texture(iChannel0, (fragCoord + offset) / iResolution.xy);\n\n    // Compare distance between current particle and neighbor particle\n    float d1 = distance(fragCoord, A.xy);\n    float d2 = distance(fragCoord, N.xy);\n\n    // Return the closer particle\n    return (d2 < d1) ? N : A;\n}\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord)\n{\n    // Normalized coordinates (0–1)\n    vec2 uv = fragCoord / iResolution.xy;\n\n    // Get particle data from previous frame\n    vec4 A = texture(iChannel0, uv);\n\n    // ===== Find the nearest particle =====\n    // Search within a 5×5 neighborhood\n    for (int x = -2; x <= 2; x++) {\n        for (int y = -2; y <= 2; y++) {\n            A = getNearestParticle(A, fragCoord, vec2(float(x), float(y)));\n        }\n    }\n\n    // ===== Random values (particle-based) =====\n    // Generate noise based on particle position instead of pixel\n    // → Important so pixels tracking the same particle behave consistently\n    vec4 noise = random4(vec3(A.xy * 0.01, iTime * 0.3));\n\n    // Personality noise fixed per particle\n    vec4 idNoise = random4(vec3(floor(A.xy / 30.0), 1.234));\n\n    // ===== Per-particle personality =====\n    float baseSpeed    = mix(25.0, 90.0, idNoise.x); // base speed\n    float wander       = mix(0.05, 1.2, idNoise.y);  // tendency to wander\n    float turnfactor   = mix(0.08, 0.7, idNoise.z);  // ease of turning\n    float sensorLength = mix(6.0, 22.0, idNoise.w);  // sensing distance\n\n    // ===== Mood (excitement level) =====\n    float mood = A.w;\n\n    // ===== Forward sensors =====\n    // Rotation matrix based on particle direction\n    mat2 rot = rotate2d(A.z);\n\n    // Three sensors: forward, front-left, front-right\n    vec2 sensor0 = vec2(12.0,  0.0) * sensorLength;\n    vec2 sensor1 = vec2(12.0,  0.7) * sensorLength;\n    vec2 sensor2 = vec2(12.0, -0.7) * sensorLength;\n\n    // Compute sensor positions\n    vec2 s0 = A.xy + rot * sensor0;\n    vec2 s1 = A.xy + rot * sensor1;\n    vec2 s2 = A.xy + rot * sensor2;\n\n    // Sample environment (field)\n    vec4 F  = texture(iChannel2, s0 / iResolution.xy);\n    vec4 FL = texture(iChannel2, s1 / iResolution.xy);\n    vec4 FR = texture(iChannel2, s2 / iResolution.xy);\n\n    // ===== Field intensity =====\n    float f  = F.x;   // front\n    float fl = FL.x;  // left\n    float fr = FR.x;  // right\n\n    // Average RGB energy\n    float energyAhead = dot(F.rgb, vec3(0.333));\n\n    // Left-right difference (bias)\n    float asym = fl - fr;\n\n    // ===== Mood update =====\n    // Excited by strong fields\n    mood += energyAhead * 0.03;\n\n    // Small random spikes (twitch-like motion)\n    mood += smoothstep(0.96, 1.0, noise.x) * 0.08;\n\n    // Gradual calming (decay)\n    mood *= 0.985;\n\n    // Clamp to [0,1]\n    mood = clamp(mood, 0.0, 1.0);\n\n    // ===== Direction control =====\n    // Higher mood → more chaotic\n    float chaos = mix(0.0, 1.5, mood);\n\n    if (f > fl && f > fr) {\n        // Forward is strongest → keep going\n    } else if (f < fl && f < fr) {\n        // No clear direction → random jitter\n        A.z += wander * (noise.z - 0.5) * (1.0 + chaos);\n    } else if (fl < fr) {\n        // Right is stronger → turn right\n        A.z += turnfactor * (1.0 + 0.7 * chaos);\n    } else if (fr < fl) {\n        // Left is stronger → turn left\n        A.z -= turnfactor * (1.0 + 0.7 * chaos);\n    }\n\n    // ===== Field obedience (mood-dependent) =====\n    // calm → follow field\n    // excited → resist field\n    A.z += asym * mix(-0.12, 0.15, mood);\n\n    // ===== Small quirks (natural variation) =====\n    A.z += 0.07 * sin(iTime * 0.9 + idNoise.x * TWOPI);\n\n    // ===== Speed =====\n    float speed = baseSpeed;\n\n    // More excited → faster\n    speed *= (1.0 + 1.8 * mood);\n\n    // Also influenced by forward energy\n    speed *= mix(0.8, 1.25, smoothstep(0.02, 0.25, energyAhead));\n\n    // ===== Movement =====\n    rot = rotate2d(A.z);\n    vec2 vel = rot * vec2(speed, 0.0);\n\n    // Update position\n    A.xy += vel * iTimeDelta;\n\n    // ===== Screen edge handling =====\n    // Soft avoidance near edges\n    float margin = 20.0;\n    if (A.x < margin)                  A.z += 0.08 + 0.12 * noise.y;\n    if (A.x > iResolution.x - margin)  A.z -= 0.08 + 0.12 * noise.y;\n    if (A.y < margin)                  A.z += 0.08 + 0.12 * noise.x;\n    if (A.y > iResolution.y - margin)  A.z -= 0.08 + 0.12 * noise.x;\n\n    // Reflect if out of bounds\n    vec2 b = clamp(A.xy, vec2(0.0), iResolution.xy);\n    if (A.x != b.x) { A.z = TWOPI * 0.5 - A.z; }\n    if (A.y != b.y) { A.z = TWOPI - A.z; }\n    A.xy = b;\n\n    // Keep angle within 0–2π\n    A.z = mod(A.z, TWOPI);\n\n    // Save mood\n    A.w = mood;\n\n    // ===== Initialization =====\n    if (iFrame == 0 || (noise.x < 0.01 && noise.y < 0.01) ) {\n        float N = 50.;\n\n        // Initial position (grid-based)\n        A.xy = round(fragCoord / N) * N;\n\n        vec4 initNoise = random4(vec3(A.xy * 0.01, 0.0));\n\n        // Initial direction\n        A.z = initNoise.z * TWOPI;\n\n        // Initial mood (low)\n        A.w = initNoise.x * 0.2;\n    }\n\n    // Output particle data for next frame\n    fragColor = A;\n}",
				"name": "Buffer A",
				"description": "",
				"type": "buffer"
			},
			{
				"outputs": [
					{
						"channel": 0,
						"id": "XsXGR8"
					}
				],
				"inputs": [
					{
						"channel": 0,
						"type": "buffer",
						"id": "4dXGR8",
						"filepath": "/media/previz/buffer00.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 1,
						"type": "buffer",
						"id": "XsXGR8",
						"filepath": "/media/previz/buffer01.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "void mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    // convert pixel coordinate to normalize texture coord\n    vec2 uv = fragCoord / iResolution.xy;\n    \n    // our previous state\n    vec4 A = texture(iChannel0, uv); // the particles\n    vec4 B = texture(iChannel1, uv); // the trails\n    \n    \n    // decay:\n    B *= 0.91;\n    \n    // draw the particle\n    // get distance from this pixel to the particle it is tracking:\n    float d = distance(fragCoord, A.xy);\n    //float p = 1/d.;\n    //float p = exp(1.9*-d);\n    float p = smoothstep(1., 0., d);\n    \n    \n    B += vec4(p);\n    \n    fragColor = B;\n}",
				"name": "Buffer B",
				"description": "",
				"type": "buffer"
			},
			{
				"outputs": [
					{
						"channel": 0,
						"id": "4sXGR8"
					}
				],
				"inputs": [
					{
						"channel": 0,
						"type": "buffer",
						"id": "4dXGR8",
						"filepath": "/media/previz/buffer00.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 2,
						"type": "buffer",
						"id": "4sXGR8",
						"filepath": "/media/previz/buffer02.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "// sugar landscape (shader that generates the field / energy environment)\n\n// Gaussian blur kernel (currently unused)\nmat3 gaussBlur = mat3(\n        1, 2, 1,\n        2, 4, 2,\n        1, 2, 1\n    ) * 1.0/16.0;\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord ) {\n\n    // Normalized coordinates (0–1)\n    vec2 uv = (fragCoord / iResolution.xy);\n    \n    // Field state from previous frame (trail / sugar)\n    vec4 C = texture(iChannel2, uv);\n\n    // ===== Diffusion =====\n    // Get neighboring pixels (up, down, left, right)\n    vec4 N = texture(iChannel2, (fragCoord + vec2(0, 1)) / iResolution.xy);\n    vec4 S = texture(iChannel2, (fragCoord + vec2(0, -1)) / iResolution.xy);\n    vec4 E = texture(iChannel2, (fragCoord + vec2(1, 0)) / iResolution.xy);\n    vec4 W = texture(iChannel2, (fragCoord + vec2(-1, 0)) / iResolution.xy);\n\n    // Create \"blurring\" by averaging neighbors\n    vec4 avg = (N + S + E + W) / 4.;\n\n    // Blend current value with average → diffusion of the field\n    C = mix(C, avg, 0.);\n\n    // ===== Decay =====\n    // Gradually fades over time (memory fading)\n    C = C * 0.95;\n    \n    // ===== Writing by particles =====\n    // Get particle data\n    vec4 A = texture(iChannel0, uv);\n\n    // Distance between this pixel and the particle\n    float dist = distance(fragCoord, A.xy);\n\n    // Add to field based on distance (stronger at the center)\n    C += exp(-dist * dist);\n    \n    \n    // ===== Moving energy source (circular motion) =====\n    float a = iTime * 0.2;\n    float r = iResolution.y / 2.;\n\n    // Point moving in a circle around the center\n    vec2 p = vec2(iResolution.xy / 2.);\n    p.x += r * cos(a);\n    p.y += r * sin(a);\n\n    // Option to control position with mouse (currently disabled)\n    if (iMouse.z > 0.0) {\n        // p = iMouse.xy;\n    }\n\n    float d = distance(fragCoord, p*5.);\n    \n    // ===== Circle radius (time-varying) =====\n    float circleRadius = 100.0 + 150.0 * sin(iTime * 2.0);\n    \n    // ===== Ring structure (around particles) =====\n    // Ring based on distance (strong at a specific radius, not center)\n    float ring = exp(-0.02 * (dist - 12.0) * (dist - 12.0));\n    C += ring;\n    \n    // ===== Value clamping =====\n    // Keep field values within 0–1\n    C = clamp(C, 0., 1.);\n    \n    // ===== Soft circular energy =====\n    // Smooth-edged glowing circle\n    float circle = smoothstep(circleRadius, circleRadius - 20.0, d);\n    C += vec4(circle);\n    \n    // ===== Multiple energy sources (two moving points) =====\n    vec2 p1 = iResolution.xy * vec2(\n        0.3 + 0.3 * cos(iTime),\n        0.5 + 0.2 * sin(iTime)\n    );\n\n    vec2 p2 = iResolution.xy * vec2(\n        0.7 + 0.2 * cos(iTime * 1.3),\n        0.5 + 0.2 * sin(iTime * 0.8)\n    );\n\n    float d1 = distance(fragCoord, p1);\n    float d2 = distance(fragCoord, p2);\n\n    // Smooth glowing fields\n    float c1 = smoothstep(120.0, 10.0, d1);\n    float c2 = smoothstep(100.0, 70.0, d2);\n\n    C += vec4(c1 + c2);\n\n    // ===== Composition with camera (live or external video) =====\n    vec4 cam = texture(iChannel2, uv);\n\n    // Blend field with camera (light overlay at 0.25)\n    fragColor = mix(C, cam, 0.25);\n}",
				"name": "Buffer C",
				"description": "",
				"type": "buffer"
			}
		],
		"flags": {
			"mFlagVR": false,
			"mFlagWebcam": false,
			"mFlagSoundInput": false,
			"mFlagSoundOutput": false,
			"mFlagKeyboard": false,
			"mFlagMultipass": true,
			"mFlagMusicStream": false
		},
		"info": {
			"id": "7cBGzc",
			"date": "1775591236",
			"viewed": 20,
			"name": "Party Lights",
			"username": "HiromuneKubayashi",
			"description": "ASSIGNMENT: Final Project\nNAME: Hiromune Kubayashi\nTITLE: Party Lights",
			"likes": 0,
			"published": 1,
			"flags": 32,
			"usePreview": 0,
			"tags": [
				"datt4950"
			],
			"hasliked": 0,
			"parentid": "7ff3RX",
			"parentname": "DATT4950 lab 9"
		}
	},
	{
		"ver": "0.1",
		"renderpass": [
			{
				"outputs": [
					{
						"channel": 0,
						"id": "4dfGRr"
					}
				],
				"inputs": [
					{
						"channel": 0,
						"type": "buffer",
						"id": "4dXGR8",
						"filepath": "/media/previz/buffer00.png",
						"sampler": {
							"filter": "nearest",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 1,
						"type": "buffer",
						"id": "XsXGR8",
						"filepath": "/media/previz/buffer01.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 2,
						"type": "buffer",
						"id": "4sXGR8",
						"filepath": "/media/previz/buffer02.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 3,
						"type": "buffer",
						"id": "XdfGR8",
						"filepath": "/media/previz/buffer03.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "\n/*\n\nStudent ID: 219581438\nFinal Project\nJulia Scheerer \n\ntitle: Caterpillars and Healers\n\n\n\nDESCRIPTION:\nOverall what Assignment does:\nyellow agents: caterpillars, eat trees and blue agents/healers inspire spores and tree growth\n\nthis system is an extention of the forest fire probabilistic CA in conjunction with an agent system. \n2 types of agents to control the growth and decay of the forest. \n\n\nTECHNICAL REALIZATONS:\n\nI was able to create this system by putting the forest fire CA into what was previously the \"sugar\" buffer\nin lab 8. from here I had to decide how the agwents were going to affect the forest. \ninitially I had them attached to the lightning strikes but lightning strikes were already so rare that it wasn't\nclear thats what the agents were affecting. I then wondered what would happen if I attached them to the burning\nprobability (if near an agent check burning probabiliy otherwise don't burn). \n\nthis was decent but I had to decide on on the burn radius around each agent. I made this relativly large because \nnot every agent is automatically causing the forest to burn so I wanted the ones who were to make a statment. \nThen I attached the spore and tree growth probabilites to another set of agents that were avoiding the trees \nthese agents would promote tree growth in their current locations, this just meant randomly assigning the agents to be \nburning or growth agents and storing their type. I just reversed the attracted to trees logic for growth agents so they \navoided trees instead. \n\nfrom here it was all about balancing the probabilites for this version where they were only considered when \nan agent of the correct type was near them. this meant all probabilites needed to increase significantly overall, \nwhile still maintaning balance between growth and burning probabilites. I like the levels I settled on but feel free\nto adjust them. I think this version works because theres always some amount of burning from a decent amount of agents \nbut not too many and the regrowth is slow enough not to make the forest too dense but fast enough that the forest \nstill regrows and doesnt stay mostly dead. you could go smaller with the growth probability but I didn't want\nthis to be way too slow either. \n\n\n\nFUTURE EXTENTIONS:\nI really like the version I created but in the future I could see attaching rain probability to something. \nI could implement a version where if 2 or more agents are close to each other rain is more likly or lightning is more likely.\n\n*/\n\n\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord ) {\n    vec2 uv = (fragCoord / iResolution.xy);\n   \n    // zoom in\n    if (iMouse.z > 0.0) {\n        float magnification = 6.;\n        uv /= magnification;\n        uv += iMouse.xy / ((iResolution.xy + (iResolution.xy / (magnification - 1.0))));\n    }\n    \n    \n    // get our cell\n    vec4 A = texture(iChannel0, uv);\n    vec4 B = texture(iChannel1, uv);\n    vec4 C = texture(iChannel2, uv);\n    \n    // divide position by resolution to view in 0..1\n    \n    // get distance from this pixel to the particle it is tracking:\n    float d = distance(uv * iResolution.xy, A.xy);\n    //float p = 1/d.;\n    //float p = exp(0.3*-d);\n    float p = smoothstep(2., 0., d);\n    \n    \n    // forest:\n  \n    if (C.x == 0.5) { // if alive\n        fragColor = vec4(0, 0.5, 0, 1);\n    } else if (C.x == 1.0) { // if burning\n        fragColor = vec4(1, 0.5, 0, 1);\n    } else {\n        fragColor = vec4(0); // dead\n    }\n    \n    // trails:\n   fragColor += B;\n    // agents:\n    fragColor += vec4(p);\n    \n   \n}",
				"name": "Image",
				"description": "",
				"type": "image"
			},
			{
				"outputs": [],
				"inputs": [],
				"code": "const float TWOPI = 6.283185307179586;\n\n// make a sigmoid transition of x around center with given width\nfloat sigmoid(float x, float center, float width) {\n    return 1.0 / (1.0 + exp(-(x-center)*4.0/width));\n}\n\n\n\n///  2 out, 3 in...\nvec2 hash23(vec3 p3)\n{\n\tp3 = fract(p3 * vec3(.1031, .1030, .0973));\n    p3 += dot(p3, p3.yzx+33.33);\n    return fract((p3.xx+p3.yz)*p3.zy);\n}\n\n// create a 2D rotation matric from an angle in radians\nmat2 rotate2d(float angle){\n    float s = sin(angle);\n    float c = cos(angle);\n    return mat2(\n        c,-s,\n        s,c\n    );\n}\n\n// Gaussian blur\nvec4 blur(sampler2D img, vec2 fragCoord, vec2 resolution, int N, vec2 dir) {\n    // N/2 .. N/4\n    float sigma = float(N)/3.14;   \n    float expFactor = -0.5/(sigma*sigma);\n    float weight = 1.;\n    vec4 sum = texture(img, fragCoord/resolution) * weight;\n    float weightSum = weight;\n    for (int i=1; i<=N; i++) {\n        vec2 offset = float(i) * dir;\n        float weight = exp(float(i*i) * expFactor);\n        sum += texture(img, (fragCoord + offset)/resolution) * weight;\n        sum += texture(img, (fragCoord - offset)/resolution) * weight;\n        weightSum += weight * 2.0;\n    \n    }\n    return sum / weightSum;\n}\n\n\n#define RANDOM_SCALE vec4(.1031, .1030, .0973, .1099)\n\nvec2 random2(float p) {\n    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec2 random2(vec2 p) {\n    vec3 p3 = fract(p.xyx * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec2 random2(vec3 p3) {\n    p3 = fract(p3 * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec3 random3(float p) {\n    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xxy + p3.yzz) * p3.zyx); \n}\n\nvec3 random3(vec2 p) {\n    vec3 p3 = fract(vec3(p.xyx) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yxz + 19.19);\n    return fract((p3.xxy + p3.yzz) * p3.zyx);\n}\n\nvec3 random3(vec3 p) {\n    p = fract(p * RANDOM_SCALE.xyz);\n    p += dot(p, p.yxz + 19.19);\n    return fract((p.xxy + p.yzz) * p.zyx);\n}\n\nvec4 random4(float p) {\n    vec4 p4 = fract(p * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);   \n}\n\nvec4 random4(vec2 p) {\n    vec4 p4 = fract(p.xyxy * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec3 p) {\n    vec4 p4 = fract(p.xyzx * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec4 p4) {\n    p4 = fract(p4  * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}",
				"name": "Common",
				"description": "",
				"type": "common"
			},
			{
				"outputs": [
					{
						"channel": 0,
						"id": "4dXGR8"
					}
				],
				"inputs": [
					{
						"channel": 0,
						"type": "buffer",
						"id": "4dXGR8",
						"filepath": "/media/previz/buffer00.png",
						"sampler": {
							"filter": "nearest",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 2,
						"type": "buffer",
						"id": "4sXGR8",
						"filepath": "/media/previz/buffer02.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "\n\n\n// each pixel tracks an agent\n// .xy is the agent location (in pixels)\n// .z is the agent direction (in radians)\n\n// given current particle \"A\" at pixel `fragCoord`\n// is the particle at `fragCoord+offset` nearer? if so return that.\nvec4 getNearestParticle(vec4 A, vec2 fragCoord, vec2 offset) {\n    // get by neighbour pixel\n    vec4 N = texture(iChannel0, (fragCoord+offset)/iResolution.xy);\n    // distance from my pixel to the particle I'm tracking:\n    float d1 = distance(fragCoord, A.xy);\n    // distance from my pixel to the particle my neighbor is tracking:\n    float d2 = distance(fragCoord, N.xy);\n    // if my neighbor's particle is nearer, track that instead! \n    if (d2 < d1) { return N; } else { return A; }\n}\n\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord) {\n    // convert pixel coordinate to normalize texture coord\n    vec2 uv = fragCoord / iResolution.xy;\n    // our previous state\n    vec4 A = texture(iChannel0, uv);\n    vec4 C = texture(iChannel2, uv);\n    // make sure we are tracking the nearest particle by testing\n    // each of our nearest pixels to see if their particle is nearer\n    for (int x=-2; x<=2; x++) {\n        for (int y=-2; y<=2; y++) {\n            A = getNearestParticle(A, fragCoord, vec2(x, y));\n        }\n    }\n    \n    vec4 noise = random4(vec3(A.xy, iTime));\n    \n    float speed = 20.;\n    float sensor_length = 20.;\n    \n    // set up antenea \n    mat2 rot = rotate2d(A.z);\n    vec2 sensor0 = vec2(1,0) * sensor_length; // sensor straight ahead at the angle your moving \n    vec2 sensor1 = vec2(1,1) * sensor_length; // sensor to the right\n    vec2 sensor2 = vec2(1,-1) * sensor_length; // sensor to the left\n    vec2 sensor0_in_world = rot* sensor0+A.xy;\n    vec2 sensor1_in_world = rot* sensor1+A.xy;\n    vec2 sensor2_in_world = rot* sensor2+A.xy;\n    \n    // get the forest location\n    vec4 F = texture (iChannel2, sensor0_in_world/iResolution.xy);\n    vec4 FL = texture (iChannel2, sensor1_in_world/iResolution.xy);\n    vec4 FR = texture (iChannel2, sensor2_in_world/iResolution.xy);\n    \n  \n    if(A.w ==1.0){\n         // attracted to forest logic\n        if (F.x > FL.x && F.x > FR.x) {\n            // no change to heading\n        } else if (F.x < FL.x && F.x < FR.x) {\n            // rotate randomly left or right\n            A.z += (noise.z = 0.5);\n        } else if (FL.x < FR.x) {\n            A.z+= 1.;\n            // rotate right\n        } else if (FR.x < FL.x) {\n            // rotate left\n            A.z -=1.;\n        }\n    }\n   \n     if(A.w ==0.0){\n        // running from forest logic\n        if (F.x > FL.x && F.x > FR.x) {\n            // no change to heading\n             A.z += (noise.z = 0.5);\n        } else if (F.x < FL.x && F.x < FR.x) {\n            // rotate randomly left or right\n            //A.z += (noise.z = 0.5);\n        } else if (FL.x < FR.x) {\n            A.z-= 1.;\n            // rotate right\n        } else if (FR.x < FL.x) {\n            // rotate left\n            A.z +=1.;\n        }\n     }\n    \n    \n    rot = rotate2d(A.z);\n    // move the particle\n    // get the xy velocity from the A.z direction\n    // polar to cartesian\n    vec2 vel =  rot* vec2(speed,0);\n    // integrate velocity to position\n    A.xy += vel * iTimeDelta;\n    \n    // get the bounded position within the screen image\n    vec2 b = clamp(A.xy, vec2(0), iResolution.xy);\n    // compare the bounded and actual positions -- if they are different, reflect their orientations:\n    if (A.x != b.x) { A.z = TWOPI*0.5 - A.z; } // reflect in Y axis\n    if (A.y != b.y) { A.z = TWOPI - A.z; } // reflect in X axis\n    // also, actually clamp the position on screen\n    A.xy = b.xy; \n    \n    // initialize:\n    if (iFrame == 0) {\n        //A.xy = iResolution.xy * noise.xy;\n        // every pixel in a NxN square is tracking the same particle\n        // round the position to the nearest \"N\"\n        float N = 30.;\n        A.xy = round(fragCoord/N) * N;\n        // we have to seed the random generator using the particle's\n        // location, not the pixel location, so that all pixels agree\n        vec4 noise = random4(vec3(A.xy, iFrame));\n        A.w = noise.y<0.5 ? 1.0: 0.0;\n        \n        // direction:\n        A.z = noise.z * TWOPI;\n    }\n    \n    fragColor = A;\n}",
				"name": "Buffer A",
				"description": "",
				"type": "buffer"
			},
			{
				"outputs": [
					{
						"channel": 0,
						"id": "XsXGR8"
					}
				],
				"inputs": [
					{
						"channel": 0,
						"type": "buffer",
						"id": "4dXGR8",
						"filepath": "/media/previz/buffer00.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 1,
						"type": "buffer",
						"id": "XsXGR8",
						"filepath": "/media/previz/buffer01.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "void mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    // convert pixel coordinate to normalize texture coord\n    vec2 uv = fragCoord / iResolution.xy;\n    \n    // our previous state\n    vec4 A = texture(iChannel0, uv); // the particles\n    vec4 B = texture(iChannel1, uv); // the trails\n    \n    \n    // decay:\n    B *= 0.9;\n    \n    // draw the particle\n    // get distance from this pixel to the particle it is tracking:\n    float d = distance(fragCoord, A.xy);\n    //float p = 1/d.;\n    //float p = exp(0.3*-d);\n    float p = smoothstep(1., 0., d);\n    \n    if(p>0.0){\n        if(A.w ==0.0){\n            B += vec4(p,p,0.8,0.7); // running from forest, blue \n       \n        }else if(A.w ==1.0 ){\n        \n            B += vec4(p,p+0.9,0.0,0.4); // going towards forest \n        }\n    }\n     \n    \n    \n    B += vec4(p);\n    \n    fragColor = B;\n}",
				"name": "Buffer B",
				"description": "",
				"type": "buffer"
			},
			{
				"outputs": [
					{
						"channel": 0,
						"id": "4sXGR8"
					}
				],
				"inputs": [
					{
						"channel": 0,
						"type": "buffer",
						"id": "4dXGR8",
						"filepath": "/media/previz/buffer00.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 2,
						"type": "buffer",
						"id": "4sXGR8",
						"filepath": "/media/previz/buffer02.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "// implemented Forest fire CA\n\n// three possible states:\nfloat empty = 0.0;\nfloat tree = 0.5;\nfloat burning = 1.0;\n\n// the chance of an empty cell regrowing trees by expansion:\nfloat growth_probability = 0.04;\n// the chance of an empty cell regrowing trees by random sporing:\nfloat spore_probability = 0.02;// 0.001\n// the chance of lighting striking a cell:\nfloat lightning_probability = 0.001;\n// chance of fire spreading:\nfloat fire_probability = 0.55;\n// chance of fire going out\nfloat chance_of_rain = 0.25;\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    // normalized coordinate (0.0 to 1.0):\n    vec2 uv = fragCoord / iResolution.xy;\n\n    // get self state\n    vec4 C  = texture(iChannel2, (fragCoord+vec2( 0, 0))/iResolution.xy);\n    \n    // get state of all neighbour pixels:\n    vec4 E  = texture(iChannel2, (fragCoord+vec2( 1, 0))/iResolution.xy);\n    vec4 W  = texture(iChannel2, (fragCoord+vec2(-1, 0))/iResolution.xy);\n    vec4 N  = texture(iChannel2, (fragCoord+vec2( 0, 1))/iResolution.xy);\n    vec4 S  = texture(iChannel2, (fragCoord+vec2( 0,-1))/iResolution.xy);\n    vec4 NE = texture(iChannel2, (fragCoord+vec2( 1, 1))/iResolution.xy);\n    vec4 NW = texture(iChannel2, (fragCoord+vec2(-1, 1))/iResolution.xy);\n    vec4 SE = texture(iChannel2, (fragCoord+vec2( 1,-1))/iResolution.xy);\n    vec4 SW = texture(iChannel2, (fragCoord+vec2(-1,-1))/iResolution.xy);\n    \n    vec4 A = texture(iChannel0, uv); // the nearest agent\n    float ad = distance(A.xy, fragCoord); // distance to agent\n\n    // true if any neighbour is a tree:\n\tbool neartree = N.x == tree || E.x == tree \n\t\t\t\t|| W.x == tree || S.x == tree \n\t\t\t\t|| NE.x == tree || SE.x == tree \n\t\t\t\t|| NW.x == tree || SW.x == tree;\n\t\n\t// true if any neighbour is burning and within 10 of an agent:\n\tbool nearburning = (N.x == burning || E.x == burning \n\t\t\t\t|| W.x == burning || S.x == burning \n\t\t\t\t|| NE.x == burning || SE.x == burning \n\t\t\t\t|| NW.x == burning || SW.x == burning )&& (ad<10.) ; \n                \n    if (nearburning== true && A.w== 0.0){ // if nearest agent is a growth agent, don't burn\n        nearburning = false;\n    }\n\n    float value = C.x;\n    vec4 noise = random4(vec3(fragCoord, iTime)); \n    \n    if (value == empty) {\n\t\t// are any neighbors trees?\n\t\tif (neartree) {\t\t\t\n\t\t\t// chance of regrowing (only if near growth agent):\n\t\t\tif (noise.x < growth_probability\n             && noise.y < growth_probability && A.w==0.0&& ad<12. && A.w==0.0) {\n\t\t\t\tvalue = tree;\n\t\t\t}\n\t\t} else if (noise.z < spore_probability \n                && noise.w < spore_probability && A.w==0.0&& ad<7. && A.w==0.0) {\n\t\t\t// smaller chance of propagation by seeding:\n\t\t\tvalue = tree;\n\t\t}\n\t} else if (value == tree) {\n\t\t// are any neighbors burning?\n\t\tif (nearburning && (noise.x < fire_probability \n                         && noise.y < fire_probability)) {\n\t\t\t// if (any neighbors are burning, start burning too:\n\t\t\tvalue = burning;\n\t\t\n\t\t}else if(noise.z < lightning_probability\n                    && noise.w < lightning_probability && A.w==1.0) {\t\t\n                // otherwise, there's a small chance of catching fire due to atmostpheric conditions:\n                value = burning;\n        }\n        \n        \n\t} else if (value == burning && noise.x < chance_of_rain \n                                && noise.y < chance_of_rain) {\n\t\t// a burning tree cell becomes an empty cell\n\t\tvalue = empty;\n\t} \n    \n    // update my state:\n    fragColor = vec4(value);\n  \n   \n    if (iFrame == 0 ) {\n        fragColor = vec4(noise.x < 0.01 ? tree : empty);\n    }\n    \n    // add burning when and where mouse is pressed\n    if (iMouse.z > 0.0) {\n        // if the mouse is held, randomize some pixels near the mouse\n        if (distance(fragCoord, iMouse.xy) < 10.0) {\n            fragColor = vec4(step(0.8, noise.x));\n        }\n    } \n    \n   \n}",
				"name": "Buffer C",
				"description": "",
				"type": "buffer"
			}
		],
		"flags": {
			"mFlagVR": false,
			"mFlagWebcam": false,
			"mFlagSoundInput": false,
			"mFlagSoundOutput": false,
			"mFlagKeyboard": false,
			"mFlagMultipass": true,
			"mFlagMusicStream": false
		},
		"info": {
			"id": "sc23Wc",
			"date": "1775619727",
			"viewed": 16,
			"name": "Caterpillars and Healers",
			"username": "Julia Scheerer",
			"description": "Forest Fire CA that is controlled by an agent system. Blue void trees and causes new spores and tree growth, yellow agents are attracted to trees and cause trees to burn",
			"likes": 0,
			"published": 1,
			"flags": 32,
			"usePreview": 0,
			"tags": [
				"datt4950"
			],
			"hasliked": 0,
			"parentid": "7fBGDm",
			"parentname": "A3 Julia Scheerer"
		}
	},
	{
		"ver": "0.1",
		"renderpass": [
			{
				"outputs": [
					{
						"channel": 0,
						"id": "4dfGRr"
					}
				],
				"inputs": [
					{
						"channel": 0,
						"type": "buffer",
						"id": "4dXGR8",
						"filepath": "/media/previz/buffer00.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 1,
						"type": "buffer",
						"id": "XsXGR8",
						"filepath": "/media/previz/buffer01.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 2,
						"type": "buffer",
						"id": "4sXGR8",
						"filepath": "/media/previz/buffer02.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 3,
						"type": "buffer",
						"id": "XdfGR8",
						"filepath": "/media/previz/buffer03.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "/*\nStudent Number: 219029677\nAssignment: A4\nName: Santiago Bucio-Cano\nTitle: Ecology of Disturbance\n\nInteractions:\n- Clicking the mouse adds local resources and\n  temporarily calms disturbed regions.\n- Resetting the shader can produce different\n  long-term outcomes due to random initial states.\n- Key parameters include agent speed, sensor length,\n  nutrient diffusion, disturbance strength, and\n  orbit phase speed.\n- The system is best viewed over time, as behavior\n  emerges through cycles rather than a static frame.\n\nSystem Idea:\nThis project explores an artificial ecosystem built from multiple interacting systems. It combines a\nnearest-particle agent simulation, a trail and nutrient field, and a dynamic cellular substrate that behaves like a living membrane.\n\nAgents are divided into multiple castes with different responses to food, substrate stability, and zones of change. An orbiting source alternates\nbetween feeding and disruption phases, making the environment continuously unstable.\n\nThe substrate actively participates in the system by shaping both agent behavior and environmental conditions such as nutrient growth, disturbance,\nand trail persistence. Instead of acting as a passive background, it becomes part of the ecology, influencing where regions become stable, unstable,\nor resource-rich.\n\nInteresting Behaviors:\nThe three behavioral castes produce visibly different movement patterns. Foragers converge on resource-rich zones, settlers prefer stable\nregions, and disruptors move toward unstable or changing areas.\n\nBecause these castes coexist, the system produces mixed regions of clustering, circulation, avoidance, and interference rather than a single\nuniform pattern.\n\nThe orbiting source creates cyclical behavior. During feeding phases, agents cluster and build dense trails. During disruption phases, agents\nscatter and reorganize. This creates repeating cycles of growth, collapse, and redistribution.\n\nTechnical Realization:\nThe project uses multiple buffers. One stores agent state (position, direction, caste seed). Another stores trail accumulation. A third stores\nthe attractor field (nutrient, disturbance, phase glow). A fourth implements a cellular substrate using a stochastic neighbor-copying\nprocess inspired by Ising systems.\n\nAgents use directional sensing to guide movement based on environmental signals. Each caste applies different weights to food, stability, and change.\nThe orbiting source modifies the environment, which indirectly changes agent behavior.\n\nThe Ising-based substrate was extended beyond a visual or steering influence to directly modify the environment. It affects nutrient accumulation,\ndisturbance intensity, and trail persistence, allowing it to act as an ecological regulator.\n\nThe substrate evolves continuously, creating regions of stability, activity, and transition. These regions influence both agent movement and\nenvironmental fields, producing feedback between motion, memory, and environmental change.\n\nSources / Credits:\n- Nearest-particle tracking and trail movement\n  from course material and Lab 9.\n- Cellular substrate logic from course material\n  and Lab 4.\n- Integration, caste behavior, swim motion, and\n  ecological system design are original extensions.\n\nFuture Extensions:\nFuture work could allow castes to directly modify the substrate, creating long-term environmental memory. \nIntroducing reproduction or competition could allow the system to evolve over time. Additional orbiting sources or irregular phase\npatterns could produce more complex dynamics.\n*/\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    vec2 uv = fragCoord / iResolution.xy;\n\n    if (iMouse.z > 0.0)\n    {\n        float magnification = 4.0;\n        uv /= magnification;\n        uv += iMouse.xy / (iResolution.xy + (iResolution.xy / (magnification - 1.0)));\n    }\n\n    vec4 A = texture(iChannel0, uv);\n    vec4 B = texture(iChannel1, uv);\n    vec4 C = texture(iChannel2, uv);\n    vec4 D = texture(iChannel3, uv);\n\n    float d = distance(uv * iResolution.xy, A.xy);\n    float p = smoothstep(2.0, 0.0, d);\n\n    // Reconstruct the moving circle source from Buffer C so it is clearly visible.\n    float a = iTime * 0.18;\n    float r = iResolution.y / 3.0;\n    vec2 center = iResolution.xy * 0.5 + vec2(cos(a), sin(a)) * r;\n    float dCircle = distance(fragCoord, center);\n\n    // Bright cyan core with a white ring for contrast.\n    float circleCore = smoothstep(60.0, 0.0, dCircle);\n    float circleEdge = smoothstep(110.0, 90.0, dCircle);\n\n   // Deep blue -> bright cyan circle\n    vec3 circleCol = mix(\n        vec3(0.0, 0.08, 0.28),\n        vec3(0.0, 0.75, 1.0),\n        circleCore\n    ) * 1.7;\n\n    // Cyan edge ring\n    circleCol += vec3(0.15, 0.85, 1.0) * circleEdge * 1.1;\n\n    // Soft inner glow\n    circleCol += vec3(0.0, 0.45, 0.9) * pow(circleCore, 2.0) * 0.45;\n\n    // Pulse\n    circleCol *= 1.0 + 0.12 * sin(iTime * 2.0);\n\n    vec3 membrane = mix(\n        vec3(0.03, 0.05, 0.10),\n        vec3(0.12, 0.35, 0.55),\n        D.r\n    );\n\n    // Recently changed membrane glows a little teal.\n    membrane += vec3(0.0, 0.35, 0.45) * D.a * 0.35;\n\n    float sugarVal = C.r;\n    float disturbVal = C.g;\n    float phaseGlow = C.b;\n\n    // Food = warm amber/orange\n    vec3 sugar = vec3(0.85, 0.42, 0.08) * sugarVal * 0.65;\n    sugar += vec3(1.0, 0.55, 0.12) * pow(sugarVal, 2.0) * 0.35;\n\n    // Disturbance = purple/magenta\n    vec3 disturbance = vec3(0.55, 0.08, 0.70) * disturbVal * 0.95;\n    disturbance += vec3(0.85, 0.18, 0.90) * phaseGlow * 0.22;\n\n    // Trails = darker cool blue\n    vec3 trails = B.rgb * vec3(0.22, 0.50, 0.72) * 0.75;\n\n    vec3 agentColor;\n\n    if (A.w > 0.42 && A.w < 0.58)\n        agentColor = vec3(0.65, 0.88, 1.0);   // hybrid = pale cyan\n    else if (A.w < 0.333)\n        agentColor = vec3(1.0, 0.72, 0.18);   // forager = amber\n    else if (A.w < 0.666)\n        agentColor = vec3(0.18, 0.95, 0.45);  // settler = green\n    else\n        agentColor = vec3(0.95, 0.18, 0.72);  // disruptor = magenta\n\n    vec3 agents = agentColor * p * 0.9;\n\n    vec3 col = membrane * 0.85 + sugar + disturbance + trails + agents + circleCol;\n\n    // Lower exposure so highlights do not wash out.\n    col = 1.0 - exp(-col * 1.02);\n\n    fragColor = vec4(col, 1.0);\n}",
				"name": "Image",
				"description": "",
				"type": "image"
			},
			{
				"outputs": [
					{
						"channel": 0,
						"id": "4dXGR8"
					}
				],
				"inputs": [
					{
						"channel": 0,
						"type": "buffer",
						"id": "4dXGR8",
						"filepath": "/media/previz/buffer00.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 1,
						"type": "buffer",
						"id": "4sXGR8",
						"filepath": "/media/previz/buffer02.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 2,
						"type": "buffer",
						"id": "XdfGR8",
						"filepath": "/media/previz/buffer03.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "// Buffer A\n// This buffer controls ALL agent behavior.\n// Each pixel represents one agent.\n\n// Data stored in A:\n// A.xy = position (in pixels)\n// A.z  = direction (angle in radians)\n// A.w  = caste / personality\n\n// Caste ranges:\n// 0.0–0.33  = forager (food-seeking)\n// 0.33–0.66 = settler (stability-seeking)\n// 0.66–1.0  = disruptor (chaos-seeking)\n//\n// 0.42–0.58 = hybrid (fusion state)\n\n\n// Finds the closest agent nearby (for tracking system)\nvec4 getNearestParticle(vec4 A, vec2 fragCoord, vec2 offset)\n{\n    // Wrap coordinates so simulation loops around edges\n    vec2 wrapped = mod(fragCoord + offset + iResolution.xy, iResolution.xy);\n\n    // Sample neighbor agent\n    vec4 N = texture(iChannel0, wrapped / iResolution.xy);\n\n    // Compare distances\n    float d1 = distance(fragCoord, A.xy);\n    float d2 = distance(fragCoord, N.xy);\n\n    // Return whichever agent is closer\n    return (d2 < d1) ? N : A;\n}\n\n// Finds a nearby agent to simulate \"collision\" / fusion\nvec4 getCloseNeighbor(vec2 fragCoord, vec4 selfParticle, float radius)\n{\n    for (int x = -3; x <= 3; x++)\n    {\n        for (int y = -3; y <= 3; y++)\n        {\n            // Wrap around screen edges\n            vec2 wrapped = mod(fragCoord + vec2(x, y) + iResolution.xy,\n                               iResolution.xy);\n\n            vec4 N = texture(iChannel0, wrapped / iResolution.xy);\n\n            // Compute toroidal (wrap-around) distance\n            vec2 delta = abs(selfParticle.xy - N.xy);\n            delta = min(delta, iResolution.xy - delta);\n            float d = length(delta);\n\n            // If close enough, return this neighbor\n            if (d > 0.5 && d < radius)\n            {\n                return N;\n            }\n        }\n    }\n\n    return selfParticle;\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    vec2 uv = fragCoord / iResolution.xy;\n\n    // Current agent\n    vec4 A = texture(iChannel0, uv);\n\n  \n    // Find nearest agent (particle tracking system)\n    for (int x = -2; x <= 2; x++)\n    {\n        for (int y = -2; y <= 2; y++)\n        {\n            A = getNearestParticle(A, fragCoord, vec2(x, y));\n        }\n    }\n\n    // Random noise for variation\n    vec4 noise = random4(vec3(A.xy, iTime));\n\n    // Base movement values\n    float speed = 42.0;\n    float wander = 0.45;\n    float turnfactor = 0.42;\n    float sensor_length = 10.0;\n\n    // Determine agent type\n    float caste = floor(A.w * 3.0);\n    bool hybrid = (A.w > 0.42 && A.w < 0.58);\n\n    // Fusion / collision logic\n\n    vec4 neighbor = getCloseNeighbor(fragCoord, A, 6.0);\n\n    // Compute distance with wrapping\n    vec2 nDelta = abs(A.xy - neighbor.xy);\n    nDelta = min(nDelta, iResolution.xy - nDelta);\n    float neighborDist = length(nDelta);\n\n    float neighborCaste = floor(neighbor.w * 3.0);\n    bool neighborHybrid = (neighbor.w > 0.42 && neighbor.w < 0.58);\n\n    if (neighborDist < 4.0)\n    {\n        // Fusion rule: forager + disruptor\n        bool fusionPair =\n            ((caste < 0.5 && neighborCaste > 1.5) ||\n             (caste > 1.5 && neighborCaste < 0.5));\n\n        // Hybrid can absorb others\n        bool hybridAbsorb =\n            (hybrid && !neighborHybrid && neighborDist < 3.0);\n\n        if (fusionPair || hybridAbsorb)\n        {\n            // Pull positions together\n            A.xy = mix(A.xy, neighbor.xy, 0.08);\n\n            // Blend directions\n            A.z = mix(A.z, neighbor.z, 0.5);\n\n            // Become hybrid\n            A.w = 0.5 + 0.06 * sin(iTime + A.xy.x * 0.01 + A.xy.y * 0.01);\n\n            caste = floor(A.w * 3.0);\n            hybrid = true;\n        }\n    }\n\n    // Behavior tuning based on caste\n\n    float sugarBias;\n    float membraneBias;\n    float changeBias;\n    float tempBias;\n\n    if (hybrid)\n    {\n        // Smooth, balanced movement\n        speed = 18.0;\n        wander = 0.08;\n        turnfactor = 0.18;\n        sensor_length = 16.0;\n\n        sugarBias = 1.1;\n        membraneBias = 0.85;\n        changeBias = 0.65;\n        tempBias = 0.05;\n    }\n    else if (caste < 0.5)\n    {\n        // Foragers (fast, food-seeking)\n        speed = 54.0;\n        wander = 0.20;\n        turnfactor = 0.62;\n        sensor_length = 14.0;\n\n        sugarBias = 2.2;\n        membraneBias = 0.15;\n        changeBias = 0.10;\n        tempBias = 0.12;\n    }\n    else if (caste < 1.5)\n    {\n        // Settlers (slow, stable)\n        speed = 24.0;\n        wander = 0.10;\n        turnfactor = 0.22;\n        sensor_length = 8.0;\n\n        sugarBias = 0.65;\n        membraneBias = 1.35;\n        changeBias = -0.45;\n        tempBias = -0.20;\n    }\n    else\n    {\n        // Disruptors (fast, chaotic)\n        speed = 62.0;\n        wander = 0.82;\n        turnfactor = 0.70;\n        sensor_length = 11.0;\n\n        sugarBias = 0.55;\n        membraneBias = 0.25;\n        changeBias = 1.80;\n        tempBias = 0.42;\n    }\n\n    // Directional sensing (front, left, right)\n\n    mat2 rot = rotate2d(A.z);\n\n    vec2 sensor0 = vec2(1.0,  0.0) * sensor_length;\n    vec2 sensor1 = vec2(1.0,  1.0) * sensor_length;\n    vec2 sensor2 = vec2(1.0, -1.0) * sensor_length;\n\n    vec2 sensor0_world = mod(rot * sensor0 + A.xy + iResolution.xy, iResolution.xy);\n    vec2 sensor1_world = mod(rot * sensor1 + A.xy + iResolution.xy, iResolution.xy);\n    vec2 sensor2_world = mod(rot * sensor2 + A.xy + iResolution.xy, iResolution.xy);\n\n    // Sample environment (food + disturbance)\n    vec4 F  = texture(iChannel1, sensor0_world / iResolution.xy);\n    vec4 FL = texture(iChannel1, sensor1_world / iResolution.xy);\n    vec4 FR = texture(iChannel1, sensor2_world / iResolution.xy);\n\n    // Sample substrate\n    vec4 D0 = texture(iChannel2, sensor0_world / iResolution.xy);\n    vec4 D1 = texture(iChannel2, sensor1_world / iResolution.xy);\n    vec4 D2 = texture(iChannel2, sensor2_world / iResolution.xy);\n\n    // Combine influences into movement decisions\n    float front =\n          F.r * sugarBias\n        - F.g * 0.9\n        + D0.r * membraneBias\n        + D0.a * changeBias;\n\n    float left =\n          FL.r * sugarBias\n        - FL.g * 0.9\n        + D1.r * membraneBias\n        + D1.a * changeBias;\n\n    float right =\n          FR.r * sugarBias\n        - FR.g * 0.9\n        + D2.r * membraneBias\n        + D2.a * changeBias;\n\n    // Steering decision\n    if (front < left && front < right)\n        A.z += wander * (noise.z - 0.5);\n    else if (left < right)\n        A.z += turnfactor;\n    else if (right < left)\n        A.z -= turnfactor;\n\n    // Swim motion (adds organic movement)\n\n    float swimPhase = iTime * 4.0 + A.xy.x * 0.01;\n\n    A.z += sin(swimPhase) * 0.1;\n\n    // Move agent\n    vec2 vel = rotate2d(A.z) * vec2(speed, 0.0);\n    A.xy += vel * iTimeDelta;\n\n    // Wrap around screen (important!)\n    A.xy = mod(A.xy + iResolution.xy, iResolution.xy);\n\n \n    if (iFrame == 0)\n    {\n        float N = 28.0;\n        A.xy = round(fragCoord / N) * N;\n\n        vec4 seed = random4(vec3(A.xy, iFrame));\n        A.z = seed.z * TWOPI;\n        A.w = seed.w;\n    }\n\n    fragColor = A;\n}",
				"name": "Buffer A",
				"description": "",
				"type": "buffer"
			},
			{
				"outputs": [],
				"inputs": [],
				"code": "const float TWOPI = 6.283185307179586;\n\n// create a 2D rotation matrix from an angle in radians:\nmat2 rotate2d(float angle) {\n    float s = sin(angle);\n    float c = cos(angle);\n    return mat2(\n        c, -s, \n        s, c\n    ); \n}\n\n// make a sigmoid transition of x around center with given width\nfloat sigmoid(float x, float center, float width) {\n    return 1.0 / (1.0 + exp(-(x-center)*4.0/width));\n}\n\n\n// Gaussian blur\nvec4 blur(sampler2D img, vec2 fragCoord, vec2 resolution, int N, vec2 dir) {\n    // N/2 .. N/4\n    float sigma = float(N)/3.14;   \n    float expFactor = -0.5/(sigma*sigma);\n    float weight = 1.;\n    vec4 sum = texture(img, fragCoord/resolution) * weight;\n    float weightSum = weight;\n    for (int i=1; i<=N; i++) {\n        vec2 offset = float(i) * dir;\n        float weight = exp(float(i*i) * expFactor);\n        sum += texture(img, (fragCoord + offset)/resolution) * weight;\n        sum += texture(img, (fragCoord - offset)/resolution) * weight;\n        weightSum += weight * 2.0;\n    \n    }\n    return sum / weightSum;\n}\n\n\n#define RANDOM_SCALE vec4(.1031, .1030, .0973, .1099)\n\nvec2 random2(float p) {\n    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec2 random2(vec2 p) {\n    vec3 p3 = fract(p.xyx * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec2 random2(vec3 p3) {\n    p3 = fract(p3 * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec3 random3(float p) {\n    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xxy + p3.yzz) * p3.zyx); \n}\n\nvec3 random3(vec2 p) {\n    vec3 p3 = fract(vec3(p.xyx) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yxz + 19.19);\n    return fract((p3.xxy + p3.yzz) * p3.zyx);\n}\n\nvec3 random3(vec3 p) {\n    p = fract(p * RANDOM_SCALE.xyz);\n    p += dot(p, p.yxz + 19.19);\n    return fract((p.xxy + p.yzz) * p.zyx);\n}\n\nvec4 random4(float p) {\n    vec4 p4 = fract(p * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);   \n}\n\nvec4 random4(vec2 p) {\n    vec4 p4 = fract(p.xyxy * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec3 p) {\n    vec4 p4 = fract(p.xyzx * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec4 p4) {\n    p4 = fract(p4  * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}",
				"name": "Common",
				"description": "",
				"type": "common"
			},
			{
				"outputs": [
					{
						"channel": 0,
						"id": "XsXGR8"
					}
				],
				"inputs": [
					{
						"channel": 0,
						"type": "buffer",
						"id": "4dXGR8",
						"filepath": "/media/previz/buffer00.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 1,
						"type": "buffer",
						"id": "XsXGR8",
						"filepath": "/media/previz/buffer01.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 2,
						"type": "buffer",
						"id": "XdfGR8",
						"filepath": "/media/previz/buffer03.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "// Buffer B\n// Trail accumulation shaped by the living substrate\n// Wrapped neighbor sampling for seamless edges.\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    vec2 uv = fragCoord / iResolution.xy;\n\n    vec4 A = texture(iChannel0, uv);\n    vec4 B = texture(iChannel1, uv);\n    vec4 D = texture(iChannel2, uv);\n\n    float substrate  = D.r;\n    float activity   = D.g;\n    float transition = D.a;\n\n    vec2 coordN = mod(fragCoord + vec2(0, 1) + iResolution.xy, iResolution.xy);\n    vec2 coordS = mod(fragCoord + vec2(0,-1) + iResolution.xy, iResolution.xy);\n    vec2 coordE = mod(fragCoord + vec2(1, 0) + iResolution.xy, iResolution.xy);\n    vec2 coordW = mod(fragCoord + vec2(-1,0) + iResolution.xy, iResolution.xy);\n\n    vec4 N = texture(iChannel1, coordN / iResolution.xy);\n    vec4 S = texture(iChannel1, coordS / iResolution.xy);\n    vec4 E = texture(iChannel1, coordE / iResolution.xy);\n    vec4 W = texture(iChannel1, coordW / iResolution.xy);\n    vec4 avg = (N + S + E + W) / 4.0;\n\n    float decay = 0.988;\n    decay += substrate * 0.006;\n    decay -= activity * 0.008;\n    decay -= transition * 0.006;\n    decay = clamp(decay, 0.97, 0.995);\n\n    B *= decay;\n    B = mix(B, avg, 0.07);\n\n    vec2 delta = abs(fragCoord - A.xy);\n    delta = min(delta, iResolution.xy - delta);\n    float d = length(delta);\n\n    float p = smoothstep(1.8, 0.0, d);\n    p *= mix(0.85, 1.35, substrate);\n    B += vec4(p);\n\n    vec4 floorVal = vec4(0.002 + substrate * 0.004);\n    B = max(B, floorVal);\n\n    fragColor = clamp(B, 0.0, 1.0);\n}",
				"name": "Buffer B",
				"description": "",
				"type": "buffer"
			},
			{
				"outputs": [
					{
						"channel": 0,
						"id": "4sXGR8"
					}
				],
				"inputs": [
					{
						"channel": 0,
						"type": "buffer",
						"id": "4dXGR8",
						"filepath": "/media/previz/buffer00.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 1,
						"type": "buffer",
						"id": "4sXGR8",
						"filepath": "/media/previz/buffer02.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 2,
						"type": "buffer",
						"id": "XdfGR8",
						"filepath": "/media/previz/buffer03.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "// Buffer C\n// Sugar / attractor field\n// Influenced strongly by the living substrate in Buffer D\n//\n// R = nutrient / attractor\n// G = disturbance memory\n// B = phase glow / thermal glow\n// A = spare glow\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    vec2 uv = fragCoord / iResolution.xy;\n\n    vec4 C = texture(iChannel1, uv);\n\n    vec2 coordN = mod(fragCoord + vec2(0, 1) + iResolution.xy, iResolution.xy);\n    vec2 coordS = mod(fragCoord + vec2(0,-1) + iResolution.xy, iResolution.xy);\n    vec2 coordE = mod(fragCoord + vec2(1, 0) + iResolution.xy, iResolution.xy);\n    vec2 coordW = mod(fragCoord + vec2(-1,0) + iResolution.xy, iResolution.xy);\n\n    vec4 N = texture(iChannel1, coordN / iResolution.xy);\n    vec4 S = texture(iChannel1, coordS / iResolution.xy);\n    vec4 E = texture(iChannel1, coordE / iResolution.xy);\n    vec4 W = texture(iChannel1, coordW / iResolution.xy);\n    vec4 avg = (N + S + E + W) / 4.0;\n\n    C = mix(C, avg, 0.22);\n    C *= vec4(0.992, 0.985, 0.990, 0.985);\n\n    vec4 A = texture(iChannel0, uv);\n    vec2 delta = abs(fragCoord - A.xy);\n    delta = min(delta, iResolution.xy - delta);\n    float dist = length(delta);\n\n    C.r += exp(-dist * dist * 0.08);\n\n    vec4 D = texture(iChannel2, uv);\n\n    float substrate  = D.r;\n    float activity   = D.g;\n    float temp       = D.b;\n    float transition = D.a;\n\n    C.r += substrate * 0.025;\n    C.g += transition * 0.045;\n    C.r -= activity * 0.020;\n    C.g += activity * 0.020;\n    C.r -= temp * 0.010;\n    C.b += temp * 0.020;\n\n    // Smooth wandering motion using sin waves\n    vec2 p = vec2(\n        sin(iTime * 0.17 + 1.3),\n        cos(iTime * 0.13 + 2.1)\n    );\n\n    // Add secondary motion so it's not just a loop\n    p += vec2(\n        sin(iTime * 0.07 + 4.0),\n        cos(iTime * 0.05 + 3.2)\n    ) * 0.5;\n\n    // Normalize to screen space\n    p = p * 0.4 + 0.5;  // keep inside bounds\n    p *= iResolution.xy;\n\n    vec2 cDelta = abs(fragCoord - p);\n    cDelta = min(cDelta, iResolution.xy - cDelta);\n    float d = length(cDelta);\n\n    float circleCore = smoothstep(85.0, 0.0, d);\n    float circleRing = smoothstep(120.0, 70.0, d) - smoothstep(70.0, 40.0, d);\n\n    vec4 Dcircle = texture(iChannel2, p / iResolution.xy);\n    float circleSubstrate = Dcircle.r;\n    float circleActivity  = Dcircle.g;\n    float circleTemp      = Dcircle.b;\n    float circleChange    = Dcircle.a;\n\n    float phase = 0.5 + 0.5 * sin(iTime * 0.9);\n\n    if (phase > 0.5)\n    {\n        float feedStrength = smoothstep(0.5, 1.0, phase);\n        float feedBoost = 1.0 + circleSubstrate * 0.6 - circleActivity * 0.4;\n\n        C.r += circleCore * 0.08 * feedStrength * feedBoost;\n        C.b += circleRing * 0.04 * feedStrength;\n        C.a += circleCore * 0.02 * feedStrength;\n    }\n    else\n    {\n        float disruptStrength = smoothstep(0.5, 0.0, phase);\n        float disruptBoost = 1.0 + circleChange * 0.8 + circleTemp * 0.3;\n\n        C.r -= circleCore * 0.05 * disruptStrength;\n        C.g += circleCore * 0.10 * disruptStrength * disruptBoost;\n        C.b += circleRing * 0.05 * disruptStrength;\n    }\n\n    if (iMouse.z > 0.0)\n    {\n        vec2 mDelta = abs(fragCoord - iMouse.xy);\n        mDelta = min(mDelta, iResolution.xy - mDelta);\n        float dm = length(mDelta);\n\n        float brush = smoothstep(120.0, 0.0, dm);\n        C.r += brush * 0.05;\n        C.g *= 1.0 - brush * 0.2;\n    }\n\n    C = clamp(C, 0.0, 1.0);\n    fragColor = C;\n}",
				"name": "Buffer C",
				"description": "",
				"type": "buffer"
			},
			{
				"outputs": [
					{
						"channel": 0,
						"id": "XdfGR8"
					}
				],
				"inputs": [
					{
						"channel": 0,
						"type": "buffer",
						"id": "XdfGR8",
						"filepath": "/media/previz/buffer03.png",
						"sampler": {
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "// Buffer D\n// Living substrate / membrane\n// R = local state\n// G = flip probability\n// B = temperature\n// A = moment of change\n\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    vec2 uv = fragCoord / iResolution.xy;\n    vec4 noise = random4(vec3(fragCoord.xy, iTime));\n\n    vec2 c0  = mod(fragCoord + vec2( 0, 0) + iResolution.xy, iResolution.xy);\n    vec2 cE  = mod(fragCoord + vec2( 1, 0) + iResolution.xy, iResolution.xy);\n    vec2 cW  = mod(fragCoord + vec2(-1, 0) + iResolution.xy, iResolution.xy);\n    vec2 cN  = mod(fragCoord + vec2( 0, 1) + iResolution.xy, iResolution.xy);\n    vec2 cS  = mod(fragCoord + vec2( 0,-1) + iResolution.xy, iResolution.xy);\n    vec2 cNE = mod(fragCoord + vec2( 1, 1) + iResolution.xy, iResolution.xy);\n    vec2 cNW = mod(fragCoord + vec2(-1, 1) + iResolution.xy, iResolution.xy);\n    vec2 cSE = mod(fragCoord + vec2( 1,-1) + iResolution.xy, iResolution.xy);\n    vec2 cSW = mod(fragCoord + vec2(-1,-1) + iResolution.xy, iResolution.xy);\n\n    vec4 C  = texture(iChannel0, c0  / iResolution.xy);\n    vec4 E  = texture(iChannel0, cE  / iResolution.xy);\n    vec4 W  = texture(iChannel0, cW  / iResolution.xy);\n    vec4 N  = texture(iChannel0, cN  / iResolution.xy);\n    vec4 S  = texture(iChannel0, cS  / iResolution.xy);\n    vec4 NE = texture(iChannel0, cNE / iResolution.xy);\n    vec4 NW = texture(iChannel0, cNW / iResolution.xy);\n    vec4 SE = texture(iChannel0, cSE / iResolution.xy);\n    vec4 SW = texture(iChannel0, cSW / iResolution.xy);\n\n    float nearVals[8] = float[8](N.r, S.r, E.r, W.r, NW.r, NE.r, SW.r, SE.r);\n\n    float differences =\n          abs(C.r - N.r) + abs(C.r - S.r)\n        + abs(C.r - E.r) + abs(C.r - W.r)\n        + abs(C.r - NE.r) + abs(C.r - NW.r)\n        + abs(C.r - SE.r) + abs(C.r - SW.r);\n\n    float different = differences / 8.0;\n\n    float temperature = 0.15 + 0.85 * uv.x;\n    temperature *= 0.8 + 0.2 * sin(iTime * 0.15);\n\n    float probability = pow(max(different, 0.0001), 1.0 / max(temperature, 0.02));\n\n    if (noise.x < probability)\n    {\n        int which = int(noise.y * 8.0);\n        C.r = nearVals[which];\n        C.a = 1.0;\n    }\n    else\n    {\n        C.a = 0.0;\n    }\n\n    if (iFrame == 0)\n    {\n        C.r = noise.x;\n        C.a = 0.0;\n    }\n\n    C.g = probability;\n    C.b = temperature;\n\n    fragColor = C;\n}",
				"name": "Buffer D",
				"description": "",
				"type": "buffer"
			}
		],
		"flags": {
			"mFlagVR": false,
			"mFlagWebcam": false,
			"mFlagSoundInput": false,
			"mFlagSoundOutput": false,
			"mFlagKeyboard": false,
			"mFlagMultipass": true,
			"mFlagMusicStream": false
		},
		"info": {
			"id": "sfsXRB",
			"date": "1775614318",
			"viewed": 25,
			"name": "Ecology of Disturbance",
			"username": "Santiago Bucio-Cano",
			"description": "A multi-agent ecosystem where different behavioral castes respond to a shifting environment, producing cycles of growth, disruption, and migration across a living substrate.",
			"likes": 2,
			"published": 1,
			"flags": 32,
			"usePreview": 0,
			"tags": [
				"datt4950"
			],
			"hasliked": 0,
			"parentid": "",
			"parentname": ""
		}
	}
]