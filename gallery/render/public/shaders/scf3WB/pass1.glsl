/*
Assignment 1: Cellular Automata
By Gavin Johnstone
217100033

Title: Mossflower

Instructions: 

    Left mouse button to zoom in.
    
    You can play with the gravity or region variables to yield other results.

Description:

    My initial vision was to solve three self-made goals regarding Langton's Ant (using initial code from 
    Termites: https://www.shadertoy.com/view/33cyRS). The three goals were: implement a system for influencing 
    the random movement, solve the problem of two ants entering the same space and one getting deleted, and 
    make the the alive state additive so cells could carry different levels of brightness. The first ended up 
    being an attraction system like gravity and the second is a system where intended direction is encoded into 
    either the first, second, third, or fourth digit of the blue channel. Unfortunnately, after a tremendous
    amount of effort I think the last one was completely impossible within my design. Best as I can understand
    it, it didn't work due to trying to read from an additive loop affected by floating point rounding errors.
    
    What I ended up with is a cellular automata that wanders randomly, but is drawn toward other cells, and can 
    pass through other cells without interference (so clusters don't shrink). The red channel reflects the 
    density of green pixels, but only updates when a green cell leaves its space, leaving some really cool 
    patterns. For an earlier version with even cooler patterns, check out https://www.shadertoy.com/view/WXKBR3.
    
    A future extension might be redesigning the system to implement the variable green data, but I'd probably 
    have to make a completely different system at a fundamental level. I also got some comments saying that it
    dies on Mac, possibly due to float errors so that's also something to fix.


*/
// red channel = generated cloud
// green channel = cell is present
// blue channel = cell direction 
// north = 1.0
// south = 2.0
// east = 4.0
// west = 8.0

int Nb = 1;
int Sb = 2;
int Eb = 4;
int Wb = 8;

// how strongly the cells attract each other
float gravity = 0.8;

// dimensions of the region that the cell will look in to calculate attraction
// playing with these values can manipulate the structures generated (or blow up your computer).
int regionH = 20;
int regionW = 20;
// if your computer is already going to blow up, try:
// int regionH = 10;
// int regionW = 10;

float north = 0.0;
float south = 0.0;
float east = 0.0;
float west = 0.0;
float Prob = 1.0;
vec2 coord = vec2(0,0);


void mainImage(out vec4 fragColor, in vec2 fragCoord) {
        // normalized coordinate (0.0 to 1.0):
    vec2 uv = fragCoord / iResolution.xy;
    float mask = 1.-texture(iMask, uv).a;
    
    int regionH = int(mix(2., 50., 1.-uv.y));
    int regionW = int(mix(2., 100., 1.-uv.x));
    
    vec4 noise = random4(vec3(fragCoord, iTime));

        // get self state
    vec4 C  = texture(iChannel0, (fragCoord+vec2( 0, 0))/iResolution.xy);
    
    
        // get state of all neighbour pixels:
    vec4 E  = texture(iChannel0, (fragCoord+vec2( 1, 0))/iResolution.xy);
    vec4 W  = texture(iChannel0, (fragCoord+vec2(-1, 0))/iResolution.xy);
    vec4 N  = texture(iChannel0, (fragCoord+vec2( 0, 1))/iResolution.xy);
    vec4 S  = texture(iChannel0, (fragCoord+vec2( 0,-1))/iResolution.xy);
   
    
        // cell leaves
    C.g = 0.;
    C.b = 0.;
        // relevant directional values of neighbors
    int north = int(S.b) & Nb; //mod(S.b, 2.)
    int south = int(N.b) & Sb; //floor(mod(N.b / 10.0, 10.0));
    int east =  int(W.b) & Eb; //floor(mod(W.b / 100.0, 10.0));
    int west =  int(E.b) & Wb; //floor(mod(E.b / 1000.0, 10.0));
    
    int outdir = 0;
    
        // cell coming west
    if (E.g > 0. && west > 0) {
            // cell is alive
        C.g = 1.;
        
        float Ntotal = 1.;
        float Stotal = 1.;
            // calculate number of cells above and below
        for (int i = -regionH/2; i <= regionH/2; i++) {
            for (int j = -regionW/2; j <= regionW/2; j++) {
                if (i < 0) {
                    Ntotal += texture(iChannel0, (fragCoord+vec2(i,j))/iResolution.xy).g;
                } else if (i > 0) {
                    Stotal += texture(iChannel0, (fragCoord+vec2(i,j))/iResolution.xy).g;
                }
            }
        }
        
            // brightness of red channel reflects how full the region is
        C.r = (Ntotal+Stotal)/float(regionH*regionW);
        
            // calculate ratio of north cells to south cells
        Prob = (Ntotal/(Ntotal+Stotal));
            // gravity affects strength of effect
        Prob = ((Prob - 0.5) * gravity) + 0.5;
        
            // if there are more north, north is more likely, 
            // or if there is also a cell coming east go north (to avoid two going the same way)
        if (noise.x < Prob || east > 0) { 
                // send it north
            //C.b += 1.;
            outdir += Nb;
        } else { 
            //C.b += 10.0; 
            outdir += Sb;
        } // send it south


    }
        // cell coming east
    if (W.g > 0. && east > 0) {
            // cell is alive
        C.g = 1.;
        float Ntotal = 1.;
        float Stotal = 1.;
            // calculate number of cells above and below
        for (int i = -regionH/2; i <= regionH/2; i++) {
            for (int j = -regionW/2; j <= regionW/2; j++) {
                if (i < 0) {
                    Ntotal += texture(iChannel0, (fragCoord+vec2(i,j))/iResolution.xy).g;
                } else if (i > 0) {
                    Stotal += texture(iChannel0, (fragCoord+vec2(i,j))/iResolution.xy).g;
                }
            }
        }
            // brightness of red channel reflects how full the region is
        C.r = (Ntotal+Stotal)/float(regionH*regionW);
            // calculate ratio of north cells to south cells
        Prob = (Ntotal/(Ntotal+Stotal));
            // gravity
        Prob = ((Prob - 0.5) * gravity) + 0.5;
            // if there are more north, south is less likely, 
            // or if there is also a cell coming west go south (to avoid two going the same way)
        if (noise.x > Prob || west > 0) { 
                // send it south
            outdir += Sb;
        } else { 
            outdir += Nb;//C.b += 1.; 
        } // send it north
    }
        // cell coming north
    if (S.g > 0. && north > 0) {
            // cell is alive
        C.g = 1.;
        float Wtotal = 1.;
        float Etotal = 1.;
            // calculate number of cells above and below
        for (int i = -regionH/2; i <= regionH/2; i++) {
            for (int j = -regionW/2; j <= regionW/2; j++) {
                if (j < 0) {
                    Wtotal += texture(iChannel0, (fragCoord+vec2(i,j))/iResolution.xy).g;
                } else if (i > 0) {
                    Etotal += texture(iChannel0, (fragCoord+vec2(i,j))/iResolution.xy).g;
                }
            }
        }
            // brightness of red channel reflects how full the region is
        C.r = (Wtotal+Etotal)/float(regionH*regionW);
            // calculate ratio of north cells to south cells
        Prob = (Wtotal/(Wtotal+Etotal));
            // gravity
        Prob = ((Prob - 0.5) * gravity) + 0.5;
            // if there are more west, west is more likely, 
            // or if there is also a cell coming north go west
        if (noise.x < Prob || south > 0) { 
                // send it west
            outdir += Wb;
        } else { outdir += Eb; } // send it east
    }
         // cell coming north
    if (N.g > 0. && south > 0) {
            // cell is alive
        C.g = 1.;
        
        float Wtotal = 1.;
        float Etotal = 1.;
            // calculate number of cells above and below
        for (int i = -regionH/2; i <= regionH/2; i++) {
            for (int j = -regionW/2; j <= regionW/2; j++) {
                if (j < 0) {
                    Wtotal += texture(iChannel0, (fragCoord+vec2(i,j))/iResolution.xy).g;
                } else if (i > 0) {
                    Etotal += texture(iChannel0, (fragCoord+vec2(i,j))/iResolution.xy).g;
                }
            }
        }
            // brightness of red channel reflects how full the region is
        C.r = (Wtotal+Etotal)/float(regionH*regionW);
            // calculate ratio of north cells to south cells
        Prob = (Wtotal/(Wtotal+Etotal));
            // gravity
        Prob = ((Prob - 0.5) * gravity) + 0.5;
            // if there are more west, east is less likely, 
            // or if there is also a cell coming south go east
        if (noise.x > Prob || north > 0) { 
                // send it east
            outdir += Eb;
        } else { outdir += Wb; } // send it west
    }
    
    C.b = float(outdir);

    fragColor = vec4(C);
    
    // initialize -- spacebar or rewind:
    // The ASCII/Unicode value for "spacebar" is 32. 
    bool spacePressed = texelFetch(iChannel3, ivec2(32, 0), 0).r > 0.;
    if (iFrame == 0 || spacePressed) { 
        fragColor = vec4(0);
        
        noise = random4(vec3(fragCoord, iDate.w));
        
            // a random scattering of cells:
        fragColor = vec4(
            0,
            noise.z < 0.2 ? 0.5 : 0., // ant here?
            noise.z < 0.2 ? 1.0 : 0., // ant direction
            0);

        
        /*
        if (uv.x < 0.6 && uv.x > 0.4) {
            fragColor = vec4(0,1,noise.x,0);
        } else {
            fragColor = vec4(0);
        }
        */
    }
    fragColor *= mask;
}