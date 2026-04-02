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
]