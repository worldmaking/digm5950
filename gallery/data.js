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
				"code": "/*\nStudent #: 219-243-807\nAssignment #: 1\nName: Kiana Misaghi\nTitle:After Iran's Streets\n\nImage role:\nRenderer. Maps Buffer A state to a minimal, matte look.\n\nMapping:\n- Black = empty\n- Bright blue dot = living cell\n- Soft red haze = stain after death\n*/\n\nfloat softDot(vec2 p, float r, float blur)\n{\n    float d = length(p);\n    return 1.0 - smoothstep(r, r + blur, d);\n}\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord)\n{\n    // Must match Buffer A.\n    float CELL_SIZE = 6.0;\n\n    vec2 cell  = floor(fragCoord / CELL_SIZE);\n    vec2 local = fract(fragCoord / CELL_SIZE) - 0.5;\n\n    vec2 center = (cell + 0.5) * CELL_SIZE;\n    vec2 uv = center / iResolution.xy;\n\n    vec4 S = texture(iChannel0, uv);\n\n    float alive  = S.r;\n    float energy = S.g;\n    float mem    = S.b;\n    float stain  = S.a;\n\n    vec3 col = vec3(0.0);\n\n    // Neighbor support affects brightness a bit (unity feeling).\n    vec2 stepUV = vec2(CELL_SIZE, CELL_SIZE) / iResolution.xy;\n    float neigh = 0.0;\n\n    neigh += texture(iChannel0, wrapUV(uv + vec2( 0.0,      stepUV.y))).r;\n    neigh += texture(iChannel0, wrapUV(uv + vec2( 0.0,     -stepUV.y))).r;\n    neigh += texture(iChannel0, wrapUV(uv + vec2( stepUV.x, 0.0     ))).r;\n    neigh += texture(iChannel0, wrapUV(uv + vec2(-stepUV.x, 0.0     ))).r;\n    neigh += texture(iChannel0, wrapUV(uv + vec2( stepUV.x, stepUV.y))).r;\n    neigh += texture(iChannel0, wrapUV(uv + vec2(-stepUV.x, stepUV.y))).r;\n    neigh += texture(iChannel0, wrapUV(uv + vec2( stepUV.x,-stepUV.y))).r;\n    neigh += texture(iChannel0, wrapUV(uv + vec2(-stepUV.x,-stepUV.y))).r;\n\n    float crowd01 = neigh / 8.0;\n\n    // Stain: soft red fog, not neon.\n    if (stain > 0.001) {\n        float haze = softDot(local, 0.22, 0.30) * stain;\n\n        vec3 red = vec3(1.0, 0.10, 0.12);\n        red = mix(red, vec3(dot(red, vec3(0.333))), 0.25);\n\n        col = max(col, red * 0.28 * haze);\n    }\n\n    // Living: tiny blue dot.\n    // Living: size grows with \"maturity\" (mem) + vitality (energy) + community (neighbors).\n// Living: obvious growth with maturity + energy + neighbors\nif (alive > 0.5) {\n\n    // 0..1 signals\n    float maturity  = smoothstep(0.02, 0.55, mem);       // grows earlier\n    float vitality  = smoothstep(0.15, 0.90, energy);    // strong effect\n    float together  = smoothstep(0.05, 0.60, crowd01);   // cluster effect\n\n    // MUCH bigger radius range so you can actually see it\n    // (still within the cell block so it doesn’t become neon blobs)\n    float r = 0.08\n            + 0.16 * maturity\n            + 0.10 * vitality\n            + 0.08 * together;\n\n    // breathing in size (life feel)\n    r += 0.02 * sin(iTime * 0.35 + mem * 6.283);\n\n    // matte soft edge\n    float blur = 0.20;\n\n    float m = softDot(local, r, blur);\n\n    vec3 blue = vec3(0.18, 0.82, 1.00);\n\n    // brightness still tied to energy + unity, but not psychedelic\n    float health = 0.55 + 0.45 * pow(energy, 1.10);\n    float unity  = 0.75 + 0.25 * smoothstep(0.05, 0.60, crowd01);\n\n    vec3 live = blue * health * unity;\n\n    // matte\n    live = pow(clamp(live, 0.0, 1.0), vec3(1.10));\n\n    col = max(col, live * m);\n}\n\n  \n\n    fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);\n}\n",
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
				"code": "/*\nStudent #: 219-243-807\nAssignment #: 1\nName: Kiana Misaghi\nTitle:After Iran's Streets\n\nBuffer A role:\nSimulation layer. Stores and updates the CA state (alive/energy/memory/stain).\n\nNotes:\n- iChannel0 must be set to Buffer A (feedback), with Nearest + Repeat.\n- No mouse/keyboard required.\n*/\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord)\n{\n    // Cell block size (bigger = bigger “cells” + fewer of them).\n    float CELL_SIZE = 6.0;\n\n    // Which cell we are in (coarse grid).\n    vec2 cell = floor(fragCoord / CELL_SIZE);\n\n    // Sample the stored state at the center of the cell block.\n    vec2 cellCenter = (cell + 0.5) * CELL_SIZE;\n    vec2 uv = cellCenter / iResolution.xy;\n\n    // One-cell step in UV space.\n    vec2 stepUV = vec2(CELL_SIZE, CELL_SIZE) / iResolution.xy;\n\n    // Slow motion. Higher = slower evolution.\n    const int UPDATE_EVERY = 2;\n\n    // ---------------- INIT ----------------\n    // Frame 0: black field + one founder cell in the middle.\n    if (iFrame == 0)\n    {\n        vec2 centerCell = floor((iResolution.xy * 0.5) / CELL_SIZE);\n\n        // Start with usable energy everywhere (tiny noise).\n        float baseE = 0.55 + 0.03 * (hash21(cell * 0.13) - 0.5);\n        baseE = clamp(baseE, 0.0, 1.0);\n\n        float alive  = 0.0;\n        float energy = baseE;\n        float mem    = 0.0;\n        float stain  = 0.0;\n\n        // Single founder seed.\n        if (all(equal(cell, centerCell))) {\n            alive  = 1.0;\n            energy = 0.85;\n            mem    = 0.05;\n        }\n\n        fragColor = vec4(alive, energy, mem, stain);\n        return;\n    }\n\n    // ---------------- TIME STEP ----------------\n    // Hold state on most frames so it doesn’t explode too fast.\n    if ((iFrame % UPDATE_EVERY) != 0)\n    {\n        vec4 hold = texture(iChannel0, uv);\n\n        // Let stain fade even on hold frames so it feels alive.\n        hold.a *= 0.9993;\n\n        fragColor = hold;\n        return;\n    }\n\n    // ---------------- READ CURRENT STATE ----------------\n    vec4 S = texture(iChannel0, uv);\n    float alive  = S.r;\n    float energy = S.g;\n    float mem    = S.b;\n    float stain  = S.a;\n\n    // ---------------- NEIGHBORS (alive count) ----------------\n    // Moore neighborhood (8 neighbors).\n    float n  = texture(iChannel0, wrapUV(uv + vec2( 0.0,      stepUV.y))).r;\n    float s  = texture(iChannel0, wrapUV(uv + vec2( 0.0,     -stepUV.y))).r;\n    float e  = texture(iChannel0, wrapUV(uv + vec2( stepUV.x, 0.0     ))).r;\n    float w  = texture(iChannel0, wrapUV(uv + vec2(-stepUV.x, 0.0     ))).r;\n    float ne = texture(iChannel0, wrapUV(uv + vec2( stepUV.x, stepUV.y))).r;\n    float nw = texture(iChannel0, wrapUV(uv + vec2(-stepUV.x, stepUV.y))).r;\n    float se = texture(iChannel0, wrapUV(uv + vec2( stepUV.x,-stepUV.y))).r;\n    float sw = texture(iChannel0, wrapUV(uv + vec2(-stepUV.x,-stepUV.y))).r;\n\n    float neighborsAlive = n + s + e + w + ne + nw + se + sw;\n    float crowd01 = neighborsAlive / 8.0;\n\n    // ---------------- ENERGY (diffusion + regen) ----------------\n    // Same neighborhood, but energy channel (G).\n    float eN  = texture(iChannel0, wrapUV(uv + vec2( 0.0,      stepUV.y))).g;\n    float eS  = texture(iChannel0, wrapUV(uv + vec2( 0.0,     -stepUV.y))).g;\n    float eE  = texture(iChannel0, wrapUV(uv + vec2( stepUV.x, 0.0     ))).g;\n    float eW  = texture(iChannel0, wrapUV(uv + vec2(-stepUV.x, 0.0     ))).g;\n    float eNE = texture(iChannel0, wrapUV(uv + vec2( stepUV.x, stepUV.y))).g;\n    float eNW = texture(iChannel0, wrapUV(uv + vec2(-stepUV.x, stepUV.y))).g;\n    float eSE = texture(iChannel0, wrapUV(uv + vec2( stepUV.x,-stepUV.y))).g;\n    float eSW = texture(iChannel0, wrapUV(uv + vec2(-stepUV.x,-stepUV.y))).g;\n\n    // Local average energy (like a simple diffusion step).\n    float eAvg = (energy + eN + eS + eE + eW + eNE + eNW + eSE + eSW) / 9.0;\n\n    float energyDiff  = 0.06;    // how fast energy spreads\n    float energyRegen = 0.0014;  // slow refill over time\n\n    energy = mix(energy, eAvg, energyDiff);\n    energy += energyRegen;\n\n    // Tiny variation prevents identical reruns.\n    energy += 0.0006 * (hash21(cell + float(iFrame) * 0.001) - 0.5);\n    energy = clamp(energy, 0.0, 1.0);\n\n    // ---------------- MEMORY (internal history) ----------------\n    // Stress rises when energy is low or when crowded.\n    float lowE   = 1.0 - smoothstep(0.12, 0.45, energy);\n    float crowdS = smoothstep(0.30, 0.85, crowd01);\n    float stress = clamp(0.55 * lowE + 0.45 * crowdS, 0.0, 1.0);\n\n    // Alive cells accumulate memory, especially under stress.\n    if (alive > 0.5) {\n        mem = clamp(mem + 0.0045 * (0.25 + 0.75 * stress), 0.0, 1.0);\n    } else {\n        mem = max(0.0, mem - 0.0012);\n    }\n\n    // ---------------- METABOLISM ----------------\n    // Living costs energy. Crowding/stress makes it harder to survive.\n    if (alive > 0.5) {\n        float baseCost   = 0.0022;\n        float crowdCost  = 0.0038 * crowd01;\n        float stressCost = 0.0032 * stress;\n        energy = max(0.0, energy - (baseCost + crowdCost + stressCost));\n    }\n\n    // ---------------- DEATH (local collapse) ----------------\n    // More likely when starving, or when crowded + high memory.\n    if (alive > 0.5) {\n        float starve = 1.0 - smoothstep(0.05, 0.14, energy);\n        float crush  = smoothstep(0.70, 1.00, crowd01) * mem;\n\n        float deathProb = clamp(0.03 * starve + 0.06 * crush, 0.0, 0.22);\n\n        float r = hash21(cell + vec2(float(iFrame) * 0.01, mem * 19.7));\n        if (r < deathProb) {\n            alive = 0.0;\n            stain = max(stain, 1.0);\n            energy *= 0.22;\n        }\n    }\n\n    // ---------------- BIRTH (growth near community) ----------------\n    // Needs nearby life + enough energy + not too crowded.\n    if (alive < 0.5) {\n\n        float nearLife     = smoothstep(0.8, 1.2, neighborsAlive);       // at least 1 neighbor\n        float notTooMany   = 1.0 - smoothstep(3.0, 4.0, neighborsAlive); // avoid filling interiors\n        float enoughEnergy = smoothstep(0.40, 0.70, energy);\n\n        // Death residue makes regrowth harder for a while.\n        float scarPenalty  = 1.0 - 0.55 * stain;\n\n        // Low base rate keeps it gradual.\n        float birthBase = 0.020;\n\n        // Slight boost when there’s a small supportive cluster.\n        float unityBoost = 0.85 + 0.30 * smoothstep(1.0, 3.0, neighborsAlive);\n\n        float birthProb = birthBase * nearLife * notTooMany * enoughEnergy * scarPenalty * unityBoost;\n\n        // Local randomness only.\n        birthProb *= (0.90 + 0.20 * hash21(cell + vec2(float(iFrame) * 0.002, 7.3)));\n        birthProb = clamp(birthProb, 0.0, 0.06);\n\n        float r = hash21(cell + vec2(float(iFrame) * 0.017, 99.9));\n        if (r < birthProb) {\n            alive  = 1.0;\n\n            // Newborn memory starts small.\n            mem    = 0.04 + 0.08 * hash21(cell + 13.7);\n\n            // Birth costs energy.\n            energy *= 0.86;\n\n            // Slight healing effect.\n            stain *= 0.985;\n        }\n    }\n\n    // ---------------- STAIN FADE ----------------\n    stain *= 0.9992;\n\n    fragColor = vec4(alive, energy, mem, stain);\n}\n",
				"name": "Buffer A",
				"description": "",
				"type": "buffer"
			},
			{
				"outputs": [],
				"inputs": [],
				"code": "/*\nStudent #: 219-243-807\nAssignment #: 1\nName: Kiana Misaghi\nTitle: After Iran's Streets\n\n//This state represents the violence inflicted on protesters \n//in Iran who were surrounded, attacked, and killed by the regime, \n//leaving behind zones of bloodshed and disappearance.\n//The red marks the irreversible loss caused by this brutality,\n//while the surrounding blue shows collective life persisting and\n//reorganizing in the presence of trauma rather than erasing it.\n\nInteractions / parameters:\n- No mouse/keyboard interaction required.\n- Reset / reload to see different outcomes (tiny randomness).\n- Key parameters to tweak:\n  - CELL_SIZE (Buffer A + Image): changes cell scale\n  - UPDATE_EVERY (Buffer A): slows/speeds evolution\n  - birthBase / deathProb tuning (Buffer A): changes growth vs collapse\n\nIdea (what this CA is):\nA small colony grows from a single founder cell on a black field. Cells only react locally:\nthey grow near neighbors, consume energy, build stress memory, and sometimes collapse.\nDeath leaves a fading stain that slows immediate regrowth. Over time you get clusters,\nspreading edges, local collapses, and recovery — no fixed direction, no “planned ending.”\n\nTechnical realization:\n- Buffer A stores the state (RGBA) and updates the CA.\n- Image maps state to a minimal, matte look.\n- Energy diffuses locally (chemical-ish), memory accumulates locally (history), and\n  birth/death are stochastic but based only on neighbors + internal state.\n\nSources / credits:\n- Built from course concepts: cellular automata + artificial life emergence.\n- No external code copied.\n\nPossible future extensions:\n- Multiple “species” with different metabolism\n- Signaling / gradients (chemoattraction)\n- Environmental shocks (temporary energy drought)\n- Lineage traits stored in A or extra buffer\n*/\n\n/*\nState stored in Buffer A (RGBA) per cell:\nR = alive  (0 or 1)\nG = energy (0..1) nutrient / vitality\nB = memory (0..1) accumulated stress / age\nA = stain  (0..1) local residue after death (fades)\n*/\n\nvec2 wrapUV(vec2 uv) {\n    return fract(uv);\n}\n\n// Small hash. Used for tiny variation so runs aren't identical.\nfloat hash21(vec2 p) {\n    p = fract(p * vec2(123.34, 345.45));\n    p += dot(p, p + 34.345);\n    return fract(p.x * p.y);\n}\n",
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
			"id": "wXVczV",
			"date": "1769574618",
			"viewed": 87,
			"name": "After Iran's Streets",
			"username": "Kiana Misaghi",
			"description": "This state represents the violence inflicted on protesters in Iran who were surrounded, attacked, and killed by the regime, leaving behind zones of bloodshed and disappearance.",
			"likes": 7,
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
				"code": "/*\nStudent Number: 219045111\nAssignment Number: 1\nName: Ian Hayward\nMisty Sky of Stars\n\nInteractions:\n    By clicking and dragging across the screen, the user can create more live cells. The new live cells\nbegin their life at at the maximum brightness rather than using noise. Interestingly, this seems to matter\nvery little as the new cells either quickly integrate into the rest of the piece or completely dissipate.\n    Some interesting variables that the user may want to change can be found at the top of Buffer A. They\nhave interesting effects on the are as follows:\n\n  - decayRate: This variable defines how quickly cells fade away. It is represented by a flat float value,\nwhich is subtracted from the cell's alpha value every frame. The higher this value is, the faster cells in\nthe shader will die. The lower this value is, the longer cells will live. It is recommended to change this\nvalue only in intervals of 0.0001 at a time, as it can very quickly lose stability.\n\n  - lookDistance: This variable defines how far a cell will look to find another cell to follow. This value\nis used to allow the cell to record the alpha value of a cell a certain distance away, which it will use to\nalter its own alpha value. The original reasoning for this value will be explained in the *technical reali-\nzation* section, where the original plan and pivot from said plan will be explained. The closer the value is\nto 2.4, the less texture the cellular bodies will have. The closer the value is to 2.5, the grainier the cell-\nular bodies will appear. It is recommended that users alter this variable only in intervals of 0.01 at a time.\n\n  - palette: Additionally, in the Image tab, users can change the palette variable to change the colour of\nthe cells. The Image tab uses a cosine palette to dynamically alter the colours of the cells based on their\nalpha value, and editing the palette variable will change the palette that is used. The variable accepts the\nvalues 0, 1, or 2 for cosine palettes. Anything else will display the original, uncoloured palette that is\nsent by Buffer A - though this may also be interesting to see, hence why it is still viewable.\n\nDescription:\n    This system appears to represent a sort of misty, foggy, or cloudy night sky. When the system is initialized,\nthe noise quickly transforms into gentle, slow-moving and liquidy cloud shapes. It's very satisfying to see\nthe clouds' natural movement across the screen, and how the gaps between them form and evolve. You might notice\nthat as the clouds begin to dissipate, thin streaks of the same colour begin to exit from behind the cover,\ntraveling in parallel towards the top-right corner of the screen. As the system continues to run, the clouds\nwill dissipate further until all that remains are the stars shooting across the sky. At this point, the system\nwill not evolve further.\n    \n    The glittery surface of the clouds and stars gives the system a unique and beautiful appearance. Every frame,\nthe cells' constant calculations and actions create a sparkling texture. The cosine palette provides a darker\naura surrounding the edges of the cloud bodies, providing a sense of depth. As the stars shoot across the screen,\nyou can see a dark sparkling trail follow them as well. When drawing over the scene with the mouse, the new cells\nwill quickly dissipate and give way to the same darker purple haze that is taken over by neighboring clouds.\n\n    The way the system works is by having each cell store its \"energy\" in the alpha value. The cell can read the\nalpha of its 8 neighbors, and change its own depending on those values. It will determine the \"flow\" of energy \nby taking the gradient direction of energy in its 8 neighbors, pointing towards the area with the most energy.\nThe cell then looks foward a certain distance in that direction to a cell ahead, and records the value of that\ncell's energy. By first averaging its alpha with that of its 8 neighbors, then averaging its alpha with that of\nthe cell it looked ahead to, it can help facilitate a flow of energy in that direction.\n\nTechnical Realization:\n    I originally wanted to create a system that imitates a liquidy, slow-moving body such as lava lamp bubbles\nor a network of tendrils. By using the energy gradient system, I had planned to make cells reach out to each\nother slowly to create connections between clumps of cells and slowly dissipate as they moved apart. However,\nI instead ended up with a cloudy liquid sort of body similar to this final product, which would evolve into\na series of long-trailed shooting stars as the system progressed. \n\n    I decided that although I had a different idea planned for this assignment, I wanted to go forward with \nthis as it still had interesting behaviour. It took a long time of tweaking the constants in the code, but I\nwas able to make the system last forever (screen doesn't go fully black or fully alive). Though one oddity is\nthat I was never able to figure out why the stars all fly north-east in parallel. That's purely a phenomena\nof the system, and I don't know how it happened or how to change it!\n\n    EDIT: Yeah we figured out why it acts like that in class. Crazy how a small typo can create completely\nnew and interesting behaviours! I'm glad it turned out this way because the behaviour, though created through\nan error, is very satisfying to look at.\n\nFuture ideas:\n    I would like to revisit this project and figure out how to make the streaks change direction and no longer\nbias the north-east and south-west diagonal. Now that I know the issue, I can fix it, but it will likely take\na lot of tweaking of the constant values to make it work properly, as it doesn't have a very interesting\nbehaviour when I fix the issue and leave the constants as is.\n\nCredits:\n    The random function and mouse interaction are taken from our in-class walkthroughs. The cosine palette\nformula and generator are both taken from the internet, and I have included the links to the sources where they\nare used in the code (just below, in this tab). All other code in this system has been written by my own two hands.\n\n*/\n\nconst float pi = 3.14159265359;\nconst int palette = 0; // CHANGE THIS TO CHANGE THE COLOUR! ACCEPTED VALUES: 0, 1, 2 - ANYTHING ELSE GIVES DEFAULT!\nvec3 a, b, c, d;\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    vec2 uv = fragCoord / iResolution.xy;\n    \n    // Unpack all the data carried over by the RGB\n    vec4 data = texture(iChannel0, uv);\n    vec2 gradDir = data.rg * 2.0 - 1.0; // Re-map the gradient back to -1.0 to 1.0\n    float alpha = data.a;\n    \n    // Use a cosine palette to make the colours interesting: a + b * cos(2pi(c * t * d))\n    // Formula obtained from: https://blog.djnavarro.net/posts/2025-09-14_cosine-palettes/\\\n    // Palettes generated at: https://dev.thi.ng/gradients/\n    if (palette == 0) {\n        a = vec3(0.651, 0.249, 0.780);\n        b = vec3(0.231, 0.242, 0.029);\n        c = vec3(0.742, 1.273, 0.782);\n        d = vec3(4.065, 0.687, 6.185);\n        // Calculate the colour\n        vec3 cosinePalette = a + b * cos(2.0 * pi * (c * alpha + d));\n        // Push the final colour!\n        fragColor = vec4(cosinePalette * alpha, alpha);\n    } else if (palette == 1) {\n        a = vec3(0.375, 0.378, 0.155);\n        b = vec3(0.640, 0.231, 0.669);\n        c = vec3(0.235, 0.696, 0.836);\n        d = vec3(3.241, 1.594, 4.935);\n        // Calculate the colour\n        vec3 cosinePalette = a + b * cos(2.0 * pi * (c * alpha + d));\n        // Push the final colour!\n        fragColor = vec4(cosinePalette * alpha, alpha);\n    } else if (palette == 2) {\n        a = vec3(0.277, 0.728, 0.245);\n        b = vec3(0.269, 0.162, 0.975);\n        c = vec3(1.198, 0.872, 0.777);\n        d = vec3(5.571, 1.407, 1.176);\n        // Calculate the colour\n        vec3 cosinePalette = a + b * cos(2.0 * pi * (c * alpha + d));\n        // Push the final colour!\n        fragColor = vec4(cosinePalette * alpha, alpha);\n    } else {\n        fragColor = vec4(alpha);\n    }\n}",
				"name": "Image",
				"description": "",
				"type": "image"
			},
			{
				"outputs": [],
				"inputs": [],
				"code": "// The following section of code for random vector generation was taken from the in-class examples.\n\n#define RANDOM_SCALE vec4(.1031, .1030, .0973, .1099)\n\nvec4 random4(vec3 p) {\n    vec4 p4 = fract(p.xyzx * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n",
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
				"code": "// Declare constant values to be used in calculations... Edit these for different behaviours. Avoid editing the actual code...\nconst float decayRate = 0.0095; // How fast cell energy dissipates (Default: 0.0095)\nconst float lookDistance = 2.5; // Try changing this between 2.5 and 2.4! Such a small difference makes a crazy change in the behaviour...\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    vec2 uv = fragCoord / iResolution.xy;\n    \n    //--------------------Retrieve cells--------------------\n    // Get & store current cell\n    vec4 C = texture(iChannel0, (fragCoord / iResolution.xy));\n    \n    // Get & store neighboring cells\n    vec4 N = texture(iChannel0, ((fragCoord + vec2(0, 1)) / iResolution.xy)); // North\n    vec4 NE = texture(iChannel0, ((fragCoord + vec2(1, 1)) / iResolution.xy)); // North-east\n    \n    vec4 E = texture(iChannel0, ((fragCoord + vec2(1, 0)) / iResolution.xy)); // East\n    vec4 SE = texture(iChannel0, ((fragCoord + vec2(1, -1)) / iResolution.xy)); // South-east\n    \n    vec4 S = texture(iChannel0, ((fragCoord + vec2(0, -1)) / iResolution.xy)); // South\n    vec4 SW = texture(iChannel0, ((fragCoord + vec2(-1, -1)) / iResolution.xy)); // South-west\n    \n    vec4 W = texture(iChannel0, ((fragCoord + vec2(-1, 0)) / iResolution.xy)); // West\n    vec4 NW = texture(iChannel0, ((fragCoord + vec2(-1, 1)) / iResolution.xy)); // North-west\n    \n    //----------Calculate cell & environment data----------\n    // Retrieve general neighbor data\n    float nAlphaAvg = (N.a + NE.a + E.a + SE.a + S.a + SW.a + W.a + NW.a) / 8.0;\n    float nAlphaMax = max((max(N.a, NE.a), max(E.a, SE.a)), max(max(S.a, SW.a), max(W.a, NW.a))); // max() only allows 2 params, ugh\n    \n    // More complex computation for the natural gradient direction (less weight for diagonals):\n    float dx = E.a - W.a;\n    dx += (NE.a + SE.a - NW.a - SW.a) * 0.707;\n    float dy = N.a - S.a;\n    dx += (NE.a + NW.a - SE.a - SW.a) * 0.707;\n    vec2 nAlphaGrad = vec2(dx, dy);\n    \n    // Store direction of gradient vector, avoid division by 0\n    vec2 nAlphaGradDir = normalize(nAlphaGrad+ 0.0001);\n    \n    //--------------Cell movement calculations--------------\n    float alpha = C.a; // Store alpha in a temporary variable\n    \n    // Look ahead using the gradient vector to inherit the alpha from a pixel a certain distance ahead\n    vec2 lookAhead = uv - (nAlphaGradDir * (1.0 / iResolution.xy) * lookDistance);\n    float lookAlpha = texture(iChannel0, lookAhead).a;\n    \n    // Blur the scene slightly, inheriting a tiny bit of neighbors' value to avoid it becoming pure black and white\n    alpha += (alpha - nAlphaAvg) * 0.15;\n    \n    // Mix the current pixel with the value of the pixel it looked ahead to\n    alpha = mix(alpha, lookAlpha, 0.2);\n    \n    // Boost the energy of a cell a tiny bit, but bias towards mid-range cells. \n    // Stop high-range cells from getting too high, kill low-range cells faster.\n    alpha += alpha * (1.0 - alpha) * 0.04;\n    \n    // Decay cell energy over time so it doesn't grow out of control (flat amount so cells can actually die off)\n    alpha -= decayRate;\n    \n    // Clamp cell value between 0 and 1\n    C.a = clamp(alpha, 0.0, 1.0);\n   \n    //---------------Initialization of cells---------------\n    // Generate a random vec4 for cell stats on-birth\n    vec4 noise = random4(vec3(fragCoord, iTime));\n    \n    // Initialize the cell and set colour based off alpha value\n    if (iFrame == 0) {\n        C = noise;\n        C.rgb = vec3(C.a, C.a, C.a);\n    }\n    \n    //----------------Send-off of cell data----------------\n    // Use the rgb values to sneak out the direction vector! (Map it to 0.0-1.0 so it can be fully carried over)\n    C.rgb = vec3(nAlphaGradDir * 0.5 + 0.5, 1.0);\n    fragColor = C;\n    \n    // The following section of code for mouse interaction was taken from the in-class examples with slight alterations.\n    if (iMouse.z > 0.0) {\n        // If the mouse is held, add a ton of live pixels\n        if (distance(fragCoord, iMouse.xy) < 10.0) {\n            fragColor = vec4(1.0);\n        }\n    } \n    \n}",
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
			"id": "w3VyDm",
			"date": "1769544017",
			"viewed": 84,
			"name": "Misty Sky of Stars",
			"username": "Ian Hayward",
			"description": "My cellular automata for assignment 1. Please give it a minute or two to see significant changes, as its behaviour tends to evolve slowly. If it does not change in a minute or two, reset it and try again as the behaviour differs based on the noise",
			"likes": 1,
			"published": 1,
			"flags": 32,
			"usePreview": 0,
			"tags": [
				"datt4950",
				"digm5950"
			],
			"hasliked": 0,
			"parentid": "wXKyWm",
			"parentname": "DIGM 5950 Hazy Mist"
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
				"code": "/*\nStudent number:218179226\nAssignment 1\nName:Junxi Li\nTitle: Sand Drift\n\n*/\n\nfloat occ(vec2 uv)\n{\n    return texture(iChannel0, uv).r;\n}\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord)\n{\n    vec2 res = iResolution.xy;\n    vec2 uv  = (fragCoord + 0.5) / res;\n\n    // Read occupancy: main dot\n    float o = occ(uv);\n\n    // Neighbor-based halo (keeps dots readable without increasing density)\n    vec2 px = 1.0 / res;\n\n    float halo = 0.0;\n    halo += occ(uv + vec2(px.x, 0.0));\n    halo += occ(uv - vec2(px.x, 0.0));\n    halo += occ(uv + vec2(0.0, px.y));\n    halo += occ(uv - vec2(0.0, px.y));\n    halo = clamp(halo * 0.25, 0.0, 1.0);\n\n    // Sand background colors\n    vec3 sandDark  = vec3(0.18, 0.15, 0.10);\n    vec3 sandLight = vec3(0.80, 0.70, 0.50);\n\n    float v = smoothstep(1.2, 0.2, length(uv - 0.5));\n    vec3 base = mix(sandDark, sandLight, 0.20 + 0.10 * v);\n\n    // Grain highlight color\n    vec3 grain = vec3(0.98, 0.96, 0.92);\n\n    // Grains brighten the sand background\n    vec3 col = base;\n    col = mix(col, grain, o);         \n    col += grain * (0.20 * halo);  \n\n    fragColor = vec4(col, 1.0);\n}\n",
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
				"code": "/*\nStudent number:218179226\nAssignment 1\nName:Junxi Li\n\nTitle: Sand Drift\n\nA vertical divider in the center separates two regions with different dynamics. \nParticles injected(use mouse to inject) on the left drift rightward and accumulate along the divider, \nwhile the right side continues to self evolve autonomously due to the built in emission source\n\nInteractions\n- Mouse (click or drag): inject extra “sand grains”(particles)\n\n- Automatic evolution:a continuous emission band emits particles, producing a persistent stream on the right side\n\n- Parameters can be changed to show the differences:\n  1) direction weights (wE, wN, wS, wW): from strength of left to right drift vs diffusion\n  2) mouseRadius + mouseProb: interaction “brush size” and local density\n\n\nTechnical realization:\nBuffer A runs the cellular automaton on a 2D grid where each cell stores a simple binary state: 0 = empty, 1 = grain. \nIn each update step, an occupied cell may attempt to move to one of its four neighbors (N/S/E/W), \nwith a higher chance of moving to the right to create a left to right drift. To keep the update stable when many grains move at once, \neach empty cell checks which neighbors want to enter it and accepts at most one incoming grain using a deterministic tie break. \nIf a grain moves beyond the grid boundary, it is removed. A continuous emission band ensures the system evolves even without user input.\n\nCredits:\nThe ideas and code I hinted and learned from came from the class lab：\nhttps://www.shadertoy.com/view/tcVfW3\nhttps://www.shadertoy.com/view/33ycRW\n\nFuture extension:\n- Add obstacles/terrain cells to shape flows\n*/\n\n////////////////////////////////////////////////////////////////\n\nfloat hash12(vec2 p)\n{\n    // Deterministic pseudo-random in [0,1) from position \n    vec3 p3 = fract(vec3(p.xyx) * 0.1031);\n    p3 += dot(p3, p3.yzx + 33.33);\n    return fract((p3.x + p3.y) * p3.z);\n}\n\nfloat readOccupancy(ivec2 cell, ivec2 gridSize)\n{\n    // Read occupancy from previous frame\n    if (cell.x < 0 || cell.y < 0 || cell.x >= gridSize.x || cell.y >= gridSize.y) return 0.0;\n\n    vec2 uv = (vec2(cell) + 0.5) / vec2(gridSize);\n    return texture(iChannel0, uv).r; // stored as 0 or 1\n}\n\n////////////////////////////////////////////////////////////////\n// Motion proposal: discrete direction with EAST bias\n////////////////////////////////////////////////////////////////\n\n// Direction encoding: 0=N, 1=S, 2=E, 3=W\nivec2 dirVector(int dir)\n{\n    if (dir == 0) return ivec2(0, 1);\n    if (dir == 1) return ivec2(0,-1);\n    if (dir == 2) return ivec2(1, 0);\n    return ivec2(-1,0);\n}\n\nint proposeDirection(ivec2 cell)\n{\n    // Choose a direction with a strong bias to the East for left to right drift.\n    float r = hash12(vec2(cell) + float(iFrame) * 0.071);\n\n    float wN = 0.18;\n    float wS = 0.18;\n    float wE = 0.54;\n    float wW = 0.10;\n\n    if (r < wN) return 0;\n    r -= wN;\n    if (r < wS) return 1;\n    r -= wS;\n    if (r < wE) return 2;\n    return 3;\n}\n\n////////////////////////////////////////////////////////////////\n// Conflict resolution: deterministic winner selection\n////////////////////////////////////////////////////////////////\n\nfloat tieBreakScore(ivec2 src)\n{\n    // Lower score wins\n    return hash12(vec2(src) + float(iFrame) * 0.113);\n}\n\nbool passesMoveProbability(ivec2 src, float moveProb)\n{\n    // Stochastic decision whether this particle attempts to move on this step\n    float r = hash12(vec2(src) + float(iFrame) * 0.193);\n    return r < moveProb;\n}\n\nbool proposesInto(ivec2 src, ivec2 dst)\n{\n    // True if src’s proposed direction targets dst\n    int d = proposeDirection(src);\n    ivec2 t = src + dirVector(d);\n    return (t.x == dst.x && t.y == dst.y);\n}\n\n////////////////////////////////////////////////////////////////\n// Pull scheme: compute incoming winner for an empty target cell\n////////////////////////////////////////////////////////////////\n\nfloat hasIncomingWinner(ivec2 target, ivec2 gridSize, float moveProb)\n{\n    // Target must be empty in previous frame to accept a move in\n    if (readOccupancy(target, gridSize) > 0.5) return 0.0;\n\n    ivec2 cand[4];\n    cand[0] = target + ivec2(0, 1);\n    cand[1] = target + ivec2(0,-1);\n    cand[2] = target + ivec2(1, 0);\n    cand[3] = target + ivec2(-1,0);\n\n    float best = 1e9;\n    bool found = false;\n\n    for (int i = 0; i < 4; i++)\n    {\n        ivec2 src = cand[i];\n\n        // Candidate must contain a particle\n        if (readOccupancy(src, gridSize) <= 0.5) continue;\n\n        // Candidate might choose not to move\n        if (!passesMoveProbability(src, moveProb)) continue;\n\n        // Candidate must propose exactly into this target\n        if (!proposesInto(src, target)) continue;\n\n        // If candidate's target is OOB, it leaves grid\n        int d = proposeDirection(src);\n        ivec2 t = src + dirVector(d);\n        if (t.x < 0 || t.y < 0 || t.x >= gridSize.x || t.y >= gridSize.y) continue;\n\n        // Choose deterministic winner\n        float s = tieBreakScore(src);\n        if (s < best)\n        {\n            best = s;\n            found = true;\n        }\n    }\n\n    return found ? 1.0 : 0.0;\n}\n\n////////////////////////////////////////////////////////////////\n// Determine if a particle moves out successfully (for uniqueness)\n////////////////////////////////////////////////////////////////\n\nbool movedOut(ivec2 src, ivec2 gridSize, float moveProb)\n{\n    // Only occupied cells can move out\n    if (readOccupancy(src, gridSize) <= 0.5) return false;\n\n    if (!passesMoveProbability(src, moveProb)) return false;\n\n    int d = proposeDirection(src);\n    ivec2 target = src + dirVector(d);\n\n    // Moving out of bounds deletes the particle\n    if (target.x < 0 || target.y < 0 || target.x >= gridSize.x || target.y >= gridSize.y) return true;\n\n    // Movement only possible if target was empty\n    if (readOccupancy(target, gridSize) > 0.5) return false;\n\n    // src must be the winner among all candidates proposing into its target\n    ivec2 cand[4];\n    cand[0] = target + ivec2(0, 1);\n    cand[1] = target + ivec2(0,-1);\n    cand[2] = target + ivec2(1, 0);\n    cand[3] = target + ivec2(-1,0);\n\n    float myScore = tieBreakScore(src);\n    float best = 1e9;\n    bool found = false;\n\n    for (int i = 0; i < 4; i++)\n    {\n        ivec2 other = cand[i];\n\n        if (readOccupancy(other, gridSize) <= 0.5) continue;\n        if (!passesMoveProbability(other, moveProb)) continue;\n        if (!proposesInto(other, target)) continue;\n\n        // If other would move OOB, it is not competing for this target\n        int od = proposeDirection(other);\n        ivec2 ot = other + dirVector(od);\n        if (ot.x < 0 || ot.y < 0 || ot.x >= gridSize.x || ot.y >= gridSize.y) continue;\n\n        // Target must be empty in previous frame for any move to occur\n        if (readOccupancy(target, gridSize) > 0.5) continue;\n\n        float s = tieBreakScore(other);\n        if (s < best)\n        {\n            best = s;\n            found = true;\n        }\n    }\n\n    return found && (myScore <= best + 1e-8);\n}\n\n////////////////////////////////////////////////////////////////\n// Main CA step\n////////////////////////////////////////////////////////////////\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord)\n{\n    ivec2 gridSize = ivec2(iResolution.xy);  \n    ivec2 cell     = ivec2(fragCoord.xy);   \n\n    ////////////////////////////////////////////////////////////\n    // Global parameters\n    ////////////////////////////////////////////////////////////\n\n    // Speed control: moveProb controls how often particles attempt a move\n    // stepInterval slows the whole CA by only moving every N frames\n    float moveProb     = 0.35;\n    int   stepInterval = 3;\n\n    bool doMoveStep = (stepInterval <= 1) ? true : ((iFrame % stepInterval) == 0);\n\n    // Stream source: vertical emission band\n    int   emissionBandWidth = 12;\n    float emissionRate      = 0.025;\n\n    // Initial density\n    float baseInitDensity = 0.0015;\n\n    // Mouse injection\n    float enableMouse = 1.0;\n    float mouseRadius = 20.0;\n    float mouseProb   = 0.10;\n\n    ////////////////////////////////////////////////////////////\n    // 1) Read or initialize previous occupancy\n    ////////////////////////////////////////////////////////////\n\n    float occPrev;\n\n    if (iFrame == 0)\n    {\n        // Random sparse initialization\n        float r = hash12(vec2(cell) * 1.31);\n        occPrev = (r < baseInitDensity) ? 1.0 : 0.0;\n    }\n    else\n    {\n        occPrev = readOccupancy(cell, gridSize);\n    }\n\n    ////////////////////////////////////////////////////////////\n    // 2) Automatic source\n    ////////////////////////////////////////////////////////////\n\n    int cx = gridSize.x / 2;\n    if (abs(cell.x - cx) <= emissionBandWidth)\n    {\n        // Emit particles inside the band with a small probability\n        float r = hash12(vec2(cell) + float(iFrame) * 0.29);\n        if (r < emissionRate) occPrev = 1.0;\n    }\n\n    ////////////////////////////////////////////////////////////\n    // 3) Mouse injection\n    ////////////////////////////////////////////////////////////\n\n    if (enableMouse > 0.5 && iMouse.z > 0.0)\n    {\n        // Map mouse from screen space to Buffer A cell coordinates\n        vec2 mouseCellF = (iMouse.xy / vec2(iResolution.xy)) * vec2(gridSize);\n        ivec2 mouseCell = ivec2(clamp(mouseCellF, vec2(0.0), vec2(gridSize) - 1.0));\n\n        float dist = length(vec2(cell - mouseCell));\n        if (dist <= mouseRadius)\n        {\n            // Center-weighted probability so edges are softer\n            float w = smoothstep(mouseRadius, 0.0, dist);\n\n            float r = hash12(vec2(cell) + float(iFrame) * 0.41);\n            if (r < mouseProb * w) occPrev = 1.0;\n        }\n    }\n\n    ////////////////////////////////////////////////////////////\n    // 4) Optional slow down: if not a move step, hold state\n    ////////////////////////////////////////////////////////////\n\n    if (!doMoveStep)\n    {\n\n        fragColor = vec4(occPrev, 0.0, 0.0, 1.0);\n        return;\n    }\n\n    ////////////////////////////////////////////////////////////\n    // 5) Synchronous CA update\n    ////////////////////////////////////////////////////////////\n\n    // If an incoming winner moves into this cell, it becomes occupied\n    float incoming = hasIncomingWinner(cell, gridSize, moveProb);\n\n    // An existing particle stays unless it successfully moved out\n    bool didMoveOut = movedOut(cell, gridSize, moveProb);\n\n    float occNew = 0.0;\n    if (incoming > 0.5) occNew = 1.0;\n    else if (occPrev > 0.5 && !didMoveOut) occNew = 1.0;\n\n    fragColor = vec4(occNew, 0.0, 0.0, 1.0);\n}\n",
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
			"id": "W3GyRG",
			"date": "1769383120",
			"viewed": 50,
			"name": "Sand Drift",
			"username": "Junxi Li",
			"description": "Junxi Li 218179226",
			"likes": 5,
			"published": 1,
			"flags": 32,
			"usePreview": 0,
			"tags": [
				"a1"
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
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "/*\nYour student number: 220874251\n\nThe assignment number: 1\n\nYour name: Liangdi Liu\n\nThe **title** of your work: Waves\n\nA description of any **interactions** : \nMouse click/hold: inject a local impulse (a \"drop\") at the cursor position, \nand creating expanding ripples.\n\nA **description** of the idea of the system:\nThe initial idea comes from my datt2040 project which is generate the surface of a lake in p5.js:\nhttps://editor.p5js.org/liangdi/sketches/j8WPw-Qh_\n\nThis system treats each pixel as a \"cell\" on a water surface that stores a height value. \nEach frame, the next height is computed from the current height, the previous height (memory), \nand a local neighborhood curvature term (Laplacian). \nThis is a discrete, cellular version of wave propagation: \nlocal height differences spread outward as circular ripples, and overlapping waves interfere. \nWhen two wavefronts intersect, their combined slopes create brighter \"splash\" highlights \nin the render pass, producing the impression of collisions on the surface.\n\nA description of the **technical realization**:\nThis project was implemented as a feedback-based cellular simulation \nusing a single simulation buffer A) \nEach pixel represents a cell on a water surface and stores the current height \nand the height from the previous frame. \nThis allows the system to remember past states and produce wave-like motion over time.\n\nIdeas for possible **future extensions** of the project:\n-Add obstacles/shoreline masks so waves reflect and refract around shapes instead of wrapping around edges.\n-Add wind/current so ripples drift and stretch over time.\n\nImage: Render water ripples from Buffer A\n\nReads:\n- R: height h(t)\n- G: previous height\n*/\n\nvec4 S(vec2 uv){ return texture(iChannel0, uv); }\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord)\n{\n    vec2 uv = fragCoord / iResolution.xy;\n\n    vec2 px = 1.0 / iResolution.xy;\n\n    float h  = S(uv).r;\n    float hE = S(uv + vec2(px.x, 0)).r;\n    float hW = S(uv - vec2(px.x, 0)).r;\n    float hN = S(uv + vec2(0, px.y)).r;\n    float hS = S(uv - vec2(0, px.y)).r;\n\n    float dx = (hE - hW);\n    float dy = (hN - hS);\n    float slope = length(vec2(dx, dy));\n\n    //  blue lake background\n    vec3 deep = vec3(0.02, 0.20, 0.55);\n    vec3 mid  = vec3(0.08, 0.55, 0.95);\n    vec3 base = mix(deep, mid, smoothstep(0.0, 1.0, uv.y));\n\n    // Fake normal lighting for water sheen\n    vec3 n = normalize(vec3(-dx*22.0, -dy*22.0, 1.0));\n    vec3 l = normalize(vec3(-0.25, 0.55, 1.0));\n    float diff = clamp(dot(n, l), 0.0, 1.0);\n\n    //Thin ring lines\n  \n    float lineWidth = 0.010;               \n    float nearZero  = 1.0 - smoothstep(0.0, lineWidth, abs(h));\n    float waveFront = smoothstep(0.004, 0.030, slope);\n    float rings = nearZero * waveFront;\n\n    //Splash \n    // Use high slope as \"spray\"\n    float foam = smoothstep(0.035, 0.085, slope);\n    // Emphasize foam mainly on/near ring lines\n    foam *= smoothstep(0.15, 0.85, rings + 0.25);\n\n    // Compose\n    vec3 col = base;\n\n    // water shading\n    col *= (0.70 + 0.55*diff);\n\n    // ring highlights\n    col += rings * vec3(1.10);\n\n    // foam highlights \n    col += foam * vec3(1.25, 1.28, 1.35);\n\n    // subtle vignette\n    vec2 p = uv - 0.5;\n    float vign = smoothstep(0.95, 0.25, dot(p,p)*1.7);\n    col *= vign;\n\n    fragColor = vec4(col, 1.0);\n}\n",
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
				"code": "/*\nBuffer A: Water surface simulation \nState:\n- R: height at time t\n- G: height at time t-1\n*/\n\nfloat hash21(vec2 p){\n    p = fract(p * vec2(123.34, 456.21));\n    p += dot(p, p + 34.345);\n    return fract(p.x * p.y);\n}\n\n// Wrap sampling so edges connect \nfloat readH(vec2 fc, vec2 of){\n    vec2 p = fc + of;\n    p = mod(p + iResolution.xy, iResolution.xy);\n    return texture(iChannel0, p / iResolution.xy).r;\n}\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord)\n{\n    vec4 C = texture(iChannel0, fragCoord / iResolution.xy);\n    float h  = C.r; // current\n    float hp = C.g; // previous\n\n    float hE  = readH(fragCoord, vec2( 1, 0));\n    float hW  = readH(fragCoord, vec2(-1, 0));\n    float hN  = readH(fragCoord, vec2( 0, 1));\n    float hS  = readH(fragCoord, vec2( 0,-1));\n    \n    float hNE = readH(fragCoord, vec2( 1, 1));\n    float hNW = readH(fragCoord, vec2(-1, 1));\n    float hSE = readH(fragCoord, vec2( 1,-1));\n    float hSW = readH(fragCoord, vec2(-1,-1));\n\n    // 9-point (more isotropic) Laplacian stencil\n    float lap = (4.0*(hN + hS + hE + hW) + (hNE + hNW + hSE + hSW) - 20.0*h) / 6.0;\n\n\n    // Parameters\n    float speed = 0.70;   // wave speed (0.3~1.0)\n    float damp  = 0.996;  // damping (0.990~0.999)\n\n    // Wave update\n    float hn = (2.0*h - hp + speed*lap) * damp;\n\n    // Mouse: short impulse (still continuous if held, but much gentler)\n    if (iMouse.z > 0.0) {\n        float d = distance(fragCoord, iMouse.xy);\n        float r = 9.0;\n        float amp = 0.22;  \n        float bump = smoothstep(r, 0.0, d);\n        hn -= bump * amp;\n    }\n\n    // Random rain: ONLY trigger briefly each tick, not every frame\n    float rate = 3.0;                      \n    float phase = fract(iTime * rate);\n    float tick  = floor(iTime * rate);\n\n    // Very short window => true impulse\n    float trigger = (phase < 0.03) ? 1.0 : 0.0;\n\n    vec2 rnd  = vec2(hash21(vec2(tick, 12.3)), hash21(vec2(45.6, tick)));\n    vec2 drop = rnd * iResolution.xy;\n\n    float dd = distance(fragCoord, drop);\n    float rr = 6.0;\n    float ampR = 0.35;\n    hn -= smoothstep(rr, 0.0, dd) * ampR * trigger;\n\n    // Init\n    if (iFrame == 0) {\n        hn = 0.0;\n        h  = 0.0;\n    }\n\n    fragColor = vec4(hn, h, 0.0, 1.0);\n}\n",
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
			"id": "wcKBWc",
			"date": "1767736078",
			"viewed": 44,
			"name": "Waves",
			"username": "Liangdi Liu",
			"description": "DATT4950 Assignment 1: Cellular Automata on Shadertoy ",
			"likes": 1,
			"published": 1,
			"flags": 32,
			"usePreview": 0,
			"tags": [
				"2d"
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
							"filter": "linear",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "void mainImage(out vec4 fragColor, in vec2 fragCoord)\n{\n    // Convert pixel coordinates to normalized UV space (0–1)\n    vec2 uv = fragCoord / iResolution.xy;\n\n    // ---- Zoom interaction ----\n    // When the mouse button is held, zoom in around the mouse position\n    if(iMouse.z > 0.0){\n        vec2 m = iMouse.xy / iResolution.xy;   // Mouse position in UV space\n        uv = (uv - m) / 5.0 + m;               // Scale around mouse (zoom factor = 5)\n    }\n\n    // Sample the simulation buffer (previous frame)\n    // R = infection intensity\n    // G = memory / age\n    // B = pulse (state change flash)\n    vec4 C = texture(iChannel0, uv);\n\n    // Normalize and enhance visibility using tone curves\n    float inf = pow(clamp(C.r / 2.0, 0.0, 1.0), 0.55);  // Infection\n    float mem = pow(clamp(C.g,        0.0, 1.0), 0.40);  // Memory\n    float pul = clamp(C.b, 0.0, 1.0);                   // Pulse\n    \n    vec3 col = vec3(0.04, 0.32, 0.28) * mem +\n           vec3(0.35, 1.09, 0.90) * inf;\n           \n    // Depth\n    col *= mix(0.45, 1.15, mem);\n    \n    // Global brightness dow\n    col -= 0.7;\n    \n    // Foam\n    col += pul * vec3(1.0) * 0.6;\n    \n    // Contrast\n    col = pow(col, vec3(0.70));\n    \n    col = clamp(col, 0.0, 1.0);\n    fragColor = vec4(col, 1.0);\n\n\n\n}\n",
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
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					},
					{
						"channel": 1,
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
				"code": "/*\nSTUDENT NUMBER: 220016416\nASSIGNMENT: 1\nNAME: Hiromune Kubayashi\nTITLE: Niagara River\n\nINTERACTIONS / PARAMETERS:\n- Mouse (hold): zoom in on the simulation (centered on cursor).\n- Spacebar: reset the simulation with a new random initial state.\n\nInteresting parameters:\n- FRAME_DIV: controls simulation speed (higher = slower, easier to observe).\n- waveSpeed / waveFreq: control wave motion and pattern density.\n- sickness_rate: changes overall growth intensity and mood.\n- nearbyinfection weights: affect how strongly infection spreads.\n- agingDecay (G): controls how long memory trails remain.\n- change + fade (B): controls transition flash strength.\n\nIDEA / SYSTEM DESCRIPTION:\nThis project is a slow cellular-automaton–like an infection system with memory.\nEach pixel stores infection strength (R), accumulated history (G), and a short \ntransition pulse (B).　\n\nThe slow update rate allows patterns to be observed clearly over time, supporting \ndrifting structures, cycles of growth and decay, and persistent traces of past motion.\n\nSOURCES / CREDITS:\n- Professor Graham’s lecture code (Hodgepodge Machine):\n  https://www.shadertoy.com/view/3XcyRs\n- ChatGPT: explanation, refactoring, and comment drafting support.\n\nTECHNICAL REALIZATION:\nThe system runs in a feedback buffer (Buffer A), using the previous frame as the \nsimulation state.\nEach step samples the 8 neighboring cells and computes a weighted infection influence.\n\nCells update by:\n- resetting when fully saturated,\n- growing when partially infected,\n- or seeding from neighbors when healthy.\n\nMemory is stored in the G channel with slow decay, and state changes are stored \nin B as short pulses.\nA separate image pass maps these values to color and applies zoom by remapping\nUV coordinates around the mouse.\n\nFUTURE EXTENSIONS:\n- Add user painting to draw or erase infection.\n- Introduce obstacles or boundaries to shape propagation.\n- Add multiple visualization modes (infection only, memory only, edges).\n- Control parameters in real time using external input (e.g., Max/MSP audio).\n*/\n\n\n\n// Update the simulation every N frames (2 = half speed).\nint FRAME_DIV = 2;\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n\n    // Normalized pixel coordinates (0..1 across the screen).\n    vec2 uv = fragCoord / iResolution.xy;\n\n    // --- Wave settings (artist knobs) ---\n    float waveSpeed = 1.35;                 // How fast the wave pattern travels.\n    float waveFreq  = 30.0;                 // Stripe density (higher = thinner/more stripes).\n    float flowAmpPx = sin(iTime) * 1.05;    // Flow strength in \"pixels\" (time-varying).\n\n    // One pixel step in UV space (so we can sample neighbors).\n    vec2 px = 1.0 / iResolution.xy;\n\n    // Wave phase that drifts diagonally.\n    // Change vec2(..., 0.35) to rotate the direction of the wave.\n    // NOTE: Using iTime inside the direction makes the direction slowly evolve over time.\n    float phase = waveFreq * dot(uv, normalize(vec2(iTime*0.02, 0.35)))\n                - iTime * (waveSpeed * 6.28318); // 2π for \"cycles per second\" feel\n\n    // A flow vector that could be used to offset sampling and create motion.\n    // (Currently computed but not applied to the neighbor lookups below.)\n    vec2 flow = flowAmpPx * px * vec2(cos(phase), sin(phase));\n\n    // Infection \"growth\" rate: low base + strong wave modulation.\n    // This makes infection intensity visibly pulse with the wave.\n    float sickness_rate = 0.01 + 0.12 * (0.5 + 0.5 * cos(phase));\n\n    // Read current cell state from the previous frame (Buffer A).\n    vec4 C0 = texture(iChannel0, uv);\n    vec4 C  = C0;\n\n    // Wave-based jitter value (roughly -1..1), used to wobble diagonal samples.\n    float w = sin(iTime * 2.0 + uv.x * 10.0 + uv.y * 6.0);\n\n    // Jitter vector in \"pixel-ish units\". This gets scaled by px later.\n    vec2 j = vec2(w, w) * 1.2; // 1.2 controls wobble amplitude (in pixels).\n\n    // Sample the 4 cardinal neighbors (no jitter).\n    vec4 E  = texture(iChannel0, uv + vec2( px.x, 0.0));\n    vec4 W  = texture(iChannel0, uv + vec2(-px.x, 0.0));\n    vec4 N  = texture(iChannel0, uv + vec2(0.0,  px.y));\n    vec4 S  = texture(iChannel0, uv + vec2(0.0, -px.y));\n\n    // Sample diagonal neighbors with wave jitter to create \"shimmering\" flow.\n    vec4 NE = texture(iChannel0, uv + (vec2( px.x,  px.y) + j*px));\n    vec4 NW = texture(iChannel0, uv + (vec2(-px.x,  px.y) + j*px));\n    vec4 SE = texture(iChannel0, uv + (vec2( px.x, -px.y) + j*px));\n    vec4 SW = texture(iChannel0, uv + (vec2(-px.x, -px.y) + j*px));\n\n    // Count how many neighbors are fully \"sick\" (R >= 1.0).\n    // This is a hard threshold for strong infection.\n    int sick = int(N.r  >= 1.) + int(S.r  >= 1.) + int(E.r  >= 1.) + int(W.r  >= 1.)\n             + int(NE.r >= 1.) + int(SE.r >= 1.) + int(NW.r >= 1.) + int(SW.r >= 1.);\n\n    // Weighted infection influence around the cell:\n    // - Center cell is heavily weighted (3.0)\n    // - Cardinal neighbors are medium (1.2)\n    // - Diagonals are light (1.2)\n    // This biases the system toward stability + “orthogonal” spreading.\n    float nearbyinfection =\n          3.0 * C.r\n        + 1.2 * (N.r + S.r + E.r + W.r)\n        + 0.2 * (NE.r + NW.r + SE.r + SW.r);\n\n    // Count how many neighbors have any infection at all (R > 0).\n    // This is a softer threshold than \"sick\".\n    int infected = int(N.r  > 0.) + int(S.r  > 0.) + int(E.r  > 0.) + int(W.r  > 0.)\n                 + int(NE.r > 0.) + int(SE.r > 0.) + int(NW.r > 0.) + int(SW.r > 0.);\n\n    // Only update the simulation state once every FRAME_DIV frames.\n    // This slows the automaton so structures are easier to observe.\n    if (iFrame % FRAME_DIV == 0) {\n\n        // Save previous infection for change detection (for B channel glow).\n        float prevR = C.r;\n\n        // ---- Transition rule (core automaton logic) ----\n        if (C.r >= 1.0) {\n            // If fully sick, reset (recovery / death / wrap-around).\n            C.r = 0.;\n        } else if (C.r > 0.0) {\n            // If already infected: move toward a local average and add sickness_rate.\n            // infected + 1 avoids division by zero, and includes self in the average.\n            float averageinfection = (nearbyinfection + C.r) / float(infected + 1);\n            C.r = averageinfection + sickness_rate;\n        } else {\n            // If healthy: infection \"spawns\" based on neighbors.\n            // infected contributes in steps of 3 (via floor(infected/3)).\n            // sick adds stronger pressure (1.0 per sick neighbor).\n            float influence = floor(float(infected) * (1./3.))\n                            + floor(float(sick) * 1.0);\n\n            // Convert influence into a small starting infection value.\n            // 0.05/255 is very subtle; increase to make new infections brighter/stronger.\n            C.r = (0.05/255.0) * influence;\n        }\n\n        // Keep infection in valid range.\n        C.r = clamp(C.r, 0., 1.0);\n\n        // ---- G channel: \"age memory\" ----\n        // Treat cells as \"alive\" if infection is above a small threshold.\n        float alive = step(0.05, C.r);  // 0 = not alive, 1 = alive\n\n        // Decay rate for memory when not alive (closer to 1 = longer trails).\n        float agingDecay = 0.97;\n\n        // If alive: increase memory up to 1.0.\n        // If dead: decay memory.\n        C.g = mix(C.g * agingDecay, min(C.g + 0.05, 1.0), alive);\n\n        // ---- B channel: change flag / afterglow ----\n        // Turn on when infection changes enough; then slowly fade for a glow trail.\n        float changed = step(0.05, abs(C.r - prevR));\n        C.b = max(C.b * 0.92, changed);\n    }\n\n    // Output the updated state (A forced to 1.0).\n    fragColor = vec4(C.rgb, 1.0);\n\n    // Random value per pixel (used for initialization).\n    vec4 noise = random4(fragCoord.xy);\n\n    // --- Initialize / reset ---\n    // iChannel1 is assumed to be a keyboard texture where ASCII codes map to keys.\n    // ASCII/Unicode for spacebar is 32.\n    bool spacePressed = texelFetch(iChannel1, ivec2(32, 0), 0).r > 0.;\n\n    // On first frame or when space is pressed: seed random live cells.\n    // step(0.8, noise.x) => ~20% chance of being 1.0 (alive), else 0.0.\n    if (iFrame == 0 || spacePressed) {\n        fragColor = vec4(step(0.8, noise.x));\n    }\n}\n\n\n\n",
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
			"mFlagKeyboard": true,
			"mFlagMultipass": true,
			"mFlagMusicStream": false
		},
		"info": {
			"id": "t3yyWh",
			"date": "1769139989",
			"viewed": 51,
			"name": "Niagara River",
			"username": "Hiromune Kubayashi",
			"description": "Hiromune Kubayashi",
			"likes": 0,
			"published": 1,
			"flags": 48,
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
				"code": "/*\nStudent Number:219884246\nAssignment Number: 2\nName: Hana Namdar\nTitle: Lucid Dreams\n\n\nINTERACTIONS:\n- Mouse X: Controls the flow of time in the dream (left = slow motion, right = fast forward)\n- Mouse Y: Controls the viscosity/density of the dream (low = ethereal gas, high = thick liquid)\n- Click and hold: \"Falls deeper into the dream\" - zooms in and intensifies colors\n- Auto-dream-cycling: Every 30 seconds, a new dream begins (fresh random pattern)\n- Color morphing: Colors continuously evolve like a dream shifting moods\n\n\n\nDESCRIPTION:\nThis is not a simulation - it's a dreamscape. I wanted to create something that feels \nalive but not mechanical, organic but not biological, abstract but not random. \n\nThe system uses a continuous cellular automaton(SmoothLife from class)as its base, but I've twisted it into \nsomething more artistic. The \"cells\" aren't really cells anymore - they're more like \npulses of awareness in a dreaming mind. The tensor field becomes the \"dream logic\" - \nwarping space and time in ways that feel intuitive but not predictable.\n\nTECHNICAL REALIZATION:\nI started with SmoothLife from class, but found it too rigid. The breakthrough was \nrealizing I could use the tensor field to control NOT JUST the neighborhood geometry,\nbut also the color, the rule parameters, and the flow of time itself.\n\nISSUES I ENCOUNTERED AND FIXED:\n.  The simulation was too stable and predictable\n   FIX: Added time-warping so rules themselves drift in and out of focus\n\n\n.  Mouse interaction felt like a tool, not part of the dream\n   FIX: Made mouse position a \"dreamer's attention\" that pulls the dream toward it\n\n. The tensor field was too regular/mathematical\n   FIX: Added layers of noise and made it feed back on itself\n\n. Random4 function errors kept appearing\n   FIX: Simplified random functions and fixed type mismatches by properly handling vec4 returns\n\nCREDITS:\n- Base SmoothLife algorithm from class notes\n- Random functions from class utilities\n\nFUTUTRE EXTENSIONS:\nAdding sound for different dream and awarness states \nAnother buffer that stores \"dream memories\"\nClick a button to plant a \"seed\" of high awareness\n*/\n\n\n\n//This is just a window into the dream. Nothing else.\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy;\n    \n    \n    vec4 dream = texture(iChannel0, uv);\n    \n    fragColor = dream;\n}",
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
				"code": "/*\nStudent Number:219884246\nAssignment Number: 2\nName: Hana Namdar\nTitle: Lucid Dreams\n\n*/\n\n\n// DREAM UTILITIES - The tools for building dreams\n\n\n#define RANDOM_SCALE vec4(.1031, .1030, .0973, .1099)\n\n/**\n * Simple random function that returns a vec4\n *  Properly returns vec4 and handles inputs correctly\n */\nvec4 random4(vec2 p) {\n    vec4 p4 = fract(p.xyxy * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\n\n //soft - makes transitions feel organic rather than mechanical\n \nfloat softSigmoid(float x, float center, float width) {\n    return 1.0 / (1.0 + exp(-(x-center)*2.0/width));\n}\n\n\n // Dream noise - less random than hash, more like static on an old TV\n\nfloat dreamNoise(vec2 p) {\n    p = fract(p * vec2(123.34, 456.78));\n    p += dot(p, p + 45.32);\n    return fract(p.x * p.y);\n}\n\n\n // Time distortion - makes dreams feel longer or shorter\n\nfloat dreamTime(float t, vec2 mouse) {\n    float flowRate = 0.5 + mouse.x;\n    return t * flowRate + sin(t * 0.5) * 0.3 + cos(t * 0.3) * 0.2;\n}\n\n// Matrix functions for warping space\nmat2 rotateDream(float angle) {\n    float c = cos(angle);\n    float s = sin(angle);\n    return mat2(c, -s, s, c);\n}\n\nmat2 stretchDream(float sx, float sy) {\n    return mat2(sx, 0.0, 0.0, sy);\n}\n\nmat2 twistDream(float amount) {\n    return mat2(1.0, amount, amount, 1.0);\n}\n\n\n// THE DREAM FIELD - Where space itself becomes emotional\n\n\n  //The dream tensor - not really a tensor anymore, more like a mood map\n \nfloat dreamTensor(vec2 uv, float time, vec2 attention) {\n    // Layer 1: Deep slow dreams - the foundation\n    float layer1 = sin(uv.x * 3.0 + time * 0.3) * cos(uv.y * 3.0 - time * 0.2);\n    \n    // Layer 2: Surface thoughts - faster, more chaotic\n    float layer2 = sin(uv.x * 8.0 + time * 1.5) * sin(uv.y * 7.0 - time * 1.2);\n    \n    // Layer 3: Fleeting impressions - very high frequency\n    float layer3 = cos((uv.x + uv.y) * 20.0 + time * 3.0) * 0.3;\n    \n    // Layer 4: Dreamer's attention - where you look, the dream flows toward you\n    float attentionPull = length(uv - attention) * 2.0;\n    float layer4 = exp(-attentionPull * 5.0) * sin(time * 2.0 + attentionPull * 10.0);\n    \n    // Combine layers with different weights\n    float dream = (layer1 * 0.5 + layer2 * 0.3 + layer3 * 0.1 + layer4 * 0.2);\n    \n    // Normalize to 0-1 range and add final noise texture\n    dream = dream * 0.5 + 0.5;\n    dream += dreamNoise(uv + time) * 0.1;\n    \n    return clamp(dream, 0.0, 1.0);\n}\n\n\n // Warps space according to dream logic\n \nvec2 warpByDream(vec2 offset, vec2 uv, float time, vec2 attention) {\n    float dreamHere = dreamTensor(uv, time, attention);\n    float dreamAngle = time * 0.8 + dreamHere * 8.0 + attention.x * 5.0;\n    float stretchX = 1.0 + dreamHere * 3.0 + sin(time + uv.y) * 0.5;\n    float stretchY = 1.0 + (1.0 - dreamHere) * 2.0 + cos(time + uv.x) * 0.5;\n    float twist = sin(time * 0.7 + dreamHere * 15.0) * 0.5;\n    \n    mat2 warp = rotateDream(dreamAngle) * \n                stretchDream(stretchX, stretchY) * \n                twistDream(twist);\n    \n    return warp * offset;\n}\n\n\n// THE DREAM ITSELF - The cellular automaton as consciousness\n\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    // Where are we in the dream?\n    vec2 uv = fragCoord / iResolution.xy;\n    \n    // Where is the dreamer looking?\n    vec2 attention = vec2(0.5);\n    if (iMouse.z > 0.0) {\n        attention = iMouse.xy / iResolution.xy;\n    }\n    \n    // Dream time - not linear, not constant\n    float dt = dreamTime(iTime, attention);\n    \n    // The current state of this point in the dream\n    vec4 dreamState = texture(iChannel0, uv);\n    float awareness = dreamState.x;      // How \"awake\" this point is (0-1)\n    \n    \n    // DREAM PARAMETERS\n  \n    float dreamHere = dreamTensor(uv, dt, attention);\n    \n    // Dream geometry -  Made constants to avoid errors\n    float outer_radius = 12.0;\n    float inner_radius = 4.0;\n    \n    // Rules that drift like thoughts\n    float birth_low = 0.15 + dreamHere * 0.2;\n    float birth_high = birth_low + 0.15;\n    float death_low = 0.25 + (1.0 - dreamHere) * 0.2;\n    float death_high = death_low + 0.25;\n    float transition_softness = 0.04 + dreamHere * 0.06;\n    float evolution_speed = 0.2;\n    \n \n    // SAMPLING THE DREAM\n    \n    float inner_sum = 0.0;\n    float outer_sum = 0.0;\n    float inner_weight_sum = 0.0;\n    float outer_weight_sum = 0.0;\n    \n    // Sample in a dreamlike pattern\n    for (float x = -outer_radius; x <= outer_radius; x += 1.2) {\n        for (float y = -outer_radius; y <= outer_radius; y += 1.2) {\n            //  tiny dream fluctuations\n            vec2 pixel = vec2(x, y);\n            pixel.x += dreamNoise(uv + vec2(x, y)) * 0.5;\n            pixel.y += dreamNoise(uv + vec2(y, x)) * 0.5;\n            \n            //  dream warping\n            vec2 warpedPixel = warpByDream(pixel, uv, dt, attention);\n            float dist = length(warpedPixel);\n            \n            if (dist <= outer_radius) {\n                vec2 texel = warpedPixel / iResolution.xy;\n                float dreamAwareness = texture(iChannel0, uv + texel).x;\n                \n                float inner_w = 1.0 - softSigmoid(dist, inner_radius, 3.0);\n                float outer_w = (1.0 - softSigmoid(dist, outer_radius, 3.0)) - inner_w;\n                \n                inner_sum += dreamAwareness * inner_w;\n                inner_weight_sum += inner_w;\n                outer_sum += dreamAwareness * outer_w;\n                outer_weight_sum += outer_w;\n            }\n        }\n    }\n    \n    // Calculate dream densities\n    float inner_density = inner_weight_sum > 0.0 ? inner_sum / inner_weight_sum : 0.0;\n    float outer_density = outer_weight_sum > 0.0 ? outer_sum / outer_weight_sum : 0.0;\n    \n \n    // DREAM RULES\n    // Death conditions (when awareness fades)\n    float not_too_lonely = softSigmoid(outer_density, death_low, transition_softness);\n    float not_too_crowded = 1.0 - softSigmoid(outer_density, death_high, transition_softness);\n    float will_survive = not_too_lonely * not_too_crowded;\n    \n    // Birth conditions (when new awareness emerges)\n    float enough_company = softSigmoid(outer_density, birth_low, transition_softness);\n    float not_overwhelmed = 1.0 - softSigmoid(outer_density, birth_high, transition_softness);\n    float will_be_born = enough_company * not_overwhelmed;\n    \n    // Blend between birth and death based on current state\n    float current_liveness = softSigmoid(inner_density, 0.5, transition_softness * 2.0);\n    float dream_transition = mix(will_be_born, will_survive, current_liveness);\n    \n    // the dream logic\n    float change = dream_transition * 2.0 - 1.0;\n    awareness += evolution_speed * change;\n    \n    // Store multiple dream layers for visualization\n    //  assigning to vec4 components\n    dreamState.x = awareness;\n    dreamState.y = dreamHere;\n    dreamState.z = outer_density;\n    dreamState.w = dream_transition;\n    \n    // Keep awareness in dream bounds\n    dreamState = clamp(dreamState, 0.0, 1.0);\n    \n \n    // DREAM INITIALIZATION\n  \n    \n    if (iFrame == 0) {\n        // First dream - random but with structure\n       \n        vec4 rand = random4(fragCoord);\n        \n        // a dreamlike initial pattern\n        float pattern = rand.x;  // Use red channel for pattern\n        \n        //  some soft structure like clouds\n        if (uv.x > 0.3 && uv.x < 0.7 && uv.y > 0.3 && uv.y < 0.7) {\n            pattern = mix(pattern, 0.8, 0.5);\n        }\n        \n        // Add dream seeds - points of awareness\n        if (fract(uv.x * 15.0) < 0.1 && fract(uv.y * 15.0) < 0.1) {\n            pattern = max(pattern, 0.9);\n        }\n        \n        \n        dreamState.x = pattern;\n        dreamState.y = 0.0;\n        dreamState.z = 0.0;\n        dreamState.w = 0.0;\n    }\n    \n    fragColor = dreamState;\n}",
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
					}
				],
				"code": "/*\nStudent Number:219884246\nAssignment Number: 2\nName: Hana Namdar\nTitle: Lucid Dreams\n*/\n\n\n// DREAM PALETTES\n/*\n\nWarm Mood (0-10 sec): Deep reds → oranges → yellows (like embers or sunset)\n\nCool Mood (10-20 sec): Deep blue → teal → cyan (like ocean depths to surface)\n\nMystic Mood (20-30 sec): Purple →  pinkish →  gold\n\n*/\n\nvec3 warmDream(float t) {\n    vec3 ember = vec3(0.3, 0.05, 0.05);\n    vec3 glow = vec3(0.8, 0.3, 0.1);\n    vec3 core = vec3(1.0, 0.8, 0.2);\n    \n    if (t < 0.33) {\n        return mix(ember, glow, t * 3.0);\n    } else if (t < 0.66) {\n        return mix(glow, core, (t - 0.33) * 3.0);\n    } else {\n        return mix(core, vec3(1.0, 0.9, 0.5), (t - 0.66) * 3.0);\n    }\n}\n\nvec3 coolDream(float t) {\n    vec3 deep = vec3(0.05, 0.1, 0.3);\n    vec3 shallows = vec3(0.1, 0.4, 0.5);\n    vec3 surface = vec3(0.6, 0.9, 1.0);\n    \n    if (t < 0.33) {\n        return mix(deep, shallows, t * 3.0);\n    } else if (t < 0.66) {\n        return mix(shallows, surface, (t - 0.33) * 3.0);\n    } else {\n        return mix(surface, vec3(1.0, 1.0, 1.0), (t - 0.66) * 3.0);\n    }\n}\n\nvec3 mysticDream(float t) {\n    vec3 mist = vec3(0.3, 0.1, 0.4);\n    vec3 impossible = vec3(0.8, 0.2, 0.6);\n    vec3 ethereal = vec3(0.9, 0.7, 0.2);\n    \n    if (t < 0.33) {\n        return mix(mist, impossible, t * 3.0);\n    } else if (t < 0.66) {\n        return mix(impossible, ethereal, (t - 0.33) * 3.0);\n    } else {\n        return mix(ethereal, vec3(1.0, 0.8, 0.9), (t - 0.66) * 3.0);\n    }\n}\n\n// DREAM TEXTURE\n\nfloat dreamTexture(vec2 p, float time) {\n    float n1 = sin(p.x * 10.0 + time) * cos(p.y * 8.0 - time * 0.5);\n    float n2 = sin(p.x * 25.0 + time * 1.3) * sin(p.y * 22.0 + time * 0.8);\n    float n3 = cos((p.x + p.y) * 40.0 + time * 2.0);\n    \n    return (n1 * 0.5 + n2 * 0.3 + n3 * 0.2) * 0.5 + 0.5;\n}\n\n\n// MAIN VISUALIZATION\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy;\n    vec2 originalUV = uv;\n    \n    vec2 attention = vec2(0.5);\n    if (iMouse.z > 0.0) {\n        attention = iMouse.xy / iResolution.xy;\n    }\n    \n    float zoomLevel = 1.0;\n    float dreamIntensity = 1.0;\n    \n    if (iMouse.z > 0.0) {\n        zoomLevel = 3.0;\n        uv = (uv - attention) / zoomLevel + attention;\n        dreamIntensity = 1.5;\n    }\n    \n    vec4 dreamState = texture(iChannel0, uv);\n    float awareness = dreamState.x;\n    float dreamHere = dreamState.y;\n    float density = dreamState.z;\n    float transition = dreamState.w;\n    \n    // Dream mood cycling\n    float moodTime = fract(iTime * 0.03) * 3.0;\n    vec3 dreamColor;\n    \n    if (moodTime < 1.0) {\n        dreamColor = warmDream(awareness);\n        dreamColor = mix(dreamColor, vec3(0.7, 0.3, 0.6), dreamHere * 0.4);\n    } else if (moodTime < 2.0) {\n        dreamColor = coolDream(awareness);\n        dreamColor = mix(dreamColor, vec3(0.2, 0.4, 0.8), dreamHere * 0.3);\n    } else {\n        dreamColor = mysticDream(awareness);\n        dreamColor = mix(dreamColor, vec3(0.9, 0.7, 0.2), dreamHere * 0.5);\n    }\n    \n    // Dream textures\n    float texture1 = dreamTexture(originalUV * 2.0, iTime);\n    dreamColor += texture1 * 0.1;\n    \n    float awarenessRipples = sin(originalUV.x * 30.0 + awareness * 10.0) * \n                             cos(originalUV.y * 30.0 - iTime) * 0.1;\n    dreamColor += awarenessRipples * awareness;\n    \n    float flow = sin(originalUV.x * 20.0 + dreamHere * 20.0) * \n                 cos(originalUV.y * 20.0 - dreamHere * 15.0);\n    flow = abs(flow) * 0.15;\n    dreamColor += vec3(flow * 0.5, flow * 0.3, flow);\n    \n    // Dreamer's touch\n    float attentionDist = length(originalUV - attention);\n    float attentionInfluence = exp(-attentionDist * 8.0) * 0.3;\n    \n    if (attentionInfluence > 0.01) {\n        dreamColor = mix(dreamColor, vec3(1.0, 0.9, 0.8), attentionInfluence * 0.5);\n        \n        float sparkle = sin(originalUV.x * 100.0 + iTime * 5.0) * \n                        cos(originalUV.y * 100.0 - iTime * 5.0);\n        sparkle = max(0.0, sparkle) * attentionInfluence * 0.3;\n        dreamColor += vec3(sparkle);\n    }\n    \n    // Dream boundaries\n    if (iMouse.z > 0.0) {\n        vec2 edgeDist = min(uv, 1.0 - uv);\n        float edgeNear = min(edgeDist.x, edgeDist.y);\n        \n        if (edgeNear < 0.02) {\n            dreamColor = mix(dreamColor, vec3(0.8, 0.7, 1.0), 0.5);\n        }\n    }\n    \n    // Dream transitions (30-second cycle)\n    float secondsInCycle = mod(iTime, 30.0);\n    if (secondsInCycle > 29.5) {\n        float fade = (secondsInCycle - 29.5) * 2.0;\n        dreamColor = mix(dreamColor, vec3(0.1, 0.05, 0.2), fade);\n    } else if (secondsInCycle < 0.5) {\n        float fade = secondsInCycle * 2.0;\n        dreamColor = mix(vec3(0.1, 0.05, 0.2), dreamColor, fade);\n    }\n    \n    // Vignette\n    float vignette = 1.0 - length(originalUV - 0.5) * 0.8;\n    dreamColor *= vignette;\n    \n    fragColor = vec4(dreamColor, 1.0);\n}",
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
			"id": "WXVfRc",
			"date": "1772038820",
			"viewed": 33,
			"name": "Lucid Dreams ",
			"username": "Hana Namdar",
			"description": "It's a dreamscape. I wanted to create something that feels \nalive but not mechanical, organic but not biological, abstract but not random. ",
			"likes": 5,
			"published": 1,
			"flags": 32,
			"usePreview": 0,
			"tags": [
				"sample3"
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
					}
				],
				"code": "void mainImage(out vec4 fragColor, in vec2 fragCoord)\n{\n    // Convert pixel coordinate to normalized UV space (0..1)\n    vec2 uv = fragCoord / iResolution.xy;\n\n\n    // ===== Read simulation state =====\n    // iChannel0 contains the reaction-diffusion buffer\n    \n    vec4 sim = texture(iChannel0, uv);\n\n    // Extract chemical concentrations\n    float A = sim.x; // chemical A\n    float B = sim.y; // chemical B\n\n\n    // ===== Convert chemical B into visible pattern =====\n    // Higher B values become visible \"ink\" areas\n    \n    float ink = smoothstep(0.25, 0.45, B);\n\n\n    // ===== Color palette (Kusama-style look) =====\n    \n    // Background color (soft green/yellow tone)\n    vec3 bg  = vec3(0.5, 0.82, 0.25);\n\n    // Dot color (pink/red tone)\n    vec3 dot = vec3(1.0, 0.32, 0.45);\n\n\n    // ===== Add subtle shading using A =====\n    // Chemical A acts like a lighting mask\n    \n    bg *= 0.95 + 0.85 * A;\n\n\n    // ===== Mix colors =====\n    // ink determines where dots appear\n    \n    vec3 col = mix(bg, dot, ink);\n\n\n    // Output final color\n    fragColor = vec4(col, 1.0);\n}",
				"name": "Image",
				"description": "",
				"type": "image"
			},
			{
				"outputs": [],
				"inputs": [],
				"code": "// 1D hash (stable pseudo-random from a single float)\nfloat hash11(float x){\n    // Generates a repeatable random value in 0..1 from input x\n    return fract(sin(x * 127.1) * 43758.5453123);\n}\n\n// 2D hash → value noise base\nfloat hash21(vec2 p){\n    // Fold coordinates into 0..1 space\n    p = fract(p * vec2(123.34, 345.45));\n    \n    // Mix components for better randomness\n    p += dot(p, p + 34.345);\n    \n    // Return pseudo-random value\n    return fract(p.x * p.y);\n}\n\n// Smooth value noise (bilinear interpolation of hash grid)\nfloat noise2(vec2 p){\n    vec2 i = floor(p);   // integer grid cell\n    vec2 f = fract(p);   // local position in cell\n\n    // Sample corners\n    float a = hash21(i);\n    float b = hash21(i + vec2(1.0, 0.0));\n    float c = hash21(i + vec2(0.0, 1.0));\n    float d = hash21(i + vec2(1.0, 1.0));\n\n    // Smooth interpolation curve (Hermite)\n    vec2 u = f * f * (3.0 - 2.0 * f);\n\n    // Bilinear blend\n    return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);\n}\n\n// Fractal Brownian Motion (layered noise)\nfloat fbm(vec2 p){\n    float v = 0.0;\n    float a = 0.5; // amplitude\n\n    // Sum multiple octaves\n    for(int i=0;i<3;i++){\n        v += a * noise2(p);\n        p *= 2.0;  // increase frequency\n        a *= 0.5;  // decrease amplitude\n    }\n\n    return v; // returns roughly in 0..1\n}\n\n\n// ===== Reaction Diffusion Core =====\n\nvec4 reactionDiffusion(vec2 fragCoord, sampler2D img, vec2 resolution, float time) {\n\n    // ===== User-tweakable parameters =====\n    \n    // Diffusion speed of chemical A and B\n    float diffusionA = 0.9;\n    float diffusionB = 0.07; \n\n    // Base Gray-Scott parameters (classic stable pattern zone)\n    float baseF = 0.036; // feed rate\n    float baseK = 0.064; // kill rate\n\n\n    // ===== Time step variation =====\n    \n    // Change dt once per second to add subtle randomness\n    float t  = floor(time);\n    float dt = mix(0.90, 1.25, hash11(floor(time)));\n\n    \n    // ===== Coordinate setup =====\n    \n    vec2 uv = fragCoord / resolution.xy; // normalized coordinates\n    vec2 px = 1.0 / resolution.xy;       // pixel size\n\n\n    // ===== Sample previous frame =====\n    \n    vec4 C  = texture(img, uv);\n\n    // 8-neighbor sampling for Laplacian\n    vec4 E  = texture(img, uv + vec2( px.x, 0.0));\n    vec4 W  = texture(img, uv + vec2(-px.x, 0.0));\n    vec4 N  = texture(img, uv + vec2(0.0,  px.y));\n    vec4 S  = texture(img, uv + vec2(0.0, -px.y));\n    vec4 NE = texture(img, uv + vec2( px.x,  px.y));\n    vec4 NW = texture(img, uv + vec2(-px.x,  px.y));\n    vec4 SE = texture(img, uv + vec2( px.x, -px.y));\n    vec4 SW = texture(img, uv + vec2(-px.x, -px.y));\n\n\n    // ===== Laplacian operator =====\n    // Weighted neighbor sum (common RD kernel)\n    \n    vec4 laplacian =\n          0.05*(NE+NW+SE+SW)\n        + 0.20*(N+E+S+W)\n        - C;\n\n\n    // Extract chemical concentrations\n    vec2 ab = C.xy;\n\n\n    // ===== Reaction term =====\n    // Gray-Scott nonlinear reaction A + 2B → 3B\n    \n    float reaction = ab.x * ab.y * ab.y;\n\n\n    // ===== Spatial + temporal noise modulation =====\n    // Slowly shifting fbm fields create evolving patterns\n    \n    float n1 = fbm(uv * 3.0 + vec2( 0.06*time, -0.04*time));\n    float n2 = fbm(uv * 3.0 + vec2(-0.05*time,  0.07*time));\n\n    // Modulate feed & kill with noise\n    float feedrate = baseF + 0.012*(n1 - 0.5);\n    float killrate = baseK + 0.012*(n2 - 0.5);\n\n\n    // ===== Add slight gradients =====\n    // Gives directional flow to the visual\n    \n    feedrate += mix(-0.005, 0.02, uv.y);\n    killrate += mix(-0.004, 0.004, uv.x);\n\n\n    // Clamp to stable RD range\n    feedrate = clamp(feedrate, 0.0, 0.09);\n    killrate = clamp(killrate, 0.0, 0.09);\n\n\n    // ===== Reaction-Diffusion update =====\n    \n    ab += vec2(\n        (diffusionA * laplacian.x) - reaction + feedrate*(1.0-ab.x),\n        (diffusionB * laplacian.y) + reaction - (killrate+feedrate)*ab.y\n    ) * dt;\n\n\n    // Prevent numeric explosion\n    ab = clamp(ab, vec2(0.0), vec2(2.0));\n\n\n    // Return updated chemicals (A,B stored in xy)\n    return vec4(ab, 0.0, 1.0);\n}",
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
					}
				],
				"code": "/* \nStudent Number: 220016416  \nAssignment #: 2  \nName: Hiromune Kubayashi  \nTitle: \"Haru no Umi (Spring Sea)\"  \n\nInteractions / Parameter Variations:\n- Mouse: Injects an excited phase and disturbs the local gate field.\n- Reset: Reloads shader (iFrame == 0 reinitializes).\n\nSystem Idea / How it Works:\n\nThis piece is inspired by Japanese ukiyo-e woodblock prints and evokes the atmosphere \nof a spring sea in Japan. At the beginning, a shape resembling a traditional Japanese \nfamily crest (kamon) emerges. Gradually, soft pink blossoms begin to bloom across the \nscene. As time progresses, the structure slowly dissolves. Around the 30-second mark,\nthe image transforms into a pink sandy shore where light green and green waves gently \nadvance and recede. Through this work, I hope viewers can experience a sense of Japanese\nharmony (\"wa\") and seasonal transition.\n\nTechnically, the visuals are generated using a Gray–Scott reaction–diffusion system \nrunning in a feedback buffer. Two virtual chemicals (A and B) diffuse at different \nrates and react nonlinearly, producing self-organizing spots, ripples, and drifting \nwave-like structures. To create a “tide” sensation, the simulation parameters are\nmodulated by time-varying procedural noise (value noise + fbm) and slow spatial \ngradients, which gently shift the feed/kill rates across the screen. This produces \nintermittent rhythms, fragmented spirals, and reef-like trapped formations that feel\nlike living coastal patterns.\n\nInteresting Parameters:\n\nDiffusion rates of chemicals A and B. A diffuses much faster than B.\nThis imbalance is essential for Gray–Scott pattern formation.\nfloat diffusionA = 0.9;\nfloat diffusionB = 0.07;\n\nCredits:\n- Based on classic Cyclic Cellular Automata concepts.\n- Uses standard shader noise (value noise + fbm).\n- AI-assisted: structure, comments, and tuning suggestions generated with ChatGPT (OpenAI).\n- Professor Graham’s lecture code (Reaction Diffusion):\n  https://www.shadertoy.com/view/W3dyDl\n\nTechnical Realization:\nImplemented as a multi-pass shader using a Gray–Scott reaction–diffusion system.\nBuffer A stores chemicals A and B, updated each frame with diffusion,\nnonlinear reaction, and noise-modulated feed/kill parameters.\n\nUpdate Steps:\n 1) Sample previous frame.\n 2) Compute Diffusion.\n 3) Calculate reaction (A * B^2).\n 4) Modulate feed/kill rates.\n 5) Update and clamp values.\n 6) Convert B into visible color.\n\n\nFuture Extensions \n - Add shoreline/terrain constraint mask.\n - Introduce directional current (advection).\n - Seasonal parameter presets.\n - Multi-species interaction.\n*/\n\n\n\n// ===== Buffer A =====\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n\n    // Run one step of the reaction-diffusion simulation\n    // Uses previous frame stored in iChannel0\n    fragColor = reactionDiffusion(fragCoord, iChannel0, iResolution.xy, iTime);\n\n\n    // ===== Initialization (only on first frame) =====\n    if (iFrame == 0) {\n\n        // Start with full chemical A and no B\n        // A stored in x, B stored in y\n        fragColor = vec4(1.0, 0.0, 1.0, 1.0);\n\n        // Convert to normalized coordinates\n        vec2 uv = fragCoord / iResolution.xy;\n\n        // Create a dotted \"seed pattern\"\n        // This gives the simulation initial disturbance points\n        float seedDots = smoothstep(\n            1.00, \n            0.0, \n            abs(fract(uv.x * 5.0) - 0.5) +\n            abs(fract(uv.y * 5.0) - 0.5)\n        );\n\n        // Inject chemical B at seed locations\n        fragColor.y += 0.95 * seedDots;\n    }\n\n\n    // ===== Mouse Injection =====\n    // Allows user to add strong disturbance interactively\n    if (iMouse.z > 0.0 && distance(fragCoord.xy, iMouse.xy) < 30.0) {\n\n        // Inject both A and B to trigger pattern growth\n        fragColor = vec4(1.0, 1.0, 0.0, 1.0);\n    }\n    \n    \n}",
				"name": "Buffer A",
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
				"inputs": [],
				"code": "// ===== Buffer D (Same As A) =====\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n\n    // Run one step of the reaction-diffusion simulation\n    // Uses previous frame stored in iChannel0\n    fragColor = reactionDiffusion(fragCoord, iChannel0, iResolution.xy, iTime);\n\n\n    // ===== Initialization (only on first frame) =====\n    if (iFrame == 0) {\n\n        // Start with full chemical A and no B\n        // A stored in x, B stored in y\n        fragColor = vec4(1.0, 0.0, 1.0, 1.0);\n\n        // Convert to normalized coordinates\n        vec2 uv = fragCoord / iResolution.xy;\n\n        // Create a dotted \"seed pattern\"\n        // This gives the simulation initial disturbance points\n        float seedDots = smoothstep(\n            1.00, \n            0.0, \n            abs(fract(uv.x * 5.0) - 0.5) +\n            abs(fract(uv.y * 5.0) - 0.5)\n        );\n\n        // Inject chemical B at seed locations\n        fragColor.y += 0.95 * seedDots;\n    }\n\n\n    // ===== Mouse Injection =====\n    // Allows user to add strong disturbance interactively\n    if (iMouse.z > 0.0 && distance(fragCoord.xy, iMouse.xy) < 30.0) {\n\n        // Inject both A and B to trigger pattern growth\n        fragColor = vec4(1.0, 1.0, 0.0, 1.0);\n    }\n    \n    \n}",
				"name": "Buffer D",
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
				"inputs": [],
				"code": "// ===== Buffer B (Same As A) =====\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n\n    // Run one step of the reaction-diffusion simulation\n    // Uses previous frame stored in iChannel0\n    fragColor = reactionDiffusion(fragCoord, iChannel0, iResolution.xy, iTime);\n\n\n    // ===== Initialization (only on first frame) =====\n    if (iFrame == 0) {\n\n        // Start with full chemical A and no B\n        // A stored in x, B stored in y\n        fragColor = vec4(1.0, 0.0, 1.0, 1.0);\n\n        // Convert to normalized coordinates\n        vec2 uv = fragCoord / iResolution.xy;\n\n        // Create a dotted \"seed pattern\"\n        // This gives the simulation initial disturbance points\n        float seedDots = smoothstep(\n            1.00, \n            0.0, \n            abs(fract(uv.x * 5.0) - 0.5) +\n            abs(fract(uv.y * 5.0) - 0.5)\n        );\n\n        // Inject chemical B at seed locations\n        fragColor.y += 0.95 * seedDots;\n    }\n\n\n    // ===== Mouse Injection =====\n    // Allows user to add strong disturbance interactively\n    if (iMouse.z > 0.0 && distance(fragCoord.xy, iMouse.xy) < 30.0) {\n\n        // Inject both A and B to trigger pattern growth\n        fragColor = vec4(1.0, 1.0, 0.0, 1.0);\n    }\n    \n    \n}",
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
				"inputs": [],
				"code": "// ===== Buffer C (Same As A) =====\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n\n    // Run one step of the reaction-diffusion simulation\n    // Uses previous frame stored in iChannel0\n    fragColor = reactionDiffusion(fragCoord, iChannel0, iResolution.xy, iTime);\n\n\n    // ===== Initialization (only on first frame) =====\n    if (iFrame == 0) {\n\n        // Start with full chemical A and no B\n        // A stored in x, B stored in y\n        fragColor = vec4(1.0, 0.0, 1.0, 1.0);\n\n        // Convert to normalized coordinates\n        vec2 uv = fragCoord / iResolution.xy;\n\n        // Create a dotted \"seed pattern\"\n        // This gives the simulation initial disturbance points\n        float seedDots = smoothstep(\n            1.00, \n            0.0, \n            abs(fract(uv.x * 5.0) - 0.5) +\n            abs(fract(uv.y * 5.0) - 0.5)\n        );\n\n        // Inject chemical B at seed locations\n        fragColor.y += 0.95 * seedDots;\n    }\n\n\n    // ===== Mouse Injection =====\n    // Allows user to add strong disturbance interactively\n    if (iMouse.z > 0.0 && distance(fragCoord.xy, iMouse.xy) < 30.0) {\n\n        // Inject both A and B to trigger pattern growth\n        fragColor = vec4(1.0, 1.0, 0.0, 1.0);\n    }\n    \n    \n}",
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
			"id": "W3tfRs",
			"date": "1771623056",
			"viewed": 39,
			"name": "Haru no Umi (Spring Sea)",
			"username": "Hiromune Kubayashi",
			"description": "Assignment 2 ",
			"likes": 0,
			"published": 1,
			"flags": 32,
			"usePreview": 0,
			"tags": [
				"datt4950"
			],
			"hasliked": 0,
			"parentid": "W3dyDl",
			"parentname": "DATT4950 Reaction Diffusion"
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
				"code": "// ===== Image =====\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy;\n    vec4 data = texture(iChannel0, uv);\n    float B = data.y;\n    float progress = data.z; // Progress of Evolution\n    \n    vec3 glow = texture(iChannel1, uv).rgb;\n    float line = smoothstep(0.2, 0.22, B) * smoothstep(0.3, 0.28, B);\n    \n    // --- Color Definition ---\n    vec3 pink = vec3(1.0, 0.2, 0.6);\n    vec3 yellow = vec3(1.0, 0.9, 0.2);\n    vec3 cyan = vec3(0.2, 0.8, 1.0);\n    \n    // Infiltration tone\n    vec3 deepBlue = vec3(0.1, 0.1, 0.5);\n    vec3 purple = vec3(0.5, 0.1, 0.8);\n    \n    // 1. Basic Dynamic Color (Growth Stage)\n    vec3 growthCol = mix(pink, yellow, sin(uv.x * 2.0 + iTime) * 0.5 + 0.5);\n    growthCol = mix(growthCol, cyan, cos(uv.y * 2.0 - iTime) * 0.5 + 0.5);\n    \n    // 2. Infiltration Color (Evolutionary Stage)\n    vec3 seepCol = mix(deepBlue, purple, B);\n    seepCol += cyan * pow(B, 3.0); // Add a highlighted border\n    \n    // 3. Progress-based interpolation\n    float t = smoothstep(0.2, 0.8, progress);\n    vec3 finalColor = vec3(0.04, 0.01, 0.08); // Background\n    \n    // Blended Line Effect\n    vec3 currentLineCol = mix(growthCol, seepCol, t);\n    finalColor += line * currentLineCol * 2.5;\n    \n    // Enhance the sense of penetration: As progress increases, have B concentration directly participate in color filling.\n    finalColor += mix(vec3(0.0), seepCol * 0.4, t * B);\n    \n    // Add Glow\n    finalColor += glow * mix(vec3(0.6, 0.3, 0.9), vec3(0.2, 0.5, 1.0), t) * 1.5;\n\n    // Fade-out reset logic\n    float fade = smoothstep(1.5, 1.2, progress);\n    \n    fragColor = vec4(pow(finalColor * fade, vec3(0.9)), 1.0);\n}",
				"name": "Image",
				"description": "",
				"type": "image"
			},
			{
				"outputs": [],
				"inputs": [],
				"code": "//Thanks for Philip's help ^-^\n#define RANDOM_SCALE vec4(.1031, .1030, .0973, .1099)\n\nvec2 random2(float p) {\n    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec2 random2(vec2 p) {\n    vec3 p3 = fract(p.xyx * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec2 random2(vec3 p3) {\n    p3 = fract(p3 * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec3 random3(float p) {\n    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xxy + p3.yzz) * p3.zyx); \n}\n\nvec3 random3(vec2 p) {\n    vec3 p3 = fract(vec3(p.xyx) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yxz + 19.19);\n    return fract((p3.xxy + p3.yzz) * p3.zyx);\n}\n\nvec3 random3(vec3 p) {\n    p = fract(p * RANDOM_SCALE.xyz);\n    p += dot(p, p.yxz + 19.19);\n    return fract((p.xxy + p.yzz) * p.zyx);\n}\n\nvec4 random4(float p) {\n    vec4 p4 = fract(p * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);   \n}\n\nvec4 random4(vec2 p) {\n    vec4 p4 = fract(p.xyxy * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec3 p) {\n    vec4 p4 = fract(p.xyzx * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec4 p4) {\n    p4 = fract(p4  * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\n\n///////////\n\n// ==========================================\n// Safe Sigmoid Function (Key to Preventing Black Screens)\n// ==========================================\nfloat sigmoid(float x, float center, float width) {\n    // 【Security Measures】Restrict input range to prevent NaN/Inf generation from exp() explosion.\n    float val = -(x - center) * 4.0 / max(0.0001, width); // Prevent division by zero\n    val = clamp(val, -10.0, 10.0); // Strictly limit the scope\n    return 1.0 / (1.0 + exp(val));\n}\n\n/*\n    Implementing the Reaction Diffusion model documented at https://www.karlsims.com/rd.html\n    \n    Chemical A stored in the green channel\n    Chemical B stored in the blue channel\n*/\n// 1. fbm\nfloat fbm(vec2 p) {\n    float v = 0.0; float a = 0.5;\n    for(int i=0; i<3; i++) {\n        // Ensure that the call is made to random2(vec2)\n        v += a * random2(p).x;\n        p *= 2.0; a *= 0.5;\n    }\n    return v;\n}\n\n// 2. reactionDiffusion\nvec4 reactionDiffusion(vec2 fragCoord, sampler2D img, vec2 res, float time, float progress) {\n    vec2 uv = fragCoord / res.xy;\n    vec2 px = 1.0 / res.xy;\n\n    vec4 C = texture(img, uv);\n    \n    // Calculate the Laplace operator\n    vec4 E  = texture(img, uv + vec2(px.x, 0));\n    vec4 W  = texture(img, uv - vec2(px.x, 0));\n    vec4 N  = texture(img, uv + vec2(0, px.y));\n    vec4 S  = texture(img, uv - vec2(0, px.y));\n    vec4 NE = texture(img, uv + vec2(px.x, px.y));\n    vec4 NW = texture(img, uv + vec2(-px.x, px.y));\n    vec4 SE = texture(img, uv + vec2(px.x, -px.y));\n    vec4 SW = texture(img, uv + vec2(-px.x, -px.y));\n    vec4 lap = 0.05*(NE+NW+SE+SW) + 0.2*(N+E+S+W) - C;\n\n    // --- Dynamic Growth Parameters ---\n    // Use vec2(time * ...) to ensure type matching.\n    float n1 = fbm(uv * 3.0 + vec2(time * 0.05)); \n    float n2 = fbm(uv * 3.0 - vec2(time * 0.04));\n    \n    float f_init = 0.037 + (n1 - 0.5) * 0.02;\n    float k_init = 0.062 + (n2 - 0.5) * 0.01;\n    \n    // Karl Sims \n    float f_karl = mix(0.01, 0.062, uv.x);\n    float k_karl = mix(0.045, 0.07, uv.y);\n    \n    // Parameter Mixing\n    float t = smoothstep(0.0, 1.0, progress);\n    float f = mix(f_init, f_karl, t);\n    float k = mix(k_init, k_karl, t);\n    \n    // Reaction-Diffusion Equation\n    float reaction = C.x * C.y * C.y;\n    vec2 ab = C.xy;\n    ab.x += (1.0 * lap.x - reaction + f * (1.0 - ab.x));\n    ab.y += (0.5 * lap.y + reaction - (k + f) * ab.y);\n\n    return vec4(clamp(ab, 0.0, 1.0), progress, 1.0);\n    }\n",
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
				"code": "// ==========================================\n// Minimal SmoothLife Calculation (For Performance and Stability)\n// ==========================================\nfloat calculateSmoothLifeTendency(vec2 uv, sampler2D img, vec2 res) {\n    // [Maximum Radius Reduction]Set to 4 to prevent graphics card timeouts\n    float outer_radius = 4.0; \n    float inner_radius = 1.5;\n    vec2 px = 1.0 / res;\n\n    float inner_sum = 0.0;\n    float outer_sum = 0.0;\n    float inner_count = 0.0;\n    float outer_count = 0.0;\n\n    // Sampling cycle\n    for (float x = -4.0; x <= 4.0; x++) {\n        for (float y = -4.0; y <= 4.0; y++) {\n            vec2 offset = vec2(x, y);\n            float dist = length(offset);\n            if (dist > outer_radius || dist < 0.1) continue;\n\n            // Sample only substance B (y channel)\n            float life = texture(img, uv + offset * px).y;\n            \n            if (dist <= inner_radius) {\n                inner_sum += life; inner_count += 1.0;\n            } else {\n                outer_sum += life; outer_count += 1.0;\n            }\n        }\n    }\n    \n    // Prevent division by zero\n    float inner_density = inner_sum / max(1.0, inner_count);\n    float outer_density = outer_sum / max(1.0, outer_count);\n\n    // SmoothLife Rule Parameters\n    float b1=0.25, b2=0.33, d1=0.365, d2=0.545, a1=0.028, a2=0.15;\n    float survive = sigmoid(outer_density, d1, a1) * (1.0 - sigmoid(outer_density, d2, a1));\n    float birth = sigmoid(outer_density, b1, a1) * (1.0 - sigmoid(outer_density, b2, a1));\n    float liveness = sigmoid(inner_density, 0.5, a2);\n    \n    // Return a target state between 0.0 and 1.0\n    return mix(birth, survive, liveness);\n}\n\n\n// ===== Buffer A Main Program =====\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy;\n    vec4 lastState = texture(iChannel0, uv);\n\n    // 1. Initialization (Seed)\n    if (iFrame == 0 || lastState.w > 0.5) {\n        vec3 rnd = random3(vec3(fragCoord, 500)); \n\n        fragColor = vec4(1.0, step(0.96, rnd.x), 0.0, 0.0);\n        return;\n    }\n\n    // 2. Progress Control\n    float progress = lastState.z;\n    \n    // Progress Trigger Logic: Detect Center Point\n    // Since the seeds are fixed, the time at which substance B reaches the center is now absolutely fixed.\n    if (texture(iChannel0, vec2(0.5)).y > 0.1) {\n        float boost = mix(1.0, 8.0, smoothstep(0.4, 1.0, progress)); \n        progress += 0.0015 * boost;\n    }\n\n    // 3. Eliminate the influence of global time on reactions (prevent random effects)\n    // We use a progress map to represent a “local time” instead of the incrementing iTime.\n    // Regardless of how long it runs, as long as the progress remains the same, the noise offset in the image will be identical.\n    float localTime = progress * 20.0; \n    \n    // Call reaction diffusion, passing localTime instead of iTime\n    vec4 rdResult = reactionDiffusion(fragCoord, iChannel0, iResolution.xy, localTime, progress);\n    vec2 finalAB = rdResult.xy;\n\n    // 4. Calculate the SmoothLife Trend\n    float slApproach = smoothstep(0.2, 0.5, progress);\n    if (slApproach > 0.01) {\n        float slTargetB = calculateSmoothLifeTendency(uv, iChannel0, iResolution.xy);\n        finalAB.y = mix(finalAB.y, slTargetB, 0.2 * slApproach);\n    }\n    \n    // 5. Mouse interaction \n    if (iMouse.z > 0.0) {\n        float d = distance(fragCoord, iMouse.xy);\n        if (d < 10.0) {\n            finalAB.y = 0.95; \n            finalAB.x = 0.5;  \n        }\n    }\n\n    // 6. Reset signal \n    float reset = (progress > 1.7) ? 1.0 : 0.0;\n\n    // 7. [Fade-Out Effect Linkage]：Although you apply the fade-out effect in Image,\n   \n    fragColor = vec4(clamp(finalAB, 0.0, 1.0), progress, reset);\n}",
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
					}
				],
				"code": "void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy;\n    float weight[5] = float[](0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);\n    \n    // Retrieve data from Buffer A\n    vec4 scene = texture(iChannel0, uv);\n    // Only the highly concentrated portion emits light.\n    vec3 brightness = vec3(smoothstep(0.3, 0.8, scene.y)); \n    \n    vec3 result = brightness * weight[0];\n    for(int i = 1; i < 5; ++i) {\n        float offset = float(i) * 1.5; // Blur Radius\n        result += texture(iChannel0, (fragCoord + vec2(offset, 0.0)) / iResolution.xy).y * weight[i] * 1.5;\n        result += texture(iChannel0, (fragCoord - vec2(offset, 0.0)) / iResolution.xy).y * weight[i] * 1.5;\n    }\n    fragColor = vec4(result, 1.0);\n}",
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
				"code": "void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy;\n    float weight[5] = float[](0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);\n    \n    // Set Channel0 to Buffer B\n    vec3 result = texture(iChannel0, uv).rgb * weight[0];\n    for(int i = 1; i < 5; ++i) {\n        float offset = float(i) * 1.5;\n        result += texture(iChannel0, (fragCoord + vec2(0.0, offset)) / iResolution.xy).rgb * weight[i];\n        result += texture(iChannel0, (fragCoord - vec2(0.0, offset)) / iResolution.xy).rgb * weight[i];\n    }\n    fragColor = vec4(result, 1.0);\n}",
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
			"id": "w3GfRG",
			"date": "1771869033",
			"viewed": 76,
			"name": "Bioluminescent Fungi",
			"username": "Jingwen Zhang",
			"description": "Come experience the fairy-tale world brought to life by luminous fungi created through mathematical functions!",
			"likes": 2,
			"published": 1,
			"flags": 32,
			"usePreview": 0,
			"tags": [
				"datt4950digm5950"
			],
			"hasliked": 0,
			"parentid": "w3GBRG",
			"parentname": "A2 6"
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
				"code": "void mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\nvec2 uv = (fragCoord/iResolution.xy);\n   //    uv = uv/10.;\n   \n    if(iMouse.z > 0.0) {\n       float magnification = 5.;\n        uv /= magnification;\n        uv += iMouse.xy / ((iResolution.xy + (iResolution.xy / (magnification - 1.0))));\n    }\n    \n   vec4 C = texture(iChannel0,uv);\n    if(C.r == 0.5){\n      fragColor = vec4(1,1,0.0,0.5);\n }else{\n  fragColor = C.rrrr;\n }\n //    fragColor = C.agrb;\n  // fragColor = C.gggg;\n}\n",
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
				"code": "/*\n\nStudent ID: 219581438\nAssignment 2 \nJulia Scheerer \nFireworks ||\n\nDESCRIPTION:\nThis project is an advanced version of my A1. There were a few bugs in the first version where it would go to noise\nreally quickly or not have enough active pixels on the screen. the explosions also didn't look like I wanted them to.\nIn this new version I was able to find a happy medium between noise and minimal activity. \nThis version has \"active\" pixels moving through space and when active pixels colide they cause an explosion. \nprobabilites were used to create random new active pixels, have any active pixels die out and have active pixels that result \nfrom an explosion die out faster. The probablities in here are very specific, changing them causes noise too often or not enough explosions \nfor my taste. \n\n\nTECHNICAL REALIZATONS:\n\nAs stated above I started with my a1 CA. Initially I looked at the explosion if statments and realized that explosions could\nonly happen if the current pixel had only 1 active neighbor pixel(before the amount of neighbors was not taken into account).\nI created the total variable to track the amount of active neighbors a given pixel has. This made it possible to add more active \npixels onto the screen at the begining without it becoming noise immediatly. \n\nfrom here I realized the explosions still werent happening right so I started tracking the N,E,S and W directions on top of the NE,SW,SE and NW\ndirections I was already tracking. I also changed my explosion condition so that explosions happen if an active pixel has 2 active neighbors. \nthis caused explosions to happen more frequently so I tried to add probability to calm explosions and produce more active pixles\nso that there wasn't too few active pixels or too many explosions. I also realized there was a difference between an active pixel and a pixel turned active \nthrough an explosion and that these 2 different types should die off at different speeds. I was able to track this by using C.a, C.a=1 is an active pixle\nresulting from an explosion. C.a=0 is a normal active pixel. Active pixels resulting from explosions die off faster than normally gnerated active pixels.\n\nFUTURE EXTENTIONS:\nI am really happy with the version of the project I came up with. The only extensions I can think of involve using this with \nan agent system like we looked at in class today. \n\n*/\n\n\n// C.r = exploding?\n// C. g = active \n// C.b = direction\n// C.a = the product of an explosion \n\nfloat north = 0.0;\nfloat northEast = 0.125;\nfloat east = 0.25;\nfloat southEast = 0.375; \nfloat south = 0.5; \nfloat southWest = 0.625;\nfloat west= 0.75; \nfloat northWest = 0.875;\n\n\n//can experiement with these 2 values to see different effects\nfloat new_active_pixel_probability = 0.0051; \n// this value essentially changes how long each active pixel is going for so the smaller the value the longer they will stay alive\nfloat normal_death_probability = 0.0001;\nfloat explosion_death_probability = 0.285; // probability an active pixel that resulted from an explosion will die\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\nvec2 uv = fragCoord/iResolution.xy;\nvec4 noise = random4(vec3(fragCoord,iTime));\n    \n   vec4 C = texture(iChannel0,(fragCoord/iResolution.xy));\n   \n   // get 8 nearest neighbors\n   vec4 NE = texture(iChannel0,((fragCoord+ vec2(1,1))/iResolution.xy));\n   vec4 NW = texture(iChannel0,((fragCoord+ vec2(-1,1))/iResolution.xy));\n   vec4 SW =  texture(iChannel0,((fragCoord+ vec2(-1,-1))/iResolution.xy));\n   vec4 SE =  texture(iChannel0,((fragCoord+ vec2(1,-1))/iResolution.xy));\n   vec4 E = texture(iChannel0,((fragCoord+ vec2(1,0))/iResolution.xy));\n   vec4 N = texture(iChannel0,((fragCoord+ vec2(0,1))/iResolution.xy));\n   vec4 S =  texture(iChannel0,((fragCoord+ vec2(0,-1))/iResolution.xy));\n   vec4 W =  texture(iChannel0,((fragCoord+ vec2(-1,0))/iResolution.xy));\n\nint total = int (NE.g+ NW.g+ SW.g+ SE.g+ N.g+S.g+E.g+W.g); // amount of neighbors that are active\n\n\n // active pixels moving in 1 direction, just modified ant logic.\n  if(SE.g==1.0 && SE.b ==northWest ){ // if south east pixel is active and moving towards you\n      C.g =1.0;  // become active \n      C.b = northWest;     // continue moving in same direction \n      if(SE.a ==1.0){ // if the neighbor is the result of an explosion this new active pixel is too. \n          C.a = 1.0; \n      }\n  }else if(NE.g==1.0 && NE.b ==southWest ){ // same for north east pixel \n      C.g =1.0;\n      C.b = southWest;\n      if(NE.a ==1.0){\n          C.a = 1.0; \n      }\n  }else if(NW.g==1.0 && NW.b ==southEast ){ // same for north west pixel \n      C.g =1.0;\n      C.b = southEast;\n      if(NW.a ==1.0){\n          C.a = 1.0; \n      }\n  }else if(SW.g==1.0 && SW.b ==northEast ){ // same for south west pixel \n      C.g =1.0;\n      C.b = northEast;\n      if(SW.a ==1.0){\n          C.a = 1.0; \n      }\n  }else if(N.g ==1.0 && N.b == south){ // same for north pixel \n      C.g = 1.0; \n      C.b = south;\n      if(N.a ==1.0){\n          C.a = 1.0; \n      }\n  }else if(E.g == 1.0 && E.b == west){ // same for east west pixel \n      C.g = 1.0; \n      C.b = west; \n      if(E.a ==1.0){\n          C.a = 1.0; \n      }\n  \n  }else if(S.g == 1.0 && S.b == north){ // same for south pixel \n      C.b = 1.0;\n      C.b = north;\n      if(S.a ==1.0){\n          C.a = 1.0; \n      }\n  }else if(W.g == 1.0 && W.b == east){ // same for west pixel \n      C.b = 1.0; \n      C.b = east;\n      if(W.a ==1.0){\n          C.a = 1.0; \n      }\n  }else{ // if no active pixels are moving in your direction, die \n      C.g =0.0;\n  }\n  \n  if(C.g ==1.0){\n  // flip colours\n      if(C.r>0.0){C.r = 0.0;} else{C.r=1.0;}\n  } else if (C.r!=0.5){\n      C.r = 0.0;\n  }\n \n // if exploding, die\n if(C.r ==0.5){\n     C.r = 0.0;\n     C.g = 0.0;\n }\n \n vec2 noise2 = hash23(vec3(fragCoord,iTime)); // noise used for probability comparisons \n \n //explosion logic: if active and neighbor is active cause explosion \n //have probabilistic things cause \"explosions\"\n \n if(C.g==1.0 && C.b ==northWest && total>1 && total <3 ){ // \n    if(noise2.x <normal_death_probability){\n        C.r =0.0;\n        C.g =0.0;\n    }else{\n        C.r = 0.5; // exploding state \n        C.g=0.0;\n    }\n  }else if(C.g==1.0 && C.b ==southWest && total >1 && total <3){ \n     if(noise2.x <normal_death_probability){\n        C.r =0.0;\n        C.g =0.0;\n    }else{\n        C.r = 0.5; // exploding state \n        C.g=0.0;\n    }\n  }else if(C.g==1.0 && C.b ==southEast && total>1&& total <3 ){ \n     if(noise2.x <normal_death_probability){\n        C.r =0.0;\n        C.g= 0.0;\n    }else{\n        C.r = 0.5; // exploding state \n        C.g=0.0;\n    }\n  }else if(C.g==1.0 && C.b ==northEast && total>1 && total <3){ \n     if(noise2.x <normal_death_probability){\n        C.r =0.0;\n        C.g =0.0;\n    }else{\n        C.r = 0.5; // exploding state \n        C.g=0.0;\n    }\n  } else if(C.g==1.0 && C.b == north && total>1 && total <3 ){\n    if(noise2.x <normal_death_probability){\n        C.r =0.0;\n        C.g =0.0;\n    }else{\n        C.r = 0.5; // exploding state \n        C.g=0.0;\n    }\n  } if(C.g==1.0 && C.b ==east && total>1 && total <3 ){\n    if(noise2.x <normal_death_probability){\n        C.r =0.0;\n        C.g =0.0;\n    }else{\n        C.r = 0.5; // exploding state \n        C.g=0.0;\n    }\n  } if(C.g==1.0 && C.b ==south && total>1 && total <3 ){\n    if(noise2.x <normal_death_probability){\n        C.r =0.0;\n        C.g =0.0;\n    }else{\n        C.r = 0.5; // exploding state \n        C.g=0.0;\n    }\n  } if(C.g==1.0 && C.b ==west && total>1 && total <3 ){\n    if(noise2.x <normal_death_probability){\n        C.r =0.0;\n        C.g =0.0;\n    }else{\n        C.r = 0.5; // exploding state \n        C.g=0.0;\n    }\n  }\n \n \n // if there ios only 1 or 0 active nieghbors, die. \n if(total>2){\n     C.g =0.0;\n     C.r = 0.0;\n }\n \n \n if(C.a == 1.0){\n     if(noise2.x <explosion_death_probability){\n         C.g = 0.0;\n         C.r = 0.0;\n         C.a = 0.0;\n     }\n }\n \n // if neighbor is exploding become active and move in the opposite direction of neighbors location \n \n if(SW.r==0.5){\n     C.g = 1.0; \n     C.b = northEast;\n     C.r = 1.0; \n     C.a = 1.0;\n }else if(NW.r==0.5){\n     C.g = 1.0; \n     C.b = southEast;\n     C.r = 1.0; \n     C.a = 1.0;\n }else if(NE.r ==0.5){\n     C.g= 1.0;\n     C.b = southWest;\n     C.r = 1.0; \n     C.a = 1.0;\n }else if (SE.r ==0.5){\n     C.g= 1.0;\n     C.b = northWest;\n     C.r = 1.0; \n     C.a = 1.0;\n }\n \n \n // if no neighbors and not active check probability of generating another active pixel\n if(C.g!=1. && total<1){\n    if(noise2.x < new_active_pixel_probability\n    && noise2.y < new_active_pixel_probability){ // if we're causing an ex\n      //  C.r =0.5;\n        C.g = 1.0;\n        C.a= 0.0;\n    }\n     \n }\n \n \n \n \n \n \n \nfloat direction;\n\n  \n  // initial conditions\n  if(iFrame ==0){\n// deciding which direction it moves. \n\n\n    if (noise.x<0.125){\n        direction = 0.0;\n    }else if(noise.x<0.25){\n        direction = 0.125;\n    }else if(noise.x<0.375){\n        direction = 0.25;\n    }else if(noise.x<0.5){\n        direction = 0.375;\n    }else if(noise.x<0.625){\n        direction = 0.5;\n    }else if(noise.x<0.75){\n        direction = 0.625;\n    }else if(noise.x<0.875){\n        direction = 0.75;\n    }else {\n        direction = 0.875;\n    }\n    // a random scattering of them:\n    C = vec4(\n            0, // alive or dead? \n            (noise.z < 0.01&& noise.y<0.1) ? 1 : 0, // actvie or inactive adjust .y to be <0.001 for a bigger screen or adjust differently if needed\n            direction, \n            0); \n            \n    if(C.g ==1.0){\n        C.r =1.0;\n    }\n  \n  }\n  \n  fragColor = C; \n}\n",
				"name": "Buffer A",
				"description": "",
				"type": "buffer"
			},
			{
				"outputs": [],
				"inputs": [],
				"code": "#define RANDOM_SCALE vec4(.1031, .1030, .0973, .1099)\n\n\n\nuint murmurHash13(uvec3 src) {\n    const uint M = 0x5bd1e995u;\n    uint h = 1190494759u;\n    src *= M; src ^= src>>24u; src *= M;\n    h *= M; h ^= src.x; h *= M; h ^= src.y; h *= M; h ^= src.z;\n    h ^= h>>13u; h *= M; h ^= h>>15u;\n    return h;\n}\n\n// 1 output, 3 inputs\n//float hash13(vec3 src) {\n   // uint h = murmurHash13(floatBitsToUint(src));\n  //  return uintBitsToFloat(h & 0x007fffffu | 0x3f800000u) - 1.0;\n//}\n\nfloat hash13(vec3 p3)\n{\n\tp3  = fract(p3 * .1031);\n    p3 += dot(p3, p3.zyx + 33.33);\n    return fract((p3.x + p3.y) * p3.z);\n}\n\n///  2 out, 3 in...\nvec2 hash23(vec3 p3)\n{\n\tp3 = fract(p3 * vec3(.1031, .1030, .0973));\n    p3 += dot(p3, p3.yzx+33.33);\n    return fract((p3.xx+p3.yz)*p3.zy);\n}\n\nvec2 random2(float p) {\n    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec2 random2(vec2 p) {\n    vec3 p3 = fract(p.xyx * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec2 random2(vec3 p3) {\n    p3 = fract(p3 * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec3 random3(float p) {\n    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xxy + p3.yzz) * p3.zyx); \n}\n\nvec3 random3(vec2 p) {\n    vec3 p3 = fract(vec3(p.xyx) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yxz + 19.19);\n    return fract((p3.xxy + p3.yzz) * p3.zyx);\n}\n\nvec3 random3(vec3 p) {\n    p = fract(p * RANDOM_SCALE.xyz);\n    p += dot(p, p.yxz + 19.19);\n    return fract((p.xxy + p.yzz) * p.zyx);\n}\n\nvec4 random4(float p) {\n    vec4 p4 = fract(p * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);   \n}\n\nvec4 random4(vec2 p) {\n    vec4 p4 = fract(p.xyxy * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec3 p) {\n    vec4 p4 = fract(p.xyzx * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec4 p4) {\n    p4 = fract(p4  * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n",
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
			"id": "33tBWf",
			"date": "1771993474",
			"viewed": 11,
			"name": "Fireworks ||",
			"username": "Julia Scheerer",
			"description": "An extended version of my A1 to create a probabilistic CA.",
			"likes": 0,
			"published": 1,
			"flags": 32,
			"usePreview": 0,
			"tags": [
				"datt4950"
			],
			"hasliked": 0,
			"parentid": "3XGyzK",
			"parentname": "Julia Scheerer Assignment1"
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
					}
				],
				"code": "// IMAGE PASS: Map Buffer A to color\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord){\n    vec2 uv = fragCoord.xy / iResolution.xy;\n \n    // Zooming if mouse pressed\n    if(iMouse.z > 0.0) {\n        float magnification = 3.;\n        uv /= magnification;\n        uv += iMouse.xy / ((iResolution.xy + (iResolution.xy / (magnification - 1.0))));\n    }\n    \n    // Sample evolving vector field from Buffer A\n    vec3 components = texture(iChannel0, uv).xyz;\n    vec3 norm = normalize(components); // normalize for color mapping\n\n    // Time-based palette evolution\n    float t = iTime*0.2;\n\n    // Base colors\n    vec3 colA = vec3(0.0, 0.0, 0.2);  // dark blue\n    vec3 colB = vec3(1.0, 0.9, 0.0);  // yellow\n    vec3 colC = vec3(0.2, 0.8, 1.0);  // cyan\n\n    // Mix dynamically with sine/cos functions to create evolving colors\n    vec3 dynamicColor = mix(colA, colB, 0.5 + 0.5*sin(t + norm.z*5.0));\n    dynamicColor = mix(dynamicColor, colC, 0.5 + 0.5*cos(t + norm.z*3.0));\n\n    fragColor = vec4(pow(dynamicColor, vec3(1.2)), 1.0);\n}",
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
						"type": "texture",
						"id": "XdXGzn",
						"filepath": "/media/a/3083c722c0c738cad0f468383167a0d246f91af2bfa373e9c5c094fb8c8413e0.png",
						"sampler": {
							"filter": "mipmap",
							"wrap": "repeat",
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
				"code": "/*\nStudent Number: 21909677\nAssignment Number: 2\nName: Santiago Bucio-Cano\nTitle: Viscous-Finger Ising Automata\nDescription of Interactions:\n    - Mouse: click & drag to zoom into regions of the final image (Image pass)\n    - Keys: can optionally reset or modify parameters\n    - Changing constants like `ls`, `cs`, `ds`, `pwr`, `amp` in Buffer A drastically alters the visual patterns\n    - The simulation evolves continuously, so resetting and observing differences demonstrates emergent behavior\n\nIdea of the System:\n    - This simulation combines **viscous fingering dynamics** (fluid diffusion instabilities) \n      with **Ising-model spin alignment**. \n    - Buffer A stores the evolving vector field representing local fluid “velocity” or spin orientations.\n    - Viscous fingering emerges from Laplacian/diffusion and curl interactions.\n    - The Ising term promotes alignment of neighboring spins, introducing structured domains over the fluid instability.\n    - Buffer B captures mouse input for interactions or zooming.\n    - Image pass maps the evolving vector field into a smooth, time-varying color palette.\n    - Interesting behaviors: swirling finger-like growths, domains of aligned spins, sensitive dependence on initial conditions.\n\nExternal Sources:\n    - Inspired by Shadertoy example (https://www.shadertoy.com/view/MsscD4h)\n    - Concepts taken from viscous fingering (Saffman-Taylor instability) and Ising spin models.\n\nTechnical Realization:\n    - Buffer A: Updates simulation state using Laplacian (diffusion), divergence, curl (rotation), and neighbor alignment (Ising term)\n    - Buffer B: Stores mouse position in a tiny region for Image pass\n    - Image pass: Maps Buffer A components to color with time-evolving palette to visualize finger-like and spin structures\n\nFuture Extensions:\n    - Real-time parameter controls for diffusion, curl, spin temperature\n    - Multi-mouse interactions to perturb the system\n    - Temporal decay / trails to see long-term evolution\n*/\n\n\n// ------------------------------\n// BUFFER A: Viscous Finger + Ising Simulation\n// ------------------------------\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord){\n    // --- Simulation constants ---\n    const float _K0 = -20.0/10.0; // center weight for Laplacian\n    const float _K1 = 4.0/6.0;    // orthogonal neighbors\n    const float _K2 = 1.0/6.0;    // diagonal neighbors\n    const float cs = 0.25;        // curl scaling (rotational effect)\n    const float ls = 0.24;        // Laplacian scaling (diffusion / viscous effect)\n    const float ps = -0.08;       // Laplacian z->xy influence\n    const float ds = -0.08;       // divergence scaling\n    const float pwr = 0.2;        // nonlinearity exponent\n    const float amp = 1.0;        // self-amplification\n    const float sq2 = 0.7;        // diagonal weight factor\n\n    // --- Pixel coordinates ---\n    vec2 vUv = fragCoord.xy / iResolution.xy;\n    vec2 texel = 1. / iResolution.xy;\n\n    // --- Initialize buffer with noise for first frames ---\n    if(iFrame < 10){\n        fragColor = -0.5 + texture(iChannel1, vUv); // small perturbation for pattern seeding\n        return;\n    }\n\n    // --- 3x3 neighborhood offsets ---\n    vec2 n  = vec2(0.0, texel.y);\n    vec2 ne = vec2(texel.x, texel.y);\n    vec2 e  = vec2(texel.x, 0.0);\n    vec2 se = vec2(texel.x, -texel.y);\n    vec2 s  = vec2(0.0, -texel.y);\n    vec2 sw = vec2(-texel.x, -texel.y);\n    vec2 w  = vec2(-texel.x, 0.0);\n    vec2 nw = vec2(-texel.x, texel.y);\n\n    // --- Sample current field from Buffer A ---\n    vec3 uvC  = texture(iChannel0, vUv).xyz;\n    vec3 uvN  = texture(iChannel0, vUv+n).xyz;\n    vec3 uvE  = texture(iChannel0, vUv+e).xyz;\n    vec3 uvS  = texture(iChannel0, vUv+s).xyz;\n    vec3 uvW  = texture(iChannel0, vUv+w).xyz;\n    vec3 uvNW = texture(iChannel0, vUv+nw).xyz;\n    vec3 uvSW = texture(iChannel0, vUv+sw).xyz;\n    vec3 uvNE = texture(iChannel0, vUv+ne).xyz;\n    vec3 uvSE = texture(iChannel0, vUv+se).xyz;\n\n    // --- Laplacian (diffusion) ---\n    vec3 lapl  = _K0*uvC + _K1*(uvN + uvE + uvW + uvS) + _K2*(uvNW + uvSW + uvNE + uvSE);\n    float sp = ps * lapl.z;\n\n    // --- Curl (rotation) for viscous fingering ---\n    float curl = uvN.x - uvS.x - uvE.y + uvW.y +\n                 sq2*(uvNW.x + uvNW.y + uvNE.x - uvNE.y + uvSW.y - uvSW.x - uvSE.y - uvSE.x);\n    float sc = cs * sign(curl) * pow(abs(curl), pwr);\n\n    // --- Divergence (compressibility effect) ---\n    float div  = uvS.y - uvN.y - uvE.x + uvW.x +\n                 sq2*(uvNW.x - uvNW.y - uvNE.x - uvNE.y + uvSW.x + uvSW.y + uvSE.y - uvSE.x);\n    float sd = ds * div;\n\n    vec2 norm = normalize(uvC.xy);\n\n    // --- Ising-inspired neighbor alignment ---\n    vec2 neighborAvg = 0.125*(uvN.xy + uvS.xy + uvE.xy + uvW.xy + uvNE.xy + uvNW.xy + uvSE.xy + uvSW.xy);\n    float temperature = 0.02; // random noise for thermal fluctuations\n    vec2 isingTerm = 0.1*(neighborAvg - uvC.xy) \n                    + temperature*(fract(sin(dot(fragCoord.xy ,vec2(12.9898,78.233)))*43758.5453)-0.5);\n\n    // --- Update x/y components combining Laplacian, divergence, curl, Ising alignment ---\n    float ta = amp*uvC.x + ls*lapl.x + norm.x*sp + uvC.x*sd + isingTerm.x;\n    float tb = amp*uvC.y + ls*lapl.y + norm.y*sp + uvC.y*sd + isingTerm.y;\n\n    // --- Rotate vector by curl for swirling motion ---\n    float a = ta*cos(sc) - tb*sin(sc);\n    float b = ta*sin(sc) + tb*cos(sc);\n\n    fragColor = clamp(vec4(a,b,div,1.0), -1.0, 1.0);\n}\n",
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
				"inputs": [],
				"code": "// BUFFER B: Mouse storage\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord){\n    vec2 uv = fragCoord.xy / iResolution.xy;\n    float eighth = 1.0/8.0;\n\n    // Only write to a small square to store mouse info\n    if(uv.x > 7.*eighth && uv.x < 8.*eighth && uv.y > 2.*eighth && uv.y < 3.*eighth){\n        fragColor = vec4(iMouse.xy / iResolution.xy, iMouse.zw / iResolution.xy);\n    }\n}",
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
			"id": "t3Kfzc",
			"date": "1771987279",
			"viewed": 21,
			"name": "Viscous-Finger Ising Automata",
			"username": "Santiago Bucio-Cano",
			"description": "Inspired by https://www.shadertoy.com/view/MsscD4 on viscous finger painting and an ising model.",
			"likes": 1,
			"published": 1,
			"flags": 32,
			"usePreview": 0,
			"tags": [
				"datt4950"
			],
			"hasliked": 0,
			"parentid": "MsscD4",
			"parentname": "Viscous Fingering vs Dual Vortex"
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
				"code": "// references:\n// https://alicelab.world/digm5950/ca.html\n// https://alicelab.world/digm5950/glsl.html\n//\n// Displays 3-chemical reaction-diffusion: u,v,w as RGB.\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy;\n\n    if (iMouse.z > 0.0) {\n        float magnification = 4.0;\n        uv /= magnification;\n        uv += iMouse.xy / ((iResolution.xy + (iResolution.xy / (magnification - 1.0))));\n    }\n\n    vec4 A = texture(iChannel0, uv);\n    vec3 col = vec3(A.r, A.g, A.b);\n    col.b *= 2.2;\n    col = min(col, vec3(1.0));\n    float mx = max(max(col.r, col.g), col.b);\n    if (mx > 0.01) col /= mx;\n\n    fragColor = vec4(col, 1.0);\n}",
				"name": "Image",
				"description": "",
				"type": "image"
			},
			{
				"outputs": [],
				"inputs": [],
				"code": "/**\n  219600360\n  A2\n  Tsz Him Ng\n\n  3 Chemical Reaction Diffusion Madness\n\n  INTERACTIONS AND PARAMETERS:\n  - Mouse click: Injects a yellow chemical blob at the cursor (BufferA); effective on frame 0 or when mouse is down.\n  - Mouse hold (Image tab): Zooms 4x into the area under the cursor for detailed inspection.\n  - Reset: Reload the shader to get a new initial pattern and different random event schedule.\n\n  Key parameters to modify for different behaviours:\n  - Slot length range: getSlotInfo (line ~123): 5.0 + hashSlot(i)*25.0 → min 5s, max 30s per event slot.\n  - Event window: eventStart (0.5 + hash*0.45) and eventLen (0.1 + hash*0.35) in getSpatialEvent (lines ~140–142).\n  - Ring width and front speed: ringWidth (0.05), speed (0.05) in getSpatialEvent.\n  - Hunt strength: huntStrength (0.015) controls how much the front curves toward high-activity regions.\n  - Base RD parameters: F, k, k_w, D_u, D_v, D_w in reactionDiffusion (lines ~245–250).\n\n  DESCRIPTION:\n  A three-species reaction-diffusion (Gray-Scott-like u,v plus a coupled w) is driven by spatial “storm fronts”\n  instead of global events. Each event slot (5–30 seconds, random) spawns 1–5 storm centers; each center\n  expands outward as a ring. Only pixels near the front (the perimeter) are affected, so causality is visible:\n  the viewer sees waves propagate and interact with the chemistry. The front shape is perturbed by the local\n  Laplacian of v so it “hunts” high-activity regions, and the effect is stronger where the gradient of v is\n  high. Five event types rotate (20% each): chemical storm (noise injection), parameter shift (scales F, k, D),\n  mutation wave (traveling wave), extinction (pull toward u=1, v=w=0), and random injection (sparse sites on\n  the front inject u,v,w). Long-term behaviour shows patterns emerging, being disrupted by fronts, and often\n  recovering. Events stop after ~60 slots (roughly 5–30 minutes) due to a fixed loop bound in getSlotInfo.\n\n  CREDITS AND SOURCES:\n  - DATT4950 course notes: https://alicelab.world/digm5950/ca.html, https://alicelab.world/digm5950/glsl.html\n  - DATT4950 Reaction Diffusion 4x https://www.shadertoy.com/view/33GyRc\n  - DATT4950 lab 5 https://www.shadertoy.com/view/t3cBRN\n  - Triple Chemical Reaction Diffusion Equation https://link.springer.com/chapter/10.1007/978-3-030-22514-8_32\n \n  TECHNICAL REALIZATION:\n  Buffers A/B/C/D run reactionDiffusion in a feedback loop (each reads the previous buffer). BufferA initializes\n  with a sin pattern for v, a center circle for w, and mouse-injected seed. Common defines getSlotInfo (variable\n  slot length via hash), getSpatialEvent (1–5 centers, expanding rings, optional lap_v for front-hunting),\n  and reactionDiffusion (discrete Laplacian, reaction terms f/g/h, five event applications). The Image pass\n  samples BufferA and normalizes RGB for display. Channel layout: .r=u, .g=v, .b=w (concentrations).\n\n  FUTURE EXTENSIONS:\n  - Make events run indefinitely by wrapping or extending the slot loop in getSlotInfo.\n  - Add more event types or modulate event probabilities.\n  - Vary ring width or speed per event type for distinct front behaviours.\n  - Export or visualize the “energy” field that modulates front intensity.\n\n  AI use aknowledgement\n    This project has used cursor AI on the parts of writing random global events and refactoring this codebase.\n    Refactor this codebase to ensure naming conventions is enforced. Comments longer than 1 lline should use block comments\n    I also asked the Ai to implement 5 random global events Chemical Storm, Parameter Shift, Mutation wave, extinction, and random injection.\n    Make it timed based on noise\n*/\n\n/* Deterministic pseudo-random scaling factors for hash functions. */\n#define RANDOM_SCALE vec4(.1031, .1030, .0973, .1099)\n\n/*\n * Returns a deterministic vec2 hash from a float seed.\n * Args: seed – scalar input (e.g. time or position component).\n * Returns: vec2 in [0,1)^2.\n */\nvec2 random2(float seed) {\n    vec3 hashState = fract(vec3(seed) * RANDOM_SCALE.xyz);\n    hashState += dot(hashState, hashState.yzx + 19.19);\n    return fract((hashState.xx + hashState.yz) * hashState.zy);\n}\n\n/*\n * Returns a deterministic vec2 hash from a vec2 seed.\n * Args: seed – 2D input (e.g. UV or pixel coords).\n * Returns: vec2 in [0,1)^2.\n */\nvec2 random2(vec2 seed) {\n    vec3 hashState = fract(seed.xyx * RANDOM_SCALE.xyz);\n    hashState += dot(hashState, hashState.yzx + 19.19);\n    return fract((hashState.xx + hashState.yz) * hashState.zy);\n}\n\n/*\n * Returns a deterministic vec2 hash from a vec3 seed.\n * Args: seed – 3D input (e.g. xy + time).\n * Returns: vec2 in [0,1)^2.\n */\nvec2 random2(vec3 seed) {\n    vec3 hashState = fract(seed * RANDOM_SCALE.xyz);\n    hashState += dot(hashState, hashState.yzx + 19.19);\n    return fract((hashState.xx + hashState.yz) * hashState.zy);\n}\n\n/*\n * Returns a deterministic vec3 hash from a float seed.\n * Args: seed – scalar input.\n * Returns: vec3 in [0,1)^3.\n */\nvec3 random3(float seed) {\n    vec3 hashState = fract(vec3(seed) * RANDOM_SCALE.xyz);\n    hashState += dot(hashState, hashState.yzx + 19.19);\n    return fract((hashState.xxy + hashState.yzz) * hashState.zyx);\n}\n\n/*\n * Returns a deterministic vec3 hash from a vec2 seed.\n * Args: seed – 2D input.\n * Returns: vec3 in [0,1)^3.\n */\nvec3 random3(vec2 seed) {\n    vec3 hashState = fract(vec3(seed.xyx) * RANDOM_SCALE.xyz);\n    hashState += dot(hashState, hashState.yxz + 19.19);\n    return fract((hashState.xxy + hashState.yzz) * hashState.zyx);\n}\n\n/*\n * Returns a deterministic vec3 hash from a vec3 seed.\n * Args: seed – 3D input.\n * Returns: vec3 in [0,1)^3.\n */\nvec3 random3(vec3 seed) {\n    vec3 hashState = fract(seed * RANDOM_SCALE.xyz);\n    hashState += dot(hashState, hashState.yxz + 19.19);\n    return fract((hashState.xxy + hashState.yzz) * hashState.zyx);\n}\n\n/*\n * Returns a deterministic vec4 hash from a float seed.\n * Args: seed – scalar input.\n * Returns: vec4 in [0,1)^4.\n */\nvec4 random4(float seed) {\n    vec4 hashState = fract(seed * RANDOM_SCALE);\n    hashState += dot(hashState, hashState.wzxy + 19.19);\n    return fract((hashState.xxyz + hashState.yzzw) * hashState.zywx);\n}\n\n/*\n * Returns a deterministic vec4 hash from a vec2 seed.\n * Args: seed – 2D input.\n * Returns: vec4 in [0,1)^4.\n */\nvec4 random4(vec2 seed) {\n    vec4 hashState = fract(seed.xyxy * RANDOM_SCALE);\n    hashState += dot(hashState, hashState.wzxy + 19.19);\n    return fract((hashState.xxyz + hashState.yzzw) * hashState.zywx);\n}\n\n/*\n * Returns a deterministic vec4 hash from a vec3 seed.\n * Args: seed – 3D input.\n * Returns: vec4 in [0,1)^4.\n */\nvec4 random4(vec3 seed) {\n    vec4 hashState = fract(seed.xyzx * RANDOM_SCALE);\n    hashState += dot(hashState, hashState.wzxy + 19.19);\n    return fract((hashState.xxyz + hashState.yzzw) * hashState.zywx);\n}\n\n/*\n * Returns a deterministic vec4 hash from a vec4 seed.\n * Args: seed – 4D input.\n * Returns: vec4 in [0,1)^4.\n */\nvec4 random4(vec4 seed) {\n    vec4 hashState = fract(seed * RANDOM_SCALE);\n    hashState += dot(hashState, hashState.wzxy + 19.19);\n    return fract((hashState.xxyz + hashState.yzzw) * hashState.zywx);\n}\n\n/* -----------------------------------------------------------------------------\n * Spatial event fronts: slot-based schedule (random slot length 5–30s, random\n * event window usually starting after 50% of slot). 1–5 storm centers per slot.\n * eventType: 1=chemical storm, 2=parameter shift, 3=mutation wave, 4=extinction,\n * 5=random injection (20% each).\n * ----------------------------------------------------------------------------- */\n\n/*\n * Deterministic hash for slot-based randomness. Same seed always gives same value.\n * Args: slot – slot index or offset (float).\n * Returns: value in [0, 1).\n */\nfloat hashSlot(float slot) {\n    return fract(sin(slot * 12.9898) * 43758.5453);\n}\n\n/*\n * Computes which event slot we are in and where we are within it.\n * Slot lengths vary 5–30s (noise-based). Loop capped at 60 slots.\n * Args: time – elapsed time in seconds.\n * Returns: vec3(slotIndex, phaseInSlot [0–1], currentSlotLen in seconds).\n */\nvec3 getSlotInfo(float time) {\n    float accumulatedTime = 0.0;\n    for (int i = 0; i < 60; i++) {\n        float slotLength = 5.0 + hashSlot(float(i)) * 25.0;\n        if (time < accumulatedTime + slotLength) {\n            float phaseInSlot = (time - accumulatedTime) / slotLength;\n            return vec3(float(i), phaseInSlot, slotLength);\n        }\n        accumulatedTime += slotLength;\n    }\n    return vec3(0.0, 0.0, 5.0);\n}\n\n/*\n * Per-pixel spatial event strength. Fronts expand from storm centers; only\n * pixels near the ring perimeter get effect. Args: fragCoord, resolution, time.\n * Returns: vec3(eventType, phase*frontStrength, intensity*frontStrength).\n */\nvec3 getSpatialEvent(vec2 fragCoord, vec2 resolution, float time) {\n    vec3 slotInfo = getSlotInfo(time);\n    float slotIndex = slotInfo.x;\n    float phaseInSlot = slotInfo.y;\n    float currentSlotLen = slotInfo.z;\n\n    /* Event window: start at 50–95% of slot, length 10–45% (clamped to fit). */\n    float eventStart = 0.5 + hashSlot(slotIndex + 0.2) * 0.45;\n    float eventLen = 0.1 + hashSlot(slotIndex + 0.5) * 0.35;\n    eventLen = min(eventLen, 1.0 - eventStart);\n\n    float normalizedEventTime = (phaseInSlot - eventStart) / eventLen;\n    float eventPhase = clamp(normalizedEventTime, 0.0, 1.0);\n    float isWithinEvent = float(normalizedEventTime >= 0.0 && normalizedEventTime <= 1.0);\n\n    /* Choose event type by hash (20% each for types 1–5). */\n    float eventTypeRoll = hashSlot(slotIndex);\n    float eventType = 1.0;\n    if (eventTypeRoll < 0.2) eventType = 1.0;\n    else if (eventTypeRoll < 0.4) eventType = 2.0;\n    else if (eventTypeRoll < 0.6) eventType = 3.0;\n    else if (eventTypeRoll < 0.8) eventType = 4.0;\n    else eventType = 5.0;\n\n    /* Intensity varies per slot so events feel different each time. */\n    float baseIntensity = 0.4 + 0.5 * hashSlot(slotIndex + 1.3);\n\n    vec2 uv = fragCoord / resolution.xy;\n    /* 1–5 storm centers per slot, positions from hash. */\n    int numCenters = 1 + int(hashSlot(slotIndex + 7.1) * 5.0);\n    float ringWidth = 0.05;\n    float expansionSpeed = 0.05;\n    float frontStrength = 0.0;\n\n    for (int i = 0; i < 5; i++) {\n        if (i >= numCenters) break;\n        vec2 centerPosition = vec2(\n            0.1 + 0.8 * hashSlot(slotIndex + float(i)),\n            0.1 + 0.8 * hashSlot(slotIndex + float(i) + 0.5)\n        );\n        float centerStartPhase = eventStart + hashSlot(slotIndex + float(i) * 0.2) * eventLen * 0.5;\n        float frontRadius = expansionSpeed * currentSlotLen * max(0.0, phaseInSlot - centerStartPhase);\n        float distanceToCenter = length(uv - centerPosition);\n        float ringWeight = smoothstep(ringWidth, 0.0, abs(distanceToCenter - frontRadius));\n        frontStrength = max(frontStrength, ringWeight);\n    }\n\n    float temporalEnvelope = sin(eventPhase * 3.14159) * isWithinEvent;\n    return vec3(eventType, temporalEnvelope * frontStrength, baseIntensity * frontStrength * isWithinEvent);\n}\n\n/*\n * Same as getSpatialEvent but perturbs front toward high-activity regions using\n * Laplacian of v (front \"hunts\"). Args: fragCoord, resolution, time, lap_v.\n * Returns: vec3(eventType, phase*frontStrength, intensity*frontStrength).\n */\nvec3 getSpatialEvent(vec2 fragCoord, vec2 resolution, float time, float lapV) {\n    vec3 slotInfo = getSlotInfo(time);\n    float slotIndex = slotInfo.x;\n    float phaseInSlot = slotInfo.y;\n    float currentSlotLen = slotInfo.z;\n\n    float eventStart = 0.5 + hashSlot(slotIndex + 0.2) * 0.45;\n    float eventLen = 0.1 + hashSlot(slotIndex + 0.5) * 0.35;\n    eventLen = min(eventLen, 1.0 - eventStart);\n\n    float normalizedEventTime = (phaseInSlot - eventStart) / eventLen;\n    float eventPhase = clamp(normalizedEventTime, 0.0, 1.0);\n    float isWithinEvent = float(normalizedEventTime >= 0.0 && normalizedEventTime <= 1.0);\n\n    float eventTypeRoll = hashSlot(slotIndex);\n    float eventType = 1.0;\n    if (eventTypeRoll < 0.2) eventType = 1.0;\n    else if (eventTypeRoll < 0.4) eventType = 2.0;\n    else if (eventTypeRoll < 0.6) eventType = 3.0;\n    else if (eventTypeRoll < 0.8) eventType = 4.0;\n    else eventType = 5.0;\n\n    /* Intensity varies per slot so events feel different each time. */\n    float baseIntensity = 0.4 + 0.5 * hashSlot(slotIndex + 1.3);\n\n    vec2 uv = fragCoord / resolution.xy;\n    int numCenters = 1 + int(hashSlot(slotIndex + 7.1) * 5.0);\n    float ringWidth = 0.05;\n    float expansionSpeed = 0.05;\n    float huntStrength = 0.015;\n    float frontStrength = 0.0;\n\n    for (int i = 0; i < 5; i++) {\n        if (i >= numCenters) break;\n        vec2 centerPosition = vec2(\n            0.1 + 0.8 * hashSlot(slotIndex + float(i)),\n            0.1 + 0.8 * hashSlot(slotIndex + float(i) + 0.5)\n        );\n        float centerStartPhase = eventStart + hashSlot(slotIndex + float(i) * 0.2) * eventLen * 0.5;\n        float frontRadius = expansionSpeed * currentSlotLen * max(0.0, phaseInSlot - centerStartPhase);\n        float distanceToCenter = length(uv - centerPosition);\n        /* Effective distance reduced where Laplacian is high so front bulges toward active regions. */\n        float effectiveDistance = distanceToCenter - huntStrength * lapV;\n        float ringWeight = smoothstep(ringWidth, 0.0, abs(effectiveDistance - frontRadius));\n        frontStrength = max(frontStrength, ringWeight);\n    }\n\n    float temporalEnvelope = sin(eventPhase * 3.14159) * isWithinEvent;\n    return vec3(eventType, temporalEnvelope * frontStrength, baseIntensity * frontStrength * isWithinEvent);\n}\n\n/* -----------------------------------------------------------------------------\n * Three-species reaction-diffusion (parabolic PDEs):\n *   du/dt = D_u * Laplacian(u) + f(u,v,w)\n *   dv/dt = D_v * Laplacian(v) + g(u,v,w)\n *   dw/dt = D_w * Laplacian(w) + h(u,v,w)\n * Concentrations u,v,w in .r, .g, .b. Discrete Laplacian: 0.05*diagonals + 0.2*cardinals - center.\n * ----------------------------------------------------------------------------- */\n\n/*\n * Reaction term for u (substrate). Gray-Scott: autocatalysis consumes u, feed replenishes.\n * Args: u,v,w = concentrations; F = feed rate; k_w = u-w coupling.\n */\nfloat reactionF(float u, float v, float w, float F, float k_w) {\n    return -u * v * v + F * (1.0 - u) - k_w * u * w;\n}\n\n/*\n * Reaction term for v (activator). Gray-Scott: u catalyzes v, v decays.\n * Args: u,v,w = concentrations; F = feed rate; k = decay rate.\n */\nfloat reactionG(float u, float v, float w, float F, float k) {\n    return u * v * v - (F + k) * v;\n}\n\n/*\n * Reaction term for w (third species). Coupled to v: v promotes w, w decays.\n */\nfloat reactionH(float u, float v, float w) {\n    return 0.04 * v * (1.0 - w) - 0.055 * w;\n}\n\n/*\n * Single step of 3-species reaction-diffusion with spatial event fronts.\n * Args: fragCoord, resolution, time; img = previous frame (feedback buffer).\n * Returns: vec4(u, v, w, 0) for next frame.\n */\nvec4 reactionDiffusion(vec2 fragCoord, sampler2D img, vec2 resolution, float time) {\n    /* Base Gray-Scott parameters; modified by parameter-shift event. */\n    float F = 0.0545;\n    float k = 0.062;\n    float k_w = 0.02;\n    float D_u = 1.0;\n    float D_v = 0.5;\n    float D_w = 0.4;\n\n    float dt = 1.0;\n    vec2 uv = fragCoord / resolution.xy;\n    vec2 texel = 1.0 / resolution.xy;  /* pixel size in UV for neighbor sampling */\n\n    /* Moore neighborhood: center + 8 neighbors for discrete Laplacian. */\n    vec4 C  = texture(img, uv);\n    vec4 E  = texture(img, uv + vec2(texel.x, 0.0));\n    vec4 W  = texture(img, uv - vec2(texel.x, 0.0));\n    vec4 N  = texture(img, uv + vec2(0.0, texel.y));\n    vec4 S  = texture(img, uv - vec2(0.0, texel.y));\n    vec4 NE = texture(img, uv + texel);\n    vec4 NW = texture(img, uv + vec2(-texel.x, texel.y));\n    vec4 SE = texture(img, uv + vec2(texel.x, -texel.y));\n    vec4 SW = texture(img, uv - texel);\n\n    /* Discrete Laplacian: 0.05*diagonals + 0.2*cardinals - center. */\n    float lap_u = 0.05 * (NE.r + NW.r + SE.r + SW.r) + 0.2 * (N.r + E.r + S.r + W.r) - C.r;\n    float lap_v = 0.05 * (NE.g + NW.g + SE.g + SW.g) + 0.2 * (N.g + E.g + S.g + W.g) - C.g;\n    float lap_w = 0.05 * (NE.b + NW.b + SE.b + SW.b) + 0.2 * (N.b + E.b + S.b + W.b) - C.b;\n\n    vec3 ev = getSpatialEvent(fragCoord, resolution, time, lap_v);\n    float eventType = ev.x;\n    float eventPhase = ev.y;\n    float eventIntensity = ev.z;\n\n    /* Front bites harder where gradient is high (active regions). */\n    vec2 grad_v = vec2(E.g - W.g, N.g - S.g);\n    float energy = length(grad_v);\n    float energy_mult = 0.5 + 0.5 * min(1.0, energy * 2.0);\n    eventIntensity *= energy_mult;\n\n    // Parameter shift event: scale F, k, D over event phase (peak in middle)\n    float paramEnvelope = sin(eventPhase * 3.14159);\n    float paramScale = 1.0 + eventIntensity * paramEnvelope * 0.9 * float(eventType == 2.0);\n    F *= paramScale;\n    k *= paramScale;\n    k_w *= paramScale;\n    D_u *= mix(1.0, 0.3 + 0.7 * paramScale, float(eventType == 2.0) * eventIntensity * paramEnvelope);\n    D_v *= mix(1.0, 0.3 + 0.7 * paramScale, float(eventType == 2.0) * eventIntensity * paramEnvelope);\n    D_w *= mix(1.0, 0.3 + 0.7 * paramScale, float(eventType == 2.0) * eventIntensity * paramEnvelope);\n\n    float u = C.r, v = C.g, w = C.b;\n\n    /* Euler step: diffusion + reaction. */\n    float du = D_u * lap_u + reactionF(u, v, w, F, k_w);\n    float dv = D_v * lap_v + reactionG(u, v, w, F, k);\n    float dw = D_w * lap_w + reactionH(u, v, w);\n\n    u = clamp(u + du * dt, 0.0, 1.0);\n    v = clamp(v + dv * dt, 0.0, 1.0);\n    w = clamp(w + dw * dt, 0.0, 1.0);\n\n    // Chemical storm: inject noise across the field\n    vec3 stormNoise = random3(vec3(fragCoord * 0.07, time * 2.0));\n    float stormEnvelope = sin(eventPhase * 3.14159) * float(eventType == 1.0);\n    u = clamp(u + (stormNoise.r - 0.5) * 0.25 * eventIntensity * stormEnvelope, 0.0, 1.0);\n    v = clamp(v + (stormNoise.g - 0.5) * 0.25 * eventIntensity * stormEnvelope, 0.0, 1.0);\n    w = clamp(w + (stormNoise.b - 0.5) * 0.25 * eventIntensity * stormEnvelope, 0.0, 1.0);\n\n    /* Mutation wave: traveling sine perturbs v (and slightly u,w). */\n    vec2 ndc = (fragCoord / resolution.xy) * 2.0 - 1.0;\n    float wave = sin(ndc.x * 4.0 + ndc.y * 3.0 - time * 3.0) * 0.5 + 0.5;\n    float mutEnvelope = sin(eventPhase * 3.14159) * float(eventType == 3.0);\n    float mut = (wave - 0.5) * eventIntensity * mutEnvelope * 0.35;\n    u = clamp(u + mut * 0.5, 0.0, 1.0);\n    v = clamp(v + mut, 0.0, 1.0);\n    w = clamp(w + mut * 0.5, 0.0, 1.0);\n\n    // Extinction event: pull all species toward depleted state (u→1, v,w→0)\n    float extEnvelope = sin(eventPhase * 3.14159) * float(eventType == 4.0);\n    float ext = eventIntensity * extEnvelope * 0.5;\n    u = mix(u, 1.0, ext);\n    v = mix(v, 0.0, ext);\n    w = mix(w, 0.0, ext);\n\n    /* Random injection: sparse cells on the front inject u,v,w to seed new patterns. */\n    float injEnvelope = sin(eventPhase * 3.14159) * float(eventType == 5.0);\n    vec2 cellIndex = floor(uv * 28.0);\n    float slotIdx = getSlotInfo(time).x;\n    float siteHash = hashSlot(cellIndex.x + cellIndex.y * 31.0 + slotIdx * 0.17) + hashSlot(time * 2.7) * 0.5;\n    float isInjectionSite = float(siteHash < 0.22);\n    vec3 injectionAmount = random3(vec3(fragCoord * 0.11, time)) * eventIntensity * injEnvelope * isInjectionSite * 0.4;\n    u = clamp(u + injectionAmount.r, 0.0, 1.0);\n    v = clamp(v + injectionAmount.g, 0.0, 1.0);\n    w = clamp(w + injectionAmount.b, 0.0, 1.0);\n\n    return vec4(u, v, w, 0.0);\n}\n\n/* -----------------------------------------------------------------------------\n * Ising-style reaction-diffusion: Moore neighborhood, entropy-driven copying.\n * Layout: .r=temp, .g=entropy, .b=state, .a=change.\n * ----------------------------------------------------------------------------- */\n\n/*\n * One Ising step: copy a random neighbor with probability based on entropy and temperature.\n * Args: uv, texel, prev buffer, noise (caller provides random4(vec3(fragCoord,iTime))), temperature.\n * Returns: vec4(temperature, entropy, newState, change).\n */\nvec4 isingReactionDiffusionStep(vec2 uv, vec2 texel, sampler2D prev, vec4 noise, float temperature) {\n    vec4 C = texture(prev, uv);\n    vec4 E  = texture(prev, uv + vec2(texel.x, 0.0));\n    vec4 W  = texture(prev, uv - vec2(texel.x, 0.0));\n    vec4 N  = texture(prev, uv + vec2(0.0, texel.y));\n    vec4 S  = texture(prev, uv - vec2(0.0, texel.y));\n    vec4 NE = texture(prev, uv + texel);\n    vec4 NW = texture(prev, uv + vec2(-texel.x, texel.y));\n    vec4 SE = texture(prev, uv + vec2(texel.x, -texel.y));\n    vec4 SW = texture(prev, uv - texel);\n\n    float neighborStates[8] = float[8](N.b, E.b, S.b, W.b, NW.b, SW.b, NE.b, SE.b);\n\n    /* Entropy = fraction of neighbors with different state; drives copy probability. */\n    int differentCount = int(C.b != E.b) + int(C.b != W.b) + int(C.b != N.b) + int(C.b != S.b)\n                       + int(C.b != NW.b) + int(C.b != SW.b) + int(C.b != NE.b) + int(C.b != SE.b);\n    float entropy = float(differentCount) / 8.0;\n\n    /* Higher temperature = more likely to copy even when entropy is low. */\n    float copyProbability = pow(entropy, 1.0 / max(temperature, 0.001));\n\n    C.g = entropy;\n    C.r = temperature;\n    C.a = 0.0;\n\n    if (noise.w < copyProbability) {\n        int neighborIndex = min(7, max(0, int(floor(noise.z * 8.0))));\n        C.b = neighborStates[neighborIndex];\n        C.a = 1.0;\n    }\n\n    return C;\n}",
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
				"code": "/*\n    3-chemical reaction-diffusion only: .r=u, .g=v, .b=w.\n*/\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    fragColor = reactionDiffusion(fragCoord, iChannel0, iResolution.xy, iTime);\n\n    if (iFrame == 0) {\n        fragColor = vec4(1.0, 0.0, 0.0, 1.0);\n        float s = 40.0;\n        fragColor.g += max(0.0, sin(fragCoord.x/s) * sin(fragCoord.y/s) - 0.25);\n\n        vec2 center = iResolution.xy * 0.5;\n        float r = length(fragCoord.xy - center);\n        float radius = min(iResolution.x, iResolution.y) * 0.1;\n        float inCircle = 1.0 - smoothstep(radius * 0.8, radius, r);\n        fragColor.b = 0.7 * inCircle;\n        fragColor.r = mix(1.0, 0.25, inCircle);\n    }\n\n    if (iMouse.z > 0.0 && distance(fragCoord.xy, iMouse.xy) < 30.0) {\n        fragColor.rgb = vec3(1.0, 1.0, 0.5);\n    }\n}",
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
					}
				],
				"code": "\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    fragColor = reactionDiffusion(fragCoord, iChannel0, iResolution.xy, iTime);\n}",
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
				"code": "\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    fragColor = reactionDiffusion(fragCoord, iChannel0, iResolution.xy, iTime);\n}",
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
				"code": "\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    fragColor = reactionDiffusion(fragCoord, iChannel0, iResolution.xy, iTime);\n}",
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
			"mFlagKeyboard": true,
			"mFlagMultipass": true,
			"mFlagMusicStream": false
		},
		"info": {
			"id": "wX3BDr",
			"date": "1770921070",
			"viewed": 49,
			"name": "3 Chemical Reaction Diffusion Madness",
			"username": "Tsz Him Ng",
			"description": "Triple chemical reaction diffusion\n",
			"likes": 5,
			"published": 1,
			"flags": 48,
			"usePreview": 0,
			"tags": [
				"datt4950"
			],
			"hasliked": 0,
			"parentid": "w3yyzm",
			"parentname": "DATT4950 A1"
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
					}
				],
				"code": "// references: \n// https://alicelab.world/digm5950/ca.html\n// https://alicelab.world/digm5950/glsl.html\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord ) {\n    vec2 uv = (fragCoord / iResolution.xy);\n    \n    if(iMouse.z > 0.0) {\n        float magnification = 10.;\n        uv /= magnification;\n        uv += iMouse.xy / ((iResolution.xy + (iResolution.xy / (magnification - 1.0))));\n    }\n    \n    vec4 C = texture(iChannel0, uv);\n    \n    fragColor = C;\n    \n    // debug code\n    //fragColor = vec4(uv, 1, 0);\n}",
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
							"filter": "nearest",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "/*\n218016485\nA2\nZeta Sovery\nMoss Fight\n--\nInteractions: \nThere is magnification by holding mouse. The noise value (noise > 0.9990) can be changed to create very different\neffects. (0.99) will make it more noisy and static while (0.9999) makes sparse mountain-like rays\n\nDescription:\nThis CA is involves the previous hodgepodge and Brian's Brain CA\ninspired CA from Assignment 1 and having it interact with Forest\nFire CA. Agent A is the agent from Assignment 1 while Agent B\nis the new agent. Agent A forms spiral trails through slow decay \nand neighbor-based birth, while Agent B spreads \nprobabilistically by copying neighboring states. The two agents\ninteract through simple local rules that allow patterns to\ninfluence each other’s growth and spread. Random noise sparks\nkeep the system active over time. Over long periods, the \nautomaton produces swirls that fight against the green waves that\nflow down the screen. Together, these rules produce continuously\nevolving patterns where spiral trails and \nflowing waves compete and blend across the screen.\n\nTechnical Realization: \nIt was kind of difficult trying to manage the two \ndifferent agents. Agent A would always end up overpowering \nthe other agents. The forest fire agent interacted with Agent \nA in a way that depending on the probability, it would be Agent\nA or B that would end up dominant. \n\nFuture Extension:\nIn future projects, it would be interesting looking \nfor ways to somehow involve chemical-like diffusion. It seems \nhard to imagine that it would create interesting interactions \nas a separate agent but it would be worth a try. \n\n--\nSource code:\nBrian's Brain (grrrwaaa) - https://www.shadertoy.com/view/t3tcDN\nHodgepodge (grrrwaaa) - https://www.shadertoy.com/view/3XcyRs\nLab 4 (grrrwaaa) -https://www.shadertoy.com/view/33yyzc\n*/\n\n\n\n\n//rgb variable is going to be used to assign blue parameters\nvec2 gb;\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord)\n{\n    vec2 uv = fragCoord / iResolution.xy;\n    \n    // get self state\n    vec4 c = texture(iChannel0, uv);\n    \n\n    // get neighbouring pixels\n    float E  = texture(iChannel0, (fragCoord + vec2( 1, 0)) / iResolution.xy).r;\n    float W  = texture(iChannel0, (fragCoord + vec2(-1, 0)) / iResolution.xy).r;\n    float N  = texture(iChannel0, (fragCoord + vec2( 0, 1)) / iResolution.xy).r;\n    float S  = texture(iChannel0, (fragCoord + vec2( 0,-1)) / iResolution.xy).r;\n    float NE = texture(iChannel0, (fragCoord + vec2( 1, 1)) / iResolution.xy).r;\n    float NW = texture(iChannel0, (fragCoord + vec2(-1, 1)) / iResolution.xy).r;\n    float SE = texture(iChannel0, (fragCoord + vec2( 1,-1)) / iResolution.xy).r;\n    float SW = texture(iChannel0, (fragCoord + vec2(-1,-1)) / iResolution.xy).r;\n    \n    \n    float Eb  = texture(iChannel0, (fragCoord + vec2( 1, 0)) / iResolution.xy).g;\n    float Wb  = texture(iChannel0, (fragCoord + vec2(-1, 0)) / iResolution.xy).g;\n    float Nb  = texture(iChannel0, (fragCoord + vec2( 0, 1)) / iResolution.xy).g;\n    float Sb  = texture(iChannel0, (fragCoord + vec2( 0,-1)) / iResolution.xy).g;\n    float NEb = texture(iChannel0, (fragCoord + vec2( 1, 1)) / iResolution.xy).g;\n    float NWb = texture(iChannel0, (fragCoord + vec2(-1, 1)) / iResolution.xy).g;\n    float SEb = texture(iChannel0, (fragCoord + vec2( 1,-1)) / iResolution.xy).g;\n    float SWb = texture(iChannel0, (fragCoord + vec2(-1,-1)) / iResolution.xy).g;\n    \n    \n    // count alive neighbour total \n    int neighbors =\n        int(E  > 0.9) + int(W  > 0.9) +\n        int(N  > 0.9) + int(S  > 0.9) +\n        int(NE > 0.9) + int(NW > 0.9) +\n        int(SE > 0.9) + int(SW > 0.9);\n\n    float next = c.r;\n    \n    int neighborsb =\n        int(Eb  > 0.9) + int(Wb  > 0.9) +\n        int(Nb  > 0.9) + int(Sb  > 0.9) +\n        int(NEb > 0.9) + int(NWb > 0.9) +\n        int(SEb > 0.9) + int(SWb > 0.9);\n\n    float nextb = c.g;\n    \n\n    // RULES - A\n\n    // if alive then start decay. \n    //using > or < makes it more angular and empty. any number between 0.4 and 0.9 makes nice spirals\n    if (c.r == 0.9 ){\n    //in relation to slow decay (0.2) 0.6 makes nice looser spirals that dont look like noise \n        next = 0.6;\n        gb = vec2(0.4, 0.2);\n    }\n\n    // slow decay\n    // in relation to decay start (0.6) 0.2 makes nicer looser spirals\n    else if (c.r > 0.2) {\n    //the higher the decay rate the angular it gets\n        next = c.r - 0.03;\n        gb = vec2(0.6, 1.0);\n    }\n\n    // if there is exactly 2 or 6 neighbours revive\n    // 2 and 6 give nice variety, breaks up spirals often\n    else {\n        if (neighbors == 2 || neighbors == 6) {\n            next = 1.0;\n            gb = vec2(0.02);\n        }\n    }\n\n    // noise to keep it alive\n    float noise = random4(vec3(fragCoord, iTime)).x;\n    //getting closer to .99 too chaotic and .9999 too sparse\n    if (noise > 0.9990) {\n        next = 1.0;\n    }\n\n    // initialization\n    if (iFrame == 0) {\n        next = step(0.6, random4(fragCoord.xy).x);\n        \n    }\n    \n    //reduces A depending on B\n    next *= 1.0 - nextb * 0.16;\n \n\n    \n    // RULES - B\n\n    // neighbour B states in array\n    float nearb[8] = float[8](Nb, Sb, Eb, Wb, NWb, NEb, SWb, SEb);\n\n    // \n    float differencesB =\n      abs(c.g - Nb) + abs(c.g - Sb)\n    + abs(c.g - Eb) + abs(c.g - Wb)\n    + abs(c.g - NEb) + abs(c.g - NWb)\n    + abs(c.g - SEb) + abs(c.g - SWb);\n\n    \n    float differentB = differencesB;\n\n    // temperature\n    float temperatureB = uv.x;\n\n    // probability to change state\n    float probabilityB = pow(differentB, 1.0 / (temperatureB + 0.001));\n\n    // noise\n    vec4 noiseB = random4(vec3(fragCoord.xy, iTime + 10.0));\n\n    // according to probability, copy random neighbour (CAN CHANGE float)\n    if (noiseB.x < probabilityB) {\n        int which = int(noiseB.y * 7.);\n        nextb = nearb[which];\n    }\n\n    // initialize B\n    if (iFrame == 0) {\n        nextb = random4(fragCoord.xy).x;\n    }\n\n\n\n    //change colour according to the state using gb variable\n    fragColor = vec4(next, nextb, gb.y, 1.0);\n}",
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
			"id": "33tfW7",
			"date": "1771822533",
			"viewed": 30,
			"name": "Moss Fight",
			"username": "Zeta Sovery",
			"description": "my assignment 2",
			"likes": 4,
			"published": 1,
			"flags": 32,
			"usePreview": 0,
			"tags": [
				"datt4950"
			],
			"hasliked": 0,
			"parentid": "tXVyzy",
			"parentname": "DATT4950 A1_ZS"
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
				"code": "void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy;\n    \n    // (Allows user to zoom in with the mouse.)\n    if (iMouse.z > 0.0) {\n        float magnification = 6.0;\n        uv /= magnification;\n        uv += iMouse.xy / (iResolution.xy + (iResolution.xy / (magnification - 1.0)));\n    }\n    //reads the cell and trail data.)\n    vec4 A = texture(iChannel0, uv);\n    vec4 B = texture(iChannel1, uv);\n    // (Turns the position into real coordinates.)\n\n    vec2 worldPos = uv * iResolution.xy;\n    \n    // (Sets the background colour of the system.)\n    vec3 col = vec3(0.05, 0.04, 0.03);\n    \n    // (Sets the colour of the orange job trail and the blue home trail respectively.)\n    col += B.r * vec3(1.0, 0.75, 0.15); \n    col += B.g * vec3(0.15, 0.85, 1.0); \n    \n    // (Creates a welcoming circular nest/job hub for the cells to gather job from and return to.)\n    float jobM = circleMask(worldPos, jobPos(iResolution.xy), 16.0);\n    float nestM = circleMask(worldPos, nestPos(iResolution.xy), 16.0);\n    // (Creates a coloured nest and job hub.)\n    col = mix(col, vec3(0.15, 0.95, 0.20), jobM);\n    col = mix(col, vec3(0.95, 0.95, 1.00), nestM);\n    \n    // (Creates a body for the ant.)\n    float d = distance(worldPos, A.xy);\n    float antMask = smoothstep(2.2, 0.0, d);\n    // (Creates differently coloured trails for the ants, one for the work trail and one for the home trail.)\n    vec3 antColorSearch = vec3(0.10, 0.10, 0.10);\n    vec3 antColorCarry  = vec3(1.00, 0.35, 0.10);\n    // (if the cell has finished their job, the colour of it changes.)\n    vec3 antColor = mix(antColorSearch, antColorCarry, step(0.5, A.w));\n    col = mix(col, antColor, antMask);\n    \n    // (Creates a subtle highlight around ants to see them better.)\n    float glow = smoothstep(6.0, 0.0, d) * 0.15;\n    col += glow * antColor;\n    \n    fragColor = vec4(col, 1.0);\n}",
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
					}
				],
				"code": "/*\n\n\n218992008\nAssignment #3\nBilly Abu Saleh\n\nCells At Work\n\n\nInteractions: When the user uses the mouse, they are able to get a closer look at system and the\nintricacies of the shader. Getting a closer look at the cells and the paths they've made going to \ntheir work place and seeing them fulfill their purpose and going back to their nest. The user is even\nable to distinguish which cells are going to work by their colour (black) and which ones are going back (orange.)\n\n\n\nDescription: Cells at Work visualizes the process of human body cells going to do their \"job\" in other parts \nof the body. With the \"nest\" of the cells as the blue circle and their \"work\" being the green circle, once \nthe shader starts you will see dozens of cells make their way to their job within the many different trails\nfollowing each other one after another, creating a spiderweb-like visual for the user to see as they see all\nthe different cells make their way to their job, and once they finish up they head back to their nest in \na totally differently coloured trail leaving behind them. \n\n\nPortions of code lifted from: https://www.shadertoy.com/view/7fl3zH - Lab 8\nOther Inspirations: Cells At Work (https://cellsatwork.fandom.com/wiki/Cells_at_Work!_Wiki)\n\n\n\n\nTechnical Realization: Lately I've been reading this manga series called \"Cells at work.\" A series\nthat takes the everyday working cells of the human body and realizes them into human-like characters \nwho does the everyday tasks of the human body. And when it came time to make my A3 I thought it would \nbe cool to use the series as inspiration for my project here. Having the cells from a blue circle \ngo to \"work\" as they travel throughout the human body and go do their job such as delivering carbon dioxide,\nkilling diseases, etc, before going back to their home. \n\n\nFuture Extensions: Now I do admit that I did not fully realize my original idea to the best of my abilities.\nI wanted to create more \"work\" places for the cells to go, but due to the semester wrapping up and other courses and my own capabilities I was only able\nto somewhat realize this system's full potential. Moving forward I could try to more closely simulate my \noriginal idea with the additions I listed above and overall make the system look more as a human body so \nusers can more easily distinguish the visual aesthetic I was trying to go for. Also making for more \nuser interactions would be a must. Perhaps letting the player making their own trail for the cells\nto follow would be a neat addition.\n\n\n*/\n\n\n// (Gets information from next closest cell.)\nvec4 getNearestParticle(vec4 A, vec2 fragCoord, vec2 offset) {\n    vec4 N = texture(iChannel0, (fragCoord + offset) / iResolution.xy);\n    // (Calculates the distance to compare which cell is closest to current one.)\n    float d1 = distance(fragCoord, A.xy);\n    float d2 = distance(fragCoord, N.xy);\n    // (If a neighbouring cell is closer, than the cell will depart from it'a path to go with the closer one.)\n    return (d2 < d1) ? N : A;\n}\n// (The cells senses the trail.)\nfloat readTrail(vec2 pos, float antState) {\n    vec2 uv = clamp(pos / iResolution.xy, 0.0, 1.0);\n    vec4 T = texture(iChannel1, uv);\n    \n// (The cells now follow the trail, the trail they follow is dictated by whether they have eaten or not.)\n    return (antState < 0.5) ? T.r : T.g;\n}\n// (Reads the pixel coordinates and updates it from how it was previously.)\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy;\n    vec4 A = texture(iChannel0, uv);\n    \n    // (Checks closest cells and tracks which one is the closest to it.)\n    for (int x = -2; x <= 2; x++) {\n        for (int y = -2; y <= 2; y++) {\n            A = getNearestParticle(A, fragCoord, vec2(float(x), float(y)));\n        }\n    }\n    \n    // (Grabs initial frame and assigns directions for cells.)\n    if (iFrame == 0) {\n        float N = 8.0;\n        A.xy = round(fragCoord / N) * N;\n        \n        vec4 noise = random4(vec3(A.xy, 1.0));\n        A.z = noise.z * TWOPI;\n        \n        // (IMPORTANT: Initial state for cell searching for job.)\n        A.w = 0.0;\n    }\n// (Get's position of both the nest and the job.)\nvec2 nest = nestPos(iResolution.xy);\nvec2 job = jobPos(iResolution.xy);\n    \n    // (Turns the cells from unfed to fed.)\n    if (A.w < 0.5 && distance(A.xy, job) < 14.0) {\n        A.w = 1.0; \n        // (Once the cells are fed they make an immediate 180 degree return to go home.)\n        A.z += PI; \n    }\n    \n    // (Once the cells come back home after being fed, they immediately get hungry again and go searching.)\n    else if (A.w > 0.5 && distance(A.xy, nest) < 14.0) {\n        A.w = 0.0; \n        // (They once again make a 180 degree return to start searching.)\n        A.z += PI * 0.5;\n    }\n    \n    // (the cells sense their directions to look for trails.)\n    float senseDist = 12.0;\n    float senseAngle = 0.55;\n    //(Calculates three different directions for searching.)\n    vec2 forward = dirFromAngle(A.z);\n    vec2 leftDir = dirFromAngle(A.z + senseAngle);\n    vec2 rightDir = dirFromAngle(A.z - senseAngle);\n    // (The three directions for the cells to sense, forward, left and right.)\n    vec2 pF = A.xy + forward * senseDist;\n    vec2 pL = A.xy + leftDir * senseDist;\n    vec2 pR = A.xy + rightDir * senseDist;\n\n    float sF = readTrail(pF, A.w);\n    float sL = readTrail(pL, A.w);\n    float sR = readTrail(pR, A.w);\n    \n    // (adds a random turn for the cells for a sense of random movement and a surprise factor to the system.)\n    vec4 noise = random4(vec3(A.xy * 0.01, iTime + A.w * 17.0));\n    float randTurn = (noise.x * 2.0 - 1.0) * 0.18;\n    A.z += randTurn;\n    \n    // (Senses the strength of each trail and determines which one the cell should follow.)\n    float turnAmount = 0.22;\n    if (sL > sF && sL > sR) {\n        A.z += turnAmount;\n    } else if (sR > sF && sR > sL) {\n        A.z -= turnAmount;\n    }\n    \n    // (So based on the state of the cell, this determines whether the cell should face it's target.)\n    vec2 target = (A.w < 0.5) ? job : nest;\n    float desired = angleTo(A.xy, target);\n    float diff = wrapAngle(desired - A.z);\n    // (Moves the cell towards it's target.)\n    float biasStrength = (A.w < 0.5) ? 0.03 : 0.07;\n    A.z += diff * biasStrength;\n    \n    // (Controls the speed of the cell.)\n    float speed = (A.w < 0.5) ? 42.0 : 50.0;\n    vec2 vel = dirFromAngle(A.z) * speed;\n    A.xy += vel * iTimeDelta;\n    \n    // (Forbids the cells from moving offscreen.)\n    vec2 b = clamp(A.xy, vec2(0.0), iResolution.xy);\n    //(\n    if (A.x != b.x) A.z = PI - A.z;\n    if (A.y != b.y) A.z = -A.z;\n    \n    A.xy = b;\n    \n    fragColor = A;\n}",
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
				"code": "\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy;\n    // (Reads the cell position.)\n    vec4 A = texture(iChannel0, uv); \n    // (Reads the trail position.)\n    vec4 B = texture(iChannel1, uv); // previous pheromone field\n    \n    // (Deletes trails of old cells, if not it will look very blue.)\n    B *= 0.985;\n    \n    // (Simulates a diffusion like effect for added flare.)\n    vec4 blurX = blur(iChannel1, fragCoord, iResolution.xy, 2, vec2(1.0, 0.0));\n    vec4 blurY = blur(iChannel1, fragCoord, iResolution.xy, 2, vec2(0.0, 1.0));\n    vec4 diffused = (blurX + blurY) * 0.5;\n      \n    // (Creates a circle around cells based on the distance.)\n    float d = distance(fragCoord, A.xy);\n    float p = smoothstep(2.5, 0.0, d);\n    \n    // (Based on if the cell is searching for job or going back to the nest the colour of the trail changes.)\n    if (A.w < 0.5) {\n        B.g += p * 0.12;\n    } else {\n        B.r += p * 0.14;\n    }\n    \n    // (Creates circular masks for the cells to detect where the job/nests are.)\n    float jobMask = circleMask(fragCoord, jobPos(iResolution.xy), 18.0);\n    float nestMask = circleMask(fragCoord, nestPos(iResolution.xy), 18.0);\n    // (Reinforces the trail to the job/nest.)\n    B.r += jobMask * 0.05;\n    B.g += nestMask * 0.05;\n    \n    B = clamp(B, 0.0, 1.0);\n    \n    fragColor = B;\n}",
				"name": "Buffer B",
				"description": "",
				"type": "buffer"
			},
			{
				"outputs": [],
				"inputs": [],
				"code": "//allows cells to move and rotate within a circular range around pi and 2pi\nconst float TWOPI = 6.283185307179586;\nconst float PI = 3.141592653589793;\n\n// make a sigmoid transition of x around center with given width\nfloat sigmoid(float x, float center, float width) {\n    return 1.0 / (1.0 + exp(-(x-center)*4.0/width));\n}\n\n// Gaussian blur\nvec4 blur(sampler2D img, vec2 fragCoord, vec2 resolution, int N, vec2 dir) {\n    float sigma = float(N)/3.14;   \n    float expFactor = -0.5/(sigma*sigma);\n    float weight = 1.;\n    vec4 sum = texture(img, fragCoord/resolution) * weight;\n    float weightSum = weight;\n    for (int i=1; i<=N; i++) {\n        vec2 offset = float(i) * dir;\n        float weight = exp(float(i*i) * expFactor);\n        sum += texture(img, (fragCoord + offset)/resolution) * weight;\n        sum += texture(img, (fragCoord - offset)/resolution) * weight;\n        weightSum += weight * 2.0;\n    }\n    return sum / weightSum;\n}\n\n#define RANDOM_SCALE vec4(.1031, .1030, .0973, .1099)\n\nvec2 random2(float p) {\n    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec2 random2(vec2 p) {\n    vec3 p3 = fract(p.xyx * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec2 random2(vec3 p3) {\n    p3 = fract(p3 * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec3 random3(float p) {\n    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xxy + p3.yzz) * p3.zyx); \n}\n\nvec3 random3(vec2 p) {\n    vec3 p3 = fract(vec3(p.xyx) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yxz + 19.19);\n    return fract((p3.xxy + p3.yzz) * p3.zyx);\n}\n\nvec3 random3(vec3 p) {\n    p = fract(p * RANDOM_SCALE.xyz);\n    p += dot(p, p.yxz + 19.19);\n    return fract((p.xxy + p.yzz) * p.zyx);\n}\n\nvec4 random4(float p) {\n    vec4 p4 = fract(p * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);   \n}\n\nvec4 random4(vec2 p) {\n    vec4 p4 = fract(p.xyxy * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec3 p) {\n    vec4 p4 = fract(p.xyzx * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec4 p4) {\n    p4 = fract(p4  * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\n// (Sets up where the nest is using coordinates.)\nvec2 nestPos(vec2 resolution) {\n    return resolution * vec2(0.18, 0.18);\n}\n// (Sets up where the job is using coordinates.)\nvec2 jobPos(vec2 resolution) {\n    return resolution * vec2(0.80, 0.78);\n}\n// (Set it up so the angle is turned into a direction so the ants know where to)\nvec2 dirFromAngle(float a) {\n    return vec2(cos(a), sin(a));\n}\n// (Keeps the angle in direct range of -pi and pi so the cells can turn turning direction can be stable.)\nfloat wrapAngle(float a) {\n    return mod(a + PI, TWOPI) - PI;\n}\n// (Calculates the angle the cells need to move to get from one place to another.)\nfloat angleTo(vec2 from, vec2 to) {\n    vec2 d = to - from;\n    return atan(d.y, d.x);\n}\n\nfloat circleMask(vec2 p, vec2 c, float r) {\n    return smoothstep(r, r - 2.0, distance(p, c));\n}",
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
			"id": "NcS3W1",
			"date": "1773935679",
			"viewed": 81,
			"name": "Cells At Work",
			"username": "Billy Abu Saleh",
			"description": "DATT 4950 Assignment 3 - Cells At Work!",
			"likes": 12,
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
				"code": "\n/*\n\nStudent ID: 219581438\nAssignment 3\nJulia Scheerer \n\nSpiral Chasers\n\nDESCRIPTION:\nOverall what A3 does:\n1 spiral of \"sugar\" (orange) that agents are atracted to and eat. orange does not decay but gets eaten\n\n1 spiral of yellow that agents are attracted to and add to. yellow decays on its own\n\nagents that have 2 antenea for sensing sugar and yellow. \n\nsuagr and yellow restart their spirals from the middle\nafter a cerntain amount of time elapses (orange = 50 seconds)\n(yellow starts at 10 seconds and regens at 60 seconds.)\n\n\nTECHNICAL REALIZATONS:\n\nFirst I took the lab 8 code and made the circle of orange sugar into a spiral\n\nI turned the agents into agents with antenea from lab 9 to increase their acuracy.\n\nfrom their I wanted to have the agents perform a different behaviour so i create a second spiral that \nagents would add to instead of subtract from. This yellow spiral that decays relativly fast, so even though \nagents are attracted to it more than the orange that is only the case until yellow decays to less than orange  in the current stop\nat which time the agents are atracted to the orange again. \n\nI ran into a problem where it seemed like agents were \"generating\" their own yellow where the orange spiral was \ninstead of \"taking\" yellow and spreading it past the spiral. This is because there is somehow a low level amount of \nyellow where the orange spiral is and yellow increases through mutliplication so low level amounts of yellow can still grow \nand make an impact on the overall yellow. I managed to combat this by making sure yellow was above a certain threshold\nbefore its allowed to expand. \n\noverall I really like the behaviours you can for the first 2 minutes or so as the agents eat orange ad expand yellow\n\n\ninteraction: when you click yellow forms \n\n\nFUTURE EXTENTIONS:\nI really like the version I created but in the future I could seperate the behaviours of eating orange \nor spreading yellow to 2 seperate agent systems. I could also create a version where proximity or yellow or orange increases\nthe speed where speed is saved in A.w now that A.w doesn't have to hold the previous frame anymore. \n\n*/\n\n\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord ) {\n    vec2 uv = (fragCoord / iResolution.xy);\n   \n    // zoom in\n    if (iMouse.z > 0.0) {\n        float magnification = 6.;\n        uv /= magnification;\n        uv += iMouse.xy / ((iResolution.xy + (iResolution.xy / (magnification - 1.0))));\n    }\n    \n    \n    // get our cell\n    vec4 A = texture(iChannel0, uv);\n    vec4 B = texture(iChannel1, uv);\n    vec4 C = texture(iChannel2, uv);\n    vec4 D = texture(iChannel3, uv);\n    // divide position by resolution to view in 0..1\n    \n    // get distance from this pixel to the particle it is tracking:\n    float d = distance(uv * iResolution.xy, A.xy);\n    //float p = 1/d.;\n    //float p = exp(0.3*-d);\n    float p = smoothstep(2., 0., d);\n    \n    \n    // sugar field:\n  \n    // orange \n    fragColor = vec4(C.x*1.,C.y* 0.5, 0, C.a);\n    // yellow\n    fragColor += vec4(D.x*1.,D.y* 1., 0, D.a);\n    // trails:\n    fragColor += B;\n    // agents:\n    fragColor += vec4(p);\n   \n}",
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
				"code": "\n\n// each pixel tracks an agent\n// .xy is the agent location (in pixels)\n// .z is the agent direction (in radians)\n\n// given current particle \"A\" at pixel `fragCoord`\n// is the particle at `fragCoord+offset` nearer? if so return that.\nvec4 getNearestParticle(vec4 A, vec2 fragCoord, vec2 offset) {\n    // get by neighbour pixel\n    vec4 N = texture(iChannel0, (fragCoord+offset)/iResolution.xy);\n    // distance from my pixel to the particle I'm tracking:\n    float d1 = distance(fragCoord, A.xy);\n    // distance from my pixel to the particle my neighbor is tracking:\n    float d2 = distance(fragCoord, N.xy);\n    // if my neighbor's particle is nearer, track that instead! \n    if (d2 < d1) { return N; } else { return A; }\n}\n\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord) {\n    // convert pixel coordinate to normalize texture coord\n    vec2 uv = fragCoord / iResolution.xy;\n    // our previous state\n    vec4 A = texture(iChannel0, uv);\n    \n    // make sure we are tracking the nearest particle by testing\n    // each of our nearest pixels to see if their particle is nearer\n    for (int x=-2; x<=2; x++) {\n        for (int y=-2; y<=2; y++) {\n            A = getNearestParticle(A, fragCoord, vec2(x, y));\n        }\n    }\n    \n    vec4 noise = random4(vec3(A.xy, iTime));\n    \n    float speed = 50.;\n    float sensor_length = 20.;\n    \n    // set up antenea \n    mat2 rot = rotate2d(A.z);\n    vec2 sensor0 = vec2(1,0) * sensor_length; // sensor straight ahead at the angle your moving \n    vec2 sensor1 = vec2(1,1) * sensor_length; // sensor to the right\n    vec2 sensor2 = vec2(1,-1) * sensor_length; // sensor to the left\n    vec2 sensor0_in_world = rot* sensor0+A.xy;\n    vec2 sensor1_in_world = rot* sensor1+A.xy;\n    vec2 sensor2_in_world = rot* sensor2+A.xy;\n    \n    // get the orange\n    vec4 For = texture (iChannel2, sensor0_in_world/iResolution.xy);\n    vec4 FLor = texture (iChannel2, sensor1_in_world/iResolution.xy);\n    vec4 FRor = texture (iChannel2, sensor2_in_world/iResolution.xy);\n    \n    // get the yellow\n    vec4 Fyellow = texture (iChannel3, sensor0_in_world/iResolution.xy);\n    vec4 FLyellow = texture (iChannel3, sensor1_in_world/iResolution.xy);\n    vec4 FRyellow = texture (iChannel3, sensor2_in_world/iResolution.xy);\n    \n    // follow the orange if its greater in the current dirction than the yellow is in a different direction \n    // yellow is a stronger lure\n    // that being said because yellow is decays fast it is only a stronger force for a short window of time\n    \n    \n    // if front orange is greater than left and front is greater than right \n    if (For.x > FLor.x && For.x > FRor.x) {\n       \n        if((FRyellow.x> FLyellow.x )&& (FRyellow.x>For.x)){ // yellow to the right is stronger than yellow to the left and yellow to the right is stronger than orange to the front \n            A.z += 1.;\n        }else if((FLyellow.x> FRyellow.x )&& (FLyellow.x>For.x)){\n            A.z -= 1.;\n        }\n      \n        // no change to heading\n    } else if (For.x < FLor.x && For.x < FRor.x) { // sugar to right and left are the same \n        // rotate randomly left or right\n        A.z += (noise.z = 0.5);\n    } else if (FLor.x < FRor.x) { // if sugar to the right is stronger than left\n    \n        if( FLyellow.x >FRor.x){ // if yellow to the left is stronger than sugar to the right \n            if(Fyellow.x>FLyellow.x){// if yellow straight ahead is great that yellow to the left\n            // keep going straight\n            }else{\n              A.z-= 1.; // rotate left \n            }\n        }else{ // sugar to the right is stronger than yellow to the left\n         \n            A.z+= 1.;\n           // rotate right\n        }\n     \n    } else if (FRor.x < FLor.x) { // if sugar to the left is stronger than sugar to the right\n    \n        if( FRyellow.x >FLor.x){ // yellow to the right is stronger than sugar to the left\n            if(Fyellow.x>FRyellow.x){// if yellow straight ahead is great that yellow to the right\n                // keep going straight\n            }else{\n                    // rotate right\n                A.z += 1.;\n            }\n        }else{\n                // rotate left\n            A.z -=1.;\n        }\n    }\n    \n    rot = rotate2d(A.z);\n    // move the particle\n    // get the xy velocity from the A.z direction\n    // polar to cartesian\n    vec2 vel =  rot* vec2(speed,0);\n    // integrate velocity to position\n    A.xy += vel * iTimeDelta;\n    \n    // get the bounded position within the screen image\n    vec2 b = clamp(A.xy, vec2(0), iResolution.xy);\n    // compare the bounded and actual positions -- if they are different, reflect their orientations:\n    if (A.x != b.x) { A.z = TWOPI*0.5 - A.z; } // reflect in Y axis\n    if (A.y != b.y) { A.z = TWOPI - A.z; } // reflect in X axis\n    // also, actually clamp the position on screen\n    A.xy = b.xy; \n    \n    // initialize:\n    if (iFrame == 0) {\n        //A.xy = iResolution.xy * noise.xy;\n        // every pixel in a NxN square is tracking the same particle\n        // round the position to the nearest \"N\"\n        float N = 30.;\n        A.xy = round(fragCoord/N) * N;\n        // we have to seed the random generator using the particle's\n        // location, not the pixel location, so that all pixels agree\n        vec4 noise = random4(vec3(A.xy, iFrame));\n        \n        \n        // direction:\n        A.z = noise.z * TWOPI;\n    }\n    \n    fragColor = A;\n}",
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
				"code": "// agent trails \n\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    // convert pixel coordinate to normalize texture coord\n    vec2 uv = fragCoord / iResolution.xy;\n    \n    // our previous state\n    vec4 A = texture(iChannel0, uv); // the particles\n    vec4 B = texture(iChannel1, uv); // the trails\n    \n    \n    // decay:\n    B *= 0.97;\n    \n    // draw the particle\n    // get distance from this pixel to the particle it is tracking:\n    float d = distance(fragCoord, A.xy);\n    //float p = 1/d.;\n    //float p = exp(0.3*-d);\n    float p = smoothstep(1., 0., d);\n    \n    B += vec4(p);\n    \n    fragColor = B;\n}",
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
				"code": "// sugar landscape\n\nmat3 gaussBlur = mat3(\n        1, 2, 1,\n        2, 4, 2,\n        1, 2, 1\n    ) * 1.0/16.0;\n    \n    \n   \n\n/*\nBuffer C generates an orange spiral. Heavily inspired by lab 8 \nthis spiral regernerates every 50 seconds (once it goes beyond my screen)\n*/\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord ) {\n    vec2 uv = (fragCoord / iResolution.xy);\n    \n    vec4 C = texture(iChannel2, uv); // the previous frame\n    \n    // gaussian blurred previous frame:\n    vec4 N = texture(iChannel2, (fragCoord + vec2(0, 1))/iResolution.xy);\n    vec4 S = texture(iChannel2, (fragCoord + vec2(0, -1))/iResolution.xy);\n    vec4 E = texture(iChannel2, (fragCoord + vec2(1, 0))/iResolution.xy);\n    vec4 W = texture(iChannel2, (fragCoord + vec2(-1, 0))/iResolution.xy);\n    vec4 NE = texture(iChannel2, (fragCoord + vec2(1, 1))/iResolution.xy);\n    vec4 SE = texture(iChannel2, (fragCoord + vec2(1, -1))/iResolution.xy);\n    vec4 NW = texture(iChannel2, (fragCoord + vec2(-1, 1))/iResolution.xy);\n    vec4 SW = texture(iChannel2, (fragCoord + vec2(-1, -1))/iResolution.xy);\n    C = ((NE+SE+NW+SW) + 2.*(N+E+S+W) + 4.*C)/16.;\n    \n    vec4 noise = random4(vec3(fragCoord, iTime));\n   \n    // am I being eaten?\n   \n    vec4 A = texture(iChannel0, uv); // the nearest agent\n    float ad = distance(A.xy, fragCoord); // distance to agent\n    if (ad < 1.) { \n        \n        C.xyz *= 0.7;\n    }\n    \n    float a = iTime*3.;\n    \n    \n    // creates a spiral effect that lasts for 49 seconds then resets. \n   \n    if (int(iTime)%50< 49){ \n        a = iTime*3.;\n    }else{\n        C.a =0.;\n    }\n    \n\n    float r = (iResolution.y)/30.+C.a;\n\n    vec2 p = vec2(iResolution.xy/2.);\n    p.x += r * cos(a);\n    p.y += r * sin(a);\n    \n    float d = distance(fragCoord, p);\n    \n    \n    // add a circle to the field:\n    C += vec4(step(d, 10.)); // size of circle \n    C.a +=0.1; // +0.05 when a = iTime*0.2,  if iTime*0.8 C.a+=0.2 is fine \n    // keep it in the range of 0..1:\n    C.xyz = clamp(C.xyz, 0., 1.);\n    fragColor = C;\n    \n    \n}\n",
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
				"code": "// sugar landscape\n\nmat3 gaussBlur = mat3(\n        1, 2, 1,\n        2, 4, 2,\n        1, 2, 1\n    ) * 1.0/16.0;\n    \n    \n   \n\n// buffere D generates the yellow pixles. \n// \nvoid mainImage( out vec4 fragColor, in vec2 fragCoord ) {\n    vec2 uv = (fragCoord / iResolution.xy);\n    \n    vec4 C = texture(iChannel2, uv); // the previous frame\n    \n    // gaussian blurred previous frame:\n    vec4 N = texture(iChannel2, (fragCoord + vec2(0, 1))/iResolution.xy);\n    vec4 S = texture(iChannel2, (fragCoord + vec2(0, -1))/iResolution.xy);\n    vec4 E = texture(iChannel2, (fragCoord + vec2(1, 0))/iResolution.xy);\n    vec4 W = texture(iChannel2, (fragCoord + vec2(-1, 0))/iResolution.xy);\n    vec4 NE = texture(iChannel2, (fragCoord + vec2(1, 1))/iResolution.xy);\n    vec4 SE = texture(iChannel2, (fragCoord + vec2(1, -1))/iResolution.xy);\n    vec4 NW = texture(iChannel2, (fragCoord + vec2(-1, 1))/iResolution.xy);\n    vec4 SW = texture(iChannel2, (fragCoord + vec2(-1, -1))/iResolution.xy);\n    C = ((NE+SE+NW+SW) + 2.*(N+E+S+W) + 4.*C)/16.;\n    \n    vec4 noise = random4(vec3(fragCoord, iTime));\n    C.xyz *=0.997; // 0.992 \n    \n    // am I adding to the yellow?\n   \n    vec4 A = texture(iChannel0, uv); // the nearest agent\n    float ad = distance(A.xy, fragCoord); // distance to agent\n\n\n          // if the current pixel isn't at the edge, \n    if (!(uv.x >= 0.95)&&!(uv.y >= 0.95)){ \n\n        // if the distance between the current pixel and its agent is < 1\n        if (ad < 0.8 && C.x+C.y>0.3) { \n            // there are low level amounts of C.x and C.y in a circular pattern that cause agents to seemingly \n            // \"generate their own yellow in a spiral. avoid this by not increasing the yellow when it is small \n            C.xyz *= 3.;\n        \n        }\n   \n    }\n      \n    float a = iTime*1.;\n  \n    \n    \n    // creates a spiral effect after 9 seconds has passed \n\n    if(iTime>9.){\n    \n        if(int(iTime)%10 > 9){\n            C.a =0.;\n      \n        }else{\n             a = iTime*1.;\n        }\n         //reset the spiral every 60 seconds. \n        if(iTime>59.){\n     \n            if (int(iTime)%60< 59){\n                a = iTime*1.;\n            }else{\n                C.a =0.;\n            }\n    \n        }\n    \n\n        float r = (iResolution.y)/30.+C.a;\n\n        vec2 p = vec2(iResolution.xy/2.);\n        p.x += r * cos(a);\n        p.y += r * sin(a);\n\n        // if the mouse is held, randomize some pixels near the mouse\n        if (iMouse.z > 0.0) {\n            p = iMouse.xy;\n        }\n        float d = distance(fragCoord, p);  // circumference edge \n\n\n        // add a circle to the field:\n        C += vec4(step(d, 10.)); // size of circle, returns 0 if distance > 10, returns 1 if distance < 10\n        C.a +=0.1; // raduis increases by 0.1 every time you hit this pixel causing a spiral\n        // keep it in the range of 0..1:\n        C.xyz = clamp(C.xyz, 0., 1.);\n    }\n    \n    fragColor = C;\n    \n   \n}\n",
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
			"id": "7fBGDm",
			"date": "1774150603",
			"viewed": 3,
			"name": "Spiral Chasers",
			"username": "Julia Scheerer",
			"description": "agents tracking the CA. CA is a spiral. one orange, one yellow. they eat orange and add to yellow.  ",
			"likes": 0,
			"published": 1,
			"flags": 32,
			"usePreview": 0,
			"tags": [
				"datt4950"
			],
			"hasliked": 0,
			"parentid": "sfs3Wl",
			"parentname": "finished lab 8 extended"
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
				"code": "// =============================================================================\n// Image: Final Visualization\n// Combines all buffers into a visually rich display. Reads from iChannel0\n// (agents), iChannel1 (pheromones), iChannel2 (environment).\n// =============================================================================\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    // Normalize UV coordinates for sampling and effects\n    vec2 uv = fragCoord / iResolution.xy;\n\n    // Zoom interaction: click and hold to zoom 4x toward cursor\n    if (iMouse.z > 0.0) {\n        float magnification = 4.0;\n        uv /= magnification;\n        uv += iMouse.xy / (iResolution.xy + iResolution.xy / (magnification - 1.0));\n    }\n\n    // Sample all simulation buffers\n    vec4 agentData = texture(iChannel0, uv);\n    vec4 pheromoneData = texture(iChannel1, uv);\n    vec4 environmentData = texture(iChannel2, uv);\n\n    // Environment: C.r = biomass (food), C.g = hazard, C.b = terrain, C.a = territory\n    float food = environmentData.r;\n    float hazard = environmentData.g;\n    float territory = environmentData.a;\n\n    // Pheromone channels: colony 0, colony 1, toxin, road traffic\n    float colony0Pheromone = pheromoneData.r;\n    float colony1Pheromone = pheromoneData.g;\n    float toxin = pheromoneData.b;\n    float road = pheromoneData.a;\n\n    // Time-based animation for pulsing and flow effects\n    float time = iTime;\n    float pulse = 0.9 + 0.1 * sin(time * 2.0);\n    float flowPhase = time * 0.5;\n\n    // Dark gradient background: warmer at center, darker at edges\n    vec2 center = uv - 0.5;\n    float radial = length(center);\n    vec3 bgDark = vec3(0.02, 0.015, 0.04);\n    vec3 bgCenter = vec3(0.04, 0.03, 0.08);\n    vec3 color = mix(bgCenter, bgDark, smoothstep(0.3, 0.8, radial));\n\n    // ========== TERRITORY (subtle ambient tint by colony control) ==========\n    vec3 territory0Tint = vec3(0.15, 0.05, 0.02);\n    vec3 territory1Tint = vec3(0.02, 0.05, 0.15);\n    float territoryStrength = abs(territory) * 0.15;\n    if (territory > 0.0) {\n        color += territory0Tint * territoryStrength;\n    } else {\n        color += territory1Tint * territoryStrength;\n    }\n\n    // ========== FOOD (pulsing bioluminescent glow) ==========\n    float foodPulse = 0.7 + 0.3 * sin(time * 1.5 + food * 3.0);\n    vec3 resourceColor = vec3(0.15, 0.9, 0.35);\n    vec3 resourceGlow = vec3(0.2, 1.0, 0.4);\n    color += resourceColor * food * 0.9 * foodPulse;\n    color += resourceGlow * food * food * 0.8;  // Bright core for dense patches\n\n    // ========== ROADS (glowing highway trails from traffic) ==========\n    float roadGlow = road * road;\n    vec3 roadColor = vec3(0.5, 0.45, 0.4);\n    vec3 roadEdge = vec3(0.9, 0.85, 0.7);\n    color += roadColor * road * 0.35;\n    color += roadEdge * roadGlow * 0.4 * pulse;\n\n    // ========== PHEROMONE TRAILS (animated, flowing) ==========\n    float trailPulse = 0.85 + 0.15 * sin(flowPhase + colony0Pheromone * 10.0);\n    vec3 pheromone0Color = vec3(1.0, 0.4, 0.1);\n    vec3 pheromone0Bright = vec3(1.0, 0.6, 0.2);\n    color += pheromone0Color * colony0Pheromone * 0.35 * trailPulse;\n    color += pheromone0Bright * colony0Pheromone * colony0Pheromone * 0.25;\n\n    trailPulse = 0.85 + 0.15 * sin(flowPhase + colony1Pheromone * 10.0 + 1.0);\n    vec3 pheromone1Color = vec3(0.1, 0.5, 1.0);\n    vec3 pheromone1Bright = vec3(0.3, 0.7, 1.0);\n    color += pheromone1Color * colony1Pheromone * 0.35 * trailPulse;\n    color += pheromone1Bright * colony1Pheromone * colony1Pheromone * 0.25;\n\n    // ========== HAZARD (creeping corruption from environment) ==========\n    if (hazard > 0.05) {\n        vec3 hazardColor = vec3(0.4, 0.05, 0.3);\n        vec3 hazardGlow = vec3(0.8, 0.2, 0.6);\n        float hazardPulse = 0.8 + 0.2 * sin(time * 3.0);\n        color = mix(color, hazardColor, hazard * 0.4);\n        color += hazardGlow * hazard * hazard * 0.5 * hazardPulse;\n    }\n\n    // ========== TOXIN (raider poison - vivid, animated) ==========\n    if (toxin > 0.08) {\n        vec3 toxinColor = vec3(0.6, 0.1, 0.5);\n        vec3 toxinGlow = vec3(1.0, 0.3, 0.9);\n        float toxinPulse = 0.7 + 0.3 * sin(time * 4.0 + toxin * 20.0);\n        color = mix(color, toxinColor, toxin * 0.5);\n        color += toxinGlow * toxin * toxinPulse * 0.6;\n    }\n\n    // ========== NESTS (breathing, pulsating hubs) ==========\n    vec2 nest0 = getNestPosition(0.0, iResolution.xy);\n    vec2 nest1 = getNestPosition(1.0, iResolution.xy);\n    vec2 pixelPos = uv * iResolution.xy;\n\n    float distToNest0 = distance(pixelPos, nest0);\n    float distToNest1 = distance(pixelPos, nest1);\n\n    float nestPulse = 0.8 + 0.2 * sin(time * 1.2);\n    float nest0Glow = smoothstep(NEST_RADIUS * 1.8, NEST_RADIUS * 0.3, distToNest0) * nestPulse;\n    float nest1Glow = smoothstep(NEST_RADIUS * 1.8, NEST_RADIUS * 0.3, distToNest1) * nestPulse;\n\n    color += vec3(0.9, 0.35, 0.1) * nest0Glow * 0.6;\n    color += vec3(0.1, 0.45, 1.0) * nest1Glow * 0.6;\n\n    // Animated concentric rings expanding outward\n    float ringPhase = mod(time * 0.8, 1.0);\n    float nest0Ring = smoothstep(3.0, 0.0, abs(distToNest0 - NEST_RADIUS - ringPhase * 20.0));\n    float nest1Ring = smoothstep(3.0, 0.0, abs(distToNest1 - NEST_RADIUS - ringPhase * 20.0));\n    color += vec3(1.0, 0.55, 0.25) * nest0Ring * 0.9 * pulse;\n    color += vec3(0.25, 0.65, 1.0) * nest1Ring * 0.9 * pulse;\n\n    // Static inner ring at nest boundary\n    float nest0Inner = smoothstep(2.0, 0.0, abs(distToNest0 - NEST_RADIUS));\n    float nest1Inner = smoothstep(2.0, 0.0, abs(distToNest1 - NEST_RADIUS));\n    color += vec3(1.0, 0.5, 0.2) * nest0Inner * 0.7;\n    color += vec3(0.2, 0.6, 1.0) * nest1Inner * 0.7;\n\n    // ========== AGENTS (enhanced glow, caste silhouettes) ==========\n    float distToAgent = distance(pixelPos, agentData.xy);\n    float agentGlow = smoothstep(4.0, 0.0, distToAgent);\n\n    if (agentGlow > 0.01) {\n        // Unpack agent state (colony, caste, cargo, energy)\n        float packedState = agentData.w;\n        float colony = floor(packedState);\n        float remainder = packedState - colony;\n        float caste = floor(remainder * 10.0);\n        remainder = remainder * 10.0 - caste;\n        float cargo = floor(remainder * 10.0);\n        remainder = remainder * 10.0 - cargo;\n        float energy = remainder * 10.0;\n\n        vec3 agentColor;\n        if (colony < 0.5) {\n            agentColor = vec3(1.0, 0.45, 0.15);\n        } else {\n            agentColor = vec3(0.2, 0.75, 1.0);\n        }\n\n        // Caste tint: builders = yellow, raiders = red\n        if (caste == CASTE_BUILDER) {\n            agentColor = mix(agentColor, vec3(1.0, 1.0, 0.4), 0.5);\n        } else if (caste == CASTE_RAIDER) {\n            agentColor = mix(agentColor, vec3(1.0, 0.15, 0.35), 0.5);\n        }\n\n        // Carrying cargo: green tint\n        if (cargo > 0.5) {\n            agentColor = mix(agentColor, vec3(0.4, 1.0, 0.5), 0.4);\n        }\n\n        agentColor *= (0.6 + energy * 0.4);\n\n        // Caste silhouettes: builders = larger glow, raiders = second ring\n        float glowSize = 4.0;\n        if (caste == CASTE_BUILDER) glowSize = 6.0;\n        float casteGlow = smoothstep(glowSize, 0.0, distToAgent);\n        color += agentColor * max(agentGlow, casteGlow * 0.8);\n\n        if (caste == CASTE_RAIDER) {\n            float ring = smoothstep(5.0, 4.0, distToAgent) * smoothstep(2.5, 3.0, distToAgent);\n            color += agentColor * ring * 0.7 * pulse;\n        }\n\n        // Bright core with energy-based intensity\n        float centerDot = smoothstep(1.8, 0.4, distToAgent);\n        color += agentColor * centerDot * (0.6 + energy * 0.4);\n\n        // Subtle outer halo\n        float halo = smoothstep(8.0, 2.0, distToAgent) * 0.15;\n        color += agentColor * halo;\n    }\n\n    // ========== POST-PROCESSING ==========\n    // Bloom: boost bright areas (subtle to avoid brightness creep over time)\n    float lum = dot(color, vec3(0.299, 0.587, 0.114));\n    color += color * smoothstep(0.1, 0.5, lum) * 0.1;\n\n    // Film grain for subtle texture\n    float grain = fract(sin(dot(fragCoord.xy + time, vec2(12.9898, 78.233))) * 43758.5453);\n    color += (grain - 0.5) * 0.03;\n\n    // Vignette (stronger, more cinematic)\n    float vignette = 1.0 - smoothstep(0.3, 0.9, radial) * 0.5;\n    color *= vignette;\n\n    // Contrast and gamma\n    color = pow(color, vec3(0.88));\n    color = color * 1.02 - 0.01;\n\n    // Slight scale to prevent additive accumulation from saturating over long runs\n    color *= 0.96;\n\n    fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);\n}\n",
				"name": "Image",
				"description": "",
				"type": "image"
			},
			{
				"outputs": [],
				"inputs": [],
				"code": "/*\n  219600360\n  A3\n  Tsz Him Ng\n\n  Duel ant colony in a Living Chemical Landscape\n\n  INTERACTIONS AND PARAMETERS:\n    - Click and hold the left mouse button to zoom in toward the cursor.\n    - Worth tuning in Common: FORAGER_PROB, BUILDER_PROB (caste mix), NEST_RADIUS,\n      NEST0_POS/NEST1_POS. In BufferA: baseSpeed, trailfactor, wanderfactor.\n\n  DESCRIPTION:\n    This piece is a 2 colony ant stingmergy simulation with a lot of ecological factors in simulation.\n  There are 2 colonies (blue and orange) of ants that have builders and raiders which build different roads \n  to find food. There also exists natural zones spawning like hazard and toxin zones which hinder the path\n  of the ant colonies. The green patches are the foods that ants collect and grow overtime while consuming some of it.\n    \n  CREDITS:\n     - DATT4950 ant stigmergy https://www.shadertoy.com/view/scXGzX\n\n  TECHNICAL REALIZATION:\n    Originally I wanted to make the ant colonies fight each other but I couldn't quite get it to work so I took a bit of inspiration\n  from previous assignment of adding natural zone effects/ecological effects that alter the course of the simulation which creates a\n  different result everytime that varies more. \n    \n  FUTURE EXTENSIONS:\n    - Add food, hazard, or spawn nests for mouse interactions.\n    - More colonies or the ants having ability to create a new colony\n    - Audio reactive based on ant locations.\n\n  AI use aknowledgement\n    This project has used cursor AI on making the ant colonies have different classes and natural hazard events. I have used a PRD document \n  to write down my changes and then modified it.\n*/\n\n\n// -----------------------------------------------------------------------------\n// Mathematical constants\n// -----------------------------------------------------------------------------\nconst float TWOPI = 6.283185307179586;\nconst float PI = 3.141592653589793;\n\n// -----------------------------------------------------------------------------\n// Caste system: Foragers (70%), Builders (15%), Raiders (15%)\n// -----------------------------------------------------------------------------\nconst float CASTE_FORAGER = 0.0;\nconst float CASTE_BUILDER = 1.0;\nconst float CASTE_RAIDER = 2.0;\n\n// Cumulative spawn probabilities (assignCaste uses rand < threshold)\nconst float FORAGER_PROB = 0.70;\nconst float BUILDER_PROB = 0.85;  // 70% + 15%; raiders get remainder\n\n// -----------------------------------------------------------------------------\n// Nest layout: Colony 0 left, Colony 1 right\n// -----------------------------------------------------------------------------\nconst vec2 NEST0_POS = vec2(0.2, 0.5);\nconst vec2 NEST1_POS = vec2(0.8, 0.5);\nconst float NEST_RADIUS = 40.0;\n\n// Terrain value meaning \"obstacle\" (agent cannot move through)\nconst float OBSTACLE_TERRAIN = 2.0;\n\n// -----------------------------------------------------------------------------\n// packAgentState: Packs colony, caste, cargo, energy, success into a float.\n//   colony: 0 or 1\n//   caste: 0=forager, 1=builder, 2=raider\n//   cargo: 0 or 1 (carrying food)\n//   energy: 0..1\n//   success: forager \"just delivered\" bonus for pheromone deposit\n// Returns packed value for storage in A.w\n// -----------------------------------------------------------------------------\nfloat packAgentState(float colony, float caste, float cargo, float energy, float success) {\n    return colony + caste * 0.1 + cargo * 0.01 + clamp(energy, 0.0, 0.999) * 0.001 + clamp(success, 0.0, 0.9) * 0.0001;\n}\n\n// getNestPosition: Returns pixel position of nest for given colony.\n//   colony: 0 or 1\n//   resolution: iResolution.xy\n// -----------------------------------------------------------------------------\nvec2 getNestPosition(float colony, vec2 resolution) {\n    return resolution * (colony < 0.5 ? NEST0_POS : NEST1_POS);\n}\n\n// assignCaste: Maps random value to caste based on spawn probabilities.\n//   rand: value in [0,1)\n// Returns CASTE_FORAGER, CASTE_BUILDER, or CASTE_RAIDER\n// -----------------------------------------------------------------------------\nfloat assignCaste(float rand) {\n    if (rand < FORAGER_PROB) return CASTE_FORAGER;\n    if (rand < BUILDER_PROB) return CASTE_BUILDER;\n    return CASTE_RAIDER;\n}\n\n// rotate2d: Builds 2D rotation matrix for given angle (radians).\n// -----------------------------------------------------------------------------\nmat2 rotate2d(float angle) {\n    float s = sin(angle);\n    float c = cos(angle);\n    return mat2(c, -s, s, c);\n}\n\n// sigmoid: Smooth transition around center with given width.\n//   x, center, width: control shape\n// -----------------------------------------------------------------------------\nfloat sigmoid(float x, float center, float width) {\n    return 1.0 / (1.0 + exp(-(x - center) * 4.0 / width));\n}\n\n// blur: Gaussian blur along direction dir. N controls kernel size.\n//   img: sampler to blur\n//   fragCoord, resolution: pixel coords and resolution\n//   N: half-kernel extent\n//   dir: blur direction (normalized)\n// -----------------------------------------------------------------------------\nvec4 blur(sampler2D img, vec2 fragCoord, vec2 resolution, int N, vec2 dir) {\n    float sigma = float(N) / 3.14;\n    float expFactor = -0.5 / (sigma * sigma);\n    float weight = 1.0;\n    vec4 sum = texture(img, fragCoord / resolution) * weight;\n    float weightSum = weight;\n    for (int i = 1; i <= N; i++) {\n        vec2 offset = float(i) * dir;\n        float w = exp(float(i * i) * expFactor);\n        sum += texture(img, (fragCoord + offset) / resolution) * w;\n        sum += texture(img, (fragCoord - offset) / resolution) * w;\n        weightSum += w * 2.0;\n    }\n    return sum / weightSum;\n}\n\n// -----------------------------------------------------------------------------\n// Hash-based pseudo-random functions (deterministic, repeatable)\n// RANDOM_SCALE avoids obvious patterns in output\n// -----------------------------------------------------------------------------\n#define RANDOM_SCALE vec4(.1031, .1030, .0973, .1099)\n\nvec2 random2(float p) {\n    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec2 random2(vec2 p) {\n    vec3 p3 = fract(p.xyx * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec2 random2(vec3 p3) {\n    p3 = fract(p3 * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\n// agentPersonality: Stable per-agent hash for scout vs follower (0-1).\n// Used to vary wander factor; higher = more exploratory.\n// -----------------------------------------------------------------------------\nfloat agentPersonality(vec2 pos, float colony, float caste) {\n    vec3 seed = vec3(floor(pos / 8.0), colony * 2.0 + caste);\n    vec3 p3 = fract(seed * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy).x;\n}\n\nvec3 random3(float p) {\n    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xxy + p3.yzz) * p3.zyx);\n}\n\nvec3 random3(vec2 p) {\n    vec3 p3 = fract(vec3(p.xyx) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yxz + 19.19);\n    return fract((p3.xxy + p3.yzz) * p3.zyx);\n}\n\nvec3 random3(vec3 p) {\n    p = fract(p * RANDOM_SCALE.xyz);\n    p += dot(p, p.yxz + 19.19);\n    return fract((p.xxy + p.yzz) * p.zyx);\n}\n\nvec4 random4(float p) {\n    vec4 p4 = fract(p * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec2 p) {\n    vec4 p4 = fract(p.xyxy * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec3 p) {\n    vec4 p4 = fract(p.xyzx * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec4 p4) {\n    p4 = fract(p4 * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n",
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
				"code": "/*\n  Buffer A: Agent simulation. Each pixel tracks one agent.\n  .xy = position (pixels), .z = heading (radians)\n  .w = packed state: colony + caste*0.1 + cargo*0.01 + energy*0.001 + success*0.0001\n\n  Uses nearest-particle lookup so each texel \"owns\" the closest agent.\n  Reads environment (C) for food/hazard, pheromones (B) for steering.\n*/\n\n// getNearestParticle: Returns the particle (A or neighbor at offset) that is\n//   closer to fragCoord. Used to resolve which agent this pixel tracks.\n//   A: current best candidate, fragCoord: pixel position, offset: neighbor delta\n// -----------------------------------------------------------------------------\nvec4 getNearestParticle(vec4 A, vec2 fragCoord, vec2 offset) {\n    vec4 neighbor = texture(iChannel0, (fragCoord + offset) / iResolution.xy);\n    float distToCurrent = distance(fragCoord, A.xy);\n    float distToNeighbor = distance(fragCoord, neighbor.xy);\n    if (distToNeighbor < distToCurrent) return neighbor;\n    return A;\n}\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy;\n\n    vec2 nest0 = getNestPosition(0.0, iResolution.xy);\n    vec2 nest1 = getNestPosition(1.0, iResolution.xy);\n\n    // Pixel is in nest if within NEST_RADIUS\n    float inNest0 = step(distance(fragCoord, nest0), NEST_RADIUS);\n    float inNest1 = step(distance(fragCoord, nest1), NEST_RADIUS);\n\n    // Load previous frame state\n    vec4 A = texture(iChannel0, uv);\n\n    // Resolve which agent this pixel tracks: nearest in 5x5 neighborhood\n    for (int x = -2; x <= 2; x++) {\n        for (int y = -2; y <= 2; y++) {\n            A = getNearestParticle(A, fragCoord, vec2(x, y));\n        }\n    }\n\n    // Unpack agent state from A.w\n    float packedState = A.w;\n    float colony = floor(packedState);\n    float remainder = packedState - colony;\n    float caste = floor(remainder * 10.0);\n    remainder = remainder * 10.0 - caste;\n    float cargo = floor(remainder * 10.0);\n    remainder = remainder * 10.0 - cargo;\n    float energy = remainder * 10.0;\n    float success = floor(fract(packedState * 10000.0) * 10.0) / 10.0;\n\n    vec2 myNest = getNestPosition(colony, iResolution.xy);\n    vec2 enemyNest = getNestPosition(1.0 - colony, iResolution.xy);\n\n    // Spawn: if this pixel is in a nest but no agent is nearby, create one\n    bool agentOutsideNest0 = distance(A.xy, nest0) > NEST_RADIUS;\n    bool agentOutsideNest1 = distance(A.xy, nest1) > NEST_RADIUS;\n\n    if (inNest0 > 0.5 && agentOutsideNest0) {\n        A.xy = nest0;\n        vec4 noise = random4(vec3(fragCoord, iFrame));\n        A.z = noise.x * TWOPI;\n        float spawnCaste = assignCaste(noise.y);\n        A.w = packAgentState(0.0, spawnCaste, 0.0, 1.0, 0.0);\n        colony = 0.0;\n        caste = spawnCaste;\n        cargo = 0.0;\n        energy = 1.0;\n        success = 0.0;\n    } else if (inNest1 > 0.5 && agentOutsideNest1) {\n        A.xy = nest1;\n        vec4 noise = random4(vec3(fragCoord, iFrame + 1000));\n        A.z = noise.x * TWOPI;\n        float spawnCaste = assignCaste(noise.y);\n        A.w = packAgentState(1.0, spawnCaste, 0.0, 1.0, 0.0);\n        colony = 1.0;\n        caste = spawnCaste;\n        cargo = 0.0;\n        energy = 1.0;\n        success = 0.0;\n    }\n\n    // Decay success (forager \"just delivered\" pheromone bonus)\n    success *= 0.5;\n\n    vec4 noise = random4(vec3(A.xy, iTime));\n\n    // Base movement parameters; caste modifies these\n    float baseSpeed = 180.0;\n    float speed = baseSpeed;\n    float sensorLen = 8.0;\n    float trailfactor = 1.5;\n    float wanderfactor = 0.4;\n\n    // Personality affects wander: scouts vs followers\n    float personality = agentPersonality(A.xy, colony, caste);\n    wanderfactor *= (0.5 + 0.5 * personality);\n\n    if (caste == CASTE_BUILDER) {\n        speed = baseSpeed * 0.7;\n        wanderfactor *= 0.5;\n    } else if (caste == CASTE_RAIDER) {\n        speed = baseSpeed * 1.2;\n        sensorLen = 12.0;\n        trailfactor = 2.0;\n    }\n\n    // Sample environment: C.r = biomass (food), C.g = hazard\n    vec4 envSample = texture(iChannel2, A.xy / iResolution.xy);\n    float food = envSample.r;\n\n    mat2 rot = rotate2d(A.z);\n\n    // Move forward\n    vec2 velocity = rot * vec2(speed, 0.0);\n    A.xy += velocity * iTimeDelta;\n\n    // Boundary: reflect at edges\n    vec2 bounded = clamp(A.xy, vec2(1.0), iResolution.xy - vec2(1.0));\n    if (A.x != bounded.x) A.z = TWOPI * 0.5 - A.z;\n    if (A.y != bounded.y) A.z = TWOPI - A.z;\n    A.xy = bounded;\n\n    envSample = texture(iChannel2, A.xy / iResolution.xy);\n    food = envSample.r;\n\n    // Sample pheromones for steering\n    vec4 pheromoneSample = texture(iChannel1, A.xy / iResolution.xy);\n    float ownPheromone = (colony < 0.5) ? pheromoneSample.r : pheromoneSample.g;\n    float toxin = pheromoneSample.b;\n\n    // Caste-specific steering\n    if (caste == CASTE_FORAGER) {\n        float distToNest = distance(A.xy, myNest);\n\n        if (food > 0.2 && cargo < 0.5 && distToNest > NEST_RADIUS * 1.5) {\n            cargo = 1.0;\n            A.z += PI;\n        } else if (distToNest < NEST_RADIUS && cargo > 0.5) {\n            cargo = 0.0;\n            success = 0.9;\n            A.z += PI;\n        }\n\n        vec2 sensorL = rot * vec2(1.0, 1.0) * sensorLen;\n        vec2 sensorR = rot * vec2(1.0, -1.0) * sensorLen;\n        vec4 senseL = texture(iChannel1, (A.xy + sensorL) / iResolution.xy);\n        vec4 senseR = texture(iChannel1, (A.xy + sensorR) / iResolution.xy);\n\n        float leftSignal = (colony < 0.5) ? senseL.r : senseL.g;\n        float rightSignal = (colony < 0.5) ? senseR.r : senseR.g;\n\n        if (cargo > 0.5) {\n            vec2 toNest = normalize(myNest - A.xy);\n            float nestDirection = atan(toNest.y, toNest.x);\n            float angleDiff = nestDirection - A.z;\n            A.z += clamp(angleDiff, -0.3, 0.3) * 0.5;\n        } else if (food > 0.2) {\n            // On food but not carrying: weak bias toward nest to avoid spinning in uniform pheromone\n            vec2 toNest = normalize(myNest - A.xy);\n            float nestDirection = atan(toNest.y, toNest.x);\n            float angleDiff = nestDirection - A.z;\n            A.z += clamp(angleDiff, -0.2, 0.2) * 0.2;\n        }\n        A.z += (rightSignal - leftSignal) * trailfactor;\n\n    } else if (caste == CASTE_BUILDER) {\n        vec2 sensorL = rot * vec2(1.0, 1.0) * sensorLen;\n        vec2 sensorR = rot * vec2(1.0, -1.0) * sensorLen;\n        vec4 senseL = texture(iChannel1, (A.xy + sensorL) / iResolution.xy);\n        vec4 senseR = texture(iChannel1, (A.xy + sensorR) / iResolution.xy);\n\n        float leftAttract = senseL.a;\n        float rightAttract = senseR.a;\n        A.z += (rightAttract - leftAttract) * trailfactor * 0.5;\n\n        float ownPheromoneL = (colony < 0.5) ? senseL.r : senseL.g;\n        float ownPheromoneR = (colony < 0.5) ? senseR.r : senseR.g;\n        A.z += (ownPheromoneR - ownPheromoneL) * 0.3;\n\n    } else if (caste == CASTE_RAIDER) {\n        vec2 sensorL = rot * vec2(1.0, 1.0) * sensorLen;\n        vec2 sensorR = rot * vec2(1.0, -1.0) * sensorLen;\n        vec4 senseL = texture(iChannel1, (A.xy + sensorL) / iResolution.xy);\n        vec4 senseR = texture(iChannel1, (A.xy + sensorR) / iResolution.xy);\n\n        float enemyL = (colony < 0.5) ? senseL.g : senseL.r;\n        float enemyR = (colony < 0.5) ? senseR.g : senseR.r;\n        A.z += (enemyR - enemyL) * trailfactor;\n\n        float ownL = (colony < 0.5) ? senseL.r : senseL.g;\n        float ownR = (colony < 0.5) ? senseR.r : senseR.g;\n        A.z -= (ownR - ownL) * 0.3;\n    }\n\n    // Wander noise (reduced when forager is on food to prevent spinning in patches)\n    float wanderScale = 1.0;\n    if (caste == CASTE_FORAGER && food > 0.25) wanderScale = 0.25;\n    A.z += (noise.z - 0.5) * wanderfactor * wanderScale;\n\n    // Avoid toxin (raiders ignore)\n    if (toxin > 0.1 && caste != CASTE_RAIDER) {\n        A.z += (noise.w - 0.5) * toxin * 2.0;\n    }\n\n    // Foragers lose energy when enemy raiders nearby (gang effect)\n    if (caste == CASTE_FORAGER) {\n        float enemyRaiders = 0.0;\n        for (int dx = -2; dx <= 2; dx++) {\n            for (int dy = -2; dy <= 2; dy++) {\n                if (dx == 0 && dy == 0) continue;\n                vec4 neighbor = texture(iChannel0, (A.xy + vec2(float(dx), float(dy))) / iResolution.xy);\n                float nw = neighbor.w;\n                float nc = floor(nw);\n                float nr = nw - nc;\n                float ncast = floor(nr * 10.0);\n                nr = nr * 10.0 - ncast;\n                if (ncast == CASTE_RAIDER && nc != colony) {\n                    float ndist = length(vec2(float(dx), float(dy)));\n                    enemyRaiders += smoothstep(4.0, 0.0, ndist);\n                }\n            }\n        }\n        energy -= enemyRaiders * 0.015;\n    }\n\n    // Regenerate energy at home nest\n    float distToHome = distance(A.xy, myNest);\n    if (distToHome < NEST_RADIUS) {\n        energy = min(energy + 0.01, 1.0);\n    }\n\n    energy = clamp(energy, 0.0, 1.0);\n    A.w = packAgentState(colony, caste, cargo, energy, success);\n\n    // Frame 0: initialize agents in nests\n    if (iFrame == 0) {\n        A = vec4(0.0);\n\n        if (inNest0 > 0.5) {\n            float gridSize = 4.0;\n            A.xy = round(fragCoord / gridSize) * gridSize;\n            vec4 initNoise = random4(vec3(A.xy, 0.0));\n            A.z = initNoise.x * TWOPI;\n            float initCaste = assignCaste(initNoise.y);\n            A.w = packAgentState(0.0, initCaste, 0.0, 1.0, 0.0);\n        } else if (inNest1 > 0.5) {\n            float gridSize = 4.0;\n            A.xy = round(fragCoord / gridSize) * gridSize;\n            vec4 initNoise = random4(vec3(A.xy, 1.0));\n            A.z = initNoise.x * TWOPI;\n            float initCaste = assignCaste(initNoise.y);\n            A.w = packAgentState(1.0, initCaste, 0.0, 1.0, 0.0);\n        }\n    }\n\n    fragColor = A;\n}\n",
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
				"code": "/*\n * Buffer B: Pheromone communication field.\n * .r = Colony 0 pheromone, .g = Colony 1 pheromone\n * .b = Toxin (raider poison), .a = Road memory (traffic intensity)\n *\n * Pheromones diffuse, decay, and are deposited by agents. Nests and food\n * emit attractant. Raiders deposit toxin; foragers/builders deposit trails.\n */\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy;\n\n    vec4 A = texture(iChannel0, uv);\n    vec4 B = texture(iChannel1, uv);\n    vec4 C = texture(iChannel2, uv);\n\n    // 3x3 Gaussian blur for diffusion\n    vec4 N  = texture(iChannel1, (fragCoord + vec2(0.0, 1.0)) / iResolution.xy);\n    vec4 S  = texture(iChannel1, (fragCoord + vec2(0.0, -1.0)) / iResolution.xy);\n    vec4 E  = texture(iChannel1, (fragCoord + vec2(1.0, 0.0)) / iResolution.xy);\n    vec4 W  = texture(iChannel1, (fragCoord + vec2(-1.0, 0.0)) / iResolution.xy);\n    vec4 NE = texture(iChannel1, (fragCoord + vec2(1.0, 1.0)) / iResolution.xy);\n    vec4 SE = texture(iChannel1, (fragCoord + vec2(1.0, -1.0)) / iResolution.xy);\n    vec4 NW = texture(iChannel1, (fragCoord + vec2(-1.0, 1.0)) / iResolution.xy);\n    vec4 SW = texture(iChannel1, (fragCoord + vec2(-1.0, -1.0)) / iResolution.xy);\n\n    vec4 blurred = ((NE + SE + NW + SW) + 2.0 * (N + E + S + W)) / 12.0;\n    B = mix(B, blurred, 0.15);\n\n    // Per-channel decay (stronger to prevent brightness creep over time)\n    B.r *= 0.99;\n    B.g *= 0.99;\n    B.b *= 0.985;\n    B.a *= 0.998;\n\n    vec2 nest0 = getNestPosition(0.0, iResolution.xy);\n    vec2 nest1 = getNestPosition(1.0, iResolution.xy);\n    float distToNest0 = distance(fragCoord, nest0);\n    float distToNest1 = distance(fragCoord, nest1);\n\n    if (distToNest0 < NEST_RADIUS) {\n        B.r = max(B.r, 0.8);\n    }\n    if (distToNest1 < NEST_RADIUS) {\n        B.g = max(B.g, 0.8);\n    }\n\n    // Food patches emit attractant (C.r = biomass)\n    float food = C.r;\n    if (food > 0.1) {\n        B.r = max(B.r, food * 0.3);\n        B.g = max(B.g, food * 0.3);\n    }\n\n    // Agent deposits: check if any agent is at this pixel\n    float distToAgent = distance(fragCoord, A.xy);\n    float agentPresence = smoothstep(2.0, 0.0, distToAgent);\n\n    if (agentPresence > 0.01) {\n        float packedState = A.w;\n        float colony = floor(packedState);\n        float remainder = packedState - colony;\n        float caste = floor(remainder * 10.0);\n        remainder = remainder * 10.0 - caste;\n        float cargo = floor(remainder * 10.0);\n        remainder = remainder * 10.0 - cargo;\n        float energy = remainder * 10.0;\n        float success = floor(fract(packedState * 10000.0) * 10.0) / 10.0;\n\n        float depositStrength = agentPresence * energy * 0.15;\n\n        if (caste == CASTE_FORAGER) {\n            float cargoBonus = cargo > 0.5 ? 1.5 : 1.0;\n            float successBonus = success > 0.4 ? 2.0 : 1.0;\n            float totalBonus = cargoBonus * successBonus;\n            if (colony < 0.5) {\n                B.r += depositStrength * totalBonus;\n            } else {\n                B.g += depositStrength * totalBonus;\n            }\n        }\n\n        if (caste == CASTE_BUILDER) {\n            if (colony < 0.5) {\n                B.r += depositStrength * 0.5;\n            } else {\n                B.g += depositStrength * 0.5;\n            }\n            B.a += agentPresence * 0.1;\n        }\n\n        if (caste == CASTE_RAIDER) {\n            float nearbyRaiders = 0.0;\n            for (int dx = -1; dx <= 1; dx++) {\n                for (int dy = -1; dy <= 1; dy++) {\n                    if (dx == 0 && dy == 0) continue;\n                    vec4 neighbor = texture(iChannel0, (fragCoord + vec2(float(dx), float(dy))) / iResolution.xy);\n                    float nd = distance(fragCoord, neighbor.xy);\n                    if (nd < 3.0) {\n                        float nw = neighbor.w;\n                        float nc = floor(nw);\n                        float nr = nw - nc;\n                        float ncast = floor(nr * 10.0);\n                        if (ncast == CASTE_RAIDER && nc == colony) nearbyRaiders += 1.0;\n                    }\n                }\n            }\n            float gangBonus = 1.0 + 0.5 * min(nearbyRaiders, 3.0);\n            B.b += agentPresence * 0.08 * gangBonus;\n            if (colony < 0.5) {\n                B.r += depositStrength * 0.3;\n            } else {\n                B.g += depositStrength * 0.3;\n            }\n        }\n\n        B.a += agentPresence * 0.02;\n    }\n\n    B = clamp(B, 0.0, 1.0);\n\n    if (iFrame == 0) {\n        B = vec4(0.0);\n        if (distToNest0 < NEST_RADIUS) B.r = 0.8;\n        if (distToNest1 < NEST_RADIUS) B.g = 0.8;\n    }\n\n    fragColor = B;\n}\n",
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
					},
					{
						"channel": 3,
						"type": "texture",
						"id": "XdX3Rn",
						"filepath": "/media/a/52d2a8f514c4fd2d9866587f4d7b2a5bfa1a11a0e772077d7682deb8b3b517e5.jpg",
						"sampler": {
							"filter": "mipmap",
							"wrap": "repeat",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "/*\n * Buffer C: Dynamic environment (cellular automaton).\n * .r = Biomass (food), .g = Hazard, .b = Terrain softness, .a = Territory\n *\n * Resources grow via logistic growth; hazard diffuses and decays. Terrain\n * compacts under traffic (roads emerge). Territory follows pheromone dominance.\n * Agents harvest, repair, or spread hazard depending on caste.\n */\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy;\n\n    vec4 A = texture(iChannel0, uv);\n    vec4 B = texture(iChannel1, uv);\n    vec4 C = texture(iChannel2, uv);\n\n    // Neighbor samples for diffusion\n    vec4 CN = texture(iChannel2, (fragCoord + vec2(0.0, 1.0)) / iResolution.xy);\n    vec4 CS = texture(iChannel2, (fragCoord + vec2(0.0, -1.0)) / iResolution.xy);\n    vec4 CE = texture(iChannel2, (fragCoord + vec2(1.0, 0.0)) / iResolution.xy);\n    vec4 CW = texture(iChannel2, (fragCoord + vec2(-1.0, 0.0)) / iResolution.xy);\n\n    float biomass = C.r;\n    float hazard = C.g;\n    float terrain = C.b;\n    float territory = C.a;\n\n    float colony0Pheromone = B.r;\n    float colony1Pheromone = B.g;\n    float toxin = B.b;\n    float roadTraffic = B.a;\n\n    vec2 nest0 = getNestPosition(0.0, iResolution.xy);\n    vec2 nest1 = getNestPosition(1.0, iResolution.xy);\n    float distToNest0 = distance(fragCoord, nest0);\n    float distToNest1 = distance(fragCoord, nest1);\n    bool inNest = (distToNest0 < NEST_RADIUS) || (distToNest1 < NEST_RADIUS);\n\n    // ========== RESOURCE DYNAMICS ==========\n    vec2 food1 = iResolution.xy * vec2(0.5, 0.8);\n    vec2 food4 = iResolution.xy * vec2(0.5, 0.5);\n    float distToFood1 = distance(fragCoord, food1);\n    float distToFood4 = distance(fragCoord, food4);\n    float growthRate = 0.00002;\n    if (distToFood4 < 50.0) growthRate = 0.0006;\n    else if (distToFood1 < 70.0) growthRate = 0.0004;\n    float carryingCapacity = 1.0;\n\n    float growthInhibition = 1.0 - hazard;\n    if (inNest) growthInhibition = 0.0;\n\n    biomass += growthRate * biomass * (1.0 - biomass / carryingCapacity) * growthInhibition;\n\n    float t = iTime;\n    float bloomPhase = mod(t, 48.0);\n    if (bloomPhase < 2.0) {\n        vec2 bloomCenter = iResolution.xy * (0.3 + 0.4 * random2(vec2(floor(t / 48.0), 1.0)));\n        float bloomDist = distance(fragCoord, bloomCenter);\n        if (bloomDist < 80.0 && !inNest) {\n            biomass += 0.015 * (1.0 - bloomDist / 80.0);\n        }\n    }\n\n    if (biomass < 0.05 && !inNest) {\n        vec4 noise = random4(vec4(fragCoord, float(iFrame) * 0.001, 0.0));\n        if (noise.x > 0.9999) {\n            biomass += 0.1;\n        }\n    }\n\n    float neighborResource = (CN.r + CS.r + CE.r + CW.r) * 0.25;\n    if (neighborResource > 0.3 && biomass < 0.1) {\n        vec4 noise = random4(vec4(fragCoord, float(iFrame) * 0.01, 1.0));\n        if (noise.y > 0.999) {\n            biomass += 0.05;\n        }\n    }\n\n    // ========== HAZARD DYNAMICS ==========\n    float hazardBlur = (CN.g + CS.g + CE.g + CW.g) * 0.25;\n    hazard = mix(hazard, hazardBlur, 0.05);\n    hazard *= 0.997;\n    hazard = max(hazard, toxin * 0.5);\n\n    float eventPhase = mod(t, 32.0);\n    if (eventPhase < 1.5) {\n        vec2 burstCenter = iResolution.xy * (0.2 + 0.6 * random2(vec2(floor(t / 32.0), 0.0)));\n        float burstDist = distance(fragCoord, burstCenter);\n        if (burstDist < 70.0) {\n            hazard += 0.12 * (1.0 - burstDist / 70.0);\n        }\n    }\n\n    // ========== TERRAIN DYNAMICS ==========\n    if (terrain < 1.5) {\n        terrain = mix(terrain, 0.0, roadTraffic * 0.005);\n        terrain = mix(terrain, 1.0, 0.0001);\n    }\n\n    // ========== TERRITORY DYNAMICS ==========\n    float pheromoneDiff = colony0Pheromone - colony1Pheromone;\n    float targetTerritory = clamp(pheromoneDiff * 2.0, -1.0, 1.0);\n    territory = mix(territory, targetTerritory, 0.01);\n\n    if (colony0Pheromone < 0.05 && colony1Pheromone < 0.05) {\n        territory *= 0.999;\n    }\n\n    // ========== AGENT INTERACTIONS ==========\n    float distToAgent = distance(fragCoord, A.xy);\n    float agentPresence = smoothstep(3.0, 0.0, distToAgent);\n\n    if (agentPresence > 0.01) {\n        float packedState = A.w;\n        float colony = floor(packedState);\n        float remainder = packedState - colony;\n        float caste = floor(remainder * 10.0);\n        remainder = remainder * 10.0 - caste;\n        float cargo = floor(remainder * 10.0);\n\n        if (caste == CASTE_FORAGER && cargo < 0.5 && biomass > 0.2) {\n            biomass -= agentPresence * 10.001;\n        }\n\n        if (caste == CASTE_BUILDER) {\n            hazard -= agentPresence * 0.02;\n            terrain -= agentPresence * 0.01;\n        }\n\n        if (caste == CASTE_RAIDER) {\n            float myTerritory = (colony < 0.5) ? territory : -territory;\n            if (myTerritory < -0.2) {\n                hazard += agentPresence * 0.03;\n            }\n        }\n    }\n\n    // ========== INITIALIZATION ==========\n    if (iFrame == 0) {\n        biomass = 0.0;\n        hazard = 0.0;\n        terrain = 1.0;\n        territory = 0.0;\n\n        vec2 mid = iResolution.xy * vec2(0.5, 0.5);\n        float wallY = iResolution.y * 0.5;\n        float wallHalfW = iResolution.x * 0.08;\n        if (abs(fragCoord.y - wallY) < 12.0 && abs(fragCoord.x - mid.x) > wallHalfW) {\n            terrain = OBSTACLE_TERRAIN;\n        }\n        if (distance(fragCoord, mid) > 120.0 && distance(fragCoord, mid) < 140.0 && fragCoord.y > wallY) {\n            terrain = OBSTACLE_TERRAIN;\n        }\n        vec2 obsBlob = iResolution.xy * vec2(0.35, 0.4);\n        if (distance(fragCoord, obsBlob) < 25.0) terrain = OBSTACLE_TERRAIN;\n        obsBlob = iResolution.xy * vec2(0.65, 0.4);\n        if (distance(fragCoord, obsBlob) < 25.0) terrain = OBSTACLE_TERRAIN;\n\n        if (distance(fragCoord, food1) < 60.0 && terrain < 1.5) { biomass = 0.8; }\n        vec2 food2 = iResolution.xy * vec2(0.3, 0.25);\n        if (distance(fragCoord, food2) < 50.0 && terrain < 1.5) { biomass = 0.7; }\n        vec2 food3 = iResolution.xy * vec2(0.7, 0.25);\n        if (distance(fragCoord, food3) < 50.0 && terrain < 1.5) { biomass = 0.7; }\n        if (distance(fragCoord, food4) < 40.0 && terrain < 1.5) { biomass = 0.9; }\n\n        if (distToNest0 < NEST_RADIUS * 2.0) {\n            territory = 1.0;\n            if (terrain < 1.5) terrain = 0.3;\n        }\n        if (distToNest1 < NEST_RADIUS * 2.0) {\n            territory = -1.0;\n            if (terrain < 1.5) terrain = 0.3;\n        }\n\n        if (inNest) biomass = 0.0;\n    }\n\n    biomass = clamp(biomass, 0.0, 1.0);\n    hazard = clamp(hazard, 0.0, 1.0);\n    if (terrain < 1.5) terrain = clamp(terrain, 0.0, 1.0);\n    territory = clamp(territory, -1.0, 1.0);\n\n    fragColor = vec4(biomass, hazard, terrain, territory);\n}\n",
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
			"id": "Ncs3zl",
			"date": "1773350441",
			"viewed": 44,
			"name": "Duel Ant Colonies",
			"username": "Tsz Him Ng",
			"description": "Duel Ant colonies with different ant classes",
			"likes": 4,
			"published": 1,
			"flags": 32,
			"usePreview": 0,
			"tags": [
				"datt4950"
			],
			"hasliked": 0,
			"parentid": "7fXGzs",
			"parentname": "Multi class ant system"
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
				"code": "/* \nAssignment 3 - Smoke\n\nBy Gavin Johnstone\n217100033\n\nInteractions: \n    After running it once, go to Buffer B and set 'obstacles' to true, then hit reset. \n    \n    Barriers and agents can be made visible at the bottom of the Image class.\n    \n    You can mess with the agent parameters in Buffer A if you're in the mood for that kind of thing.\n\nThis piece is based on the lab 9 particle tracking and sensors (grrrwaaa: https://www.shadertoy.com/view/7ff3RX).\nI was inspired by the idea that if you invert the pathfinding so that the particles avoid the 'sugar' but make the\nagents produce 'sugar' themselves, you will end up with a pretty natural avoidance patter that also spreads out \nthrough a space. I thought this could create a pretty cool 'smoke' effect, with the sugar CA being smoke and the \nagents directing its tendrils through the space. In order to make it like a gas, I used a simplified version of \nthe diffusion system found here: https://www.shadertoy.com/view/33GyRc (grrrwaaa). It took a lot of fine-tuning to\nbalance the speed of the agents and the diffusion of the gas so that I had a nice effect.\n\nMy second goal was to make the smoke interact with obstacles and move around things like walls. It was easy enough\nto factor the barriers into the agent pathfinding, but I wanted to keep the smoke net-even; destroying the gas on \ncontact leads to a weird silhouette, and the idea was that it would fill the space and get push further. This was \ntricky because I couldn't assume how many neighbors would be barriers, but counting them would require another \nnested for loop, whihc would tank performance. After a lot of work I found that if a pixel gets returned the value\nthat it would have recieved (weighted by the matrix) I *think* the result in net-even, though I'm not 100% sure.\n\nA few possible extentions/criticisms:\n- Once the smoke reaches full volume, the agents start to cluster in the middle. I toyed with having the agents \naccelerate relative to the density of the smoke in the hopes that it would push them out, but I ended up leaving\nthe rate of acceleration at a low level because increasing it led to empty areas between the furthest agents and\nthe middle.\n\n- I played around with having moving obstacles (you can see my test in Buffer B) but it's very hard to have it\npush the smoke and agents without deleting them. There would need to be a way of converting the deleted mass, but\nthe system would have to be very different unless the obstacle only moved one pixel per frame.\n\n- I originally had the circle of smoke generated by the agent be concentrated toward the middle and reduced\ntowards the edges, but I actually found it looked worse that a solid circle (the addition is already immediately\naffected by diffusion so it's still soft). There could be a better formula though that might yield nice results.\n*/\nint o = 1;\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord ) {\n    vec2 uv = (fragCoord / iResolution.xy);\n    \n    // zoom in\n    if (iMouse.z > 0.0) {\n        float magnification = 6.;\n        uv /= magnification;\n        uv += iMouse.xy / ((iResolution.xy + (iResolution.xy / (magnification - 1.0))));\n    }\n    \n    \n    // get pixels\n    vec4 A = texture(iChannel0, uv);\n    vec4 B = texture(iChannel1, uv);\n    vec4 C = texture(iChannel2, uv);\n    vec4 D = texture(iChannel3, uv);\n    \n    // get distance from this pixel to the particle it is tracking:\n    float d = distance(uv * iResolution.xy, A.xy);\n    float p = smoothstep(2., 0., d);\n    \n    \n    // smoke:\n    fragColor = D * vec4(1.0, 0.5, 0, 0);\n    // barriers:\n    //fragColor += B;\n    // agents:\n    //fragColor += vec4(p);\n   \n}",
				"name": "Image",
				"description": "",
				"type": "image"
			},
			{
				"outputs": [],
				"inputs": [],
				"code": "const float TWOPI = 6.283185307179586;\n\n// diffusion matrix\nmat3 kernel = mat3(\n        0.05, 0.2, 0.05,\n        0.2, -1, 0.2,\n        0.05, 0.2, 0.05\n    );\n// diffusion for buffer C and D\nvec4 diffusion (vec2 fragCoord, sampler2D agent, sampler2D smoke, sampler2D barrier, vec2 resolution, float time) {\n    \n    // normalize texture coords\n    vec2 uv = (fragCoord / resolution.xy);\n    // get smoke and barrier info\n    vec4 B = texture(barrier, uv);\n    vec4 C = texture(smoke, uv);\n    \n    vec4 N = vec4(0.); // sum of weighted pixels\n    vec4 reflect = vec4(0.); // sum of pixels reflected by barrier\n    for (int i = -1; i <= 1; i++) {\n        for (int j = -1; j <= 1; j++) {\n            // get the image at this texel:\n            vec4 value = texture(smoke, (fragCoord + vec2(i,j)) / resolution.xy);\n            // Apply kernel weight and sum:\n            N += value * kernel[i+1][j+1];\n            // if the target is a barrier, refund mass that would otherwise be lost\n            if (texture(barrier, (fragCoord + vec2(i,j)) / resolution.xy).r == 1.0) {\n                reflect += C * kernel[i+1][j+1];\n            }\n         }\n    }\n    // update mass, if in barrier, delete\n    if (B.r != 1.0) {\n        C += N + reflect;\n    } else {\n        C *= 0.;\n    }\n\n    // keep it in the range of 0..1:\n    C = clamp(C, 0., 1.0);\n\n    return C;\n}\n\n// create a 2D rotation matrix from an angle in radians:\nmat2 rotate2d(float angle) {\n    float s = sin(angle);\n    float c = cos(angle);\n    return mat2(\n        c, -s, \n        s, c\n    ); \n}\n\n\n\n\n#define RANDOM_SCALE vec4(.1031, .1030, .0973, .1099)\n\nvec2 random2(float p) {\n    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec2 random2(vec2 p) {\n    vec3 p3 = fract(p.xyx * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec2 random2(vec3 p3) {\n    p3 = fract(p3 * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec3 random3(float p) {\n    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xxy + p3.yzz) * p3.zyx); \n}\n\nvec3 random3(vec2 p) {\n    vec3 p3 = fract(vec3(p.xyx) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yxz + 19.19);\n    return fract((p3.xxy + p3.yzz) * p3.zyx);\n}\n\nvec3 random3(vec3 p) {\n    p = fract(p * RANDOM_SCALE.xyz);\n    p += dot(p, p.yxz + 19.19);\n    return fract((p.xxy + p.yzz) * p.zyx);\n}\n\nvec4 random4(float p) {\n    vec4 p4 = fract(p * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);   \n}\n\nvec4 random4(vec2 p) {\n    vec4 p4 = fract(p.xyxy * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec3 p) {\n    vec4 p4 = fract(p.xyzx * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec4 p4) {\n    p4 = fract(p4  * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}",
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
				"code": "// Agent buffer: agents emit smoke an move toward less dense areas\n\n// given current particle \"A\" at pixel `fragCoord`\n// is the particle at `fragCoord+offset` nearer? if so return that.\nvec4 getNearestParticle(vec4 A, vec2 fragCoord, vec2 offset) {\n    // get by neighbour pixel\n    vec4 N = texture(iChannel0, (fragCoord+offset)/iResolution.xy);\n    // distance from my pixel to the particle I'm tracking:\n    float d1 = distance(fragCoord, A.xy);\n    // distance from my pixel to the particle my neighbor is tracking:\n    float d2 = distance(fragCoord, N.xy);\n    // if my neighbor's particle is nearer, track that instead! \n    if (d2 < d1) { return N; } else { return A; }\n}\n\n// each pixel tracks an agent\n// .xy is the agent location (in pixels)\n// .z is the agent direction (in radians)\n// .w is the agent's age\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord) {\n\n    // agent behaviour\n    float speed = 30.;\n    float turn = 0.;\n    float wander = 0.3;\n    float sensor_length = 6.;\n    float acceleration = 1.1;\n    \n    // convert pixel coordinate to normalize texture coord\n    vec2 uv = fragCoord / iResolution.xy;\n    // our previous state\n    vec4 A = texture(iChannel0, uv);\n    \n    // identify spawn point\n    vec2 centre = vec2(float(round(iResolution.x*0.5)), float(round(iResolution.y*0.5)));\n    \n    \n    // make sure we are tracking the nearest particle by testing\n    // each of our nearest pixels to see if their particle is nearer\n    for (int x=-2; x<=2; x++) {\n        for (int y=-2; y<=2; y++) {\n            A = getNearestParticle(A, fragCoord, vec2(x, y));\n        }\n    }\n    \n    vec4 noise = random4(vec3(A.xy, iTime));\n    \n    \n    \n    // rotation\n    mat2 rot = rotate2d(A.z);\n    // sense smoke density in two directions\n    vec2 sensor1 = vec2(1, 1)*sensor_length;\n    vec2 sensor2 = vec2(1, -1)*sensor_length;\n    vec2 sensor1_in_world = rot*sensor1 + A.xy;\n    vec2 sensor2_in_world = rot*sensor2 + A.xy;\n    // barriers are added to the sense at an elevated rate so that they're avoided \n    vec4 sense1 = texture(iChannel1, sensor1_in_world / iResolution.xy)*1.1\n                + texture(iChannel2, sensor1_in_world / iResolution.xy);\n    vec4 sense2 = texture(iChannel1, sensor2_in_world / iResolution.xy)*1.1\n                + texture(iChannel2, sensor2_in_world / iResolution.xy);\n    // if you run into a barrier, turn around\n    // if right sense is stronger, turn left\n    // if left sense is stronger, turn right\n    // if senses are equal, go straight\n    if (texture(iChannel1, A.xy / iResolution.xy).r > 0.0) {\n        turn = 1.0;\n    } else {\n        turn = sense1.r-sense2.r;\n    }\n    \n    //speed increases slightly if there is lots of smoke.\n    speed += (sense1.r + sense2.r)*acceleration;\n    A.z += turn + wander*(noise.x*2. - 1.);\n    \n    // move the particle\n    // get the xy velocity from the A.z direction\n    rot = rotate2d(A.z);\n    // polar to cartesian\n    vec2 vel = rot * vec2(speed, 0);\n    // integrate velocity to position\n    A.xy += vel * 0.005;\n    \n    // get the bounded position within the screen image\n    vec2 b = clamp(A.xy, vec2(0), iResolution.xy);\n    // compare the bounded and actual positions -- if they are different, reflect their orientations:\n    if (A.x != b.x) { A.z = TWOPI*0.5 - A.z; } // reflect in Y axis\n    if (A.y != b.y) { A.z = TWOPI - A.z; } // reflect in X axis\n    // also, actually clamp the position on screen\n    A.xy = b.xy; \n    \n    // Age\n    // ended up not really wanting this but if you reduce the following number the agents will die over time\n    A.w += 1.0; // reset after 10,000 frames\n    // use this for a contained cloud\n    //A.w += 5.0; // reset after 2,000 frames\n    if (A.w > 10000.0) {\n        //return to centre\n        A.xy = vec2 (centre.x, centre.y);\n    }\n    \n    // spawn an agent every 30 frames\n    if (iFrame % 30 == 0 && fragCoord.x > centre.x-1. && fragCoord.x < centre.x+1. && fragCoord.y > centre.y-1. && fragCoord.y < centre.y+1.) {\n        A.xy = fragCoord.xy;\n        A.w = 0.;\n        vec4 noise = random4(vec3(A.xy, iFrame));\n        A.z = noise.z * TWOPI;\n    }\n    // initialize:\n    if (iFrame == 0) {\n        A.xy = vec2(centre.x, centre.y);\n        // we have to seed the random generator using the particle's\n        // location, not the pixel location, so that all pixels agree\n        vec4 noise = random4(vec3(A.xy, iFrame));\n\n        // direction:\n        A.z = noise.z * TWOPI;\n    }\n    \n    fragColor = A;\n}",
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
				"code": "// Barriers\n\n/*  Instruction:\n    **set obstacles to \"true\" to see collision**        \n*/\nbool obstacles = false;\n//bool obstacles = true;\n\n\n// funtion to draw a line\n// 'start' should be the higher number\n// position and thickness are relative to the screen size\nbool line(vec2 uv, float thickness, float start, float end, float pos, bool horizontal) {\n    \n    if (horizontal) {\n        return uv.x <= start && uv.x >= end \n            && uv.y >= pos - thickness && uv.y <= pos + thickness;\n    } else {\n        return uv.y <= start && uv.y >= end \n            && uv.x >= pos - thickness && uv.x <= pos + thickness;\n    }\n}\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    // convert pixel coordinate to normalize texture coord\n    vec2 uv = fragCoord / iResolution.xy;\n    \n    // our previous state\n    vec4 B = texture(iChannel1, uv);\n    \n    // moving line test\n    /*\n    if (line(uv, 10. / iResolution.x, 0.48, 0.25, 0.4*sin((iTime*0.2)-0.5)+0.5, false)) {\n        B.r = 1.;\n    } else { \n        B.r = 0.; \n    }\n    */\n    \n    \n    \n    if (iFrame == 0 && obstacles == true) {\n        // line thickness normalized to resolution\n        float thickness = 10.;\n        float xThickness = thickness / iResolution.x;\n        float yThickness = thickness / iResolution.y;\n        \n        // lines\n        bool bars = \n        // vertical\n        line(uv, xThickness, 0.74, 0.25, 0.825, false) ||\n        line(uv, xThickness, 0.48, 0.25, 0.91, false) ||\n        line(uv, xThickness, 0.4, 0.25, 0.738, false) ||\n        line(uv, xThickness, 0.9, 0.578, 0.26, false) ||\n        line(uv, xThickness, 0.294, 0.0, 0.262, false) ||\n        line(uv, xThickness, 1.0, 0.75, 0.52, false) ||\n        // horizontal\n        line(uv, yThickness, 0.75, 0.25, 0.6, true) ||\n        line(uv, yThickness, 0.75, 0.25, 0.4, true) ||\n        line(uv, yThickness, 0.75, 0.65, 0.27, true) ||\n        line(uv, yThickness, 0.837, 0.7, 0.73, true) ||\n        line(uv, yThickness, 0.62, 0.42, 0.73, true) ||\n        line(uv, yThickness, 0.34, 0.25, 0.73, true) ||\n        line(uv, yThickness, 1.0, 0.898, 0.27, true) ||\n        line(uv, yThickness, 0.58, 0.26, 0.27, true) ||\n        line(uv, yThickness, 0.95, 0.25, 0.14, true) ||\n        // oval\n        distance(uv, vec2(0.1, 0.5)) < 0.07; \n\n        if (bars) {\n            B.r = 1.;\n        } else {\n            B.r = 0.;\n\n        }\n    } else if (iFrame == 0) { // reset window\n        B.r = 0.;\n    }\n    fragColor = B;\n}",
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
				"code": "// Smoke pass 1 (two diffusion passes to speed it up)\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord ) {\n    // normalise coords\n    vec2 uv = (fragCoord / iResolution.xy);\n    vec4 A = texture(iChannel0, uv); // agents\n    vec4 C = texture(iChannel3, uv); // the previous frame\n    \n    // run diffusion\n    C = diffusion(fragCoord, iChannel0, iChannel2, iChannel1, iResolution.xy, iTime);\n    \n    // get distance from this pixel to the particle it is tracking:\n    float dist = distance(fragCoord, A.xy);\n\n    // create smoke in a 10 pixel radius\n    if (dist < 13.) { C += 0.001;}\n    fragColor = C;\n    \n    //fragColor = texture(iChannel3, uv);\n}",
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
				"code": "// Smoke pass 2\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    // normalise coords\n    vec2 uv = (fragCoord / iResolution.xy);\n    vec4 C = texture(iChannel2, uv); // the previous frame\n    // run diffusion\n    C = diffusion(fragCoord, iChannel0, iChannel2, iChannel1, iResolution.xy, iTime);\n    fragColor = C;\n}",
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
			"id": "NfBGW1",
			"date": "1774065490",
			"viewed": 9,
			"name": "Smoke",
			"username": "Gavin Johnstone",
			"description": "A3",
			"likes": 0,
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
				"code": "/*\nSTUDENT NUMBER: 215907876\n\nASSIGNMENT NUMBER : FA/DATT4950M / GS/DIGM5950M Assignment 04 - FINAL\n\nNAME: PHILIP MICHALOWSKI\n\nTITLE: CHLOROPHYLL\n\nINTERACTIONS: The shader mostly illustrates particles that interact with each other. There is no interaction to be made\nby human other than mouse left click however there are quite a few possible modifications\n- It's definitely worth to play with the fluid particle settings in buffer A\nby changing speed or radius the effect drastically changing\n- It's also interesting to use the mouse to influence\nthe field. It's a good idea to disconnect the voronoi forces\nand try to move mouse among the particles - it gives interesting particle fluid looks\n\nDESCRIPTION: CHLOROPHYLL - is based on the plant cells movement inside the\nplant green areas. I got more insights based on the video of Microbehunter (Microbehunter\n,https://www.youtube.com/watch?v=XhQBXKlvVcA) who explains that the chloroplasts - plant cells\nresponsible for the plant photosynthesis as well as the one give the green color to the leafs have a movement.\nHe explains that it's because the nutrients produced by the cell must be equally distributed\nalong the body of the green leaf. The timelapse presented in the video\nshowcases interesting leaf cells and chloroplasts moving around that cell similarly to my work.\n\nThe system introduces combination of two systems covered in class: voronoi based improvised fluid simulation (extension of class voronoi particles, Graham Wakefield, https://www.shadertoy.com/view/7fl3zH) and physarum particles (Graham Wakefield, https://www.shadertoy.com/view/7ff3RX).\nPhysarum particles form a plant cell walls that influences the chloroplasts inside it. Because\nof the force distribution the physarum searches for free space to follow between the particles\nand plant particles are being pushed to the middle of the cell wall keeping the similar\nstructure as on the video. However, while plants cell wall doesn't change its structure\nit's interesting to see the physarum constantly morphing the spaces where particles are trapped\nbecause of the physics of the chloroplasts. The other thing is that the voronoi particles change the\nspeed based on the fluid particle speed values. It's interesting because it works quite similar to the time phase and imitates\nthe human circulatory system imitating the heartbeat. Unfortunately, the effect is only momentary.\nThere is no long term behaviour other than the physarum field modification.\n\nTECHNICAL REALIZATION : I've always wanted to code a fluid simulation\nthat uses the lists like in the following video(Sebastian Lague, https://www.youtube.com/watch?v=rSKMYc1CQHE&t=1319s). Because of GLSL usage, the first step\nwas to use the smoke simulation done in the previous shader (Philip Michalowski, https://www.shadertoy.com/view/W3yfDh) to influence the location and speed\nof the particles to simulate the force field tension between particles. However when there\nis no entity to generate the smoke and the smoke density buffer only attracts the particles rather than apply the forces\nand change the direction the effect is very poor and not as intended.\n\nUnfortunately, it was difficult to find an understandable shader on Shadertoy that does fluid particle simulation. To understand the implementation behind the system\nI used Claude AI Opus 4.6 Model to give me idea how the system is implemented with the code snippets and explanation.\nLater, after a conversation with professor Wakefield I had an idea on how to store the particle data in the list buffer\non per pixel basis as well as read those values as index based list. I initialized the buffer with the\nrandom values of position and velocity. With the help of AI I understood the particle forces application based on the neighbourhood. It's interesting\nthat traversal is very similar to the particle system we created in class (Graham Wakefield,https://www.shadertoy.com/view/7ff3RX) but instead of tracking the particles it tracks indexes.\nThe scan is to apply the forces based on the particle neighbourhood and use it to update the entire particle location list rather than updating\nthe list directly in the single for loop. In this case instead of around 9000 length for loop I scan the neighbourhood with 2 short for loops to seek\nfor the tracked index change as a boundary to get the neighbouring entities and calculate force which optimizes the system significantly. Before the 9000 particle loop was reducing fps significantly up to 13, now its around 40-60.\nWhen the implementation of list with the forces and particle tracking via index improved and made possible to create a great fluid visual effect which wast possible with the combination of the smoke density field with particles.\n\nThat method gave a very visually pleasing and efficient effect for fluid simulation. I decided to test it by adding mouse forces to see how the fluid responds to movement. It was working great creating ripples and viscosity. \nTo get the desired cellular division shape I copied the voronoi physarum particles from previous assignment (Philip Michalowski, https://www.shadertoy.com/view/7fBGWh) and applied the forces\nof the physarum the same way as the fluid simulation and mouse but with greater range to push away the fluid from the particles that moves around on trails.\nAI helped me to identify how the offset works and provided with the code snippets and explained the functionality. It needed couple value tweeks in the fluid shader because the forces of the fluid particles\nas times were too stiff when i push the force and radius in the range of 50.-100. and pushed either too hard against each other or were going through with almost no forces when values where around 5.-10.\n\nTo apply the final styling I mixed all the values however it was a little unclear for me\nhow to get a white background. I asked AI to give me code snippets and explain how the\naccumulation of buffers work in here to achieve edges, soft edged particles light trails\nas well as white background.With the help of AI I also added the sampling of the edge values to voronoi particle. It gave a nice effect of speed change but I latter found that\nthe speed is variable is better, creates this circularatory vessel effect based on the fluid particle speed values.\n\nFUTURE EXTENSIONS: It would be fascinating if the particles are driven by the AI or\ncamera and how interesting the effect will be if the camera tracking has edge detection kernel applied.\nThere can definitely be more forces applied to the voronoi buffer. This time it was good for the biological representation\nhowever in the other possibility it definitely can be expanded.\n\nAI References:\nClaude AI engine Opus 4.6 helped to generate code snippets, snippets explanation for the learning purposes as well as debugging\nfor the buffer A, buffer B, Buffer C, Image and getParticle function in the common.\nCode in those buffers are interchangeably modified by me and improved/debugged by the Opus 4.6 engine.\nIt was necessary since all other sources that used particle id tracking and fluid were difficult to interpret and\neven more difficult to learn. A great conversation with professor Wakefield and AI use gave me theoretical and practical understanding\nof voronoi fluid simulation and neighbour force propagation\nSAMPLE PROMPTS:\n\"so the x coordinate is just row selector and the y coordinate * resolution is column selector - can you explain how it works in the buffer index perspective ?\"\n\"explain how do i put those values to the separate buffer to treat it as a list in shadertoy\nexplain the reasoning behind the indexes and its scanning system. Generate Code snippets and explain. <SMOKE DENSITY BUFFER CODE>\"\n\"If i wanna store just particle ids and retreive the data from the id - can you explain what are the principles ?\"\n\"<CODE IN IMAGE TO DISPLAY FLUID PARTICLES>  - this gives me black screen. Explain what im doing wrong ? Provide code explanation\"\n\"I feel some particles are geting lost <FLUID PARTICLES CODE>\"\n\"where does it calculate distance between the particles ?\"\n\"so i have the A.xy and its 4 neighbours positions and then it can tell whats the density in the particle bertween the other ones\"\n\"can you explain again how vornoi works ? will it work if i apply the force in buffer A ? can you guide me step by step ?\"\n\"so whichever particle vornoi tracks now - bestID. so voronoi is essentially to display the particles\"\n\"<VORNOI PARTICLE TRACKING CODE> like this ?\"\n\"some the particless dissapear towards the botom\"\n\nThere are quite a few more but many of them are quite the same in the principle\nand structure to give explanation, give some code snippets or debug existing buffer code.\n\nPRIOR FEEDBACK: I did my best to make the code readable and indented\n*/\n\n// IMAGE BUFFER\n\n// Coded by the author with assistance of Claude Opus 4.6\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n  vec2 uv = fragCoord / iResolution.xy;\n\n  // Get the buffers of particle tracking, trails, and voronoi particles\n  vec4 particleTracking = texture(iChannel0, uv);\n  vec4 voronoiTrails = texture(iChannel3, uv);\n  vec2 voronoiPosition = texture(iChannel2, uv).xy;\n\n  // Get the data from particle tracking buffer\n  float particleDistance = particleTracking.y;\n  float particleEdge = particleTracking.z;\n  float particleSize = particleTracking.w;\n\n  // Hardcoded colors\n  vec3 green = vec3(0.3, 0.95, 0.35);\n  vec3 lightGreen = vec3(0.2, 0.75, 0.15);\n  vec3 grayEdge = vec3(0.85, 0.85, 0.85);\n\n  // Fluid particle dot rendering\n  float fluidDots = particleSize / particleDistance;\n\n  // Voronoi particle dot rendering\n  float particleDist = distance(fragCoord, voronoiPosition);\n  float physDots = particleSize / particleDist;\n\n  // Combine both dots\n  float dots = fluidDots + physDots;\n\n  // Trail intensity reduce the intensity of the trail\n  float trailAmount = clamp(length(voronoiTrails.rgb) * 0.1, 0.0, 1.0);\n\n  // Final color - on white background\n  vec3 color = vec3(1.0);\n\n  // mix the white with edges based\n  color = mix(color, grayEdge, particleEdge);\n\n  // mix the color with green trails\n  color = mix(color, lightGreen, trailAmount);\n\n  // mix the color with green particles\n  color = mix(color, green, dots);\n\n  // everything combined\n  fragColor = vec4(color, 1.0);\n}",
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
				"code": "// BUFFER A - PARTICLE LOCATIONS AND FORCES\n\n// Coded by the author with assistance of Claude Opus 4.6 based on the idea of Graham Wakefield\n// Conversation during class meeting\n\n/*\n// Settings of the forces of particles, voronoi\nconst float particleRadius = 55.0;\nconst float particleForce = 130.0;\nconst float voronoiRadius = 130.0;\nconst float voronoiForce = 128.0;\nconst float particleSpeedDamping = 0.999;\nconst float particleMaxSpeed = 150.0;\n*/\n\nconst float particleRadius = 15.0;\nconst float particleForce = 30.0;\nconst float voronoiRadius = 30.0;\nconst float voronoiForce = 28.0;\nconst float particleSpeedDamping = 0.999;\nconst float particleMaxSpeed = 50.0;\nconst float mouseRadius = 120.0;\nconst float mouseForce = 180.0;  \n\n// Repel function - repels the particles against each other\n// based on the distance between them. If the distance between particles is too small\n// apply force to repel own particle\n// Takes own particle data, other particle data, radius and strength of the force\n// Returns the force of the particle interaction\n// Idea of Graham Wakefield\n// In class review conversation\nvec2 repel(vec2 me, vec2 other, float radius, float strength) {\n  \n  // Difference in the x and y value between particles to  get the offset \n  vec2 diff = me - other;\n  \n  // Get the length of the offset vector\n  float dist = length(diff);\n  \n  // If the length of the offset vector is greater than\n  // radius the particles are far enough from each other\n  if (dist > radius) {\n    return vec2(0);\n  }\n  // else if the particle distance is smaller than radius\n  // apply the force to repel them from each other\n  // get the direction of the offset and multiply it by the how far off\n  // the radius the distance is and how strong it applies\n  else\n    return normalize(diff) * (1.0 - dist / radius) * strength;\n}\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n  \n  // Uv and texel initialization\n  vec2 uv = fragCoord / iResolution.xy;\n  vec2 texel = 1.0 / iResolution.xy;\n\n  // calculate the index for the particle stored in the buffer\n  // index is the x coordinate as column + y fragCoord values times resolution as a row\n  // it gives the buffer stable way to combine with buffer B to form a list\n  int index = int(fragCoord.x) + int(fragCoord.y) * int(iResolution.x);\n  \n  // if the index is greater than number of particles\n  // don't put the values into the texture anymore - saves a lot of power\n  if (index >= NUM_PARTICLES) {\n    fragColor = vec4(0);\n    return;\n  }\n\n  // Get previous frame, position and velocity of the particle\n  vec4 A = texture(iChannel0, uv);\n  vec2 pos = A.xy;\n  vec2 vel = A.zw;\n  vec2 force = vec2(0);\n\n  // Get Particle coordinates in the UV space\n  vec2 particleUV = pos / iResolution.xy;\n\n  // Go over the neighbours of the particle to calculate inner forces\n  // and apply them in the system.\n  for (int x = -1; x <= 1; x++){\n    for (int y = -1; y <= 1; y++){\n      \n      // If the values is not its own pixel (0,0)\n      if (x != 0 || y != 0) {\n        \n        // Get the offset position in the variable\n        vec2 offsetDirection = vec2(x, y);\n\n        // Calculate repulsion from the physarum particles. For loop tests the distances of 7,14,21 pixels away\n        // and calculate the position of all particles and physarum from the current particle\n        // DISCONNECT FOR THE PURE PARTICLE FLUID FIELD\n        for (float offsetDistance = 7.0; offsetDistance <= 21.0; offsetDistance += 7.0) {\n          // physarum particle location\n          vec2 physarumParticle = texture(iChannel2, particleUV + offsetDirection * offsetDistance * texel).xy;\n          // Accumulate the repellent forces in the variable to later add all the forces to the particle\n          force += repel(pos, physarumParticle, voronoiRadius, voronoiForce);\n        }\n\n        // Get the own neighbour particle ID\n        int neighborIndex = int(texture(iChannel1, particleUV + offsetDirection * particleRadius * texel).x);\n        // If neighbour pixel is not the own particle\n        if (neighborIndex != index) {\n          // Get the neighbour particle from the B buffer with\n          // ID locations tracking location through ID\n          vec2 neighborPosition = getParticle(neighborIndex, iResolution.xy, iChannel0).xy;\n          // Accumulate the forces\n          force += repel(pos, neighborPosition, particleRadius, particleForce);\n        }\n      }\n    }\n  }\n  \n  // Active while mouse button is pressed\n  if (iMouse.z > 0.0) {\n    // get mouse position\n    vec2 mouse = iMouse.xy;\n    // apply the force\n    force += repel(pos, mouse, mouseRadius, mouseForce);\n  }\n\n  // Main movement functionality calculations\n  // Accumulate the velocity over time so the values\n  // are smooth every frame\n  vel += force * iTimeDelta;\n  \n  // Reduce the speed over time with damping so it decreases\n  // when there is no external force\n  vel *= particleSpeedDamping;\n  \n  // clamp the values in case so the particle doesn't\n  // speed up over the maximum speed (when clamp is not there radius can be extremely low and the particles\n  // shoot in the space all around the screen)  \n  vel = clamp(vel, -vec2(particleMaxSpeed), vec2(particleMaxSpeed));\n  \n  // Accumulate the velocity in the position to change particle\n  // coordinates based on its location\n  pos += vel * iTimeDelta;\n\n  // Position Boundaries - if the positions are going over the wall\n  // change the velocity direction to the opposite sign\n  // this way particles are always in the viewport\n  // Modified from Graham Wakefield\n  // https://www.shadertoy.com/view/7ff3RX\n  vec2 reflectionBoundary = clamp(pos, vec2(1.0), iResolution.xy - 1.0);\n  if (pos.x != reflectionBoundary.x) vel.x *= -1.0;\n  if (pos.y != reflectionBoundary.y) vel.y *= -1.0;\n  pos = reflectionBoundary;\n\n  // initialize the particles to random noise location and 0 velocity\n  if (iFrame == 0) {\n    vec4 noise = random4(vec3(fragCoord, 0.0));\n    pos = noise.xy * iResolution.xy;\n    vel = vec2(0);\n  }\n\n  fragColor = vec4(pos, vel);\n}",
				"name": "Buffer A",
				"description": "",
				"type": "buffer"
			},
			{
				"outputs": [],
				"inputs": [],
				"code": "// Coded by the author with assistance of Claude Opus 4.6 based on the idea of Graham Wakefield\n// Conversation during class meeting\n\nconst int NUM_PARTICLES = 9000;\n\n// Function converts the index into the x,y coordinates to read\n// the data encoded in the pixel vec4\n// Expects index of the particle, resolution of the screen and texture from the buffer\n// Returns offset texture with the particle position and velocity\nvec4 getParticle(int index, vec2 resolution, sampler2D channel) {\n  // get the index column of the particle\n  float x = mod(float(index), resolution.x);\n  // get the index row of the particle\n  float y = floor(float(index) / resolution.x);\n  // adjust to fragCoord since the first fragCoord starts with (0.5,0.5) not\n  // (1,1)\n  vec2 uv = (vec2(x, y) + 0.5) / resolution;\n  return texture(channel, uv);\n}\n\n// Rotation Matrix taken from class\n// Graham Wakefield\n// https://www.shadertoy.com/view/7ff3RX\n\nmat2 rotate2d(float angle) {\n  float s = sin(angle);\n  float c = cos(angle);\n  return mat2(c, -s, s, c);\n}\n\n//  Taken from Lecture Slides\n//  Graham Wakefield\n//  https://alicelab.world/digm5950/glsl.html#randomnoise\n\nfloat TWOPI = 6.28318530718;\n#define RANDOM_SCALE vec4(.1031, .1030, .0973, .1099)\n\nvec2 random2(float p) {\n  vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);\n  p3 += dot(p3, p3.yzx + 19.19);\n  return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec2 random2(vec2 p) {\n  vec3 p3 = fract(p.xyx * RANDOM_SCALE.xyz);\n  p3 += dot(p3, p3.yzx + 19.19);\n  return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec2 random2(vec3 p3) {\n  p3 = fract(p3 * RANDOM_SCALE.xyz);\n  p3 += dot(p3, p3.yzx + 19.19);\n  return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec3 random3(float p) {\n  vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);\n  p3 += dot(p3, p3.yzx + 19.19);\n  return fract((p3.xxy + p3.yzz) * p3.zyx);\n}\n\nvec3 random3(vec2 p) {\n  vec3 p3 = fract(vec3(p.xyx) * RANDOM_SCALE.xyz);\n  p3 += dot(p3, p3.yxz + 19.19);\n  return fract((p3.xxy + p3.yzz) * p3.zyx);\n}\n\nvec3 random3(vec3 p) {\n  p = fract(p * RANDOM_SCALE.xyz);\n  p += dot(p, p.yxz + 19.19);\n  return fract((p.xxy + p.yzz) * p.zyx);\n}\n\nvec4 random4(float p) {\n  vec4 p4 = fract(p * RANDOM_SCALE);\n  p4 += dot(p4, p4.wzxy + 19.19);\n  return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec2 p) {\n  vec4 p4 = fract(p.xyxy * RANDOM_SCALE);\n  p4 += dot(p4, p4.wzxy + 19.19);\n  return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec3 p) {\n  vec4 p4 = fract(p.xyzx * RANDOM_SCALE);\n  p4 += dot(p4, p4.wzxy + 19.19);\n  return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec4 p4) {\n  p4 = fract(p4 * RANDOM_SCALE);\n  p4 += dot(p4, p4.wzxy + 19.19);\n  return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}",
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
				"code": "// BUFFER: FLUID PARTICLE TRACKING\n\n// Tracks particle distances from the pixel\n// and returns whichever particle is closer\n// Based on Graham Wakefield's Particle Pixel Voronoi Tracking, modified by the author with assistance from Claude Opus 4.6\n// Graham Wakefield\n// https://www.shadertoy.com/view/7ff3RX\n// Takes current particle index, the pixel coordinate and other neighbour particle index\n// Returns the tracked particle vec3 with its index and distance among the particles\nvec3 trackParticles(vec3 currentParticle, vec2 coordinates, int otherIndex) {\n  int index = int(currentParticle.x);\n\n  // Get the position of the currently tracked particle based on the index\n  vec2 currentPosition = getParticle(index, iResolution.xy, iChannel0).xy;\n  // Get the other particle location based on its index\n  vec2 otherPosition = getParticle(otherIndex, iResolution.xy, iChannel0).xy;\n\n  // Calculate the own and other distance of the particle from the pixels\n  float distanceA = distance(coordinates, currentPosition);\n  float distanceB = distance(coordinates, otherPosition);\n\n  // Check if the other particle is closer to the pixel than the own particle\n  // If yes then return the other particle index and its distance if not return its neighbour\n  if (distanceB > distanceA) {\n    return vec3(float(index), distanceA, 0.0);\n  } \n  else {\n    return vec3(float(otherIndex), distanceB, 0.0);\n  }\n}\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n  vec2 uv = fragCoord / iResolution.xy;\n\n  // Assign a random particle index to each pixel to\n  // initialize the tracking via index\n  if (iFrame == 0) {\n    // Initialize the noise\n    vec4 noise = random4(fragCoord);\n\n    // Assign the random index in the range of particle number\n    int randomIndex = int(noise.x * float(NUM_PARTICLES));\n    // Assign random position of the particle of the random index\n    vec2 randomPosition = getParticle(randomIndex, iResolution.xy, iChannel0).xy;\n    // Add random distance of the particle from the pixel\n    float randomDistance = distance(fragCoord, randomPosition);\n\n    fragColor = vec4(float(randomIndex), randomDistance, 0.0, 0.5 + noise.y * 1.5);\n    return;\n  }\n\n  // Get the previous state of the particles tracking\n  vec4 previousPixel = texture(iChannel1, uv);\n\n  // Get the index that the pixel is\n  // tracking from the previous particle\n  int index = int(previousPixel.x);\n\n  // Store current particle index and distance\n  vec3 currentParticle = vec3(float(index), previousPixel.y, 0.0);\n\n  // Keep the particle size from the previous state\n  float particleSize = previousPixel.w;\n\n  // Sample the indexes from the 1px offset neighbourhood\n  int leftIndex = int(texture(iChannel1, (fragCoord + vec2(-1.0, 0.0)) / iResolution.xy).x);\n  int rightIndex = int(texture(iChannel1, (fragCoord + vec2(1.0, 0.0)) / iResolution.xy).x);\n  int downIndex = int(texture(iChannel1, (fragCoord + vec2(0.0, -1.0)) / iResolution.xy).x);\n  int upIndex = int(texture(iChannel1, (fragCoord + vec2(0.0, 1.0)) / iResolution.xy).x);\n\n  // If the indexes are different than current pixel index then it's a boundary\n  // Idea of Graham Wakefield\n  // Lecture conversation\n  float edge = 0.0;\n  if (leftIndex != index || rightIndex != index || downIndex != index || upIndex != index) {\n    edge = 1.0;\n  }\n\n  // Check nearby pixels and keep whichever particle is closer\n  // Modified based on Graham Wakefield's Particle Pixel Voronoi Tracking\n  // Graham Wakefield\n  // https://www.shadertoy.com/view/7ff3RX\n  for (int x = -4; x <= 4; x++) {\n    for (int y = -4; y <= 4; y++) {\n      int otherIndex = int(texture(iChannel1, (fragCoord + vec2(float(x), float(y))) / iResolution.xy).x);\n      currentParticle = trackParticles(currentParticle, fragCoord, otherIndex);\n    }\n  }\n\n  // Adds the value of the current particle data to the pixel\n  // x as index, y as the distance from the pixel, edge value, random particle size\n  fragColor = vec4(currentParticle.x, currentParticle.y, edge, particleSize);\n}",
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
				"code": "// BUFFER TO CONTROL PARTICLE POSITIONS\n\n// Author and AI Claude Opus 4.6 Modified From Particle Shader from the\n// Graham Wakefield\n// https://www.shadertoy.com/view/7ff3RX\n\n// Track particles distances between pixel and distances between particles \n// Takes current pixel with particle value, offset to check and coordinates with the fragCoord value\n// Return which particle is closer\nvec4 trackParticles(vec4 currentPixel, vec2 coordinates, vec2 offset) {\n  // Get the particle neighbour\n  vec4 neighbour = texture(iChannel0, (coordinates + offset) / iResolution.xy);\n\n  // Calculated distances between pixel coordinate and particle location\n  float distanceA = distance(coordinates, currentPixel.xy);\n  float distanceB = distance(coordinates, neighbour.xy);\n\n  // Check which particle is closer\n  if (distanceB > distanceA) {\n    return currentPixel;\n  } \n  else {\n    return neighbour;\n  }\n}\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n  vec2 uv = fragCoord / iResolution.xy;\n\n  // Get the previous state of the particles\n  vec4 fluidParticlesForces = texture(iChannel1, uv);\n  vec4 previousFrame = texture(iChannel0, uv);\n\n  // Loop to see what particles are the closest to the follower pixel\n  for (int i = -3; i < 3; i++) {\n    for (int j = -3; j < 3; j++) {\n      previousFrame = trackParticles(previousFrame, fragCoord, vec2(i, j));\n    }\n  }\n\n  // Initialize the noise based on the particle coordinates\n  vec4 noise = random4(vec3(previousFrame.xy, iTime));\n\n  // Particles parameters initialization\n  float speed = 50.;\n  float turn = 0.5;\n  float wander = 0.8;\n  float turnfactor = 0.8;\n\n  // Length of the particle sensing\n  float sensor_length = 15.;\n\n  // Set up our antennae:\n  mat2 rot = rotate2d(previousFrame.z);\n  vec2 sensor0 = vec2(1, 0) * sensor_length;\n  vec2 sensor1 = vec2(1, 1) * sensor_length;\n  vec2 sensor2 = vec2(1, -1) * sensor_length;\n  vec2 sensor0_in_world = rot * sensor0 + previousFrame.xy;\n  vec2 sensor1_in_world = rot * sensor1 + previousFrame.xy;\n  vec2 sensor2_in_world = rot * sensor2 + previousFrame.xy;\n\n  // Get the trail field where our antennae are:\n  vec4 F = texture(iChannel2, sensor0_in_world / iResolution.xy);\n  vec4 FL = texture(iChannel2, sensor1_in_world / iResolution.xy);\n  vec4 FR = texture(iChannel2, sensor2_in_world / iResolution.xy);\n  \n  // Based on the fluid velocity value from buffer A change the speed for the voronoi particle\n  // Snipped is not quite right programatically since it samples the values 2 times from the same buffer but the \n  // effect is quite intersting\n  float fluidVelocityInfluence = texture(iChannel1, fluidParticlesForces.zw / iResolution.xy).z;\n  if (fluidVelocityInfluence > 0.8) {\n    speed *= 0.5;\n  }\n\n  // If Middle Antennae sensing the strongest signal from the probability field\n  if (F.g > FL.g && F.g > FR.g) {\n    // Go straight\n  }\n  // If Middle Antennae is sensing lower than left and right antennae signal\n  // wander randomly\n  else if (F.g < FL.g && F.g < FR.g) {\n    previousFrame.z += wander * (noise.z - 0.5);\n  }\n  // If right antennae is sensing stronger signal then turn\n  else if (FL.g < FR.g) {\n    previousFrame.z += turnfactor;\n  }\n  // If left antennae is sensing stronger signal then turn the other way\n  else if (FR.g < FL.g) {\n    previousFrame.z -= turnfactor;\n  }\n\n  // Move the particle\n  // Get the xy velocity from the previous frame direction\n  rot = rotate2d(previousFrame.z);\n\n  // Polar to cartesian\n  vec2 vel = rot * vec2(speed, 0);\n\n  // Integrate velocity to position\n  previousFrame.xy += vel * iTimeDelta;\n\n  // Get the bounded position within the screen image\n  vec2 screenBounds = clamp(previousFrame.xy, vec2(0), iResolution.xy);\n\n  // Compare the bounded and actual positions -- if they are different, reflect\n  if (previousFrame.x != screenBounds.x) {\n    previousFrame.z = TWOPI * 0.5 - previousFrame.z;\n  }\n  // Reflect in X axis\n  if (previousFrame.y != screenBounds.y) {\n    previousFrame.z = TWOPI - previousFrame.z;\n  }\n  // Reflect in Y axis\n  previousFrame.xy = screenBounds.xy;\n\n  // Initialize the particle grid\n  if (iFrame == 0) {\n    // Create a grid system for each particle - 20px for each particle\n    vec2 grid = round(fragCoord / 20.) * 20.;\n    // Save XY in the red and green channel\n    previousFrame.xy = grid;\n    // Save rotation in the blue channel\n    previousFrame.z = noise.x * TWOPI;\n  }\n\n  fragColor = vec4(previousFrame);\n}",
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
				"code": "// VORONOI PARTICLE TRAILS BUFFER\n\n// Slightly Modified From Lecture\n// Graham Wakefield\n// https://www.shadertoy.com/view/7ff3RX\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n  vec2 uv = fragCoord / iResolution.xy;\n\n  // Get the voronoi particles and previous frame of own buffer\n  vec4 voronoiParticles = texture(iChannel0, uv);\n  vec4 previousFrame = texture(iChannel1, uv);\n\n  // Render the voronoi particle as a dot\n  float dist = distance(fragCoord, voronoiParticles.xy);\n  float particles = step(0.5, 1.0 / dist);\n\n  // Accumulate the trail of the particle movement\n  previousFrame += vec4(particles);\n\n  // Multiply by 0.96 to make the trails fade over time\n  // the number seemed to give optimal fade time\n  previousFrame *= 0.96;\n\n  fragColor = previousFrame;\n}",
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
			"id": "sffSz7",
			"date": "1775619133",
			"viewed": 58,
			"name": "Chlorophyll",
			"username": "Philip	Michalowski",
			"description": "Paticle Fluid System with Physarum",
			"likes": 3,
			"published": 1,
			"flags": 32,
			"usePreview": 0,
			"tags": [
				"particles"
			],
			"hasliked": 0,
			"parentid": "7flSzH",
			"parentname": "SWIM"
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
			"viewed": 112,
			"name": "Overgrown",
			"username": "Philip	Michalowski",
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
				"code": "/*\n    Final Compositing and Rendering\n    \n    INTERACTIONS:\n    - Hold mouse in TOP half: DISPERSIVE mode (Licorice background)\n    - Hold mouse in BOTTOM half: COOPERATIVE mode (Delft Blue background)\n    - Mouse click anywhere: Attracts agents and deposits pheromone\n    \n    COLOR PALETTE:\n    - Delft Blue (#353B56): Cooperative mode background\n    - Licorice (#251211): Dispersive mode background\n    - Taupe Gray (#7D7585): Low pheromone trails\n    - Persian Orange (#C99379): High pheromone trails\n    - Earth Yellow (#FBB45E): Agent bodies\n*/\n\n\n// COLOR PALETTE\n\n\n#define DELFT_BLUE vec3(0.208, 0.231, 0.337)\n#define LICORICE vec3(0.145, 0.071, 0.067)\n#define TAUPE_GRAY vec3(0.490, 0.459, 0.522)\n#define PERSIAN_ORANGE vec3(0.788, 0.576, 0.475)\n#define EARTH_YELLOW vec3(0.984, 0.706, 0.369)\n\n#define AGENT_COUNT 300\n\n// Transition speed for background color change\n#define BG_TRANSITION_SPEED 0.08\n\nivec2 agentIndexToCoord(int idx, vec2 res) {\n    int width = int(res.x);\n    return ivec2(idx % width, idx / width);\n}\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 res = iResolution.xy;\n    vec2 uv = fragCoord / res;\n    \n   \n    // READ MODE FROM BUFFER B\n    \n    \n    float mode = texelFetch(iChannel1, ivec2(0, 0), 0).a;\n    \n    // mode = 0.0: Cooperative (Delft Blue)\n    // mode = 1.0: Dispersive (Licorice)\n    \n  \n    // BACKGROUND: Changes based on mode\n\n    \n    vec3 backgroundColor = mix(DELFT_BLUE, LICORICE, mode);\n    \n    // subtle vignette\n    float vignette = 1.0 - length(uv - 0.5) * 0.25;\n    backgroundColor *= vignette;\n    \n    // very subtle noise texture to background\n    float noise = fract(sin(dot(fragCoord, vec2(12.9898, 78.233))) * 43758.5453);\n    backgroundColor += (noise - 0.5) * 0.015;\n    \n   \n    // PHEROMONE TRAILS (Buffer B)\n   \n    \n    float pheromone = texture(iChannel1, uv).r;\n    \n    // Color mapping based on pheromone intensity\n    vec3 trailColor;\n    \n    if (pheromone < 0.1) {\n        // Very low: fade from background toward Taupe Gray\n        float t = pheromone / 0.1;\n        trailColor = mix(backgroundColor, TAUPE_GRAY, t * 0.7);\n    } else if (pheromone < 0.4) {\n        // Medium: Taupe Gray\n        float t = (pheromone - 0.1) / 0.3;\n        trailColor = mix(TAUPE_GRAY, mix(TAUPE_GRAY, PERSIAN_ORANGE, 0.5), t);\n    } else {\n        // High: Persian Orange\n        float t = (pheromone - 0.4) / 0.6;\n        t = clamp(t, 0.0, 1.0);\n        trailColor = mix(mix(TAUPE_GRAY, PERSIAN_ORANGE, 0.5), PERSIAN_ORANGE, t);\n    }\n    \n    // Blend trails over background\n    float trailAlpha = smoothstep(0.0, 0.08, pheromone);\n    vec3 color = mix(backgroundColor, trailColor, trailAlpha);\n    \n  \n    // LANGTON STATE FIELD (Buffer C)\n    \n    \n    float langtonState = texture(iChannel2, uv).r;\n    \n    // Subtle texture from Langton field\n    float langtonIntensity = abs(langtonState - 0.5) * 2.0;\n    \n    // Color shifts based on state\n    vec3 langtonColor = langtonState > 0.5 ? \n        mix(backgroundColor, TAUPE_GRAY, 0.3) : \n        mix(backgroundColor, DELFT_BLUE, 0.2);\n    \n    float langtonAlpha = langtonIntensity * 0.15 * (1.0 - trailAlpha * 0.8);\n    color = mix(color, langtonColor, langtonAlpha);\n    \n  \n    // AGENT BODIES\n    \n    \n    float agentGlow = 0.0;\n    \n    for (int i = 0; i < AGENT_COUNT; i++) {\n        ivec2 agentCoord = agentIndexToCoord(i, res);\n        vec4 agentData = texelFetch(iChannel0, agentCoord, 0);\n        vec2 agentPos = agentData.xy;\n        \n        vec2 diff = abs(fragCoord - agentPos);\n        diff = min(diff, res - diff);\n        float dist = length(diff);\n        \n        // Soft outer glow\n        if (dist < 12.0) {\n            float glow = 1.0 - dist / 12.0;\n            glow = glow * glow * glow; // Cubic falloff\n            agentGlow += glow * 0.2;\n        }\n        \n        // Bright core\n        if (dist < 2.5) {\n            agentGlow += (1.0 - dist / 2.5) * 0.9;\n        }\n    }\n    \n    agentGlow = min(agentGlow, 1.0);\n    color = mix(color, EARTH_YELLOW, agentGlow);\n    \n   \n    // MOUSE INDICATOR\n    \n    \n    if (iMouse.z > 0.0) {\n        vec2 mousePos = iMouse.xy;\n        vec2 diff = abs(fragCoord - mousePos);\n        diff = min(diff, res - diff);\n        float dist = length(diff);\n        \n        // Pulsing attraction ring\n        float ringRadius = 30.0 + sin(iTime * 4.0) * 8.0;\n        float ring = abs(dist - ringRadius);\n        \n        if (ring < 4.0) {\n            float ringAlpha = 1.0 - ring / 4.0;\n            ringAlpha *= ringAlpha;\n            color = mix(color, EARTH_YELLOW, ringAlpha * 0.6);\n        }\n        \n        // Inner glow at mouse\n        if (dist < 15.0) {\n            float innerGlow = 1.0 - dist / 15.0;\n            innerGlow *= innerGlow;\n            color = mix(color, EARTH_YELLOW, innerGlow * 0.3);\n        }\n    }\n    \n    \n    // MODE INDICATOR BOX (top-left corner)\n   \n    float boxWidth = 100.0;\n    float boxHeight = 25.0;\n    float margin = 10.0;\n    \n    float boxLeft = margin;\n    float boxRight = margin + boxWidth;\n    float boxBottom = res.y - margin - boxHeight;\n    float boxTop = res.y - margin;\n    \n    if (fragCoord.x > boxLeft && fragCoord.x < boxRight &&\n        fragCoord.y > boxBottom && fragCoord.y < boxTop) {\n        \n        // color based on mode\n        vec3 boxFill = mode > 0.5 ? LICORICE : DELFT_BLUE;\n        \n        // Lighter border\n        vec3 boxBorder = mode > 0.5 ? PERSIAN_ORANGE : TAUPE_GRAY;\n        \n        float borderWidth = 2.0;\n        bool isBorder = fragCoord.x < boxLeft + borderWidth || \n                        fragCoord.x > boxRight - borderWidth ||\n                        fragCoord.y < boxBottom + borderWidth ||\n                        fragCoord.y > boxTop - borderWidth;\n        \n        if (isBorder) {\n            color = boxBorder;\n        } else {\n            color = boxFill;\n            \n            //  text hint using simple shapes\n            // \"C\" or \"D\" indicator\n            float centerX = (boxLeft + boxRight) * 0.5;\n            float centerY = (boxBottom + boxTop) * 0.5;\n            \n            // Simple dot pattern to indicate mode\n            float dotDist = length(fragCoord - vec2(centerX, centerY));\n            if (mode < 0.5) {\n                // Cooperative: cluster of dots (together)\n                float d1 = length(fragCoord - vec2(centerX - 8.0, centerY));\n                float d2 = length(fragCoord - vec2(centerX + 8.0, centerY));\n                float d3 = length(fragCoord - vec2(centerX, centerY));\n                if (d1 < 4.0 || d2 < 4.0 || d3 < 4.0) {\n                    color = EARTH_YELLOW;\n                }\n            } else {\n                // Dispersive: spread out dots\n                float d1 = length(fragCoord - vec2(centerX - 20.0, centerY));\n                float d2 = length(fragCoord - vec2(centerX + 20.0, centerY));\n                float d3 = length(fragCoord - vec2(centerX, centerY - 6.0));\n                float d4 = length(fragCoord - vec2(centerX, centerY + 6.0));\n                if (d1 < 3.0 || d2 < 3.0 || d3 < 3.0 || d4 < 3.0) {\n                    color = EARTH_YELLOW;\n                }\n            }\n        }\n    }\n    \n \n \n    \n  //FINAL OUTPUT\n    \n    fragColor = vec4(color, 1.0);\n}\n",
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
				"code": "/*\n    Student Number:219884246\n    Assignment: Final Project\n    Name: Hana Namdar\n    Title: \"Unruly Paths\" - Chemotactic Agents with Langton Dynamics\n    \n    INTERACTIONS:\n    - Mouse Hold: Attracts agents toward the cursor\n    - Mouse Position (Vertical):\n        • Top half: DISPERSIVE mode (agents avoid pheromone trails)\n        • Bottom half: COOPERATIVE mode (agents follow pheromone trails)\n    - Mouse Click: Creates a burst of pheromone at the cursor\n    \n    INTERESTING PARAMETERS TO MODIFY:\n    - AGENT_COUNT: Number of agents (100–500)\n    - ANTENNA_LENGTH: How far ahead agents sense (affects smoothness of trails)\n    - ANTENNA_ANGLE: Spread of antennae (wider = more exploration)\n    - TURN_SPEED: How fast agents turn\n    - LANGTON_STRENGTH: How much the binary state affects movement\n    \n    DESCRIPTION:\n    This system combines chemotaxis with a Langton-like binary state field to create \n    a hybrid agent-based system. Each agent uses two forward sensors (antennae) to \n    detect pheromone differences and decide which way to turn, while also interacting \n    with a grid-based state that changes over time.\n    \n    Unlike classic grid-based systems, the agents move in continuous space, which \n    makes the motion feel smoother and more natural. As they move, they both deposit \n    pheromones and flip the binary state underneath them, creating a feedback loop \n    between movement and the environment.\n    \n    This interaction leads to emergent behavior. In cooperative mode, agents follow \n    and reinforce existing trails, forming stable path networks. In dispersive mode, \n    they avoid trails and spread out, creating more scattered and exploratory patterns.\n    \n    Over time, the system reorganizes itself as pheromones diffuse and decay, leading \n    to changing structures instead of a fixed result.\n    \n    TECHNICAL REALIZATION:\n    - Buffer A: Stores agent data (position, direction, internal state)\n    - Buffer B: Handles pheromone diffusion and decay\n    - Buffer C: Stores and updates the binary Langton-like state field\n    - Image: Combines everything visually using the color palette\n    \n    - One challenge was balancing the pheromone system with the Langton state,\n    since one would often overpower the other and affect the behavior too much. \n    I also had to adjust parameters like diffusion, decay, and turning strength to get\n    more stable but still interesting results. Another difficulty was handling screen \n    wrapping while keeping movement smooth, which required careful distance calculations.\n\n    \n    Each frame, agents:\n    1. Sample pheromone using their antennae\n    2. Turn based on the gradient and binary state\n    3. Deposit pheromone\n    4. Flip the binary state\n    5. Move forward and wrap around the screen\n    \n    SOURCES:\n    - Chemotaxis and antenna sensing from course notes\n    - Langton’s Ant rules from course material\n    - Rotation matrix approach from shader examples\n    \n    FUTURE EXTENSIONS:\n    - Multiple pheromone types\n    - Agent lifespan and reproduction\n    - Obstacle avoidance\n    \n*/\n\n/*\n    Buffer A: Agent Storage\n    \n    Each pixel represents one agent:\n    - xy: position in space\n    - z: direction (mapped from 0–1 to 0–2π)\n    - w: binary state used for Langton-like behavior\n    \n    BEHAVIOR MODES:\n    - Cooperative: agents move toward higher pheromone\n    - Dispersive: agents move away from pheromone\n*/\n\n#define AGENT_COUNT 300\n#define ANTENNA_LENGTH 14.0\n#define ANTENNA_ANGLE 0.45\n#define TURN_SPEED 0.12\n#define MOVE_SPEED 1.0\n#define LANGTON_STRENGTH 0.1\n#define MOUSE_ATTRACT 0.0004\n\n#define PI 3.14159265359\n#define TWOPI 6.28318530718\n\nmat2 rotate2D(float angle) {\n    float s = sin(angle);\n    float c = cos(angle);\n    return mat2(c, -s, s, c);\n}\n\nfloat hash(vec2 p) {\n    p = fract(p * vec2(123.34, 456.21));\n    p += dot(p, p + 45.32);\n    return fract(p.x * p.y);\n}\n\nfloat hash21(vec2 p) {\n    vec3 p3 = fract(vec3(p.xyx) * 0.1031);\n    p3 += dot(p3, p3.yzx + 33.33);\n    return fract((p3.x + p3.y) * p3.z);\n}\n\nivec2 agentIndexToCoord(int idx) {\n    int width = int(iResolution.x);\n    return ivec2(idx % width, idx / width);\n}\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    ivec2 iCoord = ivec2(fragCoord);\n    vec2 res = iResolution.xy;\n    \n    int agentIdx = iCoord.y * int(res.x) + iCoord.x;\n    \n    // Not an agent pixel\n    if (agentIdx >= AGENT_COUNT) {\n        fragColor = vec4(0.0);\n        return;\n    }\n    \n   \n    // INITIALIZATION\n  \n    if (iFrame < 1) {\n        vec2 center = res * 0.5;\n        float spawnRadius = min(res.x, res.y) * 0.12;\n        \n        vec2 seed = vec2(float(agentIdx) * 1.234, float(agentIdx) * 5.678);\n        float randAngle = hash(seed) * TWOPI;\n        float randDist = sqrt(hash(seed + 100.0)) * spawnRadius;\n        \n        vec2 pos = center + vec2(cos(randAngle), sin(randAngle)) * randDist;\n        float dir = hash(seed + 200.0);\n        float state = step(0.5, hash(seed + 300.0));\n        \n        fragColor = vec4(pos, dir, state);\n        return;\n    }\n    \n    \n    // READ CURRENT STATE\n    \n    vec4 agentData = texelFetch(iChannel0, iCoord, 0);\n    vec2 pos = agentData.xy;\n    float dir = agentData.z;\n    float state = agentData.w;\n    \n    float angle = dir * TWOPI;\n    \n    \n    // READ MODE FROM BUFFER B\n    \n    float mode = texelFetch(iChannel1, ivec2(0, 0), 0).a;\n    \n    // behaviorSign: 1.0 = cooperative (toward pheromone)\n    //              -1.0 = dispersive (away from pheromone)\n    float behaviorSign = mode > 0.5 ? -1.0 : 1.0;\n    \n    \n    // DUAL ANTENNA SAMPLING\n    \n    \n    mat2 rot = rotate2D(angle);\n    \n    vec2 leftAntennaLocal = vec2(-sin(ANTENNA_ANGLE), cos(ANTENNA_ANGLE)) * ANTENNA_LENGTH;\n    vec2 rightAntennaLocal = vec2(sin(ANTENNA_ANGLE), cos(ANTENNA_ANGLE)) * ANTENNA_LENGTH;\n    \n    vec2 leftAntennaWorld = mod(pos + rot * leftAntennaLocal, res);\n    vec2 rightAntennaWorld = mod(pos + rot * rightAntennaLocal, res);\n    \n    float leftSample = texture(iChannel1, leftAntennaWorld / res).r;\n    float rightSample = texture(iChannel1, rightAntennaWorld / res).r;\n    \n    \n    // TURNING DECISION\n    \n    \n    float gradient = (rightSample - leftSample) * behaviorSign;\n    float turnAmount = gradient * TURN_SPEED * 3.0;\n    \n    // Langton bias\n    float langtonBias = (state - 0.5) * 2.0 * LANGTON_STRENGTH;\n    turnAmount += langtonBias;\n    \n    \n    // MOUSE ATTRACTION\n    \n    \n    if (iMouse.z > 0.0) {\n        vec2 mousePos = iMouse.xy;\n        vec2 toMouse = mousePos - pos;\n        \n        if (abs(toMouse.x) > res.x * 0.5) {\n            toMouse.x -= sign(toMouse.x) * res.x;\n        }\n        if (abs(toMouse.y) > res.y * 0.5) {\n            toMouse.y -= sign(toMouse.y) * res.y;\n        }\n        \n        float distToMouse = length(toMouse);\n        float angleToMouse = atan(toMouse.y, toMouse.x);\n        float angleDiff = mod(angleToMouse - angle + PI, TWOPI) - PI;\n        \n        float attractStrength = MOUSE_ATTRACT * res.x / (1.0 + distToMouse * 0.02);\n        turnAmount += angleDiff * attractStrength;\n    }\n    \n    \n    // RANDOM WIGGLE\n    \n    \n    float wiggle = (hash21(pos + vec2(iTime * 60.0, float(agentIdx))) - 0.5) * 0.08;\n    turnAmount += wiggle;\n    \n    turnAmount = clamp(turnAmount, -TURN_SPEED * 4.0, TURN_SPEED * 4.0);\n    \n    \n    // UPDATE\n   \n    angle = mod(angle + turnAmount, TWOPI);\n    \n    // Read and flip Langton state\n    float groundState = texture(iChannel2, pos / res).r;\n    state = groundState > 0.5 ? 0.0 : 1.0;\n    \n    // Move forward\n    pos += vec2(cos(angle), sin(angle)) * MOVE_SPEED;\n    pos = mod(pos, res);\n    \n    dir = angle / TWOPI;\n    \n    fragColor = vec4(pos, dir, state);\n}\n",
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
				"code": "/*\n    Buffer B: Pheromone Field\n    \n    MODE CONTROL:\n    - Mouse in TOP half: Dispersive (mode transitions toward 1.0)\n    - Mouse in BOTTOM half: Cooperative (mode transitions toward 0.0)\n    - Smooth transition between modes for gradual background change\n*/\n\n#define DECAY_RATE 0.006\n#define DIFFUSION_RATE 0.18\n#define DEPOSIT_AMOUNT 0.12\n#define AGENT_COUNT 300\n\n// How fast the mode transitions (0.0 to 1.0 range per frame)\n#define MODE_TRANSITION_SPEED 0.03\n\nivec2 agentIndexToCoord(int idx, vec2 res) {\n    int width = int(res.x);\n    return ivec2(idx % width, idx / width);\n}\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 res = iResolution.xy;\n    vec2 uv = fragCoord / res;\n    ivec2 iCoord = ivec2(fragCoord);\n    \n    \n    // INITIALIZATION\n    \n    if (iFrame < 1) {\n        fragColor = vec4(0.0);\n        return;\n    }\n    \n    \n    // MODE CONTROL WITH SMOOTH TRANSITION\n    \n    \n    // Read previous mode value\n    float mode = texelFetch(iChannel0, ivec2(0, 0), 0).a;\n    \n    // Target mode based on mouse position\n    float targetMode = mode; // Default: keep current\n    \n    if (iMouse.z > 0.0) {\n        // Mouse is pressed\n        if (iMouse.y > res.y * 0.5) {\n            // Top half = dispersive\n            targetMode = 1.0;\n        } else {\n            // Bottom half = cooperative\n            targetMode = 0.0;\n        }\n    }\n    \n    // Smoothly transition toward target\n    mode = mix(mode, targetMode, MODE_TRANSITION_SPEED);\n    \n    \n    // PHEROMONE FIELD PROCESSING\n    \n    \n    float currentPheromone = texelFetch(iChannel0, iCoord, 0).r;\n    \n    // Diffusion\n    float sum = 0.0;\n    for (int dx = -1; dx <= 1; dx++) {\n        for (int dy = -1; dy <= 1; dy++) {\n            vec2 samplePos = fragCoord + vec2(float(dx), float(dy));\n            samplePos = mod(samplePos, res);\n            sum += texture(iChannel0, samplePos / res).r;\n        }\n    }\n    float neighborAvg = sum / 9.0;\n    float diffused = mix(currentPheromone, neighborAvg, DIFFUSION_RATE);\n    \n    // Decay\n    diffused *= (1.0 - DECAY_RATE);\n    \n    \n    // AGENT DEPOSITS\n    \n    \n    for (int i = 0; i < AGENT_COUNT; i++) {\n        ivec2 agentCoord = agentIndexToCoord(i, res);\n        vec4 agentData = texelFetch(iChannel1, agentCoord, 0);\n        vec2 agentPos = agentData.xy;\n        \n        vec2 diff = abs(fragCoord - agentPos);\n        diff = min(diff, res - diff);\n        float dist = length(diff);\n        \n        if (dist < 4.0) {\n            float deposit = DEPOSIT_AMOUNT * (1.0 - dist / 4.0);\n            diffused += deposit;\n        }\n    }\n    \n    \n    // MOUSE PHEROMONE BURST\n \n    \n    if (iMouse.z > 0.0) {\n        vec2 mousePos = iMouse.xy;\n        vec2 diff = abs(fragCoord - mousePos);\n        diff = min(diff, res - diff);\n        float dist = length(diff);\n        \n        if (dist < 40.0) {\n            float burst = 0.35 * (1.0 - dist / 40.0);\n            burst *= burst;\n            diffused += burst;\n        }\n    }\n    \n    diffused = clamp(diffused, 0.0, 1.0);\n    \n    \n    // OUTPUT\n    \n    \n    float alphaOut = (iCoord.x == 0 && iCoord.y == 0) ? mode : 0.0;\n    \n    fragColor = vec4(diffused, 0.0, 0.0, alphaOut);\n}\n",
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
				"code": "/*\n    Buffer C: Langton State Field\n    \n    Binary state field (0 or 1) that agents flip as they traverse.\n    This creates the classic Langton's Ant emergent complexity.\n    \n    - Red channel: binary state (0 = off, 1 = on)\n    \n    Agents read this state to bias their turning direction,\n    then flip the state after passing through.\n*/\n\n#define AGENT_COUNT 300\n\n// Decay rate for state field (creates fading trails)\n// Set to 0 for classic Langton behavior (permanent flips)\n#define STATE_DECAY 0.002\n\nivec2 agentIndexToCoord(int idx, vec2 res) {\n    int width = int(res.x);\n    return ivec2(idx % width, idx / width);\n}\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 res = iResolution.xy;\n    ivec2 iCoord = ivec2(fragCoord);\n    \n    \n    // INITIALIZATION\n    \n    if (iFrame < 1) {\n        // Start with alternating pattern for visual interest\n        float pattern = mod(floor(fragCoord.x / 20.0) + floor(fragCoord.y / 20.0), 2.0);\n        fragColor = vec4(pattern * 0.3, 0.0, 0.0, 1.0);\n        return;\n    }\n    \n   \n    // READ CURRENT STATE\n   \n    \n    float currentState = texelFetch(iChannel0, iCoord, 0).r;\n    \n    \n    // CHECK FOR AGENT FLIPS\n    \n    float newState = currentState;\n    \n    // Check if any agent is at this pixel and should flip it\n    for (int i = 0; i < AGENT_COUNT; i++) {\n        ivec2 agentCoord = agentIndexToCoord(i, res);\n        vec4 agentData = texelFetch(iChannel1, agentCoord, 0);\n        vec2 agentPos = agentData.xy;\n        \n        // Check if agent is at this cell\n        vec2 diff = abs(fragCoord - agentPos);\n        diff = min(diff, res - diff);\n        float dist = length(diff);\n        \n        // Flip state if agent is here\n        if (dist < 1.5) {\n            // Toggle: if > 0.5 go to 0, if < 0.5 go to 1\n            newState = 1.0 - step(0.5, newState);\n        }\n    }\n    \n    \n    // GRADUAL DECAY \n    // This makes old flips fade back toward 0.5\n   \n    \n    newState = mix(newState, 0.5, STATE_DECAY);\n    \n   \n    // OUTPUT\n    \n    \n    fragColor = vec4(newState, 0.0, 0.0, 1.0);\n}\n",
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
			"mFlagKeyboard": true,
			"mFlagMultipass": true,
			"mFlagMusicStream": false
		},
		"info": {
			"id": "fflSR2",
			"date": "1775579751",
			"viewed": 42,
			"name": "Unruly Paths",
			"username": "Hana Namdar",
			"description": "description in buffer A, Chemotaxis and antenna - Langton’s Ant - Rotation matrix approach",
			"likes": 4,
			"published": 1,
			"flags": 48,
			"usePreview": 0,
			"tags": [
				"sample4"
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
				"code": "/*\nStudent number: 219045111\nAssignment number: Final\nName: Ian Hayward\nTitle: In The Bloodstream\n\n-+< Description >+-\nThis system is a microscopic ecosystem simulation that attempts to visualize the inside of a bloodstream. It\nis an agent-based system, containing different types of cells like red & white blood cells, and virus cells.\nThe virus cells also leave behind \"trails\" that are represented by agents as well The system functions using\ntwo buffers - one that manages a neighbor-sampling cellular automata that creates a gradient map, and another\nthat manages all four types of agents.\n\nThe system places heavy focus on predator-prey dynamics. All cells simply move throughout the window, with\nviruses spawning every now and then in random spots. The white blood cells, upon detecting the trail of a\nnearby virus, cease normal movement and immediately start chasing the virus until they either eliminate it or\ncan no longer sense a virus. This creates an organic-feeling ecosystem that displays continuous and interesting\nbehaviour rather than feeling stagnant or scripted.\n\nThe way the system works makes use of two buffers - Buffer A and Buffer B. Buffer A manages a cellular automata\nthat stores a direction vector and averages its own direction with its neighbors and changes its angle with a\nbit of controlled randomness. This creates a shifting flow that dictates the movement of all agents. Buffer B\nmanages all actors in the system by storing their data (xPos, yPos, angle, state) in pixels in the bottom left.\nIt also manages the behaviour of all actors at once, removing the need for multiple buffers.\n\nThe system supports long-term behaviour in that more viruses constantly spawn for white blood cells to chase.\nOver time, the flow that cells follow will stagnate into one or two large streams that wrap around the edges of\nthe screen, but the infection never truly stops changing.\n\n-+< Interactions >+-\nThe shader offers many global variables that the user can change to see different results:\nBUFFER A:\n- bias: To what degree the neighbor-sampling algorithm prioritizes the self cell in its calculations.\n    - Higher value means it samples the self's value with more weight\n\nBUFFER B:\n- speedBC: The base speed of blood cells (red and white)\n    - Higher value makes them go faster\n- speedChase: The chasing speed of white blood cells\n    - Higher value makes them go faster when chasing a virus\n- speedV: The base speed of virus cells\n    - Higher value makes them go faster\n- turnSpeed: The speed at which cells turn with the flow\n    - Higher value makes them turn faster\n- virusSpawn: Chance for viruses to randomly spawn\n    - Higher value makes viruses spawn more often\n\n-+< Technical Realization >+-\nOriginally, I wanted to create blood vessels across the screen and have cells travel through them, much like\nthey do now (actually, I originally made leaves that grow from nothing using agents, but pivoted because I\ncouldn't figure out any extensions for the project). I couldn't figure out how to make vessels, so instead I\nmade a gradient map CA where each pixel has a direction vector. This was much easier to create, though it\nstill took a great deal of number tweaking to get it to work well.\n\nSome issues I ran into involved the CA slowly drifting towards the top-right corner of the screen, this turned\nout to be because I was adding 0.00001 to the vectors before normalizing them. This led to a top-right bias\nthat evolved over a long time of running the simulation. I removed it as cos() and sin() never result in a 0,\nso there is no need to avoid normalizing a 0 vector as it will never be 0.\n\nInitially, the cells moved much faster horizontally than vertically. This is because their movement is UV-based,\nand I did not account for the aspect ratio. By taking the aspect ratio into account when manipulating the cells'\nmovement, I was able to negate this issue.\n\nThis project was (very obviously) inspired by blood cells and viruses in a bloodstream.\n\nSome future extensions of the project may include adding some interaction between virus cells and red blood cells,\nwhere perhaps viruses seek out red blood cells and damage them in order to replicate. I could also add some\ninteraction between the CA and agents in the opposite direction, where the density of blood cells in a certain\narea may affect the flow direction.\n\n-+< External Credits >+-\nMany of the random functions in the \"Common\" tab of this shader were taken from in-class labs and exercises.\nAll other code in this shader has been written from scratch. If any code was inspired by work that does not\nbelong to me (e.g. random1() in the Common tab), the original source has been credited in the comments.\n\n*/\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    vec2 uv = fragCoord/iResolution.xy;\n    \n    vec4 data = texture(iChannel0, uv);\n    \n    // DISPLAY GRADIENT MAP FOR BACKGROUND --------------\n    // Extract the direction of flow from buffer A\n    vec2 flowDir = data.rg * 2.0 - 1.0;\n    \n    // Use dot product to compare the flow direction to a vector from the top left corner of the window\n    float dotP = dot(flowDir, normalize(vec2(-1.0, 1.0)));\n    \n    // Map back to 0.0 to 1.0 for colours\n    dotP = dotP * 0.5 + 0.5;\n    \n    // Mix background colours in based on the result, deep red-tinted black vs dark red (imitates inside of blood)\n    vec3 col = mix(vec3(0.1, 0.0, 0.04), vec3(0.25, 0.02, 0.05), dotP);\n    \n    // DISPLAY CELLS ------------------------------------\n    // Cycle through agents in buffer B\n    for(int x = 0; x < 30; x++) {\n        for(int y = 0; y < 12; y++) {\n            \n            // Get areas for agents, skip empty ones\n            bool isRBC   = x < 10 && y < 10;\n            bool isWBC   = x >= 10 && x < 15 && y < 5;\n            bool isVirus = x >= 15 && x < 18 && y < 3;\n            bool isTrail = x >= 18 && x < 30 && y < 12;\n            \n            if (!isRBC && !isWBC && !isVirus && !isTrail) continue;\n            \n            // Get cell data\n            vec4 data = texelFetch(iChannel1, ivec2(x,y), 0);\n            float state = data.w;\n            \n            // Calculate wrap-around so if a cell is half off-screen it will appear on both edges\n            vec2 diff = abs(uv - data.xy);\n            diff = min(diff, 1.0 - diff);\n            diff.x *= iResolution.x / iResolution.y; \n            float dist = length(diff);\n            \n            // Draw the cells depending on the type\n            if (isRBC) {\n                // Use smoothstep to draw.\n                // param 1 is the outer egde of the cell\n                // param 2 is the inner part of the cell\n                // between param 1 and 2, smoothly transition from 0 to 1 (in terms of colour)\n                float m = smoothstep(0.008, 0.005, dist);\n                // Use mix to actually draw the cell. vec3 is the colour of the cell\n                col = mix(col, vec3(0.9, 0.0, 0.0), m);\n            } else if (isWBC) {\n                float m = smoothstep(0.010, 0.007, dist);\n                col = mix(col, vec3(0.9, 0.9, 0.9), m);\n            } else if (isVirus && state > 0.0) {\n                float m = smoothstep(0.008, 0.003, dist);\n                col = mix(col, vec3(0.3, 0.9, 0.1), m);\n            } else if (isTrail && state > 0.0) {\n                // For the trail, multiply by its life value so it fades out\n                float m = smoothstep(0.004, 0.001, dist) * state;\n                col = mix(col, vec3(0.1, 0.7, 0.2), m);\n            }\n        }\n    }\n    \n    fragColor = vec4(col, 1.0);\n}",
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
							"wrap": "repeat",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "// Global variables\nconst float bias = 20.0; // How much the neighbor averaging is biased toward self\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord)\n{\n    // Get normalized coordinates (0.0-1.0)\n    vec2 uv = fragCoord/iResolution.xy;\n    // Get previous frame's data\n    vec4 map = texture(iChannel0, uv);\n    vec4 C = map;\n    \n    // INITIALIZE on frame 0\n    if(iFrame == 0) {\n        // Determine starting angle for this pixel\n        float angle = random1(vec3(floor(uv * 15.0), iDate.w)) * 2.0 * PI;\n        // Translate angle into a normalized direction vector\n        vec2 dir = vec2(cos(angle), sin(angle));\n    \n        // pack into 0–1\n        dir = dir * 0.5 + 0.5;\n    \n        fragColor = vec4(dir, 0.0, 1.0);\n        return;\n    }\n    \n    vec2 px = 1.0/iResolution.xy;\n    \n    // Get directions of current cell and NSWE neighbors\n    vec2 center = texture(iChannel0, uv).rg * 2.0 - 1.0;\n    vec2 up = texture(iChannel0, uv + vec2(0, px.y)).rg * 2.0 - 1.0;\n    vec2 down = texture(iChannel0, uv + vec2(0, -px.y)).rg * 2.0 - 1.0;\n    vec2 left = texture(iChannel0, uv + vec2(-px.x, 0)).rg * 2.0 - 1.0;\n    vec2 right = texture(iChannel0, uv + vec2(px.x, 0)).rg * 2.0 - 1.0;\n    // Get diagonals (weighted less)\n    vec2 upLeft = (texture(iChannel0, uv + vec2(-px.x, px.y)).rg * 2.0 - 1.0) * 0.707;\n    vec2 upRight = (texture(iChannel0, uv + vec2(px.x, px.y)).rg * 2.0 - 1.0) * 0.707;\n    vec2 downLeft = (texture(iChannel0, uv + vec2(-px.x, -px.y)).rg * 2.0 - 1.0) * 0.707;\n    vec2 downRight = (texture(iChannel0, uv + vec2(px.x, -px.y)).rg * 2.0 - 1.0) * 0.707;\n    \n    // Over time, average direction vector with yourself and neighbors\n    // (prio self based on bias variable)\n    vec2 avg = (center * bias + up + down + left + right + upLeft + upRight + downLeft + downRight) / (6.828 + bias);\n    \n    // Add some cool extra directional bias\n    vec2 curl = vec2(\n        right.y - left.y,\n        up.x - down.x\n    );\n    //avg += curl * 0.01;\n    \n    // Add some controlled randomness to stop things from going stagnant\n    float rand = random1(vec3(fragCoord / 5.0, iDate.w));\n    float angleNoise = ((rand - 0.5) * 0.25);\n    // Get the angle from the average direction vector\n    float angle = atan(avg.y, avg.x);\n    // Add the randomness\n    angle += angleNoise;\n    \n    // Update direction vector\n    vec2 dir = vec2(cos(angle), sin(angle));\n    dir = normalize(dir); // + 0.00001 is not necessary because cos and sin will never generate 0\n    dir = dir * 0.5 + 0.5; // Map back to 0.0-1.0\n    \n    C = vec4(dir, 0.0, 1.0);\n    \n    fragColor = C;\n}",
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
							"wrap": "repeat",
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
				"code": "// Global Variables\nconst float speedBC = 0.0015; // Blood cell speed\nconst float speedChase = 0.002; // White blood cell chase speed\nconst float speedV = 0.001; // Virus speed\nconst float turnSpeed = 0.025; // How fast cells can turn with the flow\nconst float virusSpawn = 0.003; // How rare a virus spawns\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    ivec2 texelCoord = ivec2(fragCoord);\n    float aspect = iResolution.y / iResolution.x;\n    \n    // Allocate parts of the corner of the screen to each type of agent\n    bool isRBC   = texelCoord.x < 10 && texelCoord.y < 10;\n    bool isWBC   = texelCoord.x >= 10 && texelCoord.x < 15 && texelCoord.y < 5;\n    bool isVirus = texelCoord.x >= 15 && texelCoord.x < 18 && texelCoord.y < 3;\n    bool isTrail = texelCoord.x >= 18 && texelCoord.x < 30 && texelCoord.y < 12;\n    bool isAgent = isRBC || isWBC || isVirus || isTrail;\n    \n    // Discard anything not an agent\n    if(!isAgent) {\n        fragColor = vec4(0.0);\n        discard;\n    }\n    \n    // INITIALIZE agents on frame 0\n    if(iFrame == 0) {\n        // Generate random data for agent\n        float randX = random1(vec3(texelCoord.x, 1.0, iDate.w));\n        float randY = random1(vec3(1.0, texelCoord.y, iDate.w));\n        float randAngle = random1(vec3(texelCoord, 1.0)) * 2.0 * PI;\n        \n        float state = 1.0; \n        if(isVirus || isTrail) state = 0.0; // Start dead\n        \n        fragColor = vec4(randX, randY, randAngle, state);\n        return;\n    }\n    \n    // Read data from previous frame\n    vec4 data = texelFetch(iChannel1, texelCoord, 0);\n    vec2 pos = data.xy;\n    float angle = data.z;\n    float state = data.w;\n    \n    // Virus trail logic\n    if(isTrail) {\n        // Determine which virus this trail belongs to\n        int trailID = texelCoord.y * 12 + (texelCoord.x - 18); // 0 to 143\n        int parentId = trailID / 16; // trailID can be from 0 to 143, so parentID is from 0 to 8\n        ivec2 parentPos = ivec2(15 + (parentId % 3), parentId / 3);\n        vec4 parentData = texelFetch(iChannel1, parentPos, 0);\n        \n        // Decay over time\n        if(state > 0.0) state -= 0.002; \n        \n        if(parentData.w <= 0.0) {\n            state = 0.0; // If the parent virus dies, kill the trail\n        } else {\n            // Check if there's a white blood cell in range\n            for (int x = 10; x < 15; x++) {\n                for (int y = 0; y < 5; y++) {\n                    vec4 WBC = texelFetch(iChannel1, ivec2(x,y), 0);\n                    vec2 far = abs(pos - WBC.xy);\n                    far = min(far, 1.0 - far);\n                    if (length(far) < 0.01) state = 0.0;\n                }\n            }\n            \n            // If dead, wait to spawn\n            if (state <= 0.0) {\n                int offset = trailID % 16;\n                // Drop a trail every 45 frames, offset so its one trail agent at a time\n                if (iFrame % (16 * 45) == (offset * 45)) {\n                    pos = parentData.xy;\n                    state = 1.0;\n                }\n            }\n        }\n        fragColor = vec4(pos, angle, state);\n        return;\n    }\n\n    // Other agent logic (red blood cells, white blood cells, viruses\n    // Get the direction of flow from buffer A\n    vec2 flowDir = texture(iChannel0, pos).rg * 2.0 - 1.0;\n    vec2 targetDir = flowDir;\n    \n    // Make new variables from the global variables, as these change depending on state and type of cell\n    float speed = 0.0;\n    float turn = turnSpeed;\n    \n    if(isRBC) { // If it is a red blood cell, no special behaviour.\n        speed = speedBC;\n    } else if(isWBC) { // If it is a white blood cell, write chasing logic and state switching:\n        speed = speedBC;\n        float minDist = 0.1; // How far it can detect viruses from\n        vec2 bestDiff = vec2(0.0); // Store the CLOSEST virus trail in range to prioritize it\n        bool chasing = false;\n        \n        // Look for alive virus trails\n        for(int x = 17; x < 30; x++) {\n            for(int y = 0; y < 12; y++) {\n                vec4 tData = texelFetch(iChannel1, ivec2(x,y), 0);\n                // Check to see if there is an alive virus/trail at this pixel\n                if(tData.w > 0.0) {\n                    // Also look for virus trails that wrap around the screen:\n                    vec2 diff = tData.xy - pos;\n                    diff = mod(diff + 0.5, 1.0) - 0.5; \n                    float dist = length(diff);\n                    // If the virus is within the WBC's hunting range, chase it\n                    if(dist < minDist) {\n                        minDist = dist;\n                        bestDiff = diff;\n                        chasing = true;\n                    }\n                }\n            }\n        }\n        \n        if(chasing) {\n            targetDir = normalize(bestDiff);\n            speed = speedChase;\n            turn = 0.25;\n        }\n    } else if(isVirus) { // If it is a virus cell, write spawning and death logic\n        speed = speedV; \n        if(state <= 0.0) { // If it is dead, chance to spawn\n            speed = 0.0;\n            if(random1(vec3(fragCoord, iTime)) < virusSpawn) { // Rare spawn\n                state = 1.0;\n                pos = random2(vec3(fragCoord, iDate.w));\n            }\n        } else {\n            // Check if caught by WBC\n            for(int x = 10; x < 15; x++) { // Cycle through all WBCs\n                for(int y = 0; y < 5; y++) {\n                    vec4 WBC = texelFetch(iChannel1, ivec2(x,y), 0);\n                    vec2 diff = abs(pos - WBC.xy);\n                    diff = min(diff, 1.0 - diff);\n                    if(length(diff) < 0.015) state = 0.0; // Die when caught\n                }\n            }\n        }\n    }\n    \n    // Apply steering based off gradient map from buffer A\n    vec2 currentDir = vec2(cos(angle), sin(angle));\n    vec2 newDir = normalize(mix(currentDir, targetDir, turn));\n    angle = atan(newDir.y, newDir.x);\n    \n    // Reuse rebel steering from assignment 3\n    float rebelChance = random1(vec3(pos.x, pos.y, iTime));\n    // If the chance succeeds, make the cell take a sharp turn (to break loops)\n    if (rebelChance < 0.2) {\n        angle += (random1(vec3(angle, iTime, iFrame)) * 4.0 - 2.0) * 0.1; \n    }\n    \n    pos.x += newDir.x * speed * aspect;\n    pos.y += newDir.y * speed;\n    pos = fract(pos); \n    \n    fragColor = vec4(pos, angle, state);\n}",
				"name": "Buffer B",
				"description": "",
				"type": "buffer"
			},
			{
				"outputs": [],
				"inputs": [],
				"code": "#define RANDOM_SCALE vec4(.1031, .1030, .0973, .1099)\nconst float PI = 3.1415926535897932384626433; // Mathematical constant PI to the 25th decimal\n\n// Random functions (by me) that return a float, inspired by the random functions from class\nfloat random1(float p) {\n    vec3 p3  = fract(vec3(p) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.x + p3.y) * p3.z);\n}\n\nfloat random1(vec2 p) {\n    vec3 p3  = fract(p.xyx * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.x + p3.y) * p3.z);\n}\n\nfloat random1(vec3 p) {\n    vec3 p3  = fract(p * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.x + p3.y) * p3.z);\n}\n\n// Below are random functions not by me, but from class\n\nvec2 random2(float p) {\n    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec2 random2(vec2 p) {\n    vec3 p3 = fract(p.xyx * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec2 random2(vec3 p3) {\n    p3 = fract(p3 * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec3 random3(float p) {\n    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xxy + p3.yzz) * p3.zyx); \n}\n\nvec3 random3(vec2 p) {\n    vec3 p3 = fract(vec3(p.xyx) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yxz + 19.19);\n    return fract((p3.xxy + p3.yzz) * p3.zyx);\n}\n\nvec3 random3(vec3 p) {\n    p = fract(p * RANDOM_SCALE.xyz);\n    p += dot(p, p.yxz + 19.19);\n    return fract((p.xxy + p.yzz) * p.zyx);\n}\n\nvec4 random4(float p) {\n    vec4 p4 = fract(p * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);   \n}\n\nvec4 random4(vec2 p) {\n    vec4 p4 = fract(p.xyxy * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec3 p) {\n    vec4 p4 = fract(p.xyzx * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec4 p4) {\n    p4 = fract(p4  * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}",
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
			"id": "fcsXRS",
			"date": "1775594267",
			"viewed": 11,
			"name": "Bloodstream",
			"username": "Ian Hayward",
			"description": "Final assignment",
			"likes": 0,
			"published": 2,
			"flags": 32,
			"usePreview": 0,
			"tags": [
				"datt4950",
				"digm5950"
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
				"code": "\n/*\n\nStudent ID: 219581438\nAssignment 3\nJulia Scheerer \n\nSpiral Chasers\n\nDESCRIPTION:\nOverall what A3 does:\n1 spiral of \"sugar\" (orange) that agents are atracted to and eat. orange does not decay but gets eaten\n\n1 spiral of yellow that agents are attracted to and add to. yellow decays on its own\n\nagents that have 2 antenea for sensing sugar and yellow. \n\nsuagr and yellow restart their spirals from the middle\nafter a cerntain amount of time elapses (orange = 50 seconds)\n(yellow starts at 10 seconds and regens at 60 seconds.)\n\n\nTECHNICAL REALIZATONS:\n\nFirst I took the lab 8 code and made the circle of orange sugar into a spiral\n\nI turned the agents into agents with antenea from lab 9 to increase their acuracy.\n\nfrom their I wanted to have the agents perform a different behaviour so i create a second spiral that \nagents would add to instead of subtract from. This yellow spiral that decays relativly fast, so even though \nagents are attracted to it more than the orange that is only the case until yellow decays to less than orange  in the current stop\nat which time the agents are atracted to the orange again. \n\nI ran into a problem where it seemed like agents were \"generating\" their own yellow where the orange spiral was \ninstead of \"taking\" yellow and spreading it past the spiral. This is because there is somehow a low level amount of \nyellow where the orange spiral is and yellow increases through mutliplication so low level amounts of yellow can still grow \nand make an impact on the overall yellow. I managed to combat this by making sure yellow was above a certain threshold\nbefore its allowed to expand. \n\noverall I really like the behaviours you can for the first 2 minutes or so as the agents eat orange ad expand yellow\n\n\ninteraction: when you click yellow forms \n\n\nFUTURE EXTENTIONS:\nI really like the version I created but in the future I could seperate the behaviours of eating orange \nor spreading yellow to 2 seperate agent systems. I could also create a version where proximity or yellow or orange increases\nthe speed where speed is saved in A.w now that A.w doesn't have to hold the previous frame anymore. \n\n*/\n\n\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord ) {\n    vec2 uv = (fragCoord / iResolution.xy);\n   \n    // zoom in\n    if (iMouse.z > 0.0) {\n        float magnification = 6.;\n        uv /= magnification;\n        uv += iMouse.xy / ((iResolution.xy + (iResolution.xy / (magnification - 1.0))));\n    }\n    \n    \n    // get our cell\n    vec4 A = texture(iChannel0, uv);\n    vec4 B = texture(iChannel1, uv);\n    vec4 C = texture(iChannel2, uv);\n    vec4 D = texture(iChannel3, uv);\n    // divide position by resolution to view in 0..1\n    \n    // get distance from this pixel to the particle it is tracking:\n    float d = distance(uv * iResolution.xy, A.xy);\n    //float p = 1/d.;\n    //float p = exp(0.3*-d);\n    float p = smoothstep(2., 0., d);\n    \n    \n    // sugar field:\n  \n    // orange \n    fragColor = vec4(C.x*1.,C.y* 0.5, 0, C.a);\n    // yellow\n    fragColor += vec4(D.x*1.,D.y* 1., 0, D.a);\n    // trails:\n    fragColor += B;\n    // agents:\n    fragColor += vec4(p);\n   \n}",
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
				"code": "\n\n// each pixel tracks an agent\n// .xy is the agent location (in pixels)\n// .z is the agent direction (in radians)\n\n// given current particle \"A\" at pixel `fragCoord`\n// is the particle at `fragCoord+offset` nearer? if so return that.\nvec4 getNearestParticle(vec4 A, vec2 fragCoord, vec2 offset) {\n    // get by neighbour pixel\n    vec4 N = texture(iChannel0, (fragCoord+offset)/iResolution.xy);\n    // distance from my pixel to the particle I'm tracking:\n    float d1 = distance(fragCoord, A.xy);\n    // distance from my pixel to the particle my neighbor is tracking:\n    float d2 = distance(fragCoord, N.xy);\n    // if my neighbor's particle is nearer, track that instead! \n    if (d2 < d1) { return N; } else { return A; }\n}\n\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord) {\n    // convert pixel coordinate to normalize texture coord\n    vec2 uv = fragCoord / iResolution.xy;\n    // our previous state\n    vec4 A = texture(iChannel0, uv);\n    \n    // make sure we are tracking the nearest particle by testing\n    // each of our nearest pixels to see if their particle is nearer\n    for (int x=-2; x<=2; x++) {\n        for (int y=-2; y<=2; y++) {\n            A = getNearestParticle(A, fragCoord, vec2(x, y));\n        }\n    }\n    \n    vec4 noise = random4(vec3(A.xy, iTime));\n    \n    float speed = 50.;\n    float sensor_length = 20.;\n    \n    // set up antenea \n    mat2 rot = rotate2d(A.z);\n    vec2 sensor0 = vec2(1,0) * sensor_length; // sensor straight ahead at the angle your moving \n    vec2 sensor1 = vec2(1,1) * sensor_length; // sensor to the right\n    vec2 sensor2 = vec2(1,-1) * sensor_length; // sensor to the left\n    vec2 sensor0_in_world = rot* sensor0+A.xy;\n    vec2 sensor1_in_world = rot* sensor1+A.xy;\n    vec2 sensor2_in_world = rot* sensor2+A.xy;\n    \n    // get the orange\n    vec4 For = texture (iChannel2, sensor0_in_world/iResolution.xy);\n    vec4 FLor = texture (iChannel2, sensor1_in_world/iResolution.xy);\n    vec4 FRor = texture (iChannel2, sensor2_in_world/iResolution.xy);\n    \n    // get the yellow\n    vec4 Fyellow = texture (iChannel3, sensor0_in_world/iResolution.xy);\n    vec4 FLyellow = texture (iChannel3, sensor1_in_world/iResolution.xy);\n    vec4 FRyellow = texture (iChannel3, sensor2_in_world/iResolution.xy);\n    \n    // follow the orange if its greater in the current dirction than the yellow is in a different direction \n    // yellow is a stronger lure\n    // that being said because yellow is decays fast it is only a stronger force for a short window of time\n    \n    \n    // if front orange is greater than left and front is greater than right \n    if (For.x > FLor.x && For.x > FRor.x) {\n       \n        if((FRyellow.x> FLyellow.x )&& (FRyellow.x>For.x)){ // yellow to the right is stronger than yellow to the left and yellow to the right is stronger than orange to the front \n            A.z += 1.;\n        }else if((FLyellow.x> FRyellow.x )&& (FLyellow.x>For.x)){\n            A.z -= 1.;\n        }\n      \n        // no change to heading\n    } else if (For.x < FLor.x && For.x < FRor.x) { // sugar to right and left are the same \n        // rotate randomly left or right\n        A.z += (noise.z = 0.5);\n    } else if (FLor.x < FRor.x) { // if sugar to the right is stronger than left\n    \n        if( FLyellow.x >FRor.x){ // if yellow to the left is stronger than sugar to the right \n            if(Fyellow.x>FLyellow.x){// if yellow straight ahead is great that yellow to the left\n            // keep going straight\n            }else{\n              A.z-= 1.; // rotate left \n            }\n        }else{ // sugar to the right is stronger than yellow to the left\n         \n            A.z+= 1.;\n           // rotate right\n        }\n     \n    } else if (FRor.x < FLor.x) { // if sugar to the left is stronger than sugar to the right\n    \n        if( FRyellow.x >FLor.x){ // yellow to the right is stronger than sugar to the left\n            if(Fyellow.x>FRyellow.x){// if yellow straight ahead is great that yellow to the right\n                // keep going straight\n            }else{\n                    // rotate right\n                A.z += 1.;\n            }\n        }else{\n                // rotate left\n            A.z -=1.;\n        }\n    }\n    \n    rot = rotate2d(A.z);\n    // move the particle\n    // get the xy velocity from the A.z direction\n    // polar to cartesian\n    vec2 vel =  rot* vec2(speed,0);\n    // integrate velocity to position\n    A.xy += vel * iTimeDelta;\n    \n    // get the bounded position within the screen image\n    vec2 b = clamp(A.xy, vec2(0), iResolution.xy);\n    // compare the bounded and actual positions -- if they are different, reflect their orientations:\n    if (A.x != b.x) { A.z = TWOPI*0.5 - A.z; } // reflect in Y axis\n    if (A.y != b.y) { A.z = TWOPI - A.z; } // reflect in X axis\n    // also, actually clamp the position on screen\n    A.xy = b.xy; \n    \n    // initialize:\n    if (iFrame == 0) {\n        //A.xy = iResolution.xy * noise.xy;\n        // every pixel in a NxN square is tracking the same particle\n        // round the position to the nearest \"N\"\n        float N = 30.;\n        A.xy = round(fragCoord/N) * N;\n        // we have to seed the random generator using the particle's\n        // location, not the pixel location, so that all pixels agree\n        vec4 noise = random4(vec3(A.xy, iFrame));\n        \n        \n        // direction:\n        A.z = noise.z * TWOPI;\n    }\n    \n    fragColor = A;\n}",
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
				"code": "// agent trails \n\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    // convert pixel coordinate to normalize texture coord\n    vec2 uv = fragCoord / iResolution.xy;\n    \n    // our previous state\n    vec4 A = texture(iChannel0, uv); // the particles\n    vec4 B = texture(iChannel1, uv); // the trails\n    \n    \n    // decay:\n    B *= 0.97;\n    \n    // draw the particle\n    // get distance from this pixel to the particle it is tracking:\n    float d = distance(fragCoord, A.xy);\n    //float p = 1/d.;\n    //float p = exp(0.3*-d);\n    float p = smoothstep(1., 0., d);\n    \n    B += vec4(p);\n    \n    fragColor = B;\n}",
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
				"code": "// sugar landscape\n\nmat3 gaussBlur = mat3(\n        1, 2, 1,\n        2, 4, 2,\n        1, 2, 1\n    ) * 1.0/16.0;\n    \n    \n   \n\n/*\nBuffer C generates an orange spiral. Heavily inspired by lab 8 \nthis spiral regernerates every 50 seconds (once it goes beyond my screen)\n*/\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord ) {\n    vec2 uv = (fragCoord / iResolution.xy);\n    \n    vec4 C = texture(iChannel2, uv); // the previous frame\n    \n    // gaussian blurred previous frame:\n    vec4 N = texture(iChannel2, (fragCoord + vec2(0, 1))/iResolution.xy);\n    vec4 S = texture(iChannel2, (fragCoord + vec2(0, -1))/iResolution.xy);\n    vec4 E = texture(iChannel2, (fragCoord + vec2(1, 0))/iResolution.xy);\n    vec4 W = texture(iChannel2, (fragCoord + vec2(-1, 0))/iResolution.xy);\n    vec4 NE = texture(iChannel2, (fragCoord + vec2(1, 1))/iResolution.xy);\n    vec4 SE = texture(iChannel2, (fragCoord + vec2(1, -1))/iResolution.xy);\n    vec4 NW = texture(iChannel2, (fragCoord + vec2(-1, 1))/iResolution.xy);\n    vec4 SW = texture(iChannel2, (fragCoord + vec2(-1, -1))/iResolution.xy);\n    C = ((NE+SE+NW+SW) + 2.*(N+E+S+W) + 4.*C)/16.;\n    \n    vec4 noise = random4(vec3(fragCoord, iTime));\n   \n    // am I being eaten?\n   \n    vec4 A = texture(iChannel0, uv); // the nearest agent\n    float ad = distance(A.xy, fragCoord); // distance to agent\n    if (ad < 1.) { \n        \n        C.xyz *= 0.7;\n    }\n    \n    float a = iTime*3.;\n    \n    \n    // creates a spiral effect that lasts for 49 seconds then resets. \n   \n    if (int(iTime)%50< 49){ \n        a = iTime*3.;\n    }else{\n        C.a =0.;\n    }\n    \n\n    float r = (iResolution.y)/30.+C.a;\n\n    vec2 p = vec2(iResolution.xy/2.);\n    p.x += r * cos(a);\n    p.y += r * sin(a);\n    \n    float d = distance(fragCoord, p);\n    \n    \n    // add a circle to the field:\n    C += vec4(step(d, 10.)); // size of circle \n    C.a +=0.1; \n    // keep it in the range of 0..1:\n    C.xyz = clamp(C.xyz, 0., 1.);\n    fragColor = C;\n    \n    \n}\n",
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
				"code": "// sugar landscape\n\nmat3 gaussBlur = mat3(\n        1, 2, 1,\n        2, 4, 2,\n        1, 2, 1\n    ) * 1.0/16.0;\n    \n    \n   \n\n// buffere D generates the yellow pixles. \n// \nvoid mainImage( out vec4 fragColor, in vec2 fragCoord ) {\n    vec2 uv = (fragCoord / iResolution.xy);\n    \n    vec4 C = texture(iChannel2, uv); // the previous frame\n    \n    // gaussian blurred previous frame:\n    vec4 N = texture(iChannel2, (fragCoord + vec2(0, 1))/iResolution.xy);\n    vec4 S = texture(iChannel2, (fragCoord + vec2(0, -1))/iResolution.xy);\n    vec4 E = texture(iChannel2, (fragCoord + vec2(1, 0))/iResolution.xy);\n    vec4 W = texture(iChannel2, (fragCoord + vec2(-1, 0))/iResolution.xy);\n    vec4 NE = texture(iChannel2, (fragCoord + vec2(1, 1))/iResolution.xy);\n    vec4 SE = texture(iChannel2, (fragCoord + vec2(1, -1))/iResolution.xy);\n    vec4 NW = texture(iChannel2, (fragCoord + vec2(-1, 1))/iResolution.xy);\n    vec4 SW = texture(iChannel2, (fragCoord + vec2(-1, -1))/iResolution.xy);\n    C = ((NE+SE+NW+SW) + 2.*(N+E+S+W) + 4.*C)/16.;\n    \n    vec4 noise = random4(vec3(fragCoord, iTime));\n    C.xyz *=0.997; // 0.992 \n    \n    // am I adding to the yellow?\n   \n    vec4 A = texture(iChannel0, uv); // the nearest agent\n    float ad = distance(A.xy, fragCoord); // distance to agent\n\n\n          // if the current pixel isn't at the edge, \n    if (!(uv.x >= 0.95)&&!(uv.y >= 0.95)){ \n\n        // if the distance between the current pixel and its agent is < 1\n        if (ad < 0.8 && C.x+C.y>0.3) { \n            // there are low level amounts of C.x and C.y in a circular pattern that cause agents to seemingly \n            // \"generate their own yellow in a spiral. avoid this by not increasing the yellow when it is small \n            C.xyz *= 3.;\n        \n        }\n   \n    }\n      \n    float a = iTime*1.;\n  \n    \n    \n    // creates a spiral effect after 9 seconds has passed \n\n    if(iTime>9.){\n    \n        if(int(iTime)%10 > 9){\n            C.a =0.;\n      \n        }else{\n             a = iTime*1.;\n        }\n         //reset the spiral every 60 seconds. \n        if(iTime>59.){\n     \n            if (int(iTime)%60< 59){\n                a = iTime*1.;\n            }else{\n                C.a =0.;\n            }\n    \n        }\n    \n\n        float r = (iResolution.y)/30.+C.a;\n\n        vec2 p = vec2(iResolution.xy/2.);\n        p.x += r * cos(a);\n        p.y += r * sin(a);\n\n        // if the mouse is held, randomize some pixels near the mouse\n        if (iMouse.z > 0.0) {\n            p = iMouse.xy;\n        }\n        float d = distance(fragCoord, p);  // circumference edge \n\n\n        // add a circle to the field:\n        C += vec4(step(d, 10.)); // size of circle, returns 0 if distance > 10, returns 1 if distance < 10\n        C.a +=0.1; // raduis increases by 0.1 every time you hit this pixel causing a spiral\n        // keep it in the range of 0..1:\n        C.xyz = clamp(C.xyz, 0., 1.);\n    }\n    \n    fragColor = C;\n    \n   \n}\n",
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
			"id": "7fBGDm",
			"date": "1774150603",
			"viewed": 15,
			"name": "Spiral Chasers",
			"username": "Julia Scheerer",
			"description": "agents tracking the CA. CA is a spiral. one orange, one yellow. they eat orange and add to yellow.  ",
			"likes": 0,
			"published": 1,
			"flags": 32,
			"usePreview": 0,
			"tags": [
				"datt4950"
			],
			"hasliked": 0,
			"parentid": "sfs3Wl",
			"parentname": "finished lab 8 extended"
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
				"code": "/*\n    Title:         doomsday: life vs. ai-virus\n\n    VISUAL CONCEPT: Living Biology vs Synthetic Invader\n   \n      - White blowout eliminated: all additive layers are strictly\n        budget-capped so total brightness never saturates to white\n      - Heavily infected areas now show CORRUPTED TISSUE: dark necrotic\n        base with glowing virus-colour cracks and pulsing membrane\n        remnants — visually distinct from healthy AND from white\n      - Agent proximity bloom drastically reduced and hard-clamped\n      - Infected cell interiors REPLACE life colour rather than adding\n        on top of it — prevents double-bright accumulation\n      - Dead + infected cells show dark viral residue, not white\n\n    VISUAL LANGUAGE (organic vs synthetic):\n      Life  = soft rounded cells, warm greens/golds, visible nuclei,\n              breathing pulse, dark olive petri-dish background\n      Virus = hard rotating hexagons, cold neon, circuit-trace trails,\n              corrupted cracked necrotic tissue where it has won\n\n    Reads:\n        iChannel0 = Buffer A  (R=energy, G=age_norm, B=infection)\n        iChannel1 = Buffer B  (XY=pos, Z=heading, W=flavour; A=proximity)\n        iChannel2 = Buffer C  (R=trail, G=pressure, B=evo stage)\n*/\n\n\n// COLOUR PALETTE\n\n// virusColor(t): cold neon virus palette across 4 evolution stages.\n//   t=0: orange (Scout), t=0.33: violet (Swarm),\n//   t=0.66: electric blue (Network), t=1.0: crimson (Dominion)\n\n// Right-half mouse: inoculate radius and trail suppression strength\n#define INOCULATE_RADIUS      50.0\n#define INOCULATE_STRENGTH    0.80\n// Cauterize: hold right-click + shift kills cells (scorched earth)\n// Implemented via right half + long hold detection\n\nvec3 virusColor(float t) {\n    vec3 c0 = vec3(1.00, 0.42, 0.00);\n    vec3 c1 = vec3(0.72, 0.08, 0.95);\n    vec3 c2 = vec3(0.00, 0.48, 1.00);\n    vec3 c3 = vec3(0.95, 0.02, 0.10);\n    float s = clamp(t, 0.0, 1.0) * 3.0;\n    if (s < 1.0) return mix(c0, c1, s);\n    if (s < 2.0) return mix(c1, c2, s - 1.0);\n                 return mix(c2, c3, s - 2.0);\n}\n\n// ----------------------------------------------------------------\n// lifeColor(energy, age): warm organic palette.\n//   Young+healthy: lime green | Mature: gold | Old+weak: amber\n// ----------------------------------------------------------------\nvec3 lifeColor(float energy, float age) {\n    vec3 young = vec3(0.18, 0.92, 0.22);\n    vec3 mid   = vec3(0.82, 0.88, 0.10);\n    vec3 old   = vec3(0.90, 0.42, 0.06);\n    if (energy < 0.04) return vec3(0.04, 0.05, 0.03);\n    vec3 b = mix(young, mid, smoothstep(0.0, 0.45, age));\n    b      = mix(b, old,     smoothstep(0.45, 1.0,  age));\n    return b * (0.14 + 0.86 * energy);\n}\n\n\n// VORONOI CELL GEOMETRY\n\n\n// ----------------------------------------------------------------\n// voronoiCells(p, scale): Voronoi returning nearest cell centre,\n//   cell ID, and edge proximity for membrane rendering.\n//   p     : pixel position in pixels\n//   scale : average cell spacing\n//   Returns vec4(centre.xy, cellID, edgeDist)\n// ----------------------------------------------------------------\nvec4 voronoiCells(vec2 p, float scale) {\n    vec2  ip = floor(p / scale);\n    vec2  fp = fract(p / scale);\n    float minD = 9.0, minD2 = 9.0;\n    vec2  minCentre = vec2(0.0);\n    float minID = 0.0;\n    for (int j = -1; j <= 1; j++) {\n        for (int i = -1; i <= 1; i++) {\n            vec2  cell   = ip + vec2(i, j);\n            vec2  jitter = random2(cell) * 0.75 + 0.12;\n            vec2  r      = (vec2(i, j) + jitter) - fp;\n            float d      = dot(r, r);\n            if (d < minD) {\n                minD2     = minD; minD = d;\n                minCentre = (cell + jitter) * scale;\n                minID     = random2(cell + 5.1).x;\n            } else if (d < minD2) { minD2 = d; }\n        }\n    }\n    return vec4(minCentre, minID, sqrt(minD2) - sqrt(minD));\n}\n\n\n// ORGANIC CELL LAYER — healthy, dying, corrupted states\n\n// drawCellLayer(fragCoord, energy, age, infection, evoStage):\n//   Renders the full cell field with three cell states:\n//     HEALTHY  : warm green/gold interior, bright membrane, nucleus\n//     INFECTED : darkened interior, virus-coloured cracked membrane\n//     NECROTIC : dark husk with glowing viral crack pattern, no nucleus\n//   Critically: uses mix() not addition to prevent colour blowout.\n//   Returns: vec3 cell layer colour for this pixel.\n\n// threatDirection: compute the direction AWAY from nearest threat.\n//   Samples agent proximity and infection from 4 directions and\n//   returns a push vector pointing away from the danger.\n//   Used to offset cell centre position for recoil effect.\n//   fragCoord : current pixel position\n//   infection  : this pixel's current infection level\n//   agentProx  : this pixel's agent proximity value\n//   Returns vec2 push direction (unnormalised, magnitude = threat strength)\n// ----------------------------------------------------------------\nvec2 threatDirection(vec2 fragCoord, float infection, float agentProx) {\n    vec2 ts = 1.0 / iResolution.xy;\n    float senseR = 18.0;  // how far each cell looks for threats\n\n    // Sample infection in 4 cardinal directions\n    float iE = texture(iChannel0, (fragCoord + vec2( senseR, 0.0)) / iResolution.xy).b;\n    float iW = texture(iChannel0, (fragCoord + vec2(-senseR, 0.0)) / iResolution.xy).b;\n    float iN = texture(iChannel0, (fragCoord + vec2(0.0,  senseR)) / iResolution.xy).b;\n    float iS = texture(iChannel0, (fragCoord + vec2(0.0, -senseR)) / iResolution.xy).b;\n\n    // Sample agent proximity in 4 directions\n    float aE = texture(iChannel1, (fragCoord + vec2( senseR, 0.0)) / iResolution.xy).a;\n    float aW = texture(iChannel1, (fragCoord + vec2(-senseR, 0.0)) / iResolution.xy).a;\n    float aN = texture(iChannel1, (fragCoord + vec2(0.0,  senseR)) / iResolution.xy).a;\n    float aS = texture(iChannel1, (fragCoord + vec2(0.0, -senseR)) / iResolution.xy).a;\n\n    // Combine infection and agent threat into a single gradient\n    // Agent proximity weighted higher — agents are immediate danger\n    vec2 infGrad  = vec2(iE - iW, iN - iS);\n    vec2 agentGrad = vec2(aE - aW, aN - aS);\n    return infGrad * 1.0 + agentGrad * 2.4;\n}\n\n// ----------------------------------------------------------------\n// healthPull: compute pull direction TOWARD nearest healthy neighbours.\n//   At the infection front, healthy cells stretch toward each other\n//   creating a tension membrane effect — tissue pulling tight.\n//   fragCoord : current pixel position\n//   energy    : this cell's energy\n//   Returns vec2 pull direction toward healthiest neighbour cluster.\n// ----------------------------------------------------------------\nvec2 healthPull(vec2 fragCoord, float energy) {\n    float senseR = 14.0;\n    float eE = texture(iChannel0, (fragCoord + vec2( senseR, 0.0)) / iResolution.xy).r;\n    float eW = texture(iChannel0, (fragCoord + vec2(-senseR, 0.0)) / iResolution.xy).r;\n    float eN = texture(iChannel0, (fragCoord + vec2(0.0,  senseR)) / iResolution.xy).r;\n    float eS = texture(iChannel0, (fragCoord + vec2(0.0, -senseR)) / iResolution.xy).r;\n    // Pull toward higher energy neighbours\n    return vec2(eE - eW, eN - eS);\n}\n\n// ----------------------------------------------------------------\n// drawCellLayer: renders the full cell field with movement.\n//   Now includes:\n//     - Cell recoil: Voronoi centre shifts away from threat\n//     - Shape elongation: cells stretch toward healthy neighbours\n//       at the infection front (tension membrane)\n//     - Pulse amplitude tied to energy level\n//   energy    : cell energy [0,1]\n//   age       : normalised cell age [0,1]\n//   infection : cell infection [0,1]\n//   evoStage  : global virus evolution stage [0,1]\n//   Returns: vec3 cell layer colour.\n// ----------------------------------------------------------------\nvec3 drawCellLayer(vec2 fragCoord, float energy, float age,\n                   float infection, float evoStage) {\n\n    vec3 vCol = virusColor(evoStage);\n    vec3 lCol = lifeColor(energy, age);\n\n    // --- Compute threat and health vectors for this pixel ---\n    vec2 threat = threatDirection(fragCoord, infection, texture(iChannel1, fragCoord / iResolution.xy).a);\n    vec2 pull   = healthPull(fragCoord, energy);\n\n    float threatLen = length(threat);\n    float pullLen   = length(pull);\n\n    // --- Recoil: shift the sample point away from threat ---\n    // Healthy cells near a threat appear to physically recoil.\n    // We offset the Voronoi sample coordinate so the cell centre\n    // appears displaced — the cell has moved away from danger.\n    float recoilStrength = smoothstep(0.0, 0.6, threatLen)\n                         * (1.0 - infection)   // infected cells can't flee\n                         * energy              // weak cells can't flee either\n                         * 5.5;               // max pixel displacement\n    vec2 recoilOffset = vec2(0.0);\n    if (threatLen > 0.001) {\n        // Push AWAY from threat gradient\n        recoilOffset = -normalize(threat) * recoilStrength;\n    }\n\n    // Recoil oscillates — cells quiver against the pressure\n    // rather than smoothly drifting, giving organic feel\n    float quiver = sin(iTime * 8.5 + fragCoord.x * 0.07 + fragCoord.y * 0.05) * 0.35;\n    recoilOffset *= (1.0 + quiver);\n\n    // Apply recoil to the coordinate used for Voronoi lookup\n    vec2 sampleCoord = fragCoord + recoilOffset;\n\n    // --- Voronoi cell geometry at displaced coordinate ---\n    vec4  vor    = voronoiCells(sampleCoord, 28.0);\n    vec2  centre = vor.xy;\n    float cellID = vor.z;\n    float edgeD  = vor.w;\n\n    // --- Elongation: stretch cell shape toward healthy neighbours ---\n    // At the infection front, cells elongate toward each other,\n    // creating a visible tension membrane — tissue under stress.\n    // We apply an anisotropic scale to the SDF computation.\n    vec2 d = fragCoord - centre;\n\n    // Elongation only at the infection boundary where pull is strong\n    float frontStrength = smoothstep(0.2, 0.7, infection)\n                        * smoothstep(0.0, 0.4, pullLen)\n                        * (1.0 - infection); // disappears when fully infected\n    vec2 elongAxis = vec2(0.0);\n    if (pullLen > 0.001) {\n        elongAxis = normalize(pull);\n    }\n    // Project displacement onto healthy-pull axis for anisotropic stretch\n    float alongPull   = dot(d, elongAxis);\n    float acrossPull  = dot(d, vec2(-elongAxis.y, elongAxis.x));\n    // Compress perpendicular, stretch along pull — classic tension deformation\n    float elongScale  = 1.0 + frontStrength * 0.38;\n    float compScale   = 1.0 - frontStrength * 0.20;\n    // Reconstruct deformed displacement\n    d = elongAxis * alongPull * compScale\n      + vec2(-elongAxis.y, elongAxis.x) * acrossPull * elongScale;\n\n    // Per-cell radius — organic size variation\n    float radius  = mix(9.0, 13.5, cellID);\n    // Slight squish for organic feel, now with elongation baked in\n    d.y *= 1.06;\n    float sdf = length(d) - radius;\n\n    // Per-cell breathing — amplitude boosted when healthy, dampened when threatened\n    float breatheAmp = mix(0.07, 0.14, energy * (1.0 - infection * 0.8));\n    float breathe    = 0.5 + breatheAmp * sin(iTime * 1.4 + cellID * TWOPI * 3.7);\n\n    // ---- NECROTIC STATE (dead + infected) ----\n    if (energy < 0.04) {\n        if (infection < 0.05) return vec3(0.0);\n        float necroFill  = smoothstep(2.0, -2.0, sdf) * 0.35;\n        vec3  necroBase  = vCol * 0.15 * infection * necroFill;\n        float crackRim   = smoothstep(2.5, 0.3, sdf) * (1.0 - smoothstep(0.3, -1.5, sdf));\n        float crackPulse = 0.4 + 0.3 * sin(iTime * 2.5 + cellID * 8.3);\n        vec3  crackCol   = vCol * crackRim * infection * crackPulse * 0.70;\n        vec4  fissureVor = voronoiCells(fragCoord * 1.8 + 17.3, 18.0);\n        float fissure    = smoothstep(0.30, 0.55, fissureVor.w)\n                         * (1.0 - smoothstep(0.55, 0.80, fissureVor.w));\n        vec3  fissureCol = vCol * fissure * infection * 0.45;\n        return clamp(necroBase + crackCol + fissureCol, 0.0, 0.6);\n    }\n\n    // ---- LIVING STATE (healthy or infected) ----\n\n    float interior   = smoothstep(1.5, -2.0, sdf);\n    vec3  healthyInt = lCol * (0.26 + 0.10 * cellID + breatheAmp * breathe);\n    vec3  infectedInt = mix(lCol * 0.12, vCol * 0.30,\n                            smoothstep(0.2, 0.9, infection));\n    vec3  cellInt    = mix(healthyInt, infectedInt,\n                           smoothstep(0.15, 0.80, infection));\n\n    float groove = smoothstep(0.32, 0.52, edgeD)\n                 * (1.0 - smoothstep(0.52, 0.75, edgeD));\n    vec3  out_   = cellInt * interior * (1.0 - groove * 0.55);\n\n    // Membrane — pulses more visibly when fleeing\n    float membrane = smoothstep(2.5, 0.2, sdf)\n                   * (1.0 - smoothstep(0.2, -1.8, sdf));\n    vec3  healthMem = mix(lCol * 1.6, vec3(0.85, 1.0, 0.70), 0.20);\n    vec3  infMem    = vCol * (0.90 + 0.35 * sin(iTime * 3.0 + cellID * 5.0));\n    vec3  memCol    = mix(healthMem, infMem, smoothstep(0.20, 0.85, infection));\n    out_ += memCol * membrane * (0.80 + 0.20 * breathe);\n\n    // Tension membrane highlight — glows brighter when cell is stretching\n    // toward healthy neighbours, makes the front line visually pop\n    float tensionGlow = frontStrength * smoothstep(1.8, 0.4, sdf)\n                      * (1.0 - smoothstep(0.4, -0.8, sdf));\n    out_ += lCol * tensionGlow * 0.55;\n\n    // Rim highlight — fades with infection\n    float rim = smoothstep(1.8, 0.6, sdf) * (1.0 - smoothstep(0.6, -0.5, sdf));\n    out_ += vec3(1.0) * rim * (1.0 - infection) * 0.22;\n\n    // Nucleus — disappears as cell flees (displaced by recoil)\n    float nucleusR   = length(fragCoord - centre) - radius * 0.28;\n    float nucleus    = smoothstep(1.0, -1.0, nucleusR);\n    float nucRim     = smoothstep(1.5, 0.2, nucleusR)\n                     * (1.0 - smoothstep(0.2, -0.8, nucleusR));\n    float nucleusVis = 1.0 - smoothstep(0.3, 0.85, infection);\n    out_ += lCol * 0.10 * nucleus * nucleusVis;\n    out_ += lCol * 0.55 * nucRim  * nucleusVis;\n\n    // Outer glow — healthy cells only, dims when fleeing\n    float outerGlow = exp(-max(sdf, 0.0) * 0.18) * 0.07\n                    * (1.0 - infection) * breathe;\n    out_ += lCol * outerGlow;\n\n    return clamp(out_, 0.0, 0.85);\n}\n\n\n// VIRUS AGENT SHAPE — rotating hexagon (angular, synthetic)\n\n// hexSDF(p, size): regular hexagon signed distance function.\n//   p    : position relative to hexagon centre\n//   size : circumradius in pixels\n// ----------------------------------------------------------------\nfloat hexSDF(vec2 p, float size) {\n    vec2 q = abs(p);\n    return max(q.x * 0.866025 + q.y * 0.5, q.y) - size;\n}\n\n\n// drawVirusAgent(delta, evoStage, vCol): angular rotating hexagon.\n//   delta    : pixel offset from agent centre\n//   evoStage : controls size, spin speed, inner detail\n//   vCol     : current virus colour\n//   Returns: vec3 capped at 0.9 to prevent blowout.\n// ----------------------------------------------------------------\nvec3 drawVirusAgent(vec2 delta, float evoStage, vec3 vCol) {\n    vec3 out_ = vec3(0.0);\n\n    // Rotation: slow at Stage 0, faster and more aggressive at Stage 3\n    float spinSpeed = mix(0.3, 1.4, evoStage);\n    float rot = 0.5236 + iTime * spinSpeed;\n    float c = cos(rot), s = sin(rot);\n    vec2  p = vec2(c*delta.x - s*delta.y, s*delta.x + c*delta.y);\n\n    float hexSize = mix(5.5, 9.5, evoStage);\n    float sdf     = hexSDF(p, hexSize);\n\n    // Outer glow: hard exponential falloff (not the wide soft bloom)\n    float halo    = exp(-max(sdf, 0.0) * 0.35) * 0.40;\n    // Body: slightly transparent so underlying cell is faintly visible\n    float body    = smoothstep(1.0, -1.0, sdf);\n    // Bright hard outline — the synthetic \"shell\"\n    float outline = smoothstep(1.8, 0.5, sdf)\n                  * (1.0 - smoothstep(0.5, -0.8, sdf));\n\n    out_ += vCol * halo    * 0.55;\n    out_ += vCol * body    * 0.28;\n    out_ += vCol * outline * 1.30;\n    out_ += vec3(1.0) * outline * 0.30;\n\n    // Inner concentric hex at Stage 2+\n    if (evoStage > 0.45) {\n        float t2      = smoothstep(0.45, 0.72, evoStage);\n        float innerSDF = hexSDF(p, hexSize * 0.46);\n        float innerRim = smoothstep(1.2, 0.2, innerSDF)\n                       * (1.0 - smoothstep(0.2, -0.8, innerSDF));\n        out_ += vCol * innerRim * 0.70 * t2;\n    }\n\n    // Targeting crosshair at Stage 3\n    if (evoStage > 0.75) {\n        float t3   = smoothstep(0.75, 1.0, evoStage);\n        float crossH = smoothstep(0.7, 0.0, abs(p.y))\n                     * smoothstep(hexSize * 0.9, 0.5, abs(p.x));\n        float crossV = smoothstep(0.7, 0.0, abs(p.x))\n                     * smoothstep(hexSize * 0.9, 0.5, abs(p.y));\n        out_ += vCol * (crossH + crossV) * 0.40 * t3;\n    }\n\n    // Hard cap — agent shape alone should not cause blowout\n    return clamp(out_, 0.0, 0.90);\n}\n\n\n// SOBEL EDGE on infection field\n\nfloat sobelInfection(vec2 uv, vec2 ts) {\n    float tl=texture(iChannel0,uv+vec2(-ts.x, ts.y)).b;\n    float tc=texture(iChannel0,uv+vec2( 0.0,  ts.y)).b;\n    float tr=texture(iChannel0,uv+vec2( ts.x, ts.y)).b;\n    float ml=texture(iChannel0,uv+vec2(-ts.x, 0.0 )).b;\n    float mr=texture(iChannel0,uv+vec2( ts.x, 0.0 )).b;\n    float bl=texture(iChannel0,uv+vec2(-ts.x,-ts.y)).b;\n    float bc=texture(iChannel0,uv+vec2( 0.0, -ts.y)).b;\n    float br=texture(iChannel0,uv+vec2( ts.x,-ts.y)).b;\n    float gx=-tl-2.0*ml-bl+tr+2.0*mr+br;\n    float gy=-tl-2.0*tc-tr+bl+2.0*bc+br;\n    return clamp(sqrt(gx*gx+gy*gy)*4.0, 0.0, 1.0);\n}\n\n\n// MAIN COMPOSITOR\n\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv        = fragCoord / iResolution.xy;\n    vec2 texelSize = 1.0 / iResolution.xy;\n\n    vec4  caState  = texture(iChannel0, uv);\n    vec4  agState  = texture(iChannel1, uv);\n    vec4  evoState = texture(iChannel2, uv);\n\n    float energy    = caState.r;\n    float age       = caState.g;\n    float infection = caState.b;\n    float agentProx = texture(iChannel1, uv).a;\n    float trail     = evoState.r;\n    float evoStage  = texture(iChannel2, vec2(0.5)).b;\n\n    vec3 vCol = virusColor(evoStage);\n\n    // ============================================================\n    // LAYER 1: Petri dish background\n    // ============================================================\n    vec3 dishDark = vec3(0.020, 0.048, 0.018);\n    vec3 dishMid  = vec3(0.038, 0.082, 0.030);\n    float dishR   = length(uv - 0.5);\n    vec3 col      = mix(dishMid, dishDark, smoothstep(0.12, 0.72, dishR));\n    // Faint scan lines — microscope CCD look\n    col          *= 0.965 + 0.035 * (0.5 + 0.5 * sin(fragCoord.y * 3.14159));\n\n    // ============================================================\n    // LAYER 2: Cell field (healthy / infected / necrotic)\n    // ============================================================\n    // Uses mix() internally — won't blowout\n    vec3 cellCol = drawCellLayer(fragCoord, energy, age, infection, evoStage);\n    col = mix(col, col + cellCol, 0.95);   // blend onto background\n\n    // ============================================================\n    // LAYER 3: Chemoattractant circuit traces (Stage 2+)\n    // ============================================================\n    if (trail > 0.06 && evoStage > 0.42) {\n        float vis    = smoothstep(0.42, 0.65, evoStage);\n        float ridge  = pow(1.0 - abs(1.0 - clamp(trail * 2.0, 0.0, 2.0)), 2.8);\n        // Use mix to add trace colour without blowing out the background\n        col = mix(col, col + vCol * ridge * 0.55, vis);\n        col = mix(col, col + vec3(1.0) * ridge * ridge * 0.20, vis);\n    }\n\n    // ============================================================\n    // LAYER 4: Invasion front — hard glowing boundary\n    // ============================================================\n    float edge = sobelInfection(uv, texelSize);\n    if (edge > 0.04) {\n        float pulse    = 0.58 + 0.42 * sin(iTime * 5.2\n                       + fragCoord.x * 0.038 + fragCoord.y * 0.026);\n        float hardLine = smoothstep(0.07, 0.46, edge);\n        float softGlow = smoothstep(0.04, 0.18, edge)\n                       * (1.0 - smoothstep(0.18, 0.48, edge));\n        float whiteCap = smoothstep(0.44, 0.68, edge);\n\n        // Mix-based blending prevents the edge from going white\n        col = mix(col, vCol * pulse, hardLine * 0.75);\n        col += vCol * softGlow * 0.30;\n        col += vec3(1.0) * whiteCap * 0.22;  // small white highlight only\n    }\n\n    \n    // LAYER 5: Agent proximity bloom — STRICTLY CAPPED\n    \n    // Was causing blowout — now uses a hard cap and mix()\n    if (agentProx > 0.01) {\n        // Soft outer bloom: very limited brightness\n        float softBloom = pow(agentProx, 1.80) * 0.55;\n        col = mix(col, col + vCol * softBloom, 0.70);\n        // Tight core: only at very high proximity (agent almost on pixel)\n        float coreBloom = pow(agentProx, 5.0) * 0.85;\n        col = mix(col, vec3(1.0) * 0.80 + vCol * 0.20, coreBloom * 0.6);\n    }\n\n   \n    // LAYER 6: Virus agent hexagons\n    \n    bool agentValid = (agState.x >= 0.0 && agState.x < iResolution.x &&\n                       agState.y >= 0.0 && agState.y < iResolution.y);\n    if (agentValid) {\n        vec2  delta  = fragCoord - agState.xy;\n        float dist   = length(delta);\n        float rRad   = mix(20.0, 30.0, evoStage);\n        if (dist < rRad) {\n            float fade    = smoothstep(rRad, rRad * 0.5, dist);\n            vec3  agentC  = drawVirusAgent(delta, evoStage, vCol);\n            // Mix onto scene: agent colour replaces rather than adds\n            col = mix(col, agentC + col * 0.25, fade * 0.90);\n        }\n    }\n   \n    // LAYER 6b: Player right-half mouse — inoculate visualisation\n   \n    // Right half of screen: mouse deposits anti-viral field (Buffer C trail suppression\n    // is handled in Buffer C; here we just show the player's action visually)\n    if (iMouse.z > 0.0) {\n        float mouseXNorm = iMouse.x / iResolution.x;\n        if (mouseXNorm >= 0.5) {\n            float dist         = distance(fragCoord, iMouse.xy);\n            float brushStrength = smoothstep(INOCULATE_RADIUS, INOCULATE_RADIUS * 0.2, dist);\n            if (brushStrength > 0.0) {\n                // Visual: cold blue-white pulse showing inoculation zone\n                // Mix rather than add — won't blowout existing colour\n                vec3 inoculateCol = vec3(0.30, 0.72, 1.00);\n                float pulse       = 0.6 + 0.4 * sin(iTime * 6.0);\n                col = mix(col, inoculateCol * pulse, brushStrength * 0.55);\n                // Thin bright ring at brush edge — shows active radius\n                float ring = smoothstep(4.0, 0.0, abs(dist - INOCULATE_RADIUS));\n                col += inoculateCol * ring * 0.60;\n            }\n        }\n    }\n\n  \n    // LAYER 7: HUD — dual evolution bars (virus + life)\n    \n    float lifeStageHUD = texture(iChannel2, vec2(0.5)).a;  // life stage from Buffer C .a\n\n    // VIRUS bar (existing, now repositioned slightly)\n    vec2  hudOV = vec2(14.0, iResolution.y - 22.0);\n    float hudW  = 116.0, hudH = 7.0;\n    vec2  hcV   = fragCoord - hudOV;\n    if (hcV.x >= -1.0 && hcV.x <= hudW+1.0 &&\n        hcV.y >= -1.0 && hcV.y <= hudH+1.0) {\n        float barT  = clamp(hcV.x / hudW, 0.0, 1.0);\n        bool  inBar = hcV.x >= 0.0 && hcV.x <= hudW && hcV.y >= 0.0 && hcV.y <= hudH;\n        if (inBar) {\n            float filled = step(barT, evoStage);\n            vec3  barCol = mix(vec3(0.07), virusColor(barT)*0.88, filled);\n            float t1 = smoothstep(0.013,0.0,abs(barT-0.333));\n            float t2 = smoothstep(0.013,0.0,abs(barT-0.666));\n            barCol  += vec3(0.65) * (t1+t2);\n            barCol  += vec3(1.0) * smoothstep(0.017,0.0,abs(barT-evoStage));\n            col = barCol;\n        } else { col = vec3(0.16); }\n    }\n\n    // LIFE IMMUNE bar — warm green, below the virus bar\n    vec2  hudOL = vec2(14.0, iResolution.y - 36.0);\n    vec2  hcL   = fragCoord - hudOL;\n    if (hcL.x >= -1.0 && hcL.x <= hudW+1.0 &&\n        hcL.y >= -1.0 && hcL.y <= hudH+1.0) {\n        float barT  = clamp(hcL.x / hudW, 0.0, 1.0);\n        bool  inBar = hcL.x >= 0.0 && hcL.x <= hudW && hcL.y >= 0.0 && hcL.y <= hudH;\n        if (inBar) {\n            // Life bar only fills to 0.66 max — life never fully dominates\n            float filled = step(barT, lifeStageHUD);\n            // Green → gold palette for life's immune stages\n            vec3 lifeBarCol = mix(vec3(0.07),\n                mix(vec3(0.18, 0.82, 0.22), vec3(0.82, 0.88, 0.10),\n                    smoothstep(0.0, 0.66, barT)) * 0.85,\n                filled);\n            // Stage dividers at 0.33 and 0.66 only (no 1.0 — life maxes at stage 2)\n            float l1 = smoothstep(0.013,0.0,abs(barT-0.333));\n            float l2 = smoothstep(0.013,0.0,abs(barT-0.50));\n            lifeBarCol += vec3(0.65) * (l1+l2);\n            col = lifeBarCol;\n        } else { col = vec3(0.12); }\n    }\n\n   \n    // POST-PROCESSING — tone map THEN clamp, never let it reach 1\n    // ============================================================\n\n    // Pre-clamp: hard cap before tone mapping so nothing is extreme\n    col = clamp(col, 0.0, 1.8);\n\n    // Reinhard tone mapping — compresses the 0-1.8 range cleanly\n    col = col / (col + 0.70);\n    col = clamp(col, 0.0, 1.0);\n\n    // Vignette\n    col *= 1.0 - smoothstep(0.35, 0.80, length(uv - 0.5)) * 0.80;\n\n    // Subtle grain — adds organic texture\n    col = clamp(col + (random4(vec3(fragCoord, iTime)).x * 0.028 - 0.014),\n                0.0, 1.0);\n\n    // Gamma\n    col = pow(col, vec3(0.4545));\n\n    fragColor = vec4(col, 1.0);\n}\n",
				"name": "Image",
				"description": "",
				"type": "image"
			},
			{
				"outputs": [],
				"inputs": [],
				"code": "\n\n/// Common Tab\n\nconst float TWOPI = 6.283185307179586;\n\n// Pure math helpers from aether a2 project — \n\nfloat sigmoid(float x, float center, float width) {\n    return 1.0 / (1.0 + exp(-(x - center) * 4.0 / width));\n}\n\n// Random scale constants split by dimension to avoid type mismatch\nconst vec3 RANDOM_SCALE3 = vec3(0.1031, 0.1030, 0.0973);\nconst vec4 RANDOM_SCALE4 = vec4(0.1031, 0.1030, 0.0973, 0.1099);\n#define RANDOM_SCALE vec4(.1031, .1030, .0973, .1099)\n\nvec2 random2(float p) {\n    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec2 random2(vec2 p) {\n    vec3 p3 = fract(p.xyx * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec2 random2(vec3 p3) {\n    p3 = fract(p3 * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec3 random3(float p) {\n    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xxy + p3.yzz) * p3.zyx); \n}\n\nvec3 random3(vec2 p) {\n    vec3 p3 = fract(vec3(p.xyx) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yxz + 19.19);\n    return fract((p3.xxy + p3.yzz) * p3.zyx);\n}\n\nvec3 random3(vec3 p) {\n    p = fract(p * RANDOM_SCALE.xyz);\n    p += dot(p, p.yxz + 19.19);\n    return fract((p.xxy + p.yzz) * p.zyx);\n}\n\nvec4 random4(float p) {\n    vec4 p4 = fract(p * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);   \n}\n\nvec4 random4(vec2 p) {\n    vec4 p4 = fract(p.xyxy * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec3 p) {\n    vec4 p4 = fract(p.xyzx * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec4 p4) {\n    p4 = fract(p4  * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}",
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
				"code": "/*\n    Student Number: 219284140\n    Final project:   \n    Name:           Katelyn Yew\n    Title:           Doomsday: life vs. ai-virus\n\n    INTERACTIONS:\n    \n    - Click and drag the LEFT side of the screen (left half) to paint\n      healing energy into life cells — restoring their energy, clearing\n      infection, and resetting age. Use this to fight back the virus.\n    - The simulation runs autonomously otherwise. Reset several times\n      to see different outbreak locations and evolutionary paths.\n\n    INTERESTING PARAMETERS TO MODIFY:\n    - INFECTION_SPREAD_RATE (BufferA): base CA neighbour spread rate\n    - AGENT_INFECT_STRENGTH (BufferA): how hard each virus agent hits a cell\n    - EVOLUTION_PRESSURE_RATE (BufferC): how fast virus feels pressure to evolve\n    - VIRUS_SPEED (BufferB): base movement speed of virus agents\n    - TRAIL_DECAY (BufferC): how long virus chemoattractant trails persist\n\n\n\n    DESCRIPTION:\n    \n    Doomsday is a biological-conceptual simulation of Life versus an\n    evolving AI Virus. Life begins dominant with a dense field of glowing\n    yellow-green cells covering the screen. A single virus outbreak\n    seeds itself randomly and begins spreading and outdones the lives.\n \n    The virus is not static. It has four evolutionary stages that\n    activate both automatically over time AND reactively when the\n    virus is losing (life is recovering faster(become greener) than virus spreads).\n\n    STAGE 0 —  orange: few agents, random drift, weak infection\n    \n    STAGE 1 — amber to blue: boids flocking, stronger spread\n    \n    STAGE 2 —  blue to purple: Physarum/slime-mold trail following,\n              agents build persistent chemoattractant networks that\n              efficiently route infection through the life field\n              \n    STAGE 3 — purple to red: maximum infection power, reaction-\n              diffusion gradient climbing, agents seek healthiest cells\n              to maximally damage life's strongest zones\n\n    The CA layer (this buffer) runs A2 leaf-disease mechanics:\n    energy/age/infection with forest-fire probability spread. The key\n    advance beyond A2 is that the VIRUS AGENTS (Buffer B) physically\n    move through the CA field and inject infection directly, creating\n    a two-way coupling: CA spread sustains between-agent gaps while\n    agents pierce deep into healthy territory the CA alone cannot reach.\n\n\n\n\n    SOURCES:\n    \n    \n    - A2: Leaf chlorophyll CA (previous work)\n      https://www.shadertoy.com/view/wXVcRy\n      \n    - A3: AETHER multi-agent Voronoi system ( prior work)\n    \n    - Forest fire probability spread: course lab examples\n    \n    - Physarum/slime mold trail following concept: Jones (2010),\n      \"Characteristics of pattern formation and evolution in\n      approximations of physarum transport networks\"\n      \n    - Claude AI (Anthropic): multiple agent system implementation and debugging\n\n    TECHNICAL REALIZATION:\n    \n    Buffer A is the CA simulation layer. It reads Buffer B (agent\n    positions via trail map in .b channel) to apply direct agent\n    infection at each pixel. The CA then runs standard A2 mechanics:\n    energy decay with age penalty, neighbour energy sharing, and\n    forest-fire probability infection spread from infected neighbours.\n    Evolution stage is read from Buffer C .b channel to scale\n    how aggressively agents and spread behave.\n\n    FUTURE EXTENSIONS:\n \n    - Multiple virus strains competing with each other\n    - Life counter-evolution: healthy zones slowly develop shields\n*/\n\n// CA CONSTANTS (modified from A2) \n\n#define MAX_AGE                 2000.0\n#define ENERGY_DECAY_RATE       0.003\n#define AGE_PENALTY             2.5\n#define NEIGHBOUR_INFLUENCE     0.025\n#define DEATH_THRESHOLD         0.015\n#define SPONTANEOUS_ENERGY      0.004  \n// chance a cell spontaneously gains energy\n\n//-- Disease constants --\n// Base probability of infection spreading from an infected neighbour\n#define INFECTION_SPREAD_RATE   0.55\n// Age multiplier — older cells are more vulnerable (same as A2)\n#define AGE_VULNERABILITY       1.4\n// Energy threshold for immunity — high-energy cells resist\n#define IMMUNITY_ENERGY         0.70\n// How fast cells naturally recover from infection\n#define INFECTION_RECOVERY      0.007\n// Energy drain per frame while infected\n#define INFECTION_ENERGY_DRAIN  0.004\n// Spontaneous infection chance (very rare — seeds micro-outbreaks)\n#define SPONTANEOUS_INFECTION   0.00008\n\n// --- Agent interaction constants ---\n// How strongly a virus agent's proximity injects infection into a cell\n// This is the key new mechanic beyond A2: agents physically pierce cells\n#define AGENT_INFECT_STRENGTH   0.28\n// Radius (in pixels) within which an agent infects a cell\n#define AGENT_INFECT_RADIUS     6.0\n// How strongly agents drain energy from cells they occupy\n#define AGENT_DRAIN_STRENGTH    0.018\n\n// --- Mouse healing brush ---\n#define BRUSH_SIZE              60.0\n\n// ==== TERRAIN CONSTANTS =\n// How much stronghold terrain boosts neighbour energy sharing\n#define TERRAIN_ENERGY_BOOST    0.55\n\n// How much corridor terrain reduces starting energy (pre-weakened)\n#define TERRAIN_CORRIDOR_DRAIN  0.40\n\n\n// How much wall terrain boosts local immunity\n#define TERRAIN_WALL_IMMUNITY   0.60\n\n// Life immune resistance gained after surviving infection (A channel)\n#define IMMUNE_MEMORY_GAIN      0.18\n\n// How fast immune memory decays each frame\n#define IMMUNE_MEMORY_DECAY     0.00008\n\n// Energy threshold below which a cell cannot gain immune memory\n#define IMMUNE_MEMORY_MIN_E     0.35\n\n\n\n\n\n// = MAIN SIMULATION =\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv        = fragCoord / iResolution.xy;\n    vec2 texelSize = 1.0 / iResolution.xy;\n\n    // --- Read current cell state (R=energy, G=age normalised, B=infection) ---\n    vec4  C         = texture(iChannel0, uv);\n    float energy    = C.r;\n    float age       = C.g * MAX_AGE;\n    float infection = C.b;\n\n// - Read terrain from Buffer D -\n    // iChannel3 = Buffer D terrain map (set this in Shadertoy UI)\n    vec4  terrain     = texture(iChannel3, uv);\n    float tStronghold = terrain.r;   // life's fortress zones\n    float tCorridor   = terrain.g;   // pre-weakened fault lines\n    float tWall       = terrain.b;   // membrane chokepoints\n\n    // --- Read immune memory from our own .a channel ---\n    // Cells that survived past infection carry a resistance flag\n    float immuneMemory = C.a;\n    // --- Sample 8 neighbours for CA rules ---\n    vec4 nE  = texture(iChannel0, uv + vec2( texelSize.x, 0));\n    vec4 nW  = texture(iChannel0, uv + vec2(-texelSize.x, 0));\n    vec4 nN  = texture(iChannel0, uv + vec2(0,  texelSize.y));\n    vec4 nS  = texture(iChannel0, uv + vec2(0, -texelSize.y));\n    vec4 nNE = texture(iChannel0, uv + vec2( texelSize.x,  texelSize.y));\n    vec4 nNW = texture(iChannel0, uv + vec2(-texelSize.x,  texelSize.y));\n    vec4 nSE = texture(iChannel0, uv + vec2( texelSize.x, -texelSize.y));\n    vec4 nSW = texture(iChannel0, uv + vec2(-texelSize.x, -texelSize.y));\n\n    // Average neighbour energy for sharing mechanic\n    float neighbourEnergy = (nE.r + nW.r + nN.r + nS.r +\n                             nNE.r + nNW.r + nSE.r + nSW.r) / 8.0;\n\n    // Count living neighbours (used for rebirth rule)\n    float aliveNeighbours =\n        step(DEATH_THRESHOLD, nE.r)  + step(DEATH_THRESHOLD, nW.r) +\n        step(DEATH_THRESHOLD, nN.r)  + step(DEATH_THRESHOLD, nS.r) +\n        step(DEATH_THRESHOLD, nNE.r) + step(DEATH_THRESHOLD, nNW.r) +\n        step(DEATH_THRESHOLD, nSE.r) + step(DEATH_THRESHOLD, nSW.r);\n\n    // Count infected neighbours — for forest-fire spread\n    float infectedNeighbours =\n        step(0.1, nE.b)  + step(0.1, nW.b) +\n        step(0.1, nN.b)  + step(0.1, nS.b) +\n        step(0.1, nNE.b) + step(0.1, nNW.b) +\n        step(0.1, nSE.b) + step(0.1, nSW.b);\n\n    float infectionDensity = infectedNeighbours / 8.0;\n\n    // Per-pixel noise seeded by position + time (from A2 pattern)\n    vec4 noise = random4(vec3(fragCoord, iTime));\n\n    // --- Read virus evolution stage from Buffer C ---\n    // Buffer C .b channel encodes normalised evolution stage [0,1]\n    // Stage 0=0.0, Stage 1=0.33, Stage 2=0.66, Stage 3=1.0\n    float evoStage = texture(iChannel2, uv).b;\n\n    // Evolution amplifies infection spread — late-stage virus is\n    // significantly more aggressive at the CA neighbour level\n    float evoSpreadMul = 1.0 + evoStage * 2.2;\n\n    // === ENERGY & AGE UPDATE =\n\n    age += 1.0;\n\n    // Age and energy factors scale decay rate — older/weaker cells die faster\n    float ageFactor   = 1.0 + (age / MAX_AGE) * AGE_PENALTY;\n    float energyFactor = 1.0 + (1.0 - energy) * 0.5;\n    float decay        = ENERGY_DECAY_RATE * ageFactor * energyFactor;\n    energy -= decay;\n\n   // Alive cells gain energy from healthy neighbours —\n    // stronghold terrain amplifies this sharing (denser tissue)\n    if (aliveNeighbours > 0.0) {\n        float terrainBoost = 1.0 + tStronghold * TERRAIN_ENERGY_BOOST;\n        float gain = neighbourEnergy * NEIGHBOUR_INFLUENCE\n                   * (aliveNeighbours / 8.0) * terrainBoost;\n        energy += gain;\n    }\n    // Death by old age or energy exhaustion\n    if (energy < DEATH_THRESHOLD || age > MAX_AGE) {\n        energy = 0.0;\n        age    = 0.0;\n    }\n\n    // Rebirth: dead cell surrounded by enough healthy neighbours\n    // (same rule as A2 — Life of Life style resurrection)\n    if (energy < DEATH_THRESHOLD) {\n        if (aliveNeighbours >= 3.0 && aliveNeighbours <= 4.0\n            && neighbourEnergy > 0.55) {\n            energy = neighbourEnergy * 0.45;\n            age    = 0.0;\n        }\n    }\n\n    // Rare spontaneous energy boost — keeps life from dying too easily\n    if (noise.w < SPONTANEOUS_ENERGY) {\n        energy = min(energy + 0.25, 1.0);\n    }\n\n    energy = clamp(energy, 0.0, 1.0);\n\n    // ====== DISEASE MECHANICS =====\n\n    if (energy > DEATH_THRESHOLD) {\n        // Age-based susceptibility — older cells catch infection more easily\n        float ageNorm        = age / MAX_AGE;\n        float ageSusceptible = 1.0 + ageNorm * AGE_VULNERABILITY;\n// High-energy cells resist — walls add extra immunity bonus.\n        // Immune memory from surviving past infection also helps.\n        float wallBonus    = tWall * TERRAIN_WALL_IMMUNITY;\n        float memoryBonus  = immuneMemory * 0.50;\n        float immunity     = step(IMMUNITY_ENERGY - wallBonus - memoryBonus, energy);\n\n        // Forest-fire probability spread, scaled by evolution stage\n        float baseChance      = INFECTION_SPREAD_RATE * infectionDensity\n                              * ageSusceptible * evoSpreadMul;\n        float infectionChance = baseChance * (1.0 - immunity * 0.75);\n\n        // Two noise checks required — keeps spread probabilistic, not certain\n        if (noise.x < infectionChance && noise.y < infectionChance) {\n            infection += 0.25;\n        }\n\n        // Rare spontaneous infection (background noise, rare lightning)\n        if (noise.z < SPONTANEOUS_INFECTION) {\n            infection += 0.15;\n        }\n\n        // Natural recovery — cells slowly clear infection on their own\n        infection -= INFECTION_RECOVERY;\n\n        // Infection drains energy — this is the core damage mechanic\n        if (infection > 0.1) {\n            energy -= INFECTION_ENERGY_DRAIN * infection;\n        }\n\n        // Heavily infected weak cells die and become dead-infected tissue\n        if (infection > 0.75 && energy < 0.25) {\n            energy    = 0.0;\n            age       = 0.0;\n            infection = 1.0;\n        }\n\n    } else {\n        // Dead cells slowly clear infection (corpse cleanup)\n        infection -= INFECTION_RECOVERY * 0.4;\n    }\n\n    // === AGENT INFECTION INJECTION =======\n    // key advance beyond A2: virus agents from Buffer B\n    // physically move through the field and inject infection directly.\n    // Buffer B's .b channel is a trail/proximity map of agent positions.\n    // Each pixel reads how close the nearest agent is and gets infected\n    // proportionally — agents are like needles piercing healthy tissue.\n\n    // Agent proximity map stored in Buffer B alpha channel\n    float agentProximity = texture(iChannel1, uv).a;\n\n    // Only living cells can be directly infected by agents\n    if (energy > DEATH_THRESHOLD && agentProximity > 0.01) {\n        // Direct injection: bypasses immunity partially (virus evolved)\n        // Evolution stage reduces how much immunity blocks agents\n        float immunityBlock = 0.6 - evoStage * 0.4;  // stage3: only 20% immunity\n        float immunity2     = step(IMMUNITY_ENERGY, energy) * immunityBlock;\n        float agentInfect   = agentProximity * AGENT_INFECT_STRENGTH\n                            * evoSpreadMul * (1.0 - immunity2);\n        infection += agentInfect;\n\n        // Agents also drain energy directly — parasitic feeding\n        energy -= agentProximity * AGENT_DRAIN_STRENGTH * evoSpreadMul;\n    }\n\n    infection = clamp(infection, 0.0, 1.0);\n    energy    = clamp(energy,    0.0, 1.0);\n\n    // MOUSE: HEALING BRUSH\n    // Left half of screen: drag to heal cells (restore life)\n    if (iMouse.z > 0.0) {\n        float mouseXNorm = iMouse.x / iResolution.x;\n      \n        if (mouseXNorm < 0.5) {\n            float dist          = distance(fragCoord, iMouse.xy);\n            float brushStrength = smoothstep(BRUSH_SIZE, BRUSH_SIZE * 0.3, dist);\n            if (brushStrength > 0.0) {\n                // Restore energy, clear infection, reset age — full healing\n                energy    = mix(energy,    1.0, brushStrength * 0.85);\n                age       = mix(age,       0.0, brushStrength * 0.70);\n                infection = mix(infection, 0.0, brushStrength * 0.95);\n            }\n        }\n    }\n\n    // INITIALISATION \n    if (iFrame == 0) {\n        // Life starts dominant: most cells healthy with varied energy/age\n        energy    = 0.4 + noise.x * 0.6;    // healthy spread [0.4, 1.0]\n        age       = noise.z * MAX_AGE * 0.3; // young-to-middle aged cells\n        infection = 0.0;                      // no virus at start — seeded in BufferC\n    }\n    // --- Update immune memory ---\n    // Cells that are recovering (infection was high, now falling) gain memory.\n    // This is the \"veteran cell\" mechanic — survivors become resistant.\n    float recovering = smoothstep(0.6, 0.15, infection)  // was infected, now clearing\n                     * step(IMMUNE_MEMORY_MIN_E, energy); // only if alive and healthy\n    immuneMemory += recovering * IMMUNE_MEMORY_GAIN * iTimeDelta;\n    // Memory decays very slowly — veterans eventually forget\n    immuneMemory -= IMMUNE_MEMORY_DECAY;\n    immuneMemory  = clamp(immuneMemory, 0.0, 1.0);\n\n    // Corridor terrain pre-drains energy at frame 0 —\n    // fault lines start weakened so virus has entry points\n    if (iFrame == 0) {\n        energy -= tCorridor * TERRAIN_CORRIDOR_DRAIN;\n    }\n\n    // Pack state — now includes immune memory in .a channel\n    // (previously unused, now carrying life's counter-adaptation)\n    fragColor = vec4(energy, age / MAX_AGE, infection, immuneMemory);\n\n    // Pack state into RGBA output\n    fragColor = vec4(energy, age / MAX_AGE, infection, 1.0);\n}\n",
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
				"code": "/*\n   doomsday: life vs. ai-virus\n    Encodes virus agents using the Voronoi nearest-particle technique\n    from A3 (AETHER). Each pixel tracks the nearest agent.\n\n    Agent state packed into vec4:\n        .xy = position in pixels\n        .z  = heading in radians\n        .w  = agent-specific evolution flavour [0,1] — used for\n              colour variation and slightly offset behaviour timing\n\n    BEHAVIOUR CHANGES BY EVOLUTION STAGE (read from Buffer C .b):\n        Stage 0 (0.00-0.25): SCOUT — random drift, weak infection deposit\n        Stage 1 (0.25-0.50): SWARM — boids flocking toward infected tissue\n        Stage 2 (0.50-0.75): NETWORK — Physarum trail-following, agents\n                              reinforce each other's paths into the life field\n        Stage 3 (0.75-1.00): DOMINION — reaction-diffusion gradient climb,\n                              agents seek strongest (highest energy) life cells\n                              for maximum damage\n\n    TWO-WAY COUPLING WITH BUFFER A:\n        - Agents read Buffer A energy as terrain: HIGH energy REPELS\n          (life is strong there), LOW / zero energy ATTRACTS (dead zones\n          are food — virus feeds on dying tissue and then radiates outward)\n        - Agents write proximity into .a channel of this buffer's trail map\n          so Buffer A can apply direct injection infection\n\n    Reads:  iChannel0 = this buffer (previous agent state)\n            iChannel1 = Buffer A (CA life field — energy terrain)\n            iChannel2 = Buffer C (evolution state + chemoattractant trail)\n    Writes: RG = agent position | B = heading | A = proximity trail map\n*/\n\n// --- Agent count \n#define NUM_AGENTS      180\n\n// --- Movement constants ---\n#define VIRUS_SPEED         32.0     // base forward speed in pixels/sec\n#define MAX_SPEED_STAGE3    48.0     // faster at full evolution\n#define HEADING_JITTER      0.58     // random angular drift each frame\n\n// --- Boids constants (Stage 1+) ---\n#define BOID_COHESION_R     5.0     // radius to pull toward cluster centre\n#define BOID_SEPARATION_R   14.0     // radius to push apart\n#define W_COHESION          0.55     // cohesion weight\n#define W_SEPARATION        1.40     // separation weight\n\n// --- Terrain sensing ---\n#define TERRAIN_SENSE_R     18.0     // radius for energy gradient sampling\n#define W_TERRAIN           2.20     // terrain steering weight\n\n// --- Trail following (Stage 2+) ---\n#define TRAIL_SENSE_R       62.0     // radius for chemoattractant sensing\n#define W_TRAIL             1.80     // trail following weight\n\n// --- Proximity deposit ---\n// Each agent deposits into .a trail map so Buffer A can read proximity\n#define DEPOSIT_RADIUS      7.0      // pixels\n#define DEPOSIT_DECAY       0.92     // trail fades each frame\n\n\n// getNearestAgent: Voronoi nearest-particle propagation from A3.\n//   Tests whether a neighbour pixel's tracked agent is closer\n//   to fragCoord than the currently tracked agent A.\n//   A         : current best agent state for this pixel\n//   fragCoord : this pixel's screen coordinates\n//   offset    : neighbour offset to test\n//   Returns the closer of the two agent states.\n// -----\nvec4 getNearestAgent(vec4 A, vec2 fragCoord, vec2 offset) {\n    vec4 N  = texture(iChannel0,\n                (fragCoord + offset) / iResolution.xy);\n    float d1 = distance(fragCoord, A.xy);\n    float d2 = distance(fragCoord, N.xy);\n    return (d2 < d1) ? N : A;\n}\n\n\n// sampleEnergy: read cell energy from Buffer A at pixel position.\n//   pos : pixel-space position\n//   Returns float energy in [0,1]. Dead cells = 0.\n\nfloat sampleEnergy(vec2 pos) {\n    return texture(iChannel1, pos / iResolution.xy).r;\n}\n\n\n// sampleInfection: read cell infection from Buffer A at pos.\n//   Used to detect where to steer toward (infect more tissue).\n//   pos : pixel-space position\n//   Returns float infection in [0,1].\n\nfloat sampleInfection(vec2 pos) {\n    return texture(iChannel1, pos / iResolution.xy).b;\n}\n\n\n// sampleTrail: read chemoattractant trail from Buffer C red channel.\n//   Stage 2+ agents follow these trails like Physarum/slime mold.\n//   pos : pixel-space position\n//   Returns float trail concentration in [0,1].\n\nfloat sampleTrail(vec2 pos) {\n    return texture(iChannel2, pos / iResolution.xy).r;\n}\n\n// ----------------------------------------------------------------\n// energyGradient: compute gradient of life energy field at pos.\n//   Used for terrain steering — agents steer toward low energy\n//   (dead/dying tissue) and away from high energy (healthy life).\n//   Central difference finite differencing, same method as A3.\n//   pos : pixel-space position\n//   Returns vec2 gradient direction (unnormalised).\n// ----------------------------------------------------------------\nvec2 energyGradient(vec2 pos) {\n    float eps = TERRAIN_SENSE_R;\n    float dx  = sampleEnergy(pos + vec2(eps, 0.0))\n              - sampleEnergy(pos - vec2(eps, 0.0));\n    float dy  = sampleEnergy(pos + vec2(0.0, eps))\n              - sampleEnergy(pos - vec2(0.0, eps));\n    return vec2(dx, dy);\n}\n\n\n// trailGradient: compute gradient of chemoattractant field.\n//   Stage 2+ agents follow this up-gradient (toward trail peaks).\n//   pos : pixel-space position\n//   Returns vec2 gradient direction (unnormalised).\nvec2 trailGradient(vec2 pos) {\n    float eps = TRAIL_SENSE_R;\n    float dx  = sampleTrail(pos + vec2(eps, 0.0))\n              - sampleTrail(pos - vec2(eps, 0.0));\n    float dy  = sampleTrail(pos + vec2(0.0, eps))\n              - sampleTrail(pos - vec2(0.0, eps));\n    return vec2(dx, dy);\n}\n\n\n// steerAgent: compute new heading for agent at agentIdx.\n//   Combines terrain avoidance, boids, trail following, and\n//   reaction-diffusion gradient climbing based on evo stage.\n//   agentIdx : which agent we are updating\n//   myPos    : current position of this agent\n//   myHeading: current heading in radians\n//   evoStage : global evolution stage [0,1] from Buffer C\n//   Returns float new heading in radians.\n\nfloat steerAgent(int agentIdx, vec2 myPos, float myHeading, float evoStage) {\n    vec4  noise     = random4(vec3(myPos, iTime));\n    float newHeading = myHeading;\n\n    // --- TERRAIN STEERING: flee high energy, seek low energy ---\n    // Agents are repelled by healthy life (high energy = danger)\n    // and attracted to dying/dead cells (low energy = food)\n    // This creates the emergent behaviour of virus eating at edges\n    // of healthy zones and spreading through weakened territory.\n    vec2 eGrad = energyGradient(myPos);\n    float eLen = length(eGrad);\n    if (eLen > 0.001) {\n        // Negate gradient: steer AWAY from high energy (downhill)\n        float targetAngle = atan(-eGrad.y, -eGrad.x);\n        float diff        = targetAngle - newHeading;\n        // Wrap angle difference to [-PI, PI]\n        diff        = mod(diff + TWOPI * 1.5, TWOPI) - TWOPI * 0.5;\n        newHeading += diff * W_TERRAIN * iTimeDelta * (1.0 + evoStage);\n    }\n\n    // --- BOIDS FLOCKING (Stage 1+: evoStage > 0.25) ---\n    // Agents cluster together to create coordinated infection fronts\n    // Separation keeps them from piling up; cohesion forms swarms\n    float boidWeight = smoothstep(0.20, 0.40, evoStage);\n    if (boidWeight > 0.01) {\n        vec2  cohesionCenter = vec2(0.0);\n        int   cohesionCount  = 0;\n        vec2  separation     = vec2(0.0);\n\n        // Sample 8 evenly-spaced directions for boid neighbours\n        for (int i = 0; i < 8; i++) {\n            float sampleAngle = float(i) * TWOPI / 8.0;\n            vec2  samplePos   = myPos + vec2(cos(sampleAngle),\n                                             sin(sampleAngle))\n                                      * BOID_COHESION_R;\n            // Read which agent occupies that region\n            vec4 neighbour = texture(iChannel0,\n                                     samplePos / iResolution.xy);\n            float nd = distance(myPos, neighbour.xy);\n\n            // Cohesion: pull toward cluster if in range\n            if (nd < BOID_COHESION_R && nd > 1.0) {\n                cohesionCenter += neighbour.xy;\n                cohesionCount++;\n            }\n            // Separation: push away if too close\n            if (nd < BOID_SEPARATION_R && nd > 0.5) {\n                separation += normalize(myPos - neighbour.xy)\n                            * (1.0 - nd / BOID_SEPARATION_R);\n            }\n        }\n\n        // Apply cohesion: steer toward cluster centre\n        if (cohesionCount > 0) {\n            cohesionCenter /= float(cohesionCount);\n            float cohAngle  = atan(cohesionCenter.y - myPos.y,\n                                   cohesionCenter.x - myPos.x);\n            float cohDiff   = cohAngle - newHeading;\n            cohDiff         = mod(cohDiff + TWOPI * 1.5, TWOPI) - TWOPI * 0.5;\n            newHeading      += cohDiff * W_COHESION * boidWeight * iTimeDelta;\n        }\n\n        // Apply separation: steer away from too-close agents\n        float sepLen = length(separation);\n        if (sepLen > 0.001) {\n            float sepAngle = atan(separation.y, separation.x);\n            float sepDiff  = sepAngle - newHeading;\n            sepDiff        = mod(sepDiff + TWOPI * 1.5, TWOPI) - TWOPI * 0.5;\n            newHeading     += sepDiff * W_SEPARATION * boidWeight * iTimeDelta;\n        }\n    }\n\n    // --- TRAIL FOLLOWING / PHYSARUM (Stage 2+: evoStage > 0.50) ---\n    // Agents sense chemoattractant trails from Buffer C and\n    // follow them — like Physarum slime mold building efficient\n    // transport networks. This creates persistent viral highways\n    // through the life field that efficiently route new infection.\n    float trailWeight = smoothstep(0.45, 0.65, evoStage);\n    if (trailWeight > 0.01) {\n        vec2  tGrad = trailGradient(myPos);\n        float tLen  = length(tGrad);\n        if (tLen > 0.001) {\n            // Follow the trail gradient uphill (toward dense trails)\n            float trailAngle = atan(tGrad.y, tGrad.x);\n            float tDiff      = trailAngle - newHeading;\n            tDiff            = mod(tDiff + TWOPI * 1.5, TWOPI) - TWOPI * 0.5;\n            newHeading       += tDiff * W_TRAIL * trailWeight * iTimeDelta;\n        }\n    }\n\n    // --- REACTION-DIFFUSION GRADIENT CLIMB (Stage 3: evoStage > 0.75) ---\n    // At maximum evolution, virus inverts its terrain preference:\n    // instead of seeking dead cells, it specifically targets the\n    // STRONGEST living cells to deal maximum damage to life's\n    // most resilient zones. This makes stage 3 feel \"intelligent\".\n    float rdWeight = smoothstep(0.70, 0.90, evoStage);\n    if (rdWeight > 0.01) {\n        // Now seek HIGH energy zones — attack the strongest life\n        vec2  eGradUp  = energyGradient(myPos);\n        float eUpLen   = length(eGradUp);\n        if (eUpLen > 0.001) {\n            // Follow energy gradient UPHILL this time\n            float rdAngle = atan(eGradUp.y, eGradUp.x);\n            float rdDiff  = rdAngle - newHeading;\n            rdDiff        = mod(rdDiff + TWOPI * 1.5, TWOPI) - TWOPI * 0.5;\n            newHeading    += rdDiff * 1.60 * rdWeight * iTimeDelta;\n        }\n    }\n\n    // Small random jitter keeps movement organic and unpredictable\n    newHeading += HEADING_JITTER * (noise.w * 2.0 - 1.0) * iTimeDelta;\n\n    return newHeading;\n}\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv    = fragCoord / iResolution.xy;\n    vec4 A     = texture(iChannel0, uv);  // previous state\n\n    // Read global evolution stage from Buffer C blue channel\n    // Buffer C uses a single \"global\" pixel at (0.5, 0.5) for this\n    float evoStage = texture(iChannel2, vec2(0.5)).b;\n\n    //VORONOI PROPAGATION =\n    // From A3: each pixel propagates the nearest agent through its\n    // neighbourhood so every pixel knows which agent owns it\n    for (int x = -2; x <= 2; x++) {\n        for (int y = -2; y <= 2; y++) {\n            A = getNearestAgent(A, fragCoord, vec2(x, y));\n        }\n    }\n\n    //  UPDATE AGENT STATE\n    // Only the pixel at exactly the agent's position updates state.\n    // All other pixels just track (Voronoi ownership).\n    // We identify the \"home pixel\" as the one nearest to the agent.\n    vec2 homePixel = floor(A.xy) + 0.5;\n    bool isHome    = (distance(fragCoord, homePixel) < 0.5);\n\n    if (isHome) {\n        vec2  pos     = A.xy;\n        float heading = A.z * TWOPI;    // decode heading from [0,1] to radians\n        float flavour = A.w;             // per-agent flavour parameter\n\n        // Compute new heading via steering function\n        float newHeading = steerAgent(\n            int(floor(pos.x / 24.0) + floor(pos.y / 24.0) * 20.0),\n            pos, heading, evoStage\n        );\n\n        // Speed increases with evolution stage — virus gets faster\n        float speed = mix(VIRUS_SPEED, MAX_SPEED_STAGE3, evoStage);\n\n        // Advance position forward along heading\n        vec2 newPos = pos + vec2(cos(newHeading), sin(newHeading))\n                          * speed * iTimeDelta;\n\n        // Wrap at screen edges (toroidal space)\n        newPos = mod(newPos, iResolution.xy);\n\n        // Pack back: heading encoded as [0,1] in .z\n        A = vec4(newPos, newHeading / TWOPI, flavour);\n    }\n\n    //  PROXIMITY TRAIL MAP ==\n    // The .a channel accumulates a decaying proximity map of agent\n    // positions. Buffer A reads this to apply direct infection.\n    // All pixels contribute to the trail independently of Voronoi.\n\n    // Decay previous trail\n    float prevTrail = texture(iChannel0, uv).a * DEPOSIT_DECAY;\n    float newTrail  = prevTrail;\n\n    // Each agent deposits a soft disc at its position\n    // We sample nearby agent states via Voronoi to get deposits\n    float dist = distance(fragCoord, A.xy);\n    if (dist < DEPOSIT_RADIUS) {\n        // Gaussian-like smooth deposit\n        float deposit = smoothstep(DEPOSIT_RADIUS, 0.0, dist);\n        newTrail = max(newTrail, deposit);\n    }\n\n    //  INITIALISATION =\n    if (iFrame == 0) {\n        // Place agents in a tight cluster near a random position\n        // Seeded from pixel position so agents spread across cluster\n        float N        = 24.0;   // grid cell size (same as A3)\n        vec2  gridPos  = round(fragCoord / N) * N;\n        vec4  init     = random4(vec3(gridPos, 0.0));\n\n        // Virus starts from a random point in the middle of the screen\n        // All agents begin near the same origin to simulate outbreak\n        vec2 outbreakCenter = iResolution.xy * vec2(\n            0.3 + init.x * 0.4,   // somewhere in middle 40% of screen\n            0.3 + init.y * 0.4\n        );\n        // Scatter within a small radius of outbreak center\n        float scatterR = 30.0;\n        vec2 scatter   = vec2(\n            (random4(gridPos + 1.0).x - 0.5) * scatterR,\n            (random4(gridPos + 1.0).y - 0.5) * scatterR\n        );\n        gridPos = outbreakCenter + scatter;\n\n        // Random initial heading\n        float initHeading = init.z;   // [0,1] — decoded to radians in steer\n        float flavour     = init.w;   // per-agent permanent identifier\n\n        A = vec4(gridPos, initHeading, flavour);\n        newTrail = 0.0;\n    }\n\n    // Output: XY=agent pos, Z=heading[0,1], W=proximity trail\n    fragColor = vec4(A.xyz, newTrail);\n}\n",
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
				"code": "/*\n    Student Number: 219284140\n    Assignment:    doomsday: life vs. ai-virus\n    Name:           Katelyn Yew\n                             Buffer C\n\nBuffer C: Evolution Accumulator + Chemoattractant Field\n  \n    This buffer has two main roles:\n\n    ROLE 1 — CHEMOATTRACTANT TRAIL (.r channel, full resolution):\n        A diffusing, decaying chemical field that virus agents (Buffer B)\n        deposit into each frame and then sense via gradient following.\n        This implements Physarum/slime-mold behaviour at Stage 2+:\n        agents reinforce each other's paths, creating persistent viral\n        highways that efficiently route infection through life tissue.\n        The trail diffuses slowly to neighbouring pixels each frame and\n        decays exponentially so old paths fade when agents leave.\n\n    ROLE 2 — EVOLUTION ENGINE (.g = pressure, .b = evo stage):\n        Tracks \"virus pressure\" — a global scalar that rises when life\n        is winning (high energy, low infection) and drives mutation.\n        Evolution advances BOTH automatically over time AND reactively\n        when pressure crosses a threshold (virus adapts to failure).\n        The .b channel encodes the current normalised evolution stage\n        [0,1] and is read by Buffer A and Buffer B to scale behaviour.\n\n    CHANNEL WIRING FOR THIS BUFFER IN SHADERTOY:\n        iChannel0 = Buffer C (self — for trail diffusion and evo state)\n        iChannel1 = Buffer A (life CA field — for pressure measurement)\n        iChannel2 = Buffer B (virus agents — proximity trail in .a channel)\n\n    Writes: R = chemoattractant trail | G = pressure | B = evo stage\n*/\n\n// --- Evolution timing ---\n// Seconds for the virus to automatically advance one full stage.\n// Reactive pressure can shortcut this when life is winning.\n#define AUTO_EVOLVE_TIME         28.0\n\n// Rate at which pressure accumulates when life is winning each frame\n#define EVOLUTION_PRESSURE_RATE  0.0008\n\n// Pressure level that triggers a reactive mutation jump\n#define MUTATION_THRESHOLD       0.65\n\n// --- Chemoattractant trail parameters ---\n#define TRAIL_DECAY      0.978    // fraction remaining each frame (exponential decay)\n#define TRAIL_DIFFUSION  0.15     // fraction blended toward 4-neighbour average\n#define DEPOSIT_PER_AGENT 0.08    // concentration deposited per agent per frame\n// Life's immune stage thresholds — mirrors virus evo but slower\n// Life reaches stage 1 at ~40s, stage 2 at ~90s (virus hits stage 3 at ~84s)\n#define LIFE_AUTO_STAGE_TIME     40.0\n// How fast immune pressure builds when virus is winning\n#define LIFE_PRESSURE_RATE       0.0005\n// Life pressure threshold to trigger a reactive immune jump\n#define LIFE_MUTATION_THRESHOLD  0.70\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n\n    vec2 uv        = fragCoord / iResolution.xy;\n    vec2 texelSize = 1.0 / iResolution.xy;\n\n    // Read previous state of this buffer (self-referencing for persistence)\n    vec4  self     = texture(iChannel0, uv);\n    float prevTrail = self.r;    // previous trail concentration\n    float pressure  = self.g;   // accumulated virus pressure\n    float evoStage  = self.b;   // current evolution stage [0,1]\n\n    // ====== ROLE 1: CHEMOATTRACTANT TRAIL ==\n    // Runs at full resolution — every pixel maintains its own trail value.\n\n    // Step 1: diffuse trail toward 4-neighbour average (chemical spreading)\n    float trailN = texture(iChannel0, uv + vec2(0.0,        texelSize.y)).r;\n    float trailS = texture(iChannel0, uv + vec2(0.0,       -texelSize.y)).r;\n    float trailE = texture(iChannel0, uv + vec2( texelSize.x, 0.0      )).r;\n    float trailW = texture(iChannel0, uv + vec2(-texelSize.x, 0.0      )).r;\n\n    // Blend: mostly self-preserved, slightly spread to neighbours\n    float trailDiffused = mix(prevTrail,\n                              (trailN + trailS + trailE + trailW) * 0.25,\n                              TRAIL_DIFFUSION);\n\n    // Step 2: apply exponential decay — old trails fade out\n    float newTrail = trailDiffused * TRAIL_DECAY;\n\n    // Step 3: virus agents deposit into trail via Buffer B proximity map.\n    // iChannel2 = Buffer B. The .a channel of Buffer B is the agent\n    // proximity map — high values mean an agent is at or near this pixel.\n    float agentProximity = texture(iChannel2, uv).a;\n    newTrail = clamp(newTrail + agentProximity * DEPOSIT_PER_AGENT, 0.0, 1.0);\n\n    // Step 4: infection in the CA field also boosts trail concentration\n    // — infected zones attract more agents, self-reinforcing spread.\n    float infection = texture(iChannel1, uv).b;   // Buffer A infection channel\n    newTrail = clamp(newTrail + infection * 0.010, 0.0, 1.0);\n\n    // ======= ROLE 2: EVOLUTION ENGINE ====\n    // Pressure and evo stage are global scalars. They are computed\n    // identically at every pixel (using the same sample points) so the\n    // values propagate uniformly across the entire buffer.\n    // The Image tab and Buffer B read from vec2(0.5) to get the global value.\n\n    // Sample life field health at 9 spread points across the canvas.\n    // This gives a cheap proxy for the global state of the simulation\n    // without needing a full-resolution reduction pass.\n    float lifeHealth     = 0.0;\n    float totalInfection = 0.0;\n    for (int i = 0; i < 9; i++) {\n        float fi       = float(i);\n        // Spread sample points in a pseudo-random pattern across [0,1]\n        vec2  sampleUV = vec2(fract(fi * 0.333 + 0.16),\n                              fract(fi * 0.222 + 0.11));\n        vec4  lifeSample = texture(iChannel1, sampleUV);\n        lifeHealth     += lifeSample.r;   // energy channel\n        totalInfection += lifeSample.b;   // infection channel\n    }\n    lifeHealth     /= 9.0;\n    totalInfection /= 9.0;\n\n    // Virus is losing when life energy is high AND infection is low.\n    // This scalar drives the pressure accumulation.\n    float virusLosing = lifeHealth * (1.0 - totalInfection);\n\n    // Pressure builds when life is winning, decays slowly when virus wins\n    pressure += virusLosing  * EVOLUTION_PRESSURE_RATE;\n    pressure -= (1.0 - virusLosing) * EVOLUTION_PRESSURE_RATE * 0.30;\n    pressure  = clamp(pressure, 0.0, 1.0);\n\n    // --- Automatic evolution: advances slowly over time ---\n    // Full evolution (stage 3) reached at 3 × AUTO_EVOLVE_TIME seconds\n    float autoStage = clamp(iTime / (AUTO_EVOLVE_TIME * 3.0), 0.0, 1.0);\n\n    // --- Reactive mutation: pressure spike jumps to next stage ---\n    // If virus has been struggling, it mutates immediately\n    float pressureBoost = 0.0;\n    if (pressure > MUTATION_THRESHOLD) {\n        pressureBoost = 0.33;       // advance by exactly one stage\n        pressure     *= 0.30;       // reset pressure after mutation fires\n    }\n\n    // Final stage: take max of automatic and pressure-boosted values.\n    // Never goes backward — evolution is irreversible.\n    float targetStage = clamp(autoStage + pressureBoost, 0.0, 1.0);\n    float newEvoStage = max(evoStage, targetStage);\n\n    // Smooth interpolation so stage transitions feel gradual, not instant\n    evoStage = mix(evoStage, newEvoStage, 0.018);\n\n    // ======= INITIALISATION ========\n    if (iFrame == 0) {\n        newTrail = 0.0;\n        pressure = 0.0;\n        evoStage = 0.0;   // virus starts at Stage 0: Scout\n    }\n       // LIFE CO-EVOLUTION ENGINE \n    // Mirrors the virus evolution system but is slower and weaker.\n    // Life's immune stage is stored in the .a channel of Buffer C.\n    // Stage 0: baseline CA  |  Stage 1: quarantine pulse\n    // Stage 2: veteran resistance active  |  Stage 3: anti-viral repulsion\n\n    float lifeStage    = self.a;   // current life evolution [0,1]\n\n    // Life pressure rises when virus is winning (high infection, low energy)\n    // — opposite trigger to virus pressure\n    float virusWinning  = totalInfection * (1.0 - lifeHealth);\n    float lifePressure  = self.g;  // reuse .g for life pressure this frame?\n    // NOTE: to avoid collision with virus pressure already in .g,\n    // pack life pressure into a spare bit. Simplest approach:\n    // store life stage in .a, derive life pressure transiently each frame.\n    // Life stage auto-advances at LIFE_AUTO_STAGE_TIME per stage (max stage 2 = 0.66)\n    float lifeAutoStage = clamp(iTime / (LIFE_AUTO_STAGE_TIME * 3.0), 0.0, 0.66);\n\n    // Reactive jump: if virus is winning strongly, life mutates immediately\n    float lifePressureBoost = 0.0;\n    if (virusWinning > LIFE_MUTATION_THRESHOLD && lifeStage < 0.66) {\n        lifePressureBoost = 0.33;\n    }\n\n    float lifeTargetStage = clamp(lifeAutoStage + lifePressureBoost, 0.0, 0.66);\n    // Life never reaches stage 3 — virus stays dominant\n    float newLifeStage    = max(lifeStage, lifeTargetStage);\n    lifeStage = mix(lifeStage, newLifeStage, 0.012); // slightly slower than virus\n\n    // Anti-viral repulsion at life Stage 2+ (evoStage > 0.5):\n    // Veteran cells in strongly infected recovered zones emit a\n    // negative contribution to the chemoattractant trail —\n    // agents are slightly pushed away from well-defended areas.\n    \n    float lifeDefense = smoothstep(0.45, 0.65, lifeStage);\n    if (lifeDefense > 0.01) {\n        // Read immune memory from Buffer A .a channel\n        float immuneMemory = texture(iChannel1, uv).a;\n        // Subtract from trail where veterans are dense and infection was cleared\n        float antiViral = immuneMemory * lifeDefense * 0.04;\n        newTrail = max(newTrail - antiViral, 0.0);\n    }\n\n    // Pack all three roles into output channels\n    // R = chemoattractant trail concentration [0,1]\n    // G = virus pressure accumulator [0,1]\n    // B = evolution stage [0,1]\n   // R = chemoattractant trail | G = virus pressure | B = virus evo stage | A = life stage\n    fragColor = vec4(newTrail, pressure, evoStage, lifeStage);\n    \n \n \n}\n",
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
				"code": "/*\n\n Buffer D: Terrain Map\n    Generates a PERMANENT geographic terrain at iFrame == 0.\n    Never updates after that because it is a static landscape.\n\n    THREE terrain features stored in three channels:\n        .r = STRONGHOLD density [0,1]\n             Voronoi-seeded \"organ regions\" where life cells are\n             denser and share energy more efficiently. Virus must\n             work harder to breach these zones. Life's fortresses.\n\n        .g = CORRIDOR weakness [0,1]\n             Pre-weakened entry corridors — necrotic scars that\n             start at lower energy. Virus outbreak seeds near the\n             highest corridor value. These are the fault lines.\n\n        .b = WALL mask [0,1]\n             Thin membranes of ultra-high-immunity cells that act\n             as natural chokepoints. Physical barriers slow agent\n             traversal and boost local cell immunity.\n\n    Reads:  nothing (pure generation from position + noise)\n    Writes: R=stronghold | G=corridor | B=wall\n\n    SHADERTOY CHANNEL WIRING:\n        iChannel0 = Buffer D (self — reads own previous state\n                    so iFrame==0 init persists forever)\n*/\n\n// Number of Voronoi stronghold \"organ\" regions across the canvas\n#define NUM_STRONGHOLDS     7\n// Number of weakness corridor lines crossing the canvas\n#define NUM_CORRIDORS       5\n// Wall membrane thickness (fraction of cell spacing)\n#define WALL_THICKNESS      0.46\n\n\n// voronoiStronghold: computes how close this pixel is to the\n//   nearest stronghold centre. Returns [0,1] proximity where\n//   1.0 = at the centre, 0.0 = far away.\n//   fragCoord: pixel position\n//   seed:      unique seed per stronghold\n\nfloat voronoiStronghold(vec2 fragCoord, float seed) {\n    // Place stronghold centres pseudo-randomly but avoiding edges\n    // fract(seed*vec2) gives different positions per stronghold\n    vec2 centre = iResolution.xy * (0.15 + 0.70 * fract(seed * vec2(0.317, 0.719)));\n    float dist  = length(fragCoord - centre);\n    // Soft falloff — stronghold influence fades smoothly over ~25% of screen width\n    float radius = iResolution.x * 0.22;\n    return smoothstep(radius, 0.0, dist);\n}\n\n\n// corridorStrength: computes weakness along a diagonal stripe.\n//   Models a pre-weakened fault line through the life field.\n//   Virus tends to seed and spread along these corridors.\n//   fragCoord: pixel position\n//   seed:      unique seed per corridor (controls angle/offset)\n//   Returns [0,1] where 1.0 = at the corridor centre.\n\nfloat corridorStrength(vec2 fragCoord, float seed) {\n    vec2  uv     = fragCoord / iResolution.xy;\n    // Each corridor is a rotated stripe — angle varies per seed\n    float angle  = seed * 1.618 * 3.14159;  // golden-ratio-spaced angles\n    vec2  dir    = vec2(cos(angle), sin(angle));\n    // Offset along perpendicular — positions corridor across canvas\n    float offset = fract(seed * 0.577);\n    // Signed distance to the rotated stripe\n    float d      = abs(dot(uv - 0.5, vec2(-dir.y, dir.x)) - (offset - 0.5));\n    // Narrow soft corridor — noticeable but not world-dominating\n    return smoothstep(0.18, 0.02, d);\n}\n\n\n// wallMask: thin membrane barrier based on a second Voronoi grid.\n//   Creates organic-looking cell-wall barriers at cell boundaries.\n//   Returns 1.0 at the membrane, 0.0 away from it.\n// ----------------------------------------------------------------\nfloat wallMask(vec2 fragCoord) {\n    // Use a coarse Voronoi grid — walls are at cell boundaries\n    vec2  ip  = floor(fragCoord / 88.0);\n    vec2  fp  = fract(fragCoord / 88.0);\n    float d1  = 9.0, d2 = 9.0;\n\n    // Find two nearest Voronoi centres (d1 and d2)\n    for (int j = -1; j <= 1; j++) {\n        for (int i = -1; i <= 1; i++) {\n            vec2 cell   = ip + vec2(i, j);\n            vec2 jitter = random2(cell + 99.0) * 0.75 + 0.125;\n            vec2 r      = (vec2(i, j) + jitter) - fp;\n            float d     = dot(r, r);\n            if (d < d1) { d2 = d1; d1 = d; }\n            else if (d < d2) { d2 = d; }\n        }\n    }\n\n    // Wall is at the Voronoi edge — where d2 - d1 is smallest\n    float edgeProx = sqrt(d2) - sqrt(d1);\n    return smoothstep(WALL_THICKNESS * 2.0, 0.0, edgeProx);\n}\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n\n    // == PERSIST AFTER FRAME 0 \n    // Once generated, never regenerate — read own previous state.\n    // This is the key trick: the terrain is permanent geography.\n    if (iFrame > 0) {\n        fragColor = texture(iChannel0, fragCoord / iResolution.xy);\n        return;\n    }\n\n    // ===================== FRAME 0: GENERATE TERRAIN =====================\n\n    // --- Stronghold map: accumulate influence of all stronghold centres ---\n    float stronghold = 0.0;\n    for (int i = 0; i < NUM_STRONGHOLDS; i++) {\n        // Each stronghold gets a unique seed from its index\n        stronghold = max(stronghold, voronoiStronghold(fragCoord, float(i) * 0.137 + 0.05));\n    }\n    // Sharpen: strongholds have clear centres and clear edges\n    stronghold = pow(stronghold, 1.4);\n\n    // --- Corridor map: accumulate all weakness corridors ---\n    float corridor = 0.0;\n    for (int i = 0; i < NUM_CORRIDORS; i++) {\n        corridor = max(corridor, corridorStrength(fragCoord, float(i) * 0.251 + 0.10));\n    }\n\n    // Corridors and strongholds partially oppose each other:\n    // a stronghold partially blocks a corridor through it (life\n    // is more resilient there even along the fault line)\n    corridor = corridor * (1.0 - stronghold * 0.55);\n\n    // --- Wall membrane mask ---\n    float wall = wallMask(fragCoord);\n    // Walls only exist where there's no stronghold or corridor —\n    // strongholds absorb walls (their interior is open), corridors\n    // slice through walls (pre-broken membranes)\n    wall = wall * (1.0 - stronghold * 0.70) * (1.0 - corridor * 0.80);\n\n    // Pack three terrain channels\n    // R = stronghold, G = corridor, B = wall\n    fragColor = vec4(stronghold, corridor, wall, 1.0);\n}",
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
			"id": "NclXzs",
			"date": "1775792557",
			"viewed": 42,
			"name": "Doomsday: life vs ai",
			"username": "Katelyn Yew",
			"description": "final project\nai vs. life/living creature. both are evolving creatures but this project essentially highlights AI's outpacing and fast evolution compared to living organisms.",
			"likes": 4,
			"published": 1,
			"flags": 32,
			"usePreview": 0,
			"tags": [
				"multipleagentsandca"
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
				"code": "/*\n\n218856542\n\nDATT4950 Assignment #3\n\nRobert Jamrocha-Tullo\n\n\"Space Strugglers\"\n\nInteractions: Click, and hold anywhere on the screen with the mouse button\nto create an \"air pocket\". This will create a membrane that stores air which\nthe space strugglers on screen will sense the pressure of, flock to, break\nthrough, and let down their personal membrane while taking in the fresh air.\nIn buffer A, the if statement at the bottom has the N variable, which can be\nchanged to initialize a different number of agents, which is good for\ndifferent screen sizes. Additionally, the constants of the image buffer\n(surrounded by ***) may be fun to play with, and certain screen sizes may\nneed to in order to see intended effects, such as the eyes of the membrane.\nThe program is meant to be run on an 800 x 450 sized screen and the default\nsettings for it will work just fine, I have not tested it with 1600 x 900, but\nI'd imagine it would work fine on that size as well.\n\nDescription: The guys you see floating around the screen are what I like to\ncall \"Space Strugglers!\" They are these little guys with cores of\nbioluminescent blue which sport a pink membrane that they use to trap air\naround them, sort of like a natural spacesuit. They wander around space in\ndifferent directions. What's interesting about them is how they evolve and\nbehave. When moving in a specific direction, if you look closely, you will\nsee that they start to develop eyeballs that look toward that direction. They\nalso seem to have an innate desire to breathe fresh air. When they bump into\neach other, they will combine membranes to share the air between them, like\nthey want to experience something new. Of course, if you click and hold on the\nscreen, they will sense the air pressure of the pocket you've created, and\ntake it as a chance to relax, getting rid of their membrane, similar to how\na human would take off their coat after a long winter day. Many of these\nprocesses such as seeking air pockets were programmed directly, but many\nbehaviours took me by surprise, such as the sharing of membranes and growing\nof eyes.\n\nCitations: The basis of lots of code in this shadertoy was learned from\nlectures by Graham Wakefield, and some was inspired by his shadertoys,\nsuch as https://www.shadertoy.com/view/7fl3zH\nAnd concepts from his website: https://alicelab.world/digm5950/glsl.html\nAdditionally, the concepts for smoothlife used in this shadertoy are\ninterpolated from this research paper by Stephan Rafler:\nhttps://arxiv.org/pdf/1111.1567\nwhich was introduced to me by Graham Wakefield on his website at\nhttps://alicelab.world/digm5950/ca.html\n\nSpecific citations of how each concept was applied from where are further\ndescribed in each buffer (including later in this one).\n\nTechnical Realization: I started out by amending code for particle systems\nbeing attracted to sugar (aka Chemotaxis). I modified the attractor to instead\nbe a system where you click and hold on the screen, and modified the behaviour\nof particles so that it looked more like they were wandering around, running\nto the attractor, and then dispursing when it disappeared. I also modified the\nappearance of the particles and their attractor. I then was inspired by\nRafler's smoothlife algorithms and decided to implement my version of it into\na buffer, essentially taking the image that the particle system created and\nbuilding smoothlife off of it. I then played around with more variables, not\nonly of the smoothlife functions, but also of the particles so that they could\nbetter interact with the smoothlife. Eventually, I found good balances that\ncreated the interesting behaviours that I noted in the system description.\nFuture implementations of this code could introduce more elements to the\nsystem, possibly adding even more cellular automata that the particles can\ninteract with, and possibly even interact with the smoothlife. Maybe an evil\nalien that scares the particles could appear, and it eating particles could\ncause a reaction that makes the smoothlife grow a certain way.\n\n*/\n\n//IMAGE: The image buffer takes the compiled particle + attractor data from\n//buffer D, then transforms the image using smoothlife functions, to give it\n//the appearance we see on screen.\n\n//The basis of this code was inspired by Lectures from Graham Wakefield.\n//Many concepts used in this buffer (although parameters have been heavily\n//modified) come from research by Stephan Rafler, found at:\n// https://arxiv.org/pdf/1111.1567\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord ) {\n\n    //takes current coordinate and scales it to (0,0)-(1,1), aka normalize\n    vec2 uv = fragCoord / iResolution.xy;\n    \n    //Creates vec4 A which is the previous state of the image from last frame\n    vec4 A = texture(iChannel0, uv);\n    \n    //initializes inner and outer radii that will be used for functions to\n    //determine size for density\n    float inner_radius = 3.5;\n    float outer_radius = 10.0;\n    \n    //initializes variables that will be added to and used to determine\n    //population for density\n    float inner_sum = 0.0;\n    float outer_sum = 0.0;\n    //loops over the diameter of the outer radius\n    for (float x = -outer_radius; x <= outer_radius; x++) {\n        \n        //and the diameter of the inner radius\n        for (float y = -outer_radius; y <= outer_radius; y++){\n        \n            //creates a variable for texel\n            vec2 pixel = vec2(x,y);\n            vec2 texel = pixel / iResolution.xy;\n            //which is used to get the texture of that area, which will in the\n            //future be used to calculate life population and then density\n            float life = texture(iChannel0, uv + texel).x;     \n            \n            //distance is calculated,\n            float dist = length(pixel);\n            \n            //and then used in a sigmoid function to determine if the current\n            //point is in the radial circle we are looking for (otherwise, the\n            //for loop would go over a square).\n            float outer_w = 1.0 - sigmoid(dist, outer_radius, 1.0);\n            float inner_w = 1.0 - sigmoid(dist, inner_radius, 1.0);\n            \n            //Population is calculated\n            outer_sum += life * outer_w;\n            inner_sum += life * inner_w;\n            \n        }\n    \n    }\n    \n    //area of inner circle is calculated with pi r squared\n    float inner_area = 3.14159 * inner_radius * inner_radius;\n    //population and area are used to calculate density\n    float inner_density = inner_sum / inner_area;\n    \n    //area of outer circle is calculated with pi r squared\n    float outer_area = 3.14159 * outer_radius * outer_radius;\n    //outer density is calculated similarly to how inner density was calculated\n    //except that the inner circle's area must be eliminated\n    float outer_density = (outer_sum - inner_sum) / (outer_area - inner_area);\n    \n    //These are constant variables that effect the appearance of the smoothlife\n    //They have been modified based off Rafler's research to give the particles\n    //their look, which is that of a blue glowing particle inside of a pink\n    //membrane, with an eye pointing in the direction of movement.\n    //These values work best on an 800 x 450 sized screen.\n    //***\n    float b1 = 0.25;\n    float b2 = 0.1;\n    float a1 = 0.01;\n    float d1 = 0.1;\n    float d2 = 0.75;\n    float a2 = 0.01;\n    //***\n    \n    //Rules for transition:\n    //determines a value on if the automata is lonely\n    float notlonely = sigmoid(outer_density, d1, a1);\n    //determines a value on if the automata is crowded\n    float notcrowded = 1.0 - sigmoid(outer_density, d2, a1);\n    //crates a logical AND expression through math to determine that it will\n    //survive if it is not lonely AND not crowded\n    float survive = notlonely * notcrowded;\n    \n    //Rules for birth:\n    //determines value if there is enough density\n    float enough = sigmoid(outer_density, b1, a1);\n    //and if there is not too much density\n    float nottoomuch = 1.0 - sigmoid(outer_density, b2, a1);\n    //then performs a logical AND, automata is born if it is dense enough and\n    //not too dense\n    float birth = enough * nottoomuch;\n    \n    //Creates an interpolation between the transition and birth rules\n    float liveness = sigmoid(inner_density, 0.5, a2);\n    float transition = mix(birth, survive, liveness);\n    \n    //Clamps the transition value from 0 to 1\n    transition = clamp(transition, 0., 1.);\n    \n    //Applies transition to rules to the x value of A\n    A.x = transition;\n    \n    //Applies A to the fragColor of the image buffer, completing the image.\n    fragColor = A;\n   \n}",
				"name": "Image",
				"description": "",
				"type": "image"
			},
			{
				"outputs": [],
				"inputs": [],
				"code": "//COMMON: contains multiple constants and functions used throughout code\n//functions were sourced from https://alicelab.world/digm5950/glsl.html\n//as well as lectures from Graham Wakefield.\n\n//Constant variable for two times pi\nconst float TWOPI = 6.283185307179586;\n\n//function for sigmoid transition\nfloat sigmoid(float x, float center, float width) {\n    //x is a variable that changes the transition around center\n    //depending on width\n    return 1.0 / (1.0 + exp(-(x-center)*4.0/width));\n}\n\n\n//Gaussian blur function\nvec4 blur(sampler2D img, vec2 fragCoord, vec2 resolution, int N, vec2 dir) {\n    float sigma = float(N)/3.14;   \n    float expFactor = -0.5/(sigma*sigma);\n    float weight = 1.;\n    vec4 sum = texture(img, fragCoord/resolution) * weight;\n    float weightSum = weight;\n    for (int i=1; i<=N; i++) {\n        vec2 offset = float(i) * dir;\n        float weight = exp(float(i*i) * expFactor);\n        sum += texture(img, (fragCoord + offset)/resolution) * weight;\n        sum += texture(img, (fragCoord - offset)/resolution) * weight;\n        weightSum += weight * 2.0;\n    \n    }\n    return sum / weightSum;\n}\n\n\n//Below are multiple pseudorandom number generator functions\n\n#define RANDOM_SCALE vec4(.1031, .1030, .0973, .1099)\n\nvec2 random2(float p) {\n    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec2 random2(vec2 p) {\n    vec3 p3 = fract(p.xyx * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec2 random2(vec3 p3) {\n    p3 = fract(p3 * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec3 random3(float p) {\n    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xxy + p3.yzz) * p3.zyx); \n}\n\nvec3 random3(vec2 p) {\n    vec3 p3 = fract(vec3(p.xyx) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yxz + 19.19);\n    return fract((p3.xxy + p3.yzz) * p3.zyx);\n}\n\nvec3 random3(vec3 p) {\n    p = fract(p * RANDOM_SCALE.xyz);\n    p += dot(p, p.yxz + 19.19);\n    return fract((p.xxy + p.yzz) * p.zyx);\n}\n\nvec4 random4(float p) {\n    vec4 p4 = fract(p * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);   \n}\n\nvec4 random4(vec2 p) {\n    vec4 p4 = fract(p.xyxy * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec3 p) {\n    vec4 p4 = fract(p.xyzx * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec4 p4) {\n    p4 = fract(p4  * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}",
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
				"code": "//BUFFER A: This buffer creates the data of position, direction and\n//movement for the particle agents moving around the screen.\n\n//The basis for this code is from https://www.shadertoy.com/view/7fl3zH\n//By Graham Wakefield, with my changes.\n\n//This buffer creates \"pixels\" (comprised of regions that take up multiple\n//pixels on screen) that track a particle.\n//vec4 A is the variable used for the current \"pixel\"\n//its w contains the nearest particle's memory, its x and y track the nearest\n//particle's location, and the z contains its direction.\n\n//Function to determine nearest particle. It takes the location of the current\n//pixel and its neighbour, then determines which is closer to their particles.\nvec4 getNearestParticle(vec4 A, vec2 fragCoord, vec2 offset) {\n    //Creates a variant of 'A' for neighbour\n    vec4 N = texture(iChannel0, (fragCoord+offset)/iResolution.xy);\n    //gets the distances for current pixel to particle\n    float d1 = distance(fragCoord, A.xy);\n    //and distance for neighbouring particle to its pixel\n    float d2 = distance(fragCoord, N.xy);\n    //tracks neighbour's particle if it is closer to current pixel\n    if (d2 < d1) { return N; } else { return A; }\n}\n\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord) {\n    //takes current coordinate and scales it to (0,0)-(1,1), aka normalize\n    vec2 uv = fragCoord / iResolution.xy;\n    //updates A with whatever data was on the previous frame\n    vec4 A = texture(iChannel0, uv);\n    \n    //For loop that performs the getNearestParticle function from earlier\n    //on all the pixel's neighbours, effectively making sure that the pixel\n    //is tracking its nearest neighbour.\n    for (int x=-2; x<=2; x++) {\n        for (int y=-2; y<=2; y++) {\n            A = getNearestParticle(A, fragCoord, vec2(x, y));\n        }\n    }\n    \n    //Noise variable generated, using the particle's position and the time\n    //elapsed as a seed, ensuring that each particle will stay consistent to\n    //itself while also having some randomness.\n    vec4 noise = random4(vec3(A.xy, iTime));\n    \n    //the speed and direction change of the particle are initialized, however\n    //these values will soon update.\n    float speed = 50.;\n    float turn = 0.;\n    \n    //This part of the buffer actually pulls from buffer C, which contains\n    //an attractor field. It uses this data to create a \"pressure\" that\n    //the particles sense.\n    vec4 C = texture(iChannel2, A.xy / iResolution.xy);\n    float pressure = C.g;\n    \n    //Compares strength of pressure to the particle's memory of pressure\n    //last frame\n    float memory = A.w;\n    \n    //Checks if the pressure is stronger than last frame\n    if (pressure > memory) {\n        //If so, go keep following in the direction of the new pressure.\n        //Direction is changed to be more consistent\n        turn = 0.01;\n        //And speed picks up.\n        speed = 100.;\n    } else {\n        //If there is no sensed nearby pressure change, keep changing\n        //directions, and take it slower.\n        turn = 1.;\n        speed = 50.;\n    }\n    \n    //The direction is updated, using the amount of direction change variable,\n    //and a bit of randomization from the earlier noise function.\n    A.z += turn * (noise.x*2. - 1.);\n    \n    //Creates a velocity using cos and sin to create x and y variables from\n    //direction variable z, and combines it with speed, so there is direction\n    //and magnitude.\n    vec2 vel = vec2(cos(A.z), sin(A.z)) * speed;\n    //That velocity is then placed into the x and y variables.\n    A.xy += vel * iTimeDelta;\n    \n    // get the bounded position within the screen image\n    vec2 b = clamp(A.xy, vec2(0), iResolution.xy);\n    // compare the bounded and actual positions -- if they are different, reflect their orientations:\n    if (A.x != b.x) { A.z = TWOPI*0.5 - A.z; } // reflect in Y axis\n    if (A.y != b.y) { A.z = TWOPI - A.z; } // reflect in X axis\n    // also, actually clamp the position on screen\n    A.xy = b.xy; \n    \n    //add current pressure to memory\n    A.w = pressure;\n    \n    //Initializes particles on frame 0 (the start)\n    if (iFrame == 0) {\n        //Creates each pixel of size N by N\n        // *** You may edit this variable depending on screen size. I have it\n        //set to 40 for an 800 x 450 screen, but if you are double the size,\n        //you may set it to 80. ***\n        float N = 40.;\n        //Also rounds each on screen pixel to nearest N\n        A.xy = round(fragCoord/N) * N;\n        //Noise variable is created using A.xy isntead of fragCoord so that\n        //the particle has consistent noise.\n        vec4 noise = random4(vec3(A.xy, iFrame));\n        \n        //Random direction is chosen\n        A.z = noise.z * TWOPI;\n    }\n    \n    //Data of A is sent to fragColor of the buffer.\n    fragColor = A;\n}",
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
				"code": "//BUFFER B: This buffer takes data from buffer A and uses it to create actual\n//visual data for the agents, such as trail data.\n\n//The basis for this code is from https://www.shadertoy.com/view/7fl3zH\n//By Graham Wakefield, with my changes.\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    //takes current coordinate and scales it to (0,0)-(1,1), aka normalize\n    vec2 uv = fragCoord / iResolution.xy;\n    \n    //Gets the state of A (the current particle data)\n    vec4 A = texture(iChannel0, uv);\n    //And the previoius state of B (the trails and other visual data)\n    vec4 B = texture(iChannel1, uv);\n    \n    \n    //This makes the previous frame \"decay\" a little, so the last frame\n    //is still there but less opaque, which creates the trail effect.\n    B *= 0.925;\n    \n    //Gets distance from the actual pixel coordinate to the particle being\n    //tracked\n    float d = distance(fragCoord, A.xy);\n    \n    //If d is less than 50, it adds a new diffused particle to B, with its\n    //intensity scaled off the distance from the particle, essentially making\n    //a small light with the halo radius of 50 pixels.\n    if (d < 50.){\n            B += vec4((1.5/d)*1.,(1.5/d)*1.,(1.5/d)*1.,(1.5/d)*1.);\n        }\n    \n    //Data for visuals of particle/trails is added to the fragColor of the\n    //buffer.\n    fragColor = B;\n}",
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
				"code": "//BUFFER C: The attractor\n\n//The basis for this code is from https://www.shadertoy.com/view/7fl3zH\n//By Graham Wakefield, with my changes.\n\n//This buffer creates the \"air pocket\" that can be controlled by clicking and\n//holding anywhere on the screen. It creates pressure that attracts the agents\n//towards it so that they can have a breath of fresh air.\n\n//Gaussian blur matrix\nmat3 gaussBlur = mat3(\n        1, 2, 1,\n        2, 4, 2,\n        1, 2, 1\n    ) * 1.0/16.0;\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord ) {\n\n    //takes current coordinate and scales it to (0,0)-(1,1), aka normalize\n    vec2 uv = (fragCoord / iResolution.xy);\n    \n    //Creates a vec4 C that takes data from the previous frame\n    vec4 C = texture(iChannel2, uv);\n    \n    //Previous frame is given a gaussian blur\n    vec4 N = texture(iChannel2, (fragCoord + vec2(0, 1))/iResolution.xy);\n    vec4 S = texture(iChannel2, (fragCoord + vec2(0, -1))/iResolution.xy);\n    vec4 E = texture(iChannel2, (fragCoord + vec2(1, 0))/iResolution.xy);\n    vec4 W = texture(iChannel2, (fragCoord + vec2(-1, 0))/iResolution.xy);\n    vec4 NE = texture(iChannel2, (fragCoord + vec2(1, 1))/iResolution.xy);\n    vec4 SE = texture(iChannel2, (fragCoord + vec2(1, -1))/iResolution.xy);\n    vec4 NW = texture(iChannel2, (fragCoord + vec2(-1, 1))/iResolution.xy);\n    vec4 SW = texture(iChannel2, (fragCoord + vec2(-1, -1))/iResolution.xy);\n    C = ((NE+SE+NW+SW) + 2.*(N+E+S+W) + 4.*C)/16.;\n    \n    //decay of C so that the attractor (which appears as a membrane) does\n    //not stay on the screen forever\n    C = C * 0.9;\n\n    //Checks if mouse is held on the screen\n    if (iMouse.z > 0.0) {\n        //saves mouse position\n        vec2 p = iMouse.xy;\n        //saves distance from current coordinate to mouse coordinate\n        float d = distance(fragCoord, p);\n        //generates a diffused light based on distance, similar to the agents,\n        //except much larger halo and larger actual light, which will create\n        //a different appearance when the other CA system takes it over\n        if (d < 150.){\n            //Adds it to C as well\n            C += vec4((5./d)*1.,(5./d)*1.,(5./d)*1.,(5./d)*1.);\n        }\n    }\n    \n    //C is clamped from 0 to 1\n    C = clamp(C, 0., 1.);\n    \n    //C is added to the fragColor of the buffer\n    fragColor = C;\n}",
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
				"code": "//BUFFER D: Takes image data from buffers B (particles) and C (attractor) and\n//Combines them into one image so that the image can be processed by the image\n//buffer.\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord) {\n    \n    //takes current coordinate and scales it to (0,0)-(1,1), aka normalize\n    vec2 uv = (fragCoord / iResolution.xy);\n    \n    //Gets data from buffer B\n    vec4 B = texture(iChannel1, uv);\n    //Gets data from buffer C\n    vec4 C = texture(iChannel2, uv);\n    \n    //Adds data from C to the buffer's fragColor, taking only the red data\n    //and modifying it so that its appearance will be ready for the image buffer\n    //to make it appear like a membrane.\n    fragColor = C * vec4(0.5, 0, 0, 0);\n    \n    //Adds data from buffer B to the buffer's fragColor, taking only the red\n    //and blue data and modifying them, so that the CA of the image buffer will\n    //make them look like blue creatures with pink spacesuit membranes.\n    fragColor += (B * vec4(0.25, 0, 0.25, 0));\n    \n}",
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
			"id": "NcsGWj",
			"date": "1773613427",
			"viewed": 48,
			"name": "Space Strugglers",
			"username": "Robert	Jamrocha-Tullo",
			"description": "a3",
			"likes": 3,
			"published": 1,
			"flags": 32,
			"usePreview": 0,
			"tags": [
				"datt4950"
			],
			"hasliked": 0,
			"parentid": "fclGWj",
			"parentname": "DATT4950 A3 Robert"
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
				"code": "/*\n\n218856542\n\nDATT4950 Final Project\n\nRobert Jamrocha-Tullo\n\n\"Chasing Rays of Light\"\n\nINTERACTIONS: You may zoom in by holding on an area with the mouse button, and\nyou may reset the positions of the agents by pressing the space button, which\nis good for full screen. The default variables were intended to be used on an\n800 x 450 sized screen, however, they also work well on 1920 x 1080, so their\nshould not be a need to edit any variables. Two-way interactions between the\nagents and the rays of light may be unique throughout the running of the\nshadertoy, so watching for longer may help, but the overarching interaction\ntypes should be visible in under a minute.\n\nDESCRIPTION: This shadertoy is a reimagining of my assignment 2, using topics\nI have learned from both assignments 2 and 3, extending those topics further\nand adding some more topics I have learned. It essentially creates\nautonomous fireflies in the way I wanted to make them when I first did\nassignment 2. Each firefly is now tied to an actual agent, and can actually\nsense when light is on the screen. I also wanted to give the attractor more\ninteresting behaviour than just being held by the mouse and attracting agents\nto that point, like in my last assignment. This time around, when an agent\ngets near where the attractor would be, their region begins to light up, and\ntherefore attracts more agents to that region of the screen. This way, there\nis actual meaningful two-way interaction between the agents and their\nattractor. The way that the CA and reaction diffusion makes the fireflies look\nand move is very lifelike, and their movement patterns around the lights are\nvery interesting to see. Due to the two-way interaction, they often 'discover'\nan area that begins to show light, which makes it look like they are telling\ntheir friends to come over to that region- sometimes creating multiple flocks\nat a time, instead of just individually crowding around a single area.\nInterestingly enough, because of the tie to regions, they actually get closer\nand closer as they attract, the regions get smaller, and they shift around.\n\nTopics were learned from lectures and labs by Graham Wakefield. some code from\nhim was implemented and edited into this shadertoy, such as the following:\nhttps://alicelab.world/digm5950/glsl.html\nhttps://alicelab.world/digm5950/glsl.html#randomnoise\nhttps://www.shadertoy.com/view/W3tBRN\nhttps://www.shadertoy.com/view/7fl3zH\nhttps://www.shadertoy.com/view/t3cBRN\nhttps://alicelab.world/digm5950/ca.html#forest-fire\nhttps://www.shadertoy.com/view/tXdcDN\nhttps://www.shadertoy.com/view/7fl3zH\nhttps://alicelab.world/digm5950/glsl.html#mouse-input\n\nSpecifics on how each source's code was implemented are further detailed in\nthe buffers in which they are used.\n\nSmoothlife concepts (although parameters have been heavily\nmodified) come from research by Stephan Rafler, found at:\nhttps://arxiv.org/pdf/1111.1567\n\nTECHNICAL REALIZATION: Buffer A is the starting point, and it creates data for\nagents, including position, velocity, their turn angle, and their memory.\nThey start out moving around aimlessly, but will detect light and fly toward\nit. Keyboard functionality was added to reset the states of these agents.\nThe parameters make it so that they move similar to fireflies in both\nstates. Buffer B creates continuous CA (similar to forest fire). The params\nin this buffer make it look like fuzzy fire particles. Buffer C uses the\nposition data of agents from buffer A to determine an area to show these fire\nparticles from buffer B that tapers off, which creates a firefly-looking\neffect. Buffer D was something that I tested around with, until I found that\npulling from buffer A (the agent positions) and using them to determine their\ndistance from where the light source would be (originally just a diffused\nlight controlled by a sin wave), made for an interesting two-way interaction,\nwhere a firefly stumbling onto an area near the source would create a light\nin its region, therefore 'discovering' that light and attracting its friends.\nThe visual data of the light is sent back to buffer A and is used as an\nattractor. Finally, the image buffer completes a couple visual functions: it\nadds some reaction diffusion into the mix, creating different levels of blur\nto both the agents and the attractor. Using noise on the offset made the\nagent's blur look like wings flapping, and using heavy blur on the attractor\nmade it look like rays of sunlight. I also implemented a zoom effect which was\nrather tricky. I had to reimplement the blur function in the image buffer\ninstead of just calling it. Finally, smoothlife was implemented onto the\nagents, which after some time playing with parameters and outputs, gave them\nthat orange/yellow glow that makes it look like the light-up part of a\nfirefly. Any future implementations would likely focus around the attractor,\nspecifically the source of the light, possibly giving it more autonomous\nmovement.\n\n*/\n\n//IMAGE: The image buffer takes data from buffer C (The actual visuals of\n//the agents and their fire particle effects), as well as data from buffer D\n//(the rays of light/the attractor). It applies a blur function to both of the\n//images from these buffers, with noise for buffer C so that the blur looks\n//like the flapping of wings (and overall makes the fireflies look more\n//orange), and buffer D without noise but a much higher blur factor, to\n//further diffuse the light. Smoothlife is also implemented on a separate\n//retrieval of buffer C's data, to allow the centre of each agent to actually\n//look like a lit up firefly. In the end, all of these images are added\n//together to make the final frame.\n\n//The basis of smoothlife was inspired by lectures from Graham Wakefield.\n//Many concepts used in this buffer (although parameters have been heavily\n//modified) come from research by Stephan Rafler, found at:\n// https://arxiv.org/pdf/1111.1567\n//Some functions, such as blur functions, were implemented and edited from\n// https://www.shadertoy.com/view/W3tBRN\n//by Graham Wakefield.\n//Mouse functionality was implemented (and edited) from:\n// https://alicelab.world/digm5950/glsl.html#mouse-input\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord ) {\n\n    //takes current coordinate and scales it to (0,0)-(1,1), aka normalize\n    vec2 uv = fragCoord / iResolution.xy;\n    \n    //a texture is created from buffer C (the visuals of agents)\n    vec4 C = texture(iChannel0, uv);\n    //a texture is created from buffer D (the rays of light)\n    vec4 B = texture(iChannel1, uv);\n    //a noise variable is created based on iTime, so that later on in the\n    //code, the blur variable for the agents will move over time, making a\n    //wing flapping effect.\n    vec2 wingNoise = random2(iTime);\n    //variables containing the shadertoy's resolution and current fragCoord\n    //are created, this just made it easier for me to code the zoom effect\n    //later on.\n    vec2 resolution = iResolution.xy;\n    vec2 coordinate = fragCoord;\n    \n    //A variable for magnification is created, therefore pressing the mouse\n    //(mostly) just updates the factor that renders the sketch.\n    //Default value is 1x (no zoom) when mouse is not pressed.\n    float magnification = 1.;\n    \n    //from the alicelab website, code that makes it so that you may zoom in at\n    //a specific point by holding the mouse button when the cursor is dragged\n    //over that location.\n    //checks if mouse is pressed\n    if(iMouse.z > 0.0) {\n        //sets the magnification to 5x, to make a 5x zoom\n        magnification = 5.;\n        //sets the image to be 5x smaller than the standard image, and sets it\n        //to be around where the cursor is.\n        uv /= magnification;\n        uv += iMouse.xy / ((iResolution.xy + (iResolution.xy / (magnification - 1.0))));\n    }\n    \n    //This is a reimplementation of the gaussian blur function from:\n    // https://www.shadertoy.com/view/W3tBRN\n    //It needed to be implemented (and edited) in the image buffer, so that\n    //the updated uv value from zooming could be added, and so that the\n    //magnification values could update the fragCoord and resolution, which\n    //allows the shadertoy to render the zoom of the gaussBlur'd elements.\n    //This was particularily tricky to figure out so I apologize for the long\n    //lines of code\n    //The radius value for the blur effect is 20 pixels for the agents\n    float sigma = float(20)/3.14;   \n    float expFactor = -0.5/(sigma*sigma);\n    float weight = 1.;\n    vec4 sum = texture(iChannel0, uv) * weight;\n    float weightSum = weight;\n    for (int i=1; i<=20; i++) {\n        //Here is where the noise is applied to make a rapid \"wing flap\".\n        vec2 offset = (float(i)) * vec2(wingNoise.x,wingNoise.y);\n        float weight = exp(float(i*i) * expFactor);\n        //where I added zoom effects to the blur function.\n        sum += texture(iChannel0, ((coordinate / magnification + iMouse.xy / ((iResolution.xy + (iResolution.xy / (magnification - 1.0))))) + offset)/resolution + iMouse.xy / ((iResolution.xy + (iResolution.xy / (magnification - 1.0))))) * weight;\n        sum += texture(iChannel0, ((coordinate / magnification + iMouse.xy / ((iResolution.xy + (iResolution.xy / (magnification - 1.0))))) - offset)/resolution + iMouse.xy / ((iResolution.xy + (iResolution.xy / (magnification - 1.0))))) * weight;\n        weightSum += weight * 2.0;\n    \n    }\n    //This blur is given to the image from buffer C (the agents).\n    C = sum / weightSum;\n    \n    //The same blur is implemented for the image from buffer D: the light rays\n    //This time, the radius is a very high value to create lots of blur.\n    sigma = float(10000)/3.14;   \n    expFactor = -0.5/(sigma*sigma);\n    weight = 1.;\n    sum = texture(iChannel1, uv) * weight;\n    weightSum = weight;\n    for (int i=1; i<=20; i++) {\n        //No noise on the offset. We don't want rapid flashing.\n        vec2 offset = (float(i)) * vec2(1.,1.);\n        float weight = exp(float(i*i) * expFactor);\n        //where I added zoom effects to the blur function.\n        sum += texture(iChannel1, ((coordinate / magnification + iMouse.xy / ((iResolution.xy + (iResolution.xy / (magnification - 1.0))))) + offset)/resolution + iMouse.xy / ((iResolution.xy + (iResolution.xy / (magnification - 1.0))))) * weight;\n        sum += texture(iChannel1, ((coordinate / magnification + iMouse.xy / ((iResolution.xy + (iResolution.xy / (magnification - 1.0))))) - offset)/resolution + iMouse.xy / ((iResolution.xy + (iResolution.xy / (magnification - 1.0))))) * weight;\n        weightSum += weight * 2.0;\n    \n    }\n    //This blur is giben to the image from buffer D.\n    B = sum / weightSum;\n    \n    //Creates vec4 A which retrieves data from buffer C (the agents), but\n    //WITHOUT the blur we just added.\n    vec4 A = texture(iChannel0, uv);\n    \n    //SMOOTHLIFE IMPLEMENTATION:\n    \n    //initializes inner and outer radii that will be used for functions to\n    //determine size for density\n    float inner_radius = 3.5;\n    float outer_radius = 10.0;\n    \n    //initializes variables that will be added to and used to determine\n    //population for density\n    float inner_sum = 0.0;\n    float outer_sum = 0.0;\n    //loops over the diameter of the outer radius\n    for (float x = -outer_radius; x <= outer_radius; x++) {\n        \n        //and the diameter of the inner radius\n        for (float y = -outer_radius; y <= outer_radius; y++){\n        \n            //creates a variable for texel\n            vec2 pixel = vec2(x,y);\n            vec2 texel = pixel / iResolution.xy;\n            //which is used to get the texture of that area, which will in the\n            //future be used to calculate life population and then density\n            float life = texture(iChannel0, uv + texel).x;     \n            \n            //distance is calculated,\n            float dist = length(pixel);\n            \n            //and then used in a sigmoid function to determine if the current\n            //point is in the radial circle we are looking for (otherwise, the\n            //for loop would go over a square).\n            float outer_w = 1.0 - sigmoid(dist, outer_radius, 1.0);\n            float inner_w = 1.0 - sigmoid(dist, inner_radius, 1.0);\n            \n            //Population is calculated\n            outer_sum += life * outer_w;\n            inner_sum += life * inner_w;\n            \n        }\n    \n    }\n    \n    //area of inner circle is calculated with pi r squared\n    float inner_area = 3.14159 * inner_radius * inner_radius;\n    //population and area are used to calculate density\n    float inner_density = inner_sum / inner_area;\n    \n    //area of outer circle is calculated with pi r squared\n    float outer_area = 3.14159 * outer_radius * outer_radius;\n    //outer density is calculated similarly to how inner density was calculated\n    //except that the inner circle's area must be eliminated\n    float outer_density = (outer_sum - inner_sum) / (outer_area - inner_area);\n    \n    //Here are the variables that determine how the smoothlife will look. I\n    //worked both on an 800x 450 screen, and a 1920 x 1080 screen when in\n    //fullscreen, and the values created a good amount of smooth blending\n    //which allowed the centres of the agents to actually look like lit\n    //fireflies.\n    \n    float b1 = 0.25;\n    float b2 = 0.25;\n    float a1 = 0.01;\n    float d1 = 0.01;\n    float d2 = 0.75;\n    float a2 = 0.5;\n    \n    //Rules for transition:\n    //determines a value on if the automata is lonely\n    float notlonely = sigmoid(outer_density, d1, a1);\n    //determines a value on if the automata is crowded\n    float notcrowded = 1.0 - sigmoid(outer_density, d2, a1);\n    //crates a logical AND expression through math to determine that it will\n    //survive if it is not lonely AND not crowded\n    float survive = notlonely * notcrowded;\n    \n    //Rules for birth:\n    //determines value if there is enough density\n    float enough = sigmoid(outer_density, b1, a1);\n    //and if there is not too much density\n    float nottoomuch = 1.0 - sigmoid(outer_density, b2, a1);\n    //then performs a logical AND, automata is born if it is dense enough and\n    //not too dense\n    float birth = enough * nottoomuch;\n    \n    //Creates an interpolation between the transition and birth rules\n    float liveness = sigmoid(inner_density, 0.5, a2);\n    float transition = mix(birth, survive, liveness);\n    \n    //Clamps the transition value from 0 to 1\n    transition = clamp(transition, 0., 1.);\n    \n    //Applies transition to rules to the x and y value of A\n    //These created the best implementation of smoothlife on the buffers\n    A.x = transition;\n    A.y = transition;\n    \n    //C (the blurred agents) is edited to remove the blue values, creating\n    //more orange fireflies.\n    C = vec4(C.r * 1., C.g * 1., C.b * 0., C.a);\n    //A (the smoothlifed agents), are added to C. the red and blue values are\n    //flipped to make the smoothlife appear more red, and the green value is\n    //scaled down to appear less green and more orange/yellow.\n    C += vec4(A.b * 1., A.g * 0.75, A.r * 0., 1.);\n    //The blurred rays of light are added to the image.\n    C += B;\n    \n    //The compiled image is added to fragColor, completing the image!\n    fragColor = C;\n   \n}",
				"name": "Image",
				"description": "",
				"type": "image"
			},
			{
				"outputs": [],
				"inputs": [],
				"code": "//COMMON: contains multiple constants and functions used throughout code\n//functions were sourced from https://alicelab.world/digm5950/glsl.html\n// https://alicelab.world/digm5950/glsl.html#randomnoise\n//and\n// https://www.shadertoy.com/view/W3tBRN\n//as well as lectures from Graham Wakefield.\n\n//Constant variable for two times pi\nconst float TWOPI = 6.283185307179586;\n\n//function for sigmoid transition\nfloat sigmoid(float x, float center, float width) {\n    //x is a variable that changes the transition around center\n    //depending on width\n    return 1.0 / (1.0 + exp(-(x-center)*4.0/width));\n}\n\n\n//Gaussian blur function\n//Was re-implemented and edited in the image buffer\nvec4 blur(sampler2D img, vec2 fragCoord, vec2 resolution, int N, vec2 dir) {\n    float sigma = float(N)/3.14;   \n    float expFactor = -0.5/(sigma*sigma);\n    float weight = 1.;\n    vec4 sum = texture(img, fragCoord/resolution) * weight;\n    float weightSum = weight;\n    for (int i=1; i<=N; i++) {\n        vec2 offset = float(i) * dir;\n        float weight = exp(float(i*i) * expFactor);\n        sum += texture(img, (fragCoord + offset)/resolution) * weight;\n        sum += texture(img, (fragCoord - offset)/resolution) * weight;\n        weightSum += weight * 2.0;\n    \n    }\n    return sum / weightSum;\n}\n\n\n//Below are multiple pseudorandom number generator functions\n\n#define RANDOM_SCALE vec4(.1031, .1030, .0973, .1099)\n\nvec2 random2(float p) {\n    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec2 random2(vec2 p) {\n    vec3 p3 = fract(p.xyx * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec2 random2(vec3 p3) {\n    p3 = fract(p3 * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec3 random3(float p) {\n    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xxy + p3.yzz) * p3.zyx); \n}\n\nvec3 random3(vec2 p) {\n    vec3 p3 = fract(vec3(p.xyx) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yxz + 19.19);\n    return fract((p3.xxy + p3.yzz) * p3.zyx);\n}\n\nvec3 random3(vec3 p) {\n    p = fract(p * RANDOM_SCALE.xyz);\n    p += dot(p, p.yxz + 19.19);\n    return fract((p.xxy + p.yzz) * p.zyx);\n}\n\nvec4 random4(float p) {\n    vec4 p4 = fract(p * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);   \n}\n\nvec4 random4(vec2 p) {\n    vec4 p4 = fract(p.xyxy * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec3 p) {\n    vec4 p4 = fract(p.xyzx * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec4 p4) {\n    p4 = fract(p4  * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}",
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
				"code": "//BUFFER A: This buffer creates the data of position, direction and\n//movement for the particle agents moving around the screen.\n//Also draws data from buffer D to determine each particle's attraction level\n//to the attractor.\n\n//The basis for this code is from https://www.shadertoy.com/view/7fl3zH\n//By Graham Wakefield, with my changes.\n\n//Keyboard functionality was implemented from:\n// https://www.shadertoy.com/view/t3cBRN\n//by Graham Wakefield.\n\n//This buffer creates \"pixels\" (comprised of regions that take up multiple\n//pixels on screen) that track a particle.\n//vec4 A is the variable used for the current \"pixel\"\n//its w contains the nearest particle's memory, its x and y track the nearest\n//particle's location, and the z contains its direction.\n\n//Function to determine nearest particle. It takes the location of the current\n//pixel and its neighbour, then determines which is closer to their particles.\nvec4 getNearestParticle(vec4 A, vec2 fragCoord, vec2 offset) {\n    //Creates a variant of 'A' for neighbour\n    vec4 N = texture(iChannel0, (fragCoord+offset)/iResolution.xy);\n    //gets the distances for current pixel to particle\n    float d1 = distance(fragCoord, A.xy);\n    //and distance for neighbouring particle to its pixel\n    float d2 = distance(fragCoord, N.xy);\n    //tracks neighbour's particle if it is closer to current pixel\n    if (d2 < d1) { return N; } else { return A; }\n}\n\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord) {\n    //takes current coordinate and scales it to (0,0)-(1,1), aka normalize\n    vec2 uv = fragCoord / iResolution.xy;\n    //updates A with whatever data was on the previous frame\n    vec4 A = texture(iChannel0, uv);\n    \n    //For loop that performs the getNearestParticle function from earlier\n    //on all the pixel's neighbours, effectively making sure that the pixel\n    //is tracking its nearest neighbour.\n    for (int x=-2; x<=2; x++) {\n        for (int y=-2; y<=2; y++) {\n            A = getNearestParticle(A, fragCoord, vec2(x, y));\n        }\n    }\n    \n    //Noise variable generated, using the particle's position and the time\n    //elapsed as a seed, ensuring that each particle will stay consistent to\n    //itself while also having some randomness.\n    vec4 noise = random4(vec3(A.xy, iTime));\n    \n    //the speed and direction change of the particle are initialized, however\n    //these values will soon update.\n    float speed = 50.;\n    float turn = 1.;\n    \n    //This part of the buffer actually pulls from buffer D, which contains\n    //an attractor field. It uses this data to create a \"light attraction\"\n    //that the particles sense.\n    //The attraction is done by seeing how much visual data is on that frame,\n    //and if there is more, they follow that visual data.\n    \n    vec4 C = texture(iChannel2, A.xy / iResolution.xy);\n    float lightAttraction = C.g;\n    \n    //Compares strength of light attraction to the particle's memory\n    //of light attraction from last frame\n    float memory = A.w;\n    \n    //Checks if the light attraction is stronger than last frame\n    if (lightAttraction > memory) {\n        //If so, go keep following in the direction of the new light.\n        //Direction is changed to be more consistent\n        turn = 0.01;\n        //And speed picks up.\n        speed = 100.;\n    } else {\n        //If there is no sensed nearby light change, keep changing\n        //directions, and take it slower.\n        turn = 1.;\n        speed = 50.;\n    }\n    \n    //The direction is updated, using the amount of direction change variable,\n    //and a bit of randomization from the earlier noise function.\n    A.z += turn * (noise.x*2. - 1.);\n    \n    //Creates a velocity using cos and sin to create x and y variables from\n    //direction variable z, and combines it with speed, so there is direction\n    //and magnitude.\n    vec2 vel = vec2(cos(A.z), sin(A.z)) * speed;\n    //That velocity is then placed into the x and y variables.\n    A.xy += vel * iTimeDelta;\n    \n    // get the bounded position within the screen image\n    vec2 b = clamp(A.xy, vec2(0), iResolution.xy);\n    //compare bounded/actual positions:if different, reflect orientations:\n    if (A.x != b.x) { A.z = TWOPI*0.5 - A.z; } // reflect in Y axis\n    if (A.y != b.y) { A.z = TWOPI - A.z; } // reflect in X axis\n    // also, actually clamp the position on screen\n    A.xy = b.xy; \n    \n    //add current light attraction to memory\n    \n    A.w = lightAttraction;\n    \n    //Initializes particles on frame 0 (the start)\n    //Will also reinitialize positions (and amounts) when space bar is pressed.\n    //This is where the keyboard functionality code cited above is implemented.\n    if (iFrame == 0 || texture(iChannel3, vec2(32./256., 0.)).r > 0.f) {\n        //Creates each pixel of size N by N\n        float N = 100.;\n        //Also rounds each on screen pixel to nearest N\n        A.xy = round(fragCoord/N) * N;\n        //Noise variable is created using A.xy isntead of fragCoord so that\n        //the particle has consistent noise.\n        vec4 noise = random4(vec3(A.xy, iFrame));\n        \n        //Random direction is chosen\n        A.z = noise.z * TWOPI;\n    }\n    \n    //Data of A is sent to fragColor of the buffer.\n    fragColor = A;\n}",
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
					}
				],
				"code": "//BUFFER B: purpose of this buffer is to create continuous cellular automata,\n//making pixels exist in one of three states, and sending this data\n//to buffer C to determine if the fire particles of the fireflies will be\n//displayed, which they will if they are near an agent.\n\n//https://alicelab.world/digm5950/ca.html#forest-fire\n//and\n//https://www.shadertoy.com/view/tXdcDN\n\n//Code from these examples were used as a basis to create the cellular automata\n//system that creates state values for the pixels to exist as.\n\n//three states of fire particles:\nfloat empty = 0.0;//no fire particles\nfloat fire = 0.5;//fire particle exists\nfloat cinder = 1.0;//fire particle is a cinder and may die out\n\n//chance of fire spreading to another pixel:\nfloat spreadProbability = 0.45;\n//the chance of a random cell becoming a fire particle:\nfloat fireProbability = 0.01;\n//chance of a fire particle becoming a cinder:\nfloat fadeProbability = 0.6;\n//chance of other nearby particles having their fire absorbed and becoming a\n//cinder when near another cinder:\nfloat absorbProbability = 0.75;\n//chance of a cinder dying out:\nfloat deathProbability = 0.6;\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    //takes current coordinate and scales it to (0,0)-(1,1), aka normalize\n    vec2 uv = fragCoord / iResolution.xy;\n\n    //Get state of self\n    vec4 C  = texture(iChannel0, (fragCoord+vec2( 0, 0))/iResolution.xy);\n    \n    //Get state of neighbouring pixels\n    vec4 E  = texture(iChannel0, (fragCoord+vec2( 1, 0))/iResolution.xy);\n    vec4 W  = texture(iChannel0, (fragCoord+vec2(-1, 0))/iResolution.xy);\n    vec4 N  = texture(iChannel0, (fragCoord+vec2( 0, 1))/iResolution.xy);\n    vec4 S  = texture(iChannel0, (fragCoord+vec2( 0,-1))/iResolution.xy);\n    vec4 NE = texture(iChannel0, (fragCoord+vec2( 1, 1))/iResolution.xy);\n    vec4 NW = texture(iChannel0, (fragCoord+vec2(-1, 1))/iResolution.xy);\n    vec4 SE = texture(iChannel0, (fragCoord+vec2( 1,-1))/iResolution.xy);\n    vec4 SW = texture(iChannel0, (fragCoord+vec2(-1,-1))/iResolution.xy);\n\n    //True if any neighbour is a normal fire particle:\n\tbool nearFire = N.x == fire || E.x == fire \n\t\t\t\t|| W.x == fire || S.x == fire \n\t\t\t\t|| NE.x == fire || SE.x == fire \n\t\t\t\t|| NW.x == fire || SW.x == fire;\n\t\n\t//True if any neighbour is a cinder:\n\tbool nearCinder = N.x == cinder || E.x == cinder \n\t\t\t\t|| W.x == cinder || S.x == cinder \n\t\t\t\t|| NE.x == cinder || SE.x == cinder \n\t\t\t\t|| NW.x == cinder || SW.x == cinder;\n    //Create a variable to store value as one of the 3 states:\n    float value = C.x;\n    \n    //generate a vec4 of noise:\n    vec4 noise = random4(vec3(fragCoord, iTime)); \n    \n    //if pixel is empty\n    if (value == empty) {\n        // are any neighbors fire particles?\n        if (nearFire) {\t\t\t\n            // chance of fire spreading to another pixel\n            if (noise.x < spreadProbability && noise.y < spreadProbability) {\n                value = fire;\n            }\n            //fire may also just randomly come out of the firefly\n            } else if (noise.z < fireProbability && noise.w < fireProbability) {\n                value = fire;\n            }\n    //if pixel is a fire particle\n    } else if (value == fire) {\n        // are any neighbors cinders\n        if (nearCinder && (noise.x < absorbProbability && noise.y < absorbProbability)) {\n            // if chance is met, have firea absorbed and become a cinder\n            value = cinder;\n        } else if (noise.z < fadeProbability && noise.w < fadeProbability) {\t\t\n            //chance of fire particle becoming a cinder on its own\n            value = cinder;\n        }\n    } else if (value == cinder && noise.x < deathProbability && noise.y < deathProbability) {\n        //a cinder has a chance of dying out\n        value = empty;\n    } \n    \n    // update this pixel's state:\n    fragColor = vec4(value);\n   \n}",
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
				"code": "//BUFFER C: This buffer takes data from buffer A, B, and itself, and uses that\n//data to create visuals for the agents, adding fire particles around them.\n\n//The basis for this code is from https://www.shadertoy.com/view/7fl3zH\n//By Graham Wakefield, with my changes.\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    //takes current coordinate and scales it to (0,0)-(1,1), aka normalize\n    vec2 uv = fragCoord / iResolution.xy;\n    \n    //Gets the state of buffer A (the current particle data)\n    vec4 A = texture(iChannel0, uv);\n    //And the previoius state of C (the trails and other visual data)\n    vec4 B = texture(iChannel1, uv);\n    //And the data of the fire particles\n    vec4 C = texture(iChannel2, uv);\n    \n    //This makes the previous frame \"decay\" a little, so the last frame\n    //is still there but less opaque, which creates a trail effect.\n    B *= 0.85;\n    \n    //Gets distance from the actual pixel coordinate to the particle being\n    //tracked\n    float d = distance(fragCoord, A.xy);\n    \n    //if distance of the actual pixel coordinate from an agent is less than\n    //20 pixels, it reveals the fire particles in the surrounding 20 pixels,\n    //scaled by a factor so that the particles fade out when they get too far\n    //from the agent.\n    if (d < 20.){\n            B += vec4(C.x * (2./d), 0., C.x * (2./d), 0.);\n        }\n    \n    //Data for visuals of particle/trails is added to the fragColor of the\n    //buffer.\n    fragColor = B;\n}",
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
				"code": "//BUFFER D: The attractor/rays of light\n\n//The basis for this code is from https://www.shadertoy.com/view/7fl3zH\n//By Graham Wakefield, with my changes.\n\n//This buffer creates rays of light that move left and right across the screen\n//with a sin wave function. The actual appearance of these rays of light are\n//tied to their distance from an agent, so they only appear when an agent\n//is close by. Data from this buffer is sent to buffer A as an attractor\n//value, making for a two-way interaction between the agents and the attractor.\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord ) {\n\n    //takes current coordinate and scales it to (0,0)-(1,1), aka normalize\n    vec2 uv = (fragCoord / iResolution.xy);\n    \n    //Creates a vec4 A that takes particle position data from buffer A\n    vec4 A = texture(iChannel0, uv);\n    //Creates a vec4 C that takes data from the previous frame\n    vec4 C = texture(iChannel2, uv);\n    \n    //Previous frame is given a gaussian blur\n    vec4 N = texture(iChannel2, (fragCoord + vec2(0, 1))/iResolution.xy);\n    vec4 S = texture(iChannel2, (fragCoord + vec2(0, -1))/iResolution.xy);\n    vec4 E = texture(iChannel2, (fragCoord + vec2(1, 0))/iResolution.xy);\n    vec4 W = texture(iChannel2, (fragCoord + vec2(-1, 0))/iResolution.xy);\n    vec4 NE = texture(iChannel2, (fragCoord + vec2(1, 1))/iResolution.xy);\n    vec4 SE = texture(iChannel2, (fragCoord + vec2(1, -1))/iResolution.xy);\n    vec4 NW = texture(iChannel2, (fragCoord + vec2(-1, 1))/iResolution.xy);\n    vec4 SW = texture(iChannel2, (fragCoord + vec2(-1, -1))/iResolution.xy);\n    C = ((NE+SE+NW+SW) + 2.*(N+E+S+W) + 4.*C)/15.;\n    \n    //decay of C so that the rays of light do not stay on the screen forever\n    C = C * 0.9;\n    \n    //the position of the source of the light is created. It is determined\n    //by a sin wave and iTime, so that the source of the light bounces from\n    //the left side of the screen to the right side of the screen over time.\n    vec2 lightPos;\n    //light source only moves across the x axis\n    lightPos.y = iResolution.y/2.;\n    lightPos.x = abs(sin(iTime/10.)) * iResolution.x;\n    \n    //The distance between the light source and any agent is determined.\n    float d = distance(lightPos, A.xy);\n        \n    //if the distance between the light source and an agent is less than 150\n    //pixels, that agent's regen will light up yellow, with its intensity\n    //scaled by a factor of how close the agent is to the light source.\n    if (d < 150.){\n        C += vec4((5./d)*0.1,(5./d)*0.1,(5./d)*0.,(5./d));\n    }\n    \n    //C is clamped from 0 to 1\n    C = clamp(C, 0., 1.);\n    \n    //C is added to the fragColor of the buffer\n    fragColor = C;\n}",
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
			"mFlagKeyboard": true,
			"mFlagMultipass": true,
			"mFlagMusicStream": false
		},
		"info": {
			"id": "scfSDH",
			"date": "1775507293",
			"viewed": 43,
			"name": "Chasing Rays of Light",
			"username": "Robert	Jamrocha-Tullo",
			"description": "final project",
			"likes": 2,
			"published": 1,
			"flags": 48,
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
				"code": "//GS/DIGM5950M\n//Student Number: 214684153\n//Assignment: Final Project\n//Name: XingbangTang\n\n\n// Image — Lenia + species trail + particle dots\n\n// iChannel0: bufA  (Lenia)\n// iChannel1: bufB  (particle state)\n// iChannel2: bufC  (trail: .r=intensity, .g=speciesID/9)\n\n/*\nInstruction:\n \n   A Lenia cellular automaton built on top of a particle system.\n   Each particle carries a species identity and leaves a trail behind,\n   allowing multiple species to coexist in the same field at once.\n \n   Instead of evolving as a single uniform lifeform, the system supports\n   competition, suppression, and conversion between species, producing\n   a more dynamic and ecologically-like behavior over time.\n\n\nEcological balance:\n   Species 9 tends to grow uncontrollably and would normally take over the whole screen.\n   In this setup, though, other species compete with it.\n   Their kernels lower the local average density around species 9,\n   pushing its growth below the survival threshold.\n   Interestingly, its dense clusters still act as a kind of baseline,\n   giving nearby species enough density to keep growing.\n\n   The system settles into a dynamic balance — species keep growing,\n   suppressing each other, and converting into one another.\n   This prevents any single species from taking over,\n   and keeps the simulation active over long periods.\n\n\n\nFuture work: \n   move beyond simple collision-based interactions,\n   and use the particle system to model more biologically-inspired behaviors between species, \n   such as coexistence, competition, and evolutionary dynamics.\n\n*/\n\nvec3 speciesColor(float s) {\n    float h = s / 10.0;\n    vec3 rgb = clamp(abs(mod(h*6.0 + vec3(0.,4.,2.), 6.)-3.)-1., 0., 1.);\n    return mix(vec3(1.), rgb, 0.85);\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    vec2 uv = fragCoord / iResolution.xy;\n\n    vec3 lenia = texture(iChannel0, uv).rgb;\n    vec4 A     = texture(iChannel1, uv);          // particle\n    vec2 trail = texture(iChannel2, uv).rg;       // .r=intensity .g=speciesNorm\n\n    vec3 trailColor = speciesColor(trail.g * 9.0);\n\n    vec3 col = lenia;\n\n    // species trail glow\n    // ---------------------------------------\n    //uncomment this line to show trails\n    //col += trailColor * trail.r * 0.5;\n\n    // particle dot colored by species\n    float d  = distance(fragCoord, A.xy);\n    vec3  sc = speciesColor(A.w);\n    \n    // ----------------------------------------\n    //uncomment this line to show particles\n    //col += sc * smoothstep(3., 0., d);\n\n    fragColor = vec4(clamp(col, 0., 1.), 1.);\n}\n",
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
				"code": "// Buffer A — Lenia multichannel, per-pixel species from nearest particle\n//\n// iChannel0: self  (Lenia feedback)\n// iChannel1: bufC  (trail — .r=intensity, .g=speciesID/9)\n\n// Gaussian bell applied element-wise to a mat4.\n// bell(x, m, s) = exp(-(x-m)² / (2s²))\nmat4 bell(in mat4 x, in mat4 m, in mat4 s) {\n    mat4 v = -mult(x-m,x-m)/s/s/2.;\n    return mat4(exp(v[0]),exp(v[1]),exp(v[2]),exp(v[3]));\n}\n\n\n// Compute the 16-kernel weight matrix for a sample at normalised\n// radius r = dist/R (r=0 = center, r=1 = outer edge).\n//   1. Br = betaLen/relR * r  →  which ring each kernel is in\n//   2. height = beta value of that ring (beta0/1/2)\n//   3. mod(Br,1) = fractional phase within the ring  →  bell shape\n// Returns a mat4 of per-kernel weights.\nmat4 getWeight(float r, mat4 _relR, mat4 _betaLen, mat4 _beta0, mat4 _beta1, mat4 _beta2) {\n    mat4 Br = _betaLen / _relR * r;\n    ivec4 Br0=ivec4(Br[0]), Br1=ivec4(Br[1]), Br2=ivec4(Br[2]), Br3=ivec4(Br[3]);\n    mat4 height = mat4(\n        _beta0[0]*vec4(equal(Br0,iv0)) + _beta1[0]*vec4(equal(Br0,iv1)) + _beta2[0]*vec4(equal(Br0,iv2)),\n        _beta0[1]*vec4(equal(Br1,iv0)) + _beta1[1]*vec4(equal(Br1,iv1)) + _beta2[1]*vec4(equal(Br1,iv2)),\n        _beta0[2]*vec4(equal(Br2,iv0)) + _beta1[2]*vec4(equal(Br2,iv1)) + _beta2[2]*vec4(equal(Br2,iv2)),\n        _beta0[3]*vec4(equal(Br3,iv0)) + _beta1[3]*vec4(equal(Br3,iv1)) + _beta2[3]*vec4(equal(Br3,iv2)));\n    mat4 mod1 = mat4(mod(Br[0],1.),mod(Br[1],1.),mod(Br[2],1.),mod(Br[3],1.));\n    return mult(height, bell(mod1, kmu, ksigma));\n}\n\n\n// Broadcast a vec3 RGB value into a mat4 row, selecting the\n// component specified by srcv (0=R, 1=G, 2=B) for each column.\n// Used to route each kernel's source channel independently.\nvec4 getSrc(in vec3 v, in ivec4 srcv) {\n    return v.r*vec4(equal(srcv,iv0)) + v.g*vec4(equal(srcv,iv1)) + v.b*vec4(equal(srcv,iv2));\n}\n\n// Accumulate the growth contributions from all kernels whose\n// destination channel matches ch (0=R, 1=G, 2=B).\nfloat getDst(in mat4 m, in ivec4 ch) {\n    return dot(m[0],vec4(equal(dst0,ch))) + dot(m[1],vec4(equal(dst1,ch)))\n         + dot(m[2],vec4(equal(dst2,ch))) + dot(m[3],vec4(equal(dst3,ch)));\n}\n\n// Sample the Lenia field at pixel xy and expand it into a mat4\n// where each column feeds the correct source channel per kernel.\nmat4 getVal(in vec2 xy) {\n    vec2 txy = mod(xy/iResolution.xy, 1.);\n    vec3 val = texture(iChannel0, txy).rgb;\n    return mat4(getSrc(val,src0), getSrc(val,src1), getSrc(val,src2), getSrc(val,src3));\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    vec2 uv = fragCoord / iResolution.xy;\n\n    // read species ID from trail (persists after particle moves away)\n    vec2 trail = texture(iChannel1, uv).rg;\n    int sid = clamp(int(trail.g * 9.0 + 0.5), 0, 9);\n\n    // fetch species-specific kernel parameters\n    mat4 _betaLen = sp_betaLen(sid);\n    mat4 _beta0   = sp_beta0(sid);\n    mat4 _beta1   = sp_beta1(sid);\n    mat4 _beta2   = sp_beta2(sid);\n    mat4 _relR    = sp_relR(sid);\n    mat4 _mu      = sp_mu(sid);\n    mat4 _sigma   = sp_sigma(sid);\n    mat4 _eta     = sp_eta(sid);\n\n    // ---- Convolution: weighted sum over the disk of radius R ----\n    // Three passes cover all directions without a full 2-D loop:\n    //   1) cardinal axes  2) 45° diagonals  3) all other off-axis pairs\n    mat4 sum   = mat4(0.); // accumulates weighted cell densities\n    mat4 total = mat4(0.); // accumulates weights  →  avg = sum / total\n\n    float r;        // normalised sample radius  (0 = center, 1 = edge)\n    mat4  weight;   // per-kernel weights returned by getWeight()\n    mat4  valSrc;   // cell value expanded into per-kernel source channels\n\n    // Center pixel  (r = 0)\n    r      = 0.;\n    weight = getWeight(r, _relR, _betaLen, _beta0, _beta1, _beta2);\n    valSrc = getVal(fragCoord);\n    sum   += mult(valSrc, weight);\n    total += weight;\n\n    // cardinal axes (+x, -x, +y, -y)\n    for (int x=1; x<=intR; x++) {\n        r=float(x)/R; weight=getWeight(r,_relR,_betaLen,_beta0,_beta1,_beta2);\n        valSrc=getVal(fragCoord+vec2(+x,0)*samplingDist); sum+=mult(valSrc,weight); total+=weight;\n        valSrc=getVal(fragCoord+vec2(-x,0)*samplingDist); sum+=mult(valSrc,weight); total+=weight;\n        valSrc=getVal(fragCoord+vec2(0,+x)*samplingDist); sum+=mult(valSrc,weight); total+=weight;\n        valSrc=getVal(fragCoord+vec2(0,-x)*samplingDist); sum+=mult(valSrc,weight); total+=weight;\n    }\n    \n    // diagonals (45°, r = x√2/R)\n    for (int x=1; x<=intR; x++) {\n        r=sqrt(2.)*float(x)/R;\n        if (r<=1.) {\n            weight=getWeight(r,_relR,_betaLen,_beta0,_beta1,_beta2);\n            valSrc=getVal(fragCoord+vec2(+x,+x)*samplingDist); sum+=mult(valSrc,weight); total+=weight;\n            valSrc=getVal(fragCoord+vec2(+x,-x)*samplingDist); sum+=mult(valSrc,weight); total+=weight;\n            valSrc=getVal(fragCoord+vec2(-x,+x)*samplingDist); sum+=mult(valSrc,weight); total+=weight;\n            valSrc=getVal(fragCoord+vec2(-x,-x)*samplingDist); sum+=mult(valSrc,weight); total+=weight;\n        }\n    }\n    \n    // all remaining off-axis directions (8 symmetrical samples each)\n    for (int y=1; y<=intR-1; y++)\n    for (int x=y+1; x<=intR; x++) {\n        r=sqrt(float(x*x+y*y))/R;\n        if (r<=1.) {\n            weight=getWeight(r,_relR,_betaLen,_beta0,_beta1,_beta2);\n            valSrc=getVal(fragCoord+vec2(+x,+y)*samplingDist); sum+=mult(valSrc,weight); total+=weight;\n            valSrc=getVal(fragCoord+vec2(+x,-y)*samplingDist); sum+=mult(valSrc,weight); total+=weight;\n            valSrc=getVal(fragCoord+vec2(-x,+y)*samplingDist); sum+=mult(valSrc,weight); total+=weight;\n            valSrc=getVal(fragCoord+vec2(-x,-y)*samplingDist); sum+=mult(valSrc,weight); total+=weight;\n            valSrc=getVal(fragCoord+vec2(+y,+x)*samplingDist); sum+=mult(valSrc,weight); total+=weight;\n            valSrc=getVal(fragCoord+vec2(+y,-x)*samplingDist); sum+=mult(valSrc,weight); total+=weight;\n            valSrc=getVal(fragCoord+vec2(-y,+x)*samplingDist); sum+=mult(valSrc,weight); total+=weight;\n            valSrc=getVal(fragCoord+vec2(-y,-x)*samplingDist); sum+=mult(valSrc,weight); total+=weight;\n        }\n    }\n    mat4 avg = sum / (total + EPSILON);\n\n    mat4 growth = mult(_eta, bell(avg,_mu,_sigma)*2.-1.);\n    vec3 growthDst = vec3(getDst(growth,iv0), getDst(growth,iv1), getDst(growth,iv2));\n    vec3 val = texture(iChannel0, uv).rgb;\n    vec3 rgb = clamp(dt*growthDst + val, 0., 1.);\n\n    // First frame or mouse drag: reset to seeded noise\n    if (iFrame==0 || iMouse.z>0.) {\n        float bn = 0.16;\n        vec3 noiseRGB = vec3(\n            noise(fragCoord/R/samplingDist + mod(iDate.w,1.)*100.),\n            noise(fragCoord/R/samplingDist + sin(iDate.w)*100.),\n            noise(fragCoord/R/samplingDist + cos(iDate.w)*100.) );\n        rgb = bn + noiseRGB;\n    }\n\n    fragColor = vec4(rgb, 1.);\n}\n",
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
				"code": "// Buffer B — Particle state\n// Each pixel stores the state of the nearest particle:\n//   .xy = particle position (pixels)\n//   .z  = heading angle (radians)\n//   .w  = species ID (0–9, stored as float)\n//\n// Role of particles in the ecosystem:\n//   Particles do NOT directly overwrite cell values.\n//   Instead, their trails (bufC) carry species information that\n//   bufA reads to select which kernel to apply at each location.\n//   This means particles only shape the *surrounding kernel environment*\n//   of living cells — they act as \"gardeners\" steering growth rules,\n//   not bulldozers that destroy existing life.\n//\n//   Without steering, a particle moving in a straight line through a colony\n//   stamps its species trail across the interior, flipping the kernel and\n//   killing the cells it crosses.  Steering keeps particles on the edges.\n//\n// Particle–cell relationship:\n//   - In regions where cells have already grown (high Lenia luminance),\n//     particles are attracted toward the bright boundary edges.\n//     They orbit around established colonies rather than\n//     cutting straight through, preserving the active kernel zone.\n//   - When a particle does pass near a living region, its species trail\n//     may shift the local kernel — but only gradually, because trail\n//     diffusion and decay (bufC) smooth out abrupt transitions.\n//   - The net effect: particles continuously sculpt the kernel landscape\n//     around cell colonies, enabling new growth patterns to emerge at\n//     the periphery while leaving the interior ecology intact.\n\n// iChannel0: bufA   (Lenia field for attraction)\n// iChannel1: bufB   (particle feedback)\n\n\nvec4 getNearestParticle(vec4 A, vec2 fragCoord, vec2 offset) {\n    vec4 N = texture(iChannel1, (fragCoord+offset)/iResolution.xy);\n    return (distance(fragCoord,N.xy) < distance(fragCoord,A.xy)) ? N : A;\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    vec2 uv = fragCoord / iResolution.xy;\n    vec4 A  = texture(iChannel1, uv);\n\n    // nearest-particle propagation\n    for (int x=-2; x<=2; x++)\n    for (int y=-2; y<=2; y++)\n        A = getNearestParticle(A, fragCoord, vec2(x,y));\n    \n    // per-particle random values\n    vec4 rnd = random4(vec3(A.xy, iTime));\n\n    float speed        = 60.;   // pixels per second\n    float wander       = 0.4;   // random drift when no clear gradient\n    float turnfactor   = 0.6;   // radians to turn toward brighter sensor\n    float sensor_length = 18.;  // how far ahead sensors reach (pixels)\n\n    // Sensors: F=forward, FL=forward-left, FR=forward-right\n    mat2 rot = rotate2d(A.z);\n    vec2 s0  = rot * vec2(1., 0.) * sensor_length + A.xy;\n    vec2 s1  = rot * vec2(1., 1.) * sensor_length + A.xy;\n    vec2 s2  = rot * vec2(1.,-1.) * sensor_length + A.xy;\n\n    // Sample Lenia luminance at each sensor position\n    vec3 c0 = texture(iChannel0, s0/iResolution.xy).rgb;\n    vec3 c1 = texture(iChannel0, s1/iResolution.xy).rgb;\n    vec3 c2 = texture(iChannel0, s2/iResolution.xy).rgb;\n    float F  = dot(c0, vec3(0.333));\n    float FL = dot(c1, vec3(0.333));\n    float FR = dot(c2, vec3(0.333));\n\n    // Steer: wander if forward is brightest, else turn toward brighter side\n    if (F>=FL && F>=FR)   A.z += wander*(rnd.z-0.5)*0.3;\n    else if (FL>=FR)      A.z += turnfactor;\n    else                  A.z -= turnfactor;\n\n    rot   = rotate2d(A.z);\n    A.xy += rot * vec2(speed,0.) * iTimeDelta;\n\n    vec2 b = clamp(A.xy, vec2(0.), iResolution.xy);\n    if (A.x!=b.x) A.z = TWOPI*0.5 - A.z;\n    if (A.y!=b.y) A.z = TWOPI     - A.z;\n    A.xy = b;\n\n    // Place particles on a regular N×N grid, random heading and specie\n    if (iFrame==0) {\n        float N = 100.;\n        A.xy = round(fragCoord/N)*N;\n        vec4 r0 = random4(vec3(A.xy, 0.));\n        A.z  = r0.z * TWOPI;              // random initial heading       \n        A.w  = floor(r0.w * 10.);   // species 0-9\n    }\n\n    fragColor = A;\n}\n",
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
				"code": "// ============================================================\n//  common.glsl — shared constants and helpers for all passes\n//\n//  Multichannel Lenia with up to 16 kernels packed into a 4×4\n//  mat4 (column-major).  Each kernel maps one source RGB channel\n//  to one destination RGB channel.\n// ============================================================\n\n\n// maximum 16 kernels by using 4x4 matrix\n#define EPSILON 0.000001\n#define mult matrixCompMult\n\nconst float samplingDist = 1.;\n\nconst ivec4 iv0 = ivec4(0);\nconst ivec4 iv1 = ivec4(1);\nconst ivec4 iv2 = ivec4(2);\nconst ivec4 iv3 = ivec4(3);\nconst vec4 v0 = vec4(0.);\nconst vec4 v1 = vec4(1.);\nconst mat4 m0 = mat4(v0, v0, v0, v0); // all-zero mat4\nconst mat4 m1 = mat4(v1, v1, v1, v1); // all-one  mat4\n\n// fixed: all species use R=12, T=2 (species3 originally R=10 but approximated)\nconst float R    = 12.;    // kernel radius in pixels\nconst float T    = 2.;     // time-steps \nconst int   intR = int(ceil(R));\nconst float dt   = 1./T;\n\n// ---- Bell-curve kernel shape ----\n// Every ring within a kernel is shaped by a Gaussian bell\n// centered at the ring midpoint (kmu=0.5) with width ksv=0.15.\n// These are the same for all species / kernels.\nconst vec4 kmv    = vec4(0.5);\nconst mat4 kmu    = mat4(kmv, kmv, kmv, kmv);   // ring-bell center\nconst vec4 ksv    = vec4(0.15);\nconst mat4 ksigma = mat4(ksv, ksv, ksv, ksv);   // ring-bell width\n\n// channel routing — identical for all 10 species\nconst mat4 src = mat4(0.,0.,0.,1., 1.,1.,2.,2., 2.,0.,0.,1., 1.,2.,2.,0.);\nconst mat4 dst = mat4(0.,0.,0.,1., 1.,1.,2.,2., 2.,1.,2.,0., 2.,0.,1.,0.);\n// Pre-cast to ivec4 for integer comparisons inside bufA\nconst ivec4 src0=ivec4(src[0]), src1=ivec4(src[1]), src2=ivec4(src[2]), src3=ivec4(src[3]);\nconst ivec4 dst0=ivec4(dst[0]), dst1=ivec4(dst[1]), dst2=ivec4(dst[2]), dst3=ivec4(dst[3]);\n\n// ---- Per-species parameter getters (species 0-9) ----\n// mat4 is column-major: mat4(col0, col1, col2, col3), each col = 4 floats\n\nmat4 sp_betaLen(int s) {\n    if (s==0) return mat4(1.,1.,2.,2., 1.,2.,1.,1., 1.,2.,2.,2., 1.,2.,1.,0.);\n    if (s==1) return mat4(1.,1.,2.,2., 1.,2.,1.,1., 1.,2.,2.,2., 1.,2.,1.,0.);\n    if (s==2) return mat4(1.,1.,1.,2., 1.,2.,1.,1., 1.,1.,1.,2., 1.,1.,2.,0.);\n    if (s==3) return mat4(2.,3.,1.,2., 3.,1.,2.,3., 1.,0.,0.,0., 0.,0.,0.,0.);\n    if (s==4) return mat4(1.,1.,2.,2., 1.,2.,1.,1., 1.,2.,2.,1., 1.,2.,1.,0.);\n    if (s==5) return mat4(1.,1.,2.,2., 1.,2.,1.,1., 1.,2.,2.,2., 1.,3.,1.,0.);\n    if (s==6) return mat4(1.,1.,2.,2., 1.,2.,1.,1., 1.,2.,2.,2., 1.,2.,1.,0.);\n    if (s==7) return mat4(1.,1.,2.,2., 1.,2.,1.,1., 1.,2.,2.,2., 1.,2.,1.,0.);\n    if (s==8) return mat4(1.,1.,2.,2., 1.,2.,1.,1., 1.,2.,2.,2., 1.,2.,1.,0.);\n    /*s==9*/  return mat4(1.,1.,1.,2., 1.,2.,1.,1., 1.,1.,1.,3., 1.,1.,2.,0.);\n}\n\n\n// sp_beta0/1/2 — relative height of ring 0, 1, 2 respectively.\n//   Scales the bell amplitude for that ring.\n//   Rings beyond betaLen are unused (height irrelevant).\n\nmat4 sp_beta0(int s) {\n    if (s==0) return mat4(1.,1.,1.,0., 1.,.8333,1.,1., 1.,.9167,.75,.9167, 1.,.1667,1.,0.);\n    if (s==1) return mat4(1.,1.,1.,0., 1.,.75,1.,1.,   1.,.9167,.75,1.,    1.,.25,1.,0.);\n    if (s==2) return mat4(1.,1.,1.,.0833, 1.,.8333,1.,1., 1.,1.,1.,1.,     1.,1.,1.,0.);\n    if (s==3) return mat4(.25,1.,1.,.25, 1.,1.,.25,1., 1.,0.,0.,0.,         0.,0.,0.,0.);\n    if (s==4) return mat4(1.,1.,1.,0., 1.,.8333,1.,1., 1.,.9167,.75,1.,    1.,.1667,1.,0.);\n    if (s==5) return mat4(1.,1.,1.,0., 1.,.8333,1.,1., 1.,.9167,.75,.9167, 1.,.1667,1.,0.);\n    if (s==6) return mat4(1.,1.,1.,0., 1.,.75,1.,1.,   1.,.9167,.8333,1.,  1.,.25,1.,0.);\n    if (s==7) return mat4(1.,1.,1.,0., 1.,.8333,1.,1., 1.,.9167,.75,1.,    1.,.1667,1.,0.);\n    if (s==8) return mat4(1.,1.,1.,0., 1.,.75,1.,1.,   1.,.9167,.75,1.,    1.,.1667,1.,0.);\n    /*s==9*/  return mat4(1.,1.,1.,.0833, 1.,.8333,1.,1., 1.,1.,1.,1.,     1.,1.,1.,0.);\n}\n\nmat4 sp_beta1(int s) {\n    if (s==0) return mat4(0.,0.,.25,1., 0.,1.,0.,0., 0.,1.,1.,1.,    0.,1.,0.,0.);\n    if (s==1) return mat4(0.,0.,.25,1., 0.,1.,0.,0., 0.,1.,1.,.9167, 0.,1.,0.,0.);\n    if (s==2) return mat4(0.,0.,0.,1.,  0.,1.,0.,0., 0.,0.,0.,.9167, 1.,0.,0.,0.);\n    if (s==3) return mat4(1.,.75,0.,1., .75,0.,1.,.75, 0.,0.,0.,0.,  0.,0.,0.,0.);\n    if (s==4) return mat4(0.,0.,.25,1., 0.,1.,0.,0., 0.,1.,1.,0.,    0.,1.,0.,0.);\n    if (s==5) return mat4(0.,0.,.25,1., 0.,1.,0.,0., 0.,1.,1.,1.,    0.,1.,0.,0.);\n    if (s==6) return mat4(0.,0.,.25,1., 0.,1.,0.,0., 0.,1.,1.,.9167, 0.,1.,0.,0.);\n    if (s==7) return mat4(0.,0.,.25,1., 0.,1.,0.,0., 0.,1.,1.,.9167, 0.,1.,0.,0.);\n    if (s==8) return mat4(0.,0.,.25,1., 0.,1.,0.,0., 0.,1.,1.,.9167, 0.,1.,0.,0.);\n    /*s==9*/  return mat4(0.,0.,0.,1.,  0.,1.,0.,0., 0.,0.,0.,.9167, 0.,0.,.0833,0.);\n}\n\n\n// beta2 is non-zero only for species 3 (which has 3-ring kernels)\nmat4 sp_beta2(int s) {\n    if (s==3) return mat4(0.,.75,0.,0., .75,0.,0.,.75, 0.,0.,0.,0., 0.,0.,0.,0.);\n    return mat4(0.,0.,0.,0., 0.,0.,0.,0., 0.,0.,0.,0., 0.,0.,0.,0.);\n}\n\n\n// sp_mu — target density for each kernel's growth function.\n//   Growth is maximized when the kernel's neighbourhood average\n//   equals mu, and becomes negative when far from mu.\nmat4 sp_mu(int s) {\n    if (s==0) return mat4(.272,.349,.2,.114,    .447,.247,.21,.462,  .446,.327,.476,.379, .262,.412,.201,0.);\n    if (s==1) return mat4(.175,.382,.231,.123,  .398,.224,.193,.512, .427,.286,.508,.372, .196,.371,.246,0.);\n    if (s==2) return mat4(.118,.174,.244,.114,  .374,.222,.306,.449, .498,.295,.43,.353,  .238,.39,.1,0.);\n    if (s==3) return mat4(.16,.22,.28,.16,      .22,.28,.16,.22,     .28,0.,0.,0.,        0.,0.,0.,0.);\n    if (s==4) return mat4(.204,.359,.176,.128,  .386,.229,.181,.466, .466,.37,.447,.391,  .299,.398,.183,0.);\n    if (s==5) return mat4(.282,.354,.197,.164,  .406,.251,.259,.517, .455,.264,.472,.417, .208,.395,.184,0.);\n    if (s==6) return mat4(.272,.337,.129,.132,  .429,.239,.25,.497,  .486,.276,.425,.352, .21,.381,.244,0.);\n    if (s==7) return mat4(.242,.375,.194,.122,  .413,.221,.192,.492, .426,.361,.464,.361, .235,.381,.216,0.);\n    if (s==8) return mat4(.22,.351,.177,.126,   .437,.234,.179,.489, .419,.341,.469,.369, .219,.385,.208,0.);\n    /*s==9*/  return mat4(.168,.1,.265,.111,    .327,.223,.293,.465, .606,.404,.377,.297, .319,.483,.1,0.);\n}\n\n// sp_sigma — width of the growth bell around mu.\n//   Smaller sigma → sharper peak → more sensitive to exact density.\n//   The last element (sentinel kernel) uses sigma=1 (growth near 0).\nmat4 sp_sigma(int s) {\n    if (s==0) return mat4(.0595,.1585,.0332,.0528, .0777,.0342,.0617,.1192, .1793,.1408,.0995,.0697, .0877,.1101,.0786,1.);\n    if (s==1) return mat4(.0682,.1568,.034,.0484,  .0816,.0376,.063,.1189,  .1827,.1422,.1079,.0724, .0934,.1107,.0712,1.);\n    if (s==2) return mat4(.0639,.159,.0287,.0469,  .0822,.0294,.0775,.124,  .1836,.1373,.0999,.0954, .0995,.1094,.0601,1.);\n    if (s==3) return mat4(.025,.042,.025,.025,     .042,.025,.025,.042,     .025,1.,1.,1.,           1.,1.,1.,1.);\n    if (s==4) return mat4(.0574,.152,.0314,.0545,  .0825,.0348,.0657,.1224, .1789,.1372,.1064,.0644, .0891,.1065,.0773,1.);\n    if (s==5) return mat4(.0646,.1584,.0359,.056,  .0738,.0383,.0665,.1164, .1806,.1437,.0939,.0666, .0815,.1049,.0748,1.);\n    if (s==6) return mat4(.0674,.1576,.0382,.0514, .0813,.0409,.0691,.1166, .1751,.1344,.1026,.0797, .0921,.1056,.0813,1.);\n    if (s==7) return mat4(.061,.1553,.0361,.0531,  .0774,.0365,.0649,.1219, .1759,.1381,.1044,.0686, .0924,.1118,.0748,1.);\n    if (s==8) return mat4(.0628,.1539,.0333,.0525, .0797,.0369,.0653,.1213, .1775,.1388,.1054,.0721, .0898,.1102,.0749,1.);\n    /*s==9*/  return mat4(.062,.1495,.0488,.0555,  .0763,.0333,.0724,.1345, .1807,.1413,.1136,.0701, .1038,.1185,.0571,1.);\n}\n\n// sp_eta — growth weight (step size) for each kernel.\n//   The kernel's growth value is multiplied by eta before being\n//   accumulated into the destination channel's update.\n//   Higher eta → stronger / faster influence from this kernel.\n//   Sentinel (last element) is always 0 — no contribution.\nmat4 sp_eta(int s) {\n    if (s==0) return mat4(.19,.66,.39,.38,    .74,.92,.59,.37,  .94,.51,.77,.92,  .71,.59,.41,0.);\n    if (s==1) return mat4(.138,.544,.326,.256, .544,.544,.442,.198, .58,.282,.396,.618, .382,.374,.376,0.);\n    if (s==2) return mat4(.082,.462,.496,.27,  .518,.576,.324,.306, .544,.374,.33,.528, .498,.43,.26,0.);\n    if (s==3) return mat4(.666,.666,.666,.666, .666,.666,.666,.666, .666,0.,0.,0.,      0.,0.,0.,0.);\n    if (s==4) return mat4(.116,.448,.332,.392, .398,.614,.448,.224, .624,.352,.342,.634, .362,.472,.242,0.);\n    if (s==5) return mat4(.082,.544,.26,.294,  .508,.56,.326,.21,   .638,.346,.384,.748, .44,.366,.294,0.);\n    if (s==6) return mat4(.15,.474,.342,.192,  .524,.598,.426,.348, .62,.338,.314,.608,  .292,.426,.346,0.);\n    if (s==7) return mat4(.144,.506,.332,.3,   .502,.58,.344,.268,  .582,.326,.418,.642, .39,.378,.294,0.);\n    if (s==8) return mat4(.174,.46,.31,.242,   .508,.566,.406,.27,  .588,.294,.388,.62,  .348,.436,.39,0.);\n    /*s==9*/  return mat4(.076,.562,.548,.306,  .568,.598,.396,.298, .59,.396,.156,.426,  .558,.388,.132,0.);\n}\n\n// sp_relR — relative radius of each kernel as a fraction of R.\n//   Actual pixel radius = relR * R.\n//   Allows different kernels to sense at different spatial scales\n//   within the same species.  Species 3 uses relR=1 for all kernels.\nmat4 sp_relR(int s) {\n    if (s==0) return mat4(.91,.62,.5,.97,  .72,.8,.96,.56,  .78,.79,.5,.72,  .68,.55,.82,1.);\n    if (s==1) return mat4(.78,.56,.6,.84,  .76,.82,1.,.68,  .99,.72,.56,.65, .85,.54,.82,1.);\n    if (s==2) return mat4(.85,.61,.5,.81,  .85,.93,.88,.74, .97,.92,.56,.56, .95,.59,.58,1.);\n    if (s==3) return mat4(1.,1.,1.,1.,     1.,1.,1.,1.,     1.,1.,1.,1.,     1.,1.,1.,1.);\n    if (s==4) return mat4(.93,.59,.58,.97, .79,.87,1.,.64,  .67,.68,.5,.85,  .69,.87,.66,1.);\n    if (s==5) return mat4(.85,.62,.69,.84, .82,.86,1.,.5,   .78,.6,.5,.7,    .67,.6,.8,1.);\n    if (s==6) return mat4(.87,.65,.67,.98, .77,.83,1.,.7,   .99,.69,.7,.57,  .89,.84,.76,1.);\n    if (s==7) return mat4(.98,.59,.5,.93,  .73,.88,.93,.61, .84,.7,.57,.73,  .74,.87,.72,1.);\n    if (s==8) return mat4(.87,.52,.58,.89, .78,.79,1.,.64,  .96,.66,.69,.61, .81,.81,.71,1.);\n    /*s==9*/  return mat4(.58,.68,.5,.87,  1.,1.,.88,.88,   .86,.98,.63,.53, 1.,.89,.59,1.);\n}\n\n// ---- Simplex noise (iq) ----\nvec2 _nh(vec2 p) {\n    p = vec2(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)));\n    return -1.0 + 2.0*fract(sin(p)*43758.5453123);\n}\nfloat noise(in vec2 p) {\n    const float K1=0.366025404, K2=0.211324865;\n    vec2 i=floor(p+(p.x+p.y)*K1);\n    vec2 a=p-i+(i.x+i.y)*K2;\n    float m=step(a.y,a.x);\n    vec2 o=vec2(m,1.-m), b=a-o+K2, c=a-1.+2.*K2;\n    vec3 h=max(.5-vec3(dot(a,a),dot(b,b),dot(c,c)),0.);\n    return dot(h*h*h*h*vec3(dot(a,_nh(i)),dot(b,_nh(i+o)),dot(c,_nh(i+1.))), vec3(70.));\n}\n\n// ---- Particle utilities ----\nconst float TWOPI = 6.283185307179586;\n\nmat2 rotate2d(float a) {\n    float s=sin(a), c=cos(a);\n    return mat2(c,-s,s,c);\n}\n\n#define RANDOM_SCALE vec4(.1031,.1030,.0973,.1099)\n\nvec4 random4(vec3 p) {\n    vec4 p4=fract(p.xyzx*RANDOM_SCALE);\n    p4+=dot(p4,p4.wzxy+19.19);\n    return fract((p4.xxyz+p4.yzzw)*p4.zywx);\n}\n",
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
			"viewed": 81,
			"name": "Lenia Multi-Species Particle",
			"username": "Xingbang Tang",
			"description": "reference: https://www.shadertoy.com/view/7lsGDr\nhttps://chakazul.github.io/lenia.html\nThis project extends Lenia by integrating a particle system that allows multiple species to coexist and interact within the same environment.",
			"likes": 7,
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
				"code": "/*\n\nStudent ID: 218763342\nFinal Project\nStudent Name: Zachery Bissoon\n\nreferences used:\nsmoothLife: https://www.shadertoy.com/view/t3dfR2\nDATT4950 ant stigmergy: https://www.shadertoy.com/view/scXGzX\niTime randomness: https://alicelab.world/digm5950/ca.html#pseudo-randomness\nChatGPT 5.2 used for rectangle generation\n\nSnakes and Slimes\n\nNote: FPS drastically changes how the simulation works, I originally tested it at 180FPS, but I \ntested it afterwords on a different computer with 60FPS, and the ants sort of broke. On 60FPS, putting\nthe speed to 65. helps the ants function properly.\n\nUser Interaction: \nUse LMB to zoom in\n\nDefault Values for ants in buffer A:\n\n    float speed = 175.;        \n    float sensorLen = 6.;      \n    float trailfactor = 1.25;    \n    float wanderfactor = 0.55;\n\nDefault Values for smoothLife in buffer B:\n\n    float b1 = 0.25;           0.21 for faster behaviour\n    float b2 = b1 + 0.08;      anything >0.08 gives fast spawning cells\n    float d1 = 0.36;\n    float d2 = d1 + 0.18;\n\n    float a1 = 0.03;\n    float a2 = 0.15;\n    float dt = 0.2;\n\nchanging the period in buffer C will change the spawn rate of the rectangles \n\nyou can change the dimensions of the circles in buffer C at line 44, defaults are 10. and 30.\n\nyou can also change the spawn rate of ants in the nest in buffer A at line 56, changing above 0.01 will spawn lots of ants\n\nDescription:\nI built this off of my assignment 3, which was the ant roadway stigermy. This is a mesh between the ant stigmergy and smoothLife, with a \nslight modifier to the cells based on their height. The ants have changed, now appearing more snake-like in manner. They still follow similar\nrules based on their pheremones, but the pheremone food trails have now been replaced by smoothLife cells. Once finding their way to food, the\nsnakes break up and return to their ant form, spawning smoothLife cells as they keep moving. These food carrying ants can move through the \nsmoothLife cells which influences their shape as well as spreading it further. The non food carriers will eat through the smoothLife cells, \nhelping to slow the spread. The cells also weaken as they approach the top of the screen.\n\nTechnical Realization:\nAs mentioned before, I continued building upon my assignment 3, and integrated the smoothLife lab on top of it. To do this, I added smoothLife\nto Buffer B mostly unchanged, and removed some of the ant stigermy pheromones, in particular the trails to make way for the smoothLife cells.\nTo do this, the ants had to have the smoothLife cells growing off of them, which happens when they grab the food. The other ants eat through\nthe smoothLife cells in order to keep the growth from getting too out of hand. Towards the top of the screen the smoothLife cells become\nweaker. I did this to maintain an open space that showed the ant's movements outside of the smoothLife cells, since they tend to stabilize\nsomewhat quickly. The food generation is largely the same from my assignment 3, but I did change it to spawn clumps of circles instead. I\nfound that to be much more natural looking. The spawn conditions for the ants were drastically reduced, the inital amount of ants was also\nreduced. I changed this in order to allow the smoothLife a chance to grow, since a lot of non food carrier ants would basically not allow \nthe smoothLife to spawn anywhere.\n\nFuture Ideas:\nHave the ants eat the food more effectively, add different food that makes the ants spawn different behaving smoothLife cells, add user\ninteraction in the form of removing/adding smoothLife cells\n\n*/\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord ) {\n    vec2 uv = (fragCoord / iResolution.xy);\n   \n    // zoom in\n    if (iMouse.z > 0.0) {\n        float magnification = 6.;\n        uv /= magnification;\n        uv += iMouse.xy / ((iResolution.xy + (iResolution.xy / (magnification - 1.0))));\n    }\n    \n    \n    // get our cell\n    vec4 A = texture(iChannel0, uv);\n    vec4 B = texture(iChannel1, uv);\n    vec4 C = texture(iChannel2, uv);\n    //vec4 D = texture(iChannel3, uv);\n   \n   \n   vec4 D = texture(iChannel3, uv); //phremones\n\n    fragColor = vec4(D.x); // grayscale\n    \n    // divide position by resolution to view in 0..1\n    //fragColor.xy = A.xy / iResolution.xy;\n    // divide direction by TWOPI to view in 0..1\n    //fragColor.z = A.z / TWOPI;\n    \n    // get distance from this pixel to the particle it is tracking:\n    float d = distance(uv * iResolution.xy, A.xy);\n    //float p = 1/d.;\n    //float p = exp(0.3*-d);\n    float p = smoothstep(2., 0., d);\n    \n    //fragColor = D.xxxx;\n    // trails: note can change 'B' with 'D' to see the pheremones\n    fragColor = mix(B, C, 0.45)*0.9;\n    \n    // agents:\n    fragColor += vec4(p*(1.-A.w), p*A.w, p*0.75, 0);\n   \n}",
				"name": "Image",
				"description": "",
				"type": "image"
			},
			{
				"outputs": [],
				"inputs": [],
				"code": "const float TWOPI = 6.283185307179586;\nconst float PI = 3.141592653589793;\n\n// make a sigmoid transition of x around center with given width\nfloat sigmoid(float x, float center, float width) {\n    return 1.0 / (1.0 + exp(-(x-center)*4.0/width));\n}\n\n\n// Gaussian blur\nvec4 blur(sampler2D img, vec2 fragCoord, vec2 resolution, int N, vec2 dir) {\n    // N/2 .. N/4\n    float sigma = float(N)/3.14;   \n    float expFactor = -0.5/(sigma*sigma);\n    float weight = 1.;\n    vec4 sum = texture(img, fragCoord/resolution) * weight;\n    float weightSum = weight;\n    for (int i=1; i<=N; i++) {\n        vec2 offset = float(i) * dir;\n        float weight = exp(float(i*i) * expFactor);\n        sum += texture(img, (fragCoord + offset)/resolution) * weight;\n        sum += texture(img, (fragCoord - offset)/resolution) * weight;\n        weightSum += weight * 2.0;\n    \n    }\n    return sum / weightSum;\n}\n\n\n#define RANDOM_SCALE vec4(.1031, .1030, .0973, .1099)\n\nvec2 random2(float p) {\n    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec2 random2(vec2 p) {\n    vec3 p3 = fract(p.xyx * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec2 random2(vec3 p3) {\n    p3 = fract(p3 * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec3 random3(float p) {\n    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xxy + p3.yzz) * p3.zyx); \n}\n\nvec3 random3(vec2 p) {\n    vec3 p3 = fract(vec3(p.xyx) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yxz + 19.19);\n    return fract((p3.xxy + p3.yzz) * p3.zyx);\n}\n\nvec3 random3(vec3 p) {\n    p = fract(p * RANDOM_SCALE.xyz);\n    p += dot(p, p.yxz + 19.19);\n    return fract((p.xxy + p.yzz) * p.zyx);\n}\n\nvec4 random4(float p) {\n    vec4 p4 = fract(p * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);   \n}\n\nvec4 random4(vec2 p) {\n    vec4 p4 = fract(p.xyxy * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec3 p) {\n    vec4 p4 = fract(p.xyzx * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec4 p4) {\n    p4 = fract(p4  * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}",
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
				"code": "\n// create a 2D rotation matrix from an angle in radians:\nmat2 rotate2d(float angle) {\n    float s = sin(angle);\n    float c = cos(angle);\n    return mat2(\n        c, -s, \n        s, c\n    ); \n}\n\n// each pixel tracks an agent\n// .xy is the agent location (in pixels)\n// .z is the agent direction (in radians)\n// .w is food carried by the agent\n\n// given current particle \"A\" at pixel `fragCoord`\n// is the particle at `fragCoord+offset` nearer? if so return that.\nvec4 getNearestParticle(vec4 A, vec2 fragCoord, vec2 offset) {\n    // get by neighbour pixel\n    vec4 N = texture(iChannel0, (fragCoord+offset)/iResolution.xy);\n    // distance from my pixel to the particle I'm tracking:\n    float d1 = distance(fragCoord, A.xy);\n    // distance from my pixel to the particle my neighbor is tracking:\n    float d2 = distance(fragCoord, N.xy);\n    // if my neighbor's particle is nearer, track that instead! \n    if (d2 < d1) { return N; } else { return A; }\n}\n\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord) {\n    // convert pixel coordinate to normalize texture coord\n    vec2 uv = fragCoord / iResolution.xy;\n    \n    \n    // respawn in nest:\n    vec2 nest = iResolution.xy * vec2(0.5, 0.5);\n    float nest_radius = 75.; //bigger nest radius for more ants\n    float nd = step(distance(fragCoord, nest), nest_radius);\n    \n    // our previous state\n    vec4 A = texture(iChannel0, uv);\n    \n    // make sure we are tracking the nearest particle by testing\n    // each of our nearest pixels to see if their particle is nearer\n    for (int x=-2; x<=2; x++) {\n        for (int y=-2; y<=2; y++) {\n            A = getNearestParticle(A, fragCoord, vec2(x, y));\n        }\n    }\n    \n    \n    // spawn new ants inside the nest, will spawn in a circle radius outside of the nest\n    if (distance(fragCoord, nest) <= nest_radius) {\n        //spawns ants per pixel, very low number because otherwise it will spawn a lot of ants\n        if (random4(vec3(fragCoord, iFrame)).x < 0.000001) { \n           vec4 r = random4(vec3(fragCoord, iFrame));\n                   \n            float angle = r.x * TWOPI;\n            float radius = nest_radius * sqrt(r.y);\n\n            vec2 spawnPos = nest + vec2(cos(angle), sin(angle)) * radius;\n\n            A.xy = spawnPos;\n            A.z  = r.z * TWOPI;\n\n        }\n    }\n    \n    vec4 noise = random4(vec3(A.xy, iTime));\n    \n    float speed = 175.;        //175. or 65. if at 60FPS\n    float sensorLen = 6.;      //6.\n    float trailfactor = 1.;    //1.\n    float wanderfactor = 0.55; //0.35\n    \n    // get rotation matrix for this agent:\n    mat2 rot = rotate2d(A.z);\n    \n    // move the particle\n    vec2 vel = rot * vec2(speed, 0);\n    // integrate velocity to position\n    A.xy += vel * iTimeDelta;\n    \n    // get the bounded position within the screen image\n    vec2 b = clamp(A.xy, vec2(0), iResolution.xy);\n    // compare the bounded and actual positions -- if they are different, reflect their orientations:\n    if (A.x != b.x) { A.z = TWOPI*0.5 - A.z; } // reflect in Y axis\n    if (A.y != b.y) { A.z = TWOPI - A.z; } // reflect in X axis\n    // also, actually clamp the position on screen\n    A.xy = b.xy; \n        \n    // sense the sugar in buffer C:\n    vec4 C = texture(iChannel2, A.xy / iResolution.xy);\n    \n    // pick up or drop food:\n    if (C.g > 0. && A.w < 0.5) {\n        A.w = 1.;\n    } else if (C.r > 0. && A.w > 0.5) {\n        A.w = 0.;\n    }\n    \n    // if I hit something, turn around:\n    if (C.g > 0. || C.r > 0.) { A.z += PI; }   \n    \n    //rot = rotate2d(A.z);\n    \n    \n    // sensors:   \n    vec2 sensorL = rot * vec2(1, 1) * sensorLen;\n    vec2 sensorR = rot * vec2(1, -1) * sensorLen;\n    vec4 senseL = texture(iChannel3, (A.xy + sensorL)/iResolution.xy);\n    vec4 senseR = texture(iChannel3, (A.xy + sensorR)/iResolution.xy);\n\n    // ants with food follow red pheremone\n    if (A.w > 0.5) {\n        A.z += (senseR.r - senseL.r) * trailfactor;\n    }\n    // ants without food follow green\n    else {\n      A.z += (senseR.g - senseL.g) * trailfactor;\n    }\n    \n    \n    \n    // initialize:\n    if (iFrame == 0) {\n        A = vec4(0);\n        \n        if (nd > 0.5) {\n        \n            float N = 25.; //changed to initialize with less ants\n            A.xy = round(fragCoord/N) * N;\n            \n            vec4 noise = random4(vec3(A.xy, iFrame));\n            A.z = noise.z * TWOPI;\n            A.w = 0.;\n        }\n    }\n    \n    fragColor = A;\n}",
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
				"code": "//smoothLife and ants\n//smoothLife taken from https://www.shadertoy.com/view/t3dfR2\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    vec2 uv = fragCoord / iResolution.xy;\n\n    // previous SmoothLife state\n    vec4 state = texture(iChannel1, uv);\n\n    // ants\n    vec4 A = texture(iChannel0, uv);\n\n    //smoothLife variables\n    float outer_radius = 10.0;\n    float inner_radius = 3.0;\n\n    float b1 = 0.245; //0.21 for faster behaviour\n    float b2 = b1 + 0.08; //anything >0.08 gives fast spawning cells\n    float d1 = 0.36;\n    float d2 = d1 + 0.18;\n\n    float a1 = 0.03;\n    float a2 = 0.15;\n    float dt = 0.2;\n\n    float inner_sum = 0.0;\n    float outer_sum = 0.0;\n    \n    //smoothLife neighbours\n    for (float x = -outer_radius; x <= outer_radius; x++) {\n        for (float y = -outer_radius; y <= outer_radius; y++) {\n            vec2 offset = vec2(x, y);\n            float dist = length(offset);\n\n            vec2 texel = offset / iResolution.xy;\n            float life = texture(iChannel1, uv + texel).x;\n\n            float outer_w = 1.0 - sigmoid(dist, outer_radius, 1.0);\n            float inner_w = 1.0 - sigmoid(dist, inner_radius, 1.0);\n\n            outer_sum += life * outer_w;\n            inner_sum += life * inner_w;\n        }\n    }\n\n    float inner_area = 3.14159 * inner_radius * inner_radius;\n    float outer_area = 3.14159 * outer_radius * outer_radius;\n\n    float inner_density = inner_sum / inner_area;\n    float outer_density = (outer_sum - inner_sum) / (outer_area - inner_area);\n\n    //smoothLife rules\n    float notlonely = sigmoid(outer_density, d1, a1);\n    float notcrowded = 1.0 - sigmoid(outer_density, d2, a1);\n    float survive = notlonely * notcrowded;\n\n    float enough = sigmoid(outer_density, b1, a1);\n    float nottoomuch = 1.0 - sigmoid(outer_density, b2, a1);\n    float birth = enough * nottoomuch;\n\n    float liveness = sigmoid(inner_density, 0.5, a2);\n    float transition = mix(birth, survive, liveness);\n\n    float change = transition * 2.0 - 1.0;\n\n    //smoothLife growth or decay\n    state.x += dt * change;\n    \n\n    //ant behaviours\n    //ant forward movement\n    vec2 dir = vec2(cos(A.z), sin(A.z));\n    vec2 toPixel = fragCoord - A.xy;\n\n    //get vector from ant to pixel\n    float dist = length(toPixel);\n    vec2 n = dist > 0.0 ? toPixel / dist : vec2(0.0);\n\n    float forward = dot(n, dir);\n\n    // elongated falloff\n    float deposit = 1.0 * exp(-dist * 0.17); //0.17\n\n    //2 ant roles, food carriers grow cells, non carriers remove cells\n    float grow = deposit * A.w;\n    float eat  = deposit * (1.0 - A.w);\n\n    //smoothLife seed\n    state.x = max(state.x, grow);\n    \n    //ants eating cells\n    state.x -= eat * state.x * 0.25;\n    \n    state.x -= eat * 0.35;\n\n\n    //weaken smoothLife towards top of screen\n    float h = uv.y;\n\n    state.x += dt * change * (1.0 - h * 0.7);\n\n    state.x *= (1.0 - uv.y * 0.3);\n    \n    state.x = clamp(state.x, 0.0, 1.0);\n\n    //initialization\n    if (iFrame == 0) {\n        state = vec4(0.0);\n    }\n\n    fragColor = state;\n}",
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
				"code": "/* \nfood & nest \n\nimplemeted using ChatGPT, prompt is \n\"can I generate one rectangle at a time? so that every 1000 iFrames \nfor example it will generate just one food blotch somewhere random?\"\n\nin this version I changed the rectangle, now uses multiple circles\n\n*/\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    vec2 uv = fragCoord / iResolution.xy;\n    \n    vec4 A = texture(iChannel0, uv); // particles\n    vec4 C = texture(iChannel2, uv); // previous state (persistent)\n    \n    float d = distance(fragCoord, A.xy);\n    \n    // remove food:\n    if (A.w < 0.5 && d < 2.0) C.g = 0.0; \n  \n    //circle spawning\n    \n    float period = 1500.0; //1500.0 is default\n    \n    // which spawn event we're on\n    float t = floor(iTime / period);\n    \n    // trigger only once per period\n    bool spawn = mod(float(iFrame), period) < 1.0;\n    \n    if (spawn) {\n        // used to create random circles\n        vec4 r = random4(vec2(t, iTime));\n        \n        vec2 center = r.xy * iResolution.xy;\n\n    float blob = 0.0;\n\n    //combine circles to spawn\n    for (int i = 0; i < 4; i++) {\n        vec2 offset = (random2(r.xy + float(i)) - 0.5) * 40.0;\n        float radius = mix(10.0, 30.0, r.z);\n\n        float d = distance(fragCoord, center + offset);\n        blob += smoothstep(radius, radius * 0.6, d);\n    }\n\n    // normalize\n    blob /= 4.0;\n\n    C.g = max(C.g, blob);\n    }\n    \n    //initilization \n    if (iFrame == 0) {\n        C = vec4(0.0);\n        \n        // nest in center\n        vec2 nest = iResolution.xy / 2.;\n        if (distance(fragCoord, nest) <= 30.0) {\n            C = vec4(1.0, 0.0, 0.0, 0.0);\n        }\n    }\n    \n    fragColor = C;\n}",
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
				"code": "// Buffer D = pheromones\n// .r = nest trail (go home)\n// .g = food trail (go to food)\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    vec2 uv = fragCoord / iResolution.xy;\n\n    vec4 A = texture(iChannel0, uv);\n    vec4 B = texture(iChannel1, uv); // previous pheromones\n    vec4 C  = texture(iChannel2, uv); // nest/food\n\n\n\n    //diffusion\n    vec4 N  = texture(iChannel1, (fragCoord + vec2(0, 1))/iResolution.xy);\n    vec4 S  = texture(iChannel1, (fragCoord + vec2(0,-1))/iResolution.xy);\n    vec4 E  = texture(iChannel1, (fragCoord + vec2(1, 0))/iResolution.xy);\n    vec4 W  = texture(iChannel1, (fragCoord + vec2(-1,0))/iResolution.xy);\n\n    B = mix(B, (N+S+E+W)/4.0, 0.5);\n\n    //decay\n    B *= 0.995;\n\n    float d = distance(fragCoord, A.xy);\n\n    //ant pheremone blob \n    float deposit = exp(-d * 0.15);\n\n    //makes pheremone pull stronger or weaker depending on values\n    //this one doesn't seem to change much if anything\n    B.r += deposit * A.w * 5.0;\n    //higher values here will weaken the pull of non-food \n    B.g += deposit * (1.0 - A.w) * 2.0;\n\n    //forces phermone to be strong at certain spots\n    //B.r = max(B.r, C.r); // nest\n    //B.g = max(B.g, C.g); // food\n\n    B = clamp(B, 0.0, 1.0);\n\n    if (iFrame == 0) {\n        B = vec4(0.0);\n    }\n\n    fragColor = B;\n}",
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
			"id": "fcfSzX",
			"date": "1775627391",
			"viewed": 21,
			"name": "Final",
			"username": "Zachery Bissoon",
			"description": "final project",
			"likes": 0,
			"published": 1,
			"flags": 32,
			"usePreview": 0,
			"tags": [
				"datt4950"
			],
			"hasliked": 0,
			"parentid": "7flXz2",
			"parentname": "oh man"
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
				"code": "/*\n218016485\nA4\nZeta Sovery\nPassing \n--\nInteractions: \nThere is magnification by holding mouse. There are a few parameters that I think are\ncool messing with such as the ad and C.r(specifically the one dealing with the agents\nand noiseCUSTOM) n buffer C\n\nDescription:\nThis CA is mainly based off my previous assignment \"Christmas Time\" which builds off\nof nearest-particle tracking and chemotaxis. This CA takes some inspiration from\nProbabilistic/Stochastic CA to make it nore interesting and so it has less likelihood\nof stabilizing. More specifically this CA looks at the \"Forest Fire\" CA where I take \nthe idea of \"planting\" and \"burning: and integrating it into my already existing\n\"safe\" and \"danger\" type agents. The safe agents try its best to avoid the fire but\nthe spread is so quick it gets caught, but it recovers quickly. The fire spreads out \nlike shards of diamonds similar to my older CAs, while the heads of the \"burning\" \nagents look like its sizzling.The safe agents look glowy and wispy which contrats\nthe harsh visuals of the burning areas. The way the fire spreads kind of like a \nliquid that slowly spreads through thicker liquid. The glowy effect on the safe agents \nmake it look ghostly but the way it looks when burning looks like a disease. \nConceptually it is like ghostly whisps trying to pass through the \"other side\" but\ncan't get past without getting burnt. \n\n\nTechnical Realization: \nThe balance in the base CA makes it hard to expirement by tweaking the parameters. My\nfirst thought was to add a super agent to further evolve the CA, but it still falls\nunder the problem of possibly stabilizing fast. To try and counterbalance this I\nlooked into Stochastic CA, and I really liked the idea of the Forest Fire CA. The danger\nagents are more spontaneous or event-based instead, and the \"planting\" of the safe\nagents add back the balance so the danger agents don't overtake. This way, the safe\nagents aren't added in by a \"sugar field\" like the Chemotaxis from before. The CA\nfeels more flexible and dynamic this way\n\nFuture Extension:\nI still would like to play with adding some kind of super agent. This agent would\ndisrupt the CA and make it more interesting. However, the super agent would preferably\nbe done through the user's actions like dragging the mouse on the screen or keyboard\ninputs. \n\n--\nSource code:\nLab 8 (grrrwaaa) - https://www.shadertoy.com/view/7fl3zH\nDATT4950 Forest Fire (grrrwaaa) - https://www.shadertoy.com/view/tXdcDN\nAgent-based system (grrrwaaa) - https://alicelab.world/digm5950/agent.html\nChemotaxis (grrrwaaa) - https://alicelab.world/digm5950/agent.html\nForest Fire (grrrwaaa) - https://alicelab.world/digm5950/agent.html\nProbabilistic/Stochastic CA (grrrwaaa) - https://alicelab.world/digm5950/agent.html\n\n*/\n\n\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord ) {\n    vec2 uv = (fragCoord / iResolution.xy);\n   \n    // zoom in\n    if (iMouse.z > 0.0) {\n        float magnification = 6.;\n        uv /= magnification;\n        uv += iMouse.xy / ((iResolution.xy + (iResolution.xy / (magnification - 1.0))));\n    }\n    \n    \n    // get our cell\n    vec4 A = texture(iChannel0, uv);\n    vec4 B = texture(iChannel1, uv);\n    vec4 C = texture(iChannel2, uv);\n    \n    // divide position by resolution to view in 0..1\n    //fragColor.xy = A.xy / iResolution.xy;\n    // divide direction by TWOPI to view in 0..1\n    //fragColor.z = A.z / TWOPI;\n    \n    // get distance from this pixel to the particle it is tracking:\n    float d = distance(uv * iResolution.xy, A.xy);\n    //float p = 1/d.;\n    //float p = exp(0.3*-d);\n    float p = smoothstep(1., 0., d);\n    \n    \n \n    float tree = C.g;\n    float fire = C.r;\n\n    // base colors\n    vec3 treeColor = vec3(1.0, 2.5, 7.7); // babyblue\n    vec3 fireColor = vec3(1.9, 0.5, 1.9); // purple fire!\n    vec3 ashColor  = vec3(0.1, 0.1, 0.1);   // dark\n\n    // combine\n    vec3 col = mix(ashColor, treeColor, tree);\n    col = mix(col, fireColor, fire);\n    col = mix(C.rgb, col, 0.3); // 0.3 = how fast new colors overwrite old\n    fragColor = vec4(col, 1.0);\n}",
				"name": "Image",
				"description": "",
				"type": "image"
			},
			{
				"outputs": [],
				"inputs": [],
				"code": "const float TWOPI = 6.283185307179586;\n\n// make a sigmoid transition of x around center with given width\nfloat sigmoid(float x, float center, float width) {\n    return 1.0 / (1.0 + exp(-(x-center)*4.0/width));\n}\n\n\n// Gaussian blur\nvec4 blur(sampler2D img, vec2 fragCoord, vec2 resolution, int N, vec2 dir) {\n    // N/2 .. N/4\n    float sigma = float(N)/3.14;   \n    float expFactor = -0.5/(sigma*sigma);\n    float weight = 1.;\n    vec4 sum = texture(img, fragCoord/resolution) * weight;\n    float weightSum = weight;\n    for (int i=1; i<=N; i++) {\n        vec2 offset = float(i) * dir;\n        float weight = exp(float(i*i) * expFactor);\n        sum += texture(img, (fragCoord + offset)/resolution) * weight;\n        sum += texture(img, (fragCoord - offset)/resolution) * weight;\n        weightSum += weight * 2.0;\n    \n    }\n    return sum / weightSum;\n}\n\n\n#define RANDOM_SCALE vec4(.1031, .1030, .0973, .1099)\n\nvec2 random2(float p) {\n    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec2 random2(vec2 p) {\n    vec3 p3 = fract(p.xyx * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec2 random2(vec3 p3) {\n    p3 = fract(p3 * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\nvec3 random3(float p) {\n    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.xxy + p3.yzz) * p3.zyx); \n}\n\nvec3 random3(vec2 p) {\n    vec3 p3 = fract(vec3(p.xyx) * RANDOM_SCALE.xyz);\n    p3 += dot(p3, p3.yxz + 19.19);\n    return fract((p3.xxy + p3.yzz) * p3.zyx);\n}\n\nvec3 random3(vec3 p) {\n    p = fract(p * RANDOM_SCALE.xyz);\n    p += dot(p, p.yxz + 19.19);\n    return fract((p.xxy + p.yzz) * p.zyx);\n}\n\nvec4 random4(float p) {\n    vec4 p4 = fract(p * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);   \n}\n\nvec4 random4(vec2 p) {\n    vec4 p4 = fract(p.xyxy * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec3 p) {\n    vec4 p4 = fract(p.xyzx * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}\n\nvec4 random4(vec4 p4) {\n    p4 = fract(p4  * RANDOM_SCALE);\n    p4 += dot(p4, p4.wzxy + 19.19);\n    return fract((p4.xxyz + p4.yzzw) * p4.zywx);\n}",
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
				"code": "// each pixel tracks an agent\n// .xy is the agent location (in pixels)\n// .z is the agent direction (in radians)\n// .w is the agent's memory\n\n// given current particle \"A\" at pixel `fragCoord`\n// is the particle at `fragCoord+offset` nearer? if so return that.\nvec4 getNearestParticle(vec4 A, vec2 fragCoord, vec2 offset) {\n    // get by neighbour pixel\n    vec4 N = texture(iChannel0, (fragCoord+offset)/iResolution.xy);\n    // distance from my pixel to the particle I'm tracking:\n    float d1 = distance(fragCoord, A.xy);\n    // distance from my pixel to the particle my neighbor is tracking:\n    float d2 = distance(fragCoord, N.xy);\n    // if my neighbor's particle is nearer, track that instead! \n    if (d2 < d1) { return N; } else { return A; }\n}\n\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord) {\n    // convert pixel coordinate to normalize texture coord\n    vec2 uv = fragCoord / iResolution.xy;\n    // our previous state\n    vec4 A = texture(iChannel0, uv);\n    \n    // make sure we are tracking the nearest particle by testing\n    // each of our nearest pixels to see if their particle is nearer\n    for (int x=-2; x<=2; x++) {\n        for (int y=-2; y<=2; y++) {\n            A = getNearestParticle(A, fragCoord, vec2(x, y));\n        }\n    }\n    \n    vec4 noise = random4(vec3(A.xy, iTime));\n    \n\n    \n    \n    \n    float speed = 50.;\n    float turn = 0.;\n    \n    \n    \n    // sense the sugar in buffer C:\n    vec4 C = texture(iChannel2, A.xy / iResolution.xy);\n    float smell; \n    float safeTrail   = C.g;   // safe\n    float dangerTrail = C.r;   // danger\n\n    \n    // sense type\n    //vec4 B = texture(iChannel1, A.xy / iResolution.xy);\n    // 0 = safe, 1 = danger\n    float type   = floor(A.w/2.0);\n    float memory = fract(A.w);\n\n    //type attraction\n    if(type < 0.5){ //if safe or simple agent\n        //smell = safeTrail - dangerTrail; //yes safetrail, no danger\n        smell = safeTrail - 2.0 * dangerTrail;\n    }\n    else {       // danger\n        smell = safeTrail + dangerTrail; //yes safetrail, yes danger\n    }\n    \n    \n    // compare it to my memory of the smell on the last frame:\n    // is my life getting better?\n    if (smell > memory) {\n        // if what I smell here is better than \n        // what I remember smelling back there\n        // I'm probably going in a good direction, keep on\n        turn = 0.01;\n        speed = 75.;\n    } else {\n        // the smell here is not better. try another direction.\n        turn = 1.;\n        speed = 20.;\n    }\n    \n    A.z += turn * (noise.x*2. - 1.);\n    \n    // move the particle\n    // get the xy velocity from the A.z direction\n    // polar to cartesian\n    vec2 vel = vec2(cos(A.z), sin(A.z)) * speed;\n    // integrate velocity to position\n    A.xy += vel * iTimeDelta;\n    \n    // get the bounded position within the screen image\n    vec2 b = clamp(A.xy, vec2(0), iResolution.xy);\n    // compare the bounded and actual positions -- if they are different, reflect their orientations:\n    if (A.x != b.x) { A.z = TWOPI*0.5 - A.z; } // reflect in Y axis\n    if (A.y != b.y) { A.z = TWOPI - A.z; } // reflect in X axis\n    // also, actually clamp the position on screen\n    A.xy = b.xy; \n    \n\n    // remember my smell and type:\n    // danger → safe when near \"fire\"\n    if(type > 0.5 && dangerTrail > 0.5){\n        type = 0.0; \n    }\n  \n  \n    \n    A.w = type * 2.0 + clamp(smell, 0.0, 0.999); //so type and memory are cleary separated\n    \n    // initialize:\n    if (iFrame == 0) {\n    \n        //A.xy = iResolution.xy * noise.xy;\n        // every pixel in a NxN square is tracking the same particle\n        // round the position to the nearest \"N\"\n        float N = 30.;\n        A.xy = round(fragCoord/N) * N;\n        // generate danger (60%) agents and safe (40%) agents\n        vec4 noise = random4(vec3(A.xy, iFrame));\n        type = step(0.4, random4(vec3(A.xy,iFrame)).x);\n        A.w = type * 2.0;\n    \n        // direction:\n        A.z = noise.z * TWOPI;\n        }\n    \n    fragColor = A;\n    }\n",
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
				"code": "void mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    // convert pixel coordinate to normalize texture coord\n    vec2 uv = fragCoord / iResolution.xy;\n    \n    // our previous state\n    vec4 A = texture(iChannel0, uv); // the particles\n    vec4 B = texture(iChannel1, uv); // the trails\n    \n    \n    // decay:\n    B.rgb *= 0.98;\n    \n    // draw the particle\n    // get distance from this pixel to the particle it is tracking:\n    float d = distance(fragCoord, A.xy);\n    //float p = 1/d.;\n    //float p = exp(0.3*-d);\n    float p = smoothstep(2.0, 0., d);\n   \n    \n    B.rgb += vec3(p);\n    \n    fragColor = B;\n}\n\n",
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
							"filter": "nearest",
							"wrap": "clamp",
							"vflip": "true",
							"srgb": "false",
							"internal": "byte"
						}
					}
				],
				"code": "//C.r is danger type/\"fire\"\n//C.g is simple type/\"tree\"\n\n\nmat3 gaussBlur = mat3(\n        1, 2, 1,\n        2, 4, 2,\n        1, 2, 1\n    ) * 1.0/16.0;\n    \n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord ) {\n    vec2 uv = (fragCoord / iResolution.xy);\n    \n    vec4 C = texture(iChannel2, uv); // the previous frame\n    \n    // gaussian blurred previous frame:\n    vec4 N = texture(iChannel2, (fragCoord + vec2(0, 1))/iResolution.xy);\n    vec4 S = texture(iChannel2, (fragCoord + vec2(0, -1))/iResolution.xy);\n    vec4 E = texture(iChannel2, (fragCoord + vec2(1, 0))/iResolution.xy);\n    vec4 W = texture(iChannel2, (fragCoord + vec2(-1, 0))/iResolution.xy);\n    vec4 NE = texture(iChannel2, (fragCoord + vec2(1, 1))/iResolution.xy);\n    vec4 SE = texture(iChannel2, (fragCoord + vec2(1, -1))/iResolution.xy);\n    vec4 NW = texture(iChannel2, (fragCoord + vec2(-1, 1))/iResolution.xy);\n    vec4 SW = texture(iChannel2, (fragCoord + vec2(-1, -1))/iResolution.xy);\n    C = ((NE+SE+NW+SW) + 2.*(N+E+S+W) + 4.*C)/16.;\n    \n    vec4 noise = random4(vec3(fragCoord, iTime));\n    \n    // decay:\n    \n    C.r *= 0.994; // danger trails\n    C.g *= 0.998; // safe trails\n    \n    //checking neighbours for \"fire\"/danger\n    float neighborFire = max(max(N.x, S.x), max(E.x, W.x));\n    //if enough \"tree\" and \"fire\" then \"ignite\"\n    if(C.g > 0.3 && neighborFire > 0.5){\n        C.r = 0.7;\n    }\n    //if fire\n    if(C.r > 0.5){\n        C.r *= 0.73; //\"fire\" depletes\n        C.g *= 0.75; //\"tree\" depletes\n    }\n    \n    float noiseCUSTOM = random4(vec3(fragCoord, iTime)).x;\n\n    if(noiseCUSTOM > 0.9995){\n        C.r = 0.5; // changing this value kind achanges burnign pattern 0.03\n    }\n   \n\n\n    // nearest agent for \"forest fire\"\n    vec4 A = texture(iChannel0, uv); // the nearest agent\n    float ad = distance(A.xy, fragCoord); // distance to agent\n    float type = floor(A.w/2.);\n    //\"fire\" or \"plant\" with agents\n    if (ad < 3.) { //changing AD makes cool effect 3.0 , 10.0, 50.0\n    if (type < 0.5) {\n        // green agent plants tree (not every time)\n        if(random4(vec3(fragCoord, iTime)).x > 0.7){ //chance for planting\n            C.g += 2.2; //\"forest\" growth\n           \n        }\n    } \n    else {\n        C.r += 0.348;// \"fire\" signal\n        }\n    }\n    \n    \n    if(C.r > 0.47){ //0.47 - 0.49 brings most interesting visuals\n        C.g = 0.0; // burn the tree away\n    }\n\n    // background noise\n    //C += 0.1*(noise.z - 0.5);\n \n    \n    C = clamp(C, 0., 1.);\n   \n    \n    fragColor = C;\n}",
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
			"id": "fflXDn",
			"date": "1775533858",
			"viewed": 23,
			"name": "Passing",
			"username": "Zeta Sovery",
			"description": "A4",
			"likes": 1,
			"published": 1,
			"flags": 32,
			"usePreview": 0,
			"tags": [
				"datt4950"
			],
			"hasliked": 0,
			"parentid": "NcXGWl",
			"parentname": " DATT4950 A3 ZS"
		}
	}
]