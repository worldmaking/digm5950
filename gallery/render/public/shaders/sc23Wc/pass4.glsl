// implemented Forest fire CA

// three possible states:
float empty = 0.0;
float tree = 0.5;
float burning = 1.0;

// the chance of an empty cell regrowing trees by expansion:
float growth_probability = 0.04 * 2.;
// the chance of an empty cell regrowing trees by random sporing:
float spore_probability = 0.02 / 2.;// 0.001
// the chance of lighting striking a cell:
float lightning_probability = 0.001;
// chance of fire spreading:
float fire_probability = 0.8;//0.55 * 1.5;
// chance of fire going out
float chance_of_rain = 0.25;

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // normalized coordinate (0.0 to 1.0):
    vec2 uv = fragCoord / iResolution.xy;
    float mask = 1.-texture(iMask, uv).a;

    // get self state
    vec4 C  = texture(iChannel2, (fragCoord+vec2( 0, 0))/iResolution.xy);
    
    // get state of all neighbour pixels:
    vec4 E  = texture(iChannel2, (fragCoord+vec2( 1, 0))/iResolution.xy);
    vec4 W  = texture(iChannel2, (fragCoord+vec2(-1, 0))/iResolution.xy);
    vec4 N  = texture(iChannel2, (fragCoord+vec2( 0, 1))/iResolution.xy);
    vec4 S  = texture(iChannel2, (fragCoord+vec2( 0,-1))/iResolution.xy);
    vec4 NE = texture(iChannel2, (fragCoord+vec2( 1, 1))/iResolution.xy);
    vec4 NW = texture(iChannel2, (fragCoord+vec2(-1, 1))/iResolution.xy);
    vec4 SE = texture(iChannel2, (fragCoord+vec2( 1,-1))/iResolution.xy);
    vec4 SW = texture(iChannel2, (fragCoord+vec2(-1,-1))/iResolution.xy);
    
    vec4 A = texture(iChannel0, uv); // the nearest agent
    float ad = distance(A.xy, fragCoord); // distance to agent

    // true if any neighbour is a tree:
	bool neartree = N.x == tree || E.x == tree 
				|| W.x == tree || S.x == tree 
				|| NE.x == tree || SE.x == tree 
				|| NW.x == tree || SW.x == tree;
	
	// true if any neighbour is burning and within 10 of an agent:
	bool nearburning = (N.x == burning || E.x == burning 
				|| W.x == burning || S.x == burning 
				|| NE.x == burning || SE.x == burning 
				|| NW.x == burning || SW.x == burning )&& (ad<10.) ; 
                
    if (nearburning== true && A.w== 0.0){ // if nearest agent is a growth agent, don't burn
        nearburning = false;
    }

    float value = C.x;
    vec4 noise = random4(vec3(fragCoord, iTime)); 
    
    if (value == empty) {
		// are any neighbors trees?
		if (neartree) {			
			// chance of regrowing (only if near growth agent):
			if (noise.x < growth_probability
             && noise.y < growth_probability && A.w==0.0&& ad<12. && A.w==0.0) {
				value = tree;
			}
		} else if (noise.z < spore_probability 
                && noise.w < spore_probability && A.w==0.0&& ad<7. && A.w==0.0) {
			// smaller chance of propagation by seeding:
			value = tree;
		}
	} else if (value == tree) {
		// are any neighbors burning?
		if (nearburning && (noise.x < fire_probability 
                         && noise.y < fire_probability)) {
			// if (any neighbors are burning, start burning too:
			value = burning;
		
		}else if(noise.z < lightning_probability
                    && noise.w < lightning_probability && A.w==1.0) {		
                // otherwise, there's a small chance of catching fire due to atmostpheric conditions:
                value = burning;
        }
        
        
	} else if (value == burning && noise.x < chance_of_rain 
                                && noise.y < chance_of_rain) {
		// a burning tree cell becomes an empty cell
		value = empty;
	} 
    
    // update my state:
    fragColor = vec4(value);
  
   
    if (iFrame == 0 ) {
        fragColor = vec4(noise.x < 0.01 ? tree : empty);
    }
    
    // add burning when and where mouse is pressed
    if (iMouse.z > 0.0) {
        // if the mouse is held, randomize some pixels near the mouse
        if (distance(fragCoord, iMouse.xy) < 10.0) {
            fragColor = vec4(step(0.8, noise.x));
        }
    } 

    fragColor *= mask;
    
   
}