title: Agents
importance: 6

---

# Agent-based models, multi-agent systems

Agent-based models, or multi-agent systems, attempt to understand how non-trivial organized macro-behavior emerges from typically mobile individuals that sense and respond to a world primarily at a local-level. These individuals are called **agents**. Just like CA, at times, the self-organizing behavior of systems of even relatively simple agents can be unpredictable, complex, and generate new emergent structures of order. Agent-based modeling has applications from microbiology to sociology, as well as video games and computer graphics. As a biological approximation, an agent could refer to anything from an individual protein, virus, cell, bacterium, organism, or deme (a population group). Agent systems also share many features with particle systems, and the two are sometimes conflated.

### A simple agent

The first distinction between CA and agent-based systems are that agents are not typically distributed in a grid, and are quite often mobile: a potentially **variable position** in potentially continuous space. The second distinction is that agents may have a number of other **properties** besides position. At the least, a mobile agent may have a **direction** or a **velocity**. 

For our purposes, the Javascript ```Object``` is a general container for properties, and may serve as the representation of agents:

```javascript
let agent = {
	pos: [0.5, 0.5],  // position, x and y components
	vel: [0.01, 0],  // velocity, x and y components
	size: 0.1,
};

function draw(ctx) {
	// draw a circle at the agent's position,
	// matching the agent's size:
	draw2D.circle(agent.pos, agent.size);
}

function update(dt) {
	// apply motion:
	agent.pos[0] += agent.vel[0];
	agent.pos[1] += agent.vel[1];
}
```

We could also use a vector object to represent position & velocity, which would offer more useful methods (see the [labs.html](labs) page for details on ```vec2```):

```javascript
let agent = {
	pos: new vec2(0.5, 0.5),  // position, x and y components
	vel: new vec2(0.01, 0),  // velocity, x and y components
	size: 0.1,
};

function update(dt) {
	// apply motion:
	agent.pos.add(agent.vel);
}
```

### Boundary conditions

This agent wanders off the page. As with CA, we can decide how to handle the **boundary conditions** of an agent-based system in a few different ways, including:

- **clamping** agents at the borders; use ```agent.pos.clip(1)```
- **wrapping** agents around opposite borders (making a 'toroidal' space); use ```agent.pos.wrap(1)``` 
- other strategies can respond to the *condition* of being 'out of bounds', using ```if (agent.pos.oob(1))...```, by: 
- **modifying** their velocities/directions to point them back toward the center, etc., or
- **resetting** agents with a new position, such as at the centre of the world (```agent.pos.set(0.5)```), or at a random position (```agent.pos.set(random(),random())```), or some variant, such as random distance from centre of the world (```agent.pos.random(random()*0.1).add(0.5)```), and possibly also changing other properties
- simply letting them die (see below on how to manage variable population sizes)

Note that we might also consider different boundary regions -- it doesn't have to be a square!

### Random walks in nature

The agent also moves very robotically at present. We can give it some "life" by introducing variations into its motion, suggestive of it making decisions in response to an environment. 

The simplest way is to introduce stochastic changes to the velocity in direction and magnitute (speed). For direction, we would typically want to turn up to a certain limit (in radians), with equal chance of clockwise and anticlockwise rotation: ```agent.vel.rotate((random()-0.5)*turnfactor)```. For speed, we can randomize the length of the velocity up to a certain limit: ```agent.vel.len(random()*maxspeed)```

The result is a **random walk**. Random walks are a well-established model in mathematics, with a physical interpretation as [Brownian motion](https://en.wikipedia.org/wiki/Brownian_motion). Essentially, for an agent a **random walk** involves small random deviations to steering. This form of movement is widely utilized by nature, whether purposefully or simply through environmental interactions. 

### Multiple agents

A good way of seeing why random walks work is to deploy a **population** of agents, rather than a single one. We can do this by storing our agents in an array:

```javascript
let agents = [];
let population_size = 24;

function reset() {
	for (let i=0; i<population_size; i++) {
		// create a randomized agent:
		let agent = {
			pos: new vec2(random(), random()),
			vel: vec2.random(),
			size: 0.1,
		};
		// store in population array:
		agents[i] = agent;
	}
}

function update(dt) {
	// iterate over population:
	for (let agent of agents) {
		// update agent as before
	}
}

function draw(ctx) {
	// iterate over population:
	for (let agent of agents) {
		// draw agent as before
	}
}
```

### The environmental field

The agent however still lives in a void, with no environment to respond to. Even the simplest organisms hve the ability to sense the environment, and direct their motions accordingly; they depend on it for survival. 

One of the simplest examples is **chemotaxis**. Chemotaxis is the phenomenon whereby somatic cells, bacteria, and other single-cell or multicellular organisms direct their movements according to certain chemicals in their environment. This is important for bacteria to find food (for example, glucose) by swimming towards the highest **concentration** of food molecules, or to flee from poisons (for example, phenol). In multicellular organisms, chemotaxis is critical to early development (e.g. movement of sperm towards the egg during fertilization) and subsequent phases of development (e.g. migration of neurons or lymphocytes) as well as in normal function. [wikipedia](https://en.wikipedia.org/wiki/Chemotaxis)

Sensing a **concentration** is rather like smell: the feature being detected is not a solid object with a distinct boundary, but is *diffuse*: it seems instead to occupy all parts of space to varying degrees. We model such kinds of spatial properties as *fields*, such as density fields, probability fields, magnetic fields, etc. Fields occupy all space but in different intensities. But since our simulations are limited in memory, we *simulate* such continuous fields with discrete approximations, such as grids. Thus we can re-use the ```field2D``` to represent enviornmental features for agents to sense. 

The choice of **environment** agents will respond is just as important as the design of agents themselves, including both its **initial state** and its **continuous processes**. If the field is entirely homogenous, in which there are no spatial variations, there is nothing significant to sense. On the other hand, if the field is too noisy, it can be too difficult to make sense of. How can we make a better environment?

Perhaps it is helpful to think of the environment as a landscape, with mountain tops where the intensity is high, and valleys where the intensity is low. Now a homongenous landscape is like a flat plain -- no place is better than any other. But a noisy landscape is like a city block designed by a madman -- difficult to do anything but get lost. What makes an interesting landscape to explore & make sense of? Perhaps one that has an interesting distribution of hills and valleys; where height (intensity) tends to be more similar at shorter distances but tends to be more different at larger distances. 

Here's a single central mountain, by computing the distance from the centre:

```javascript
let dim = 256;
let sugar = new field2D(dim);
let center = new vec2(0.5, 0.5);

sugar.set(function(x, y) {
	// convert x, y in to 0..1 range:
	var p = new vec2(x / dim, y / dim);
	// get distance from center:
	var d = p.distance(center);
	// make concentration high at center, lower with increasing distance:
	return 1 - d;
})
```

Or, for a more interesting and variegated landscape, we can start from uniform noise, and then smoothen it out:

```javascript
// fill with uniform noise
sugar.set(function(x, y) { return random(); });
// smoothen it out by long-range diffusion:
sugar.diffuse(sugar.clone(), sugar.width, 100);
// make it vary between 0 and 1:
sugar.normalize();
```

Or, we could design a CA to generate an interesting landscape, such as using a stochastic Monte Carlo process that prefers making neigbhour cells more similar, starting from a field of noise.

```javascript
// fill with uniform noise
  sugar.set(function(x, y) { return random(); });
  // run a stochastic CA for a while:
  for (let i=0; i<dim*dim*40; i++) {
    // pick a random cell:
    let x0 = random(dim);
    let y0 = random(dim);
    let v0 = sugar.get(x0, y0);
    // pick a random neighbor:
    let x1 = x0 + random(3)-1;
    let y1 = y0 + random(3)-1;
    let v1 = sugar.get(x1, y1);
    // average them:
    let v2 = (v0 + v1)*0.5;
    // and update cell with this new value
    sugar.set(v2, x0, y0);
  }
  // make it vary between 0 and 1:
  sugar.normalize();
```

### Sensing the field

Sensing a field by "smell" is as simple as sampling the field's value at the agent's location. We can compute the nearest cell index to the agent, and then get the value:

```javascript
// scale position (0..1) to field cell width
// and use Math.floor to round this to a whole number:
let x = Math.floor(agent.pos[0] * sugar.width);
let y = Math.floor(agent.pos[1] * sugar.height);
// get field value at this cell:
agent.sense = sugar.get(x, y);
```

This is fine so long as we think of the environment as being really made up of discrete blocks in a grid. But in many cases, our grid-based field is only a *discrete approximation* of a continuous field. In that case, sensing single discrete cells breaks the approximation. What we really want is an approximate value taken between *all* the nearest cells. We can do this by *bilinear interpolation* between the four nearest cells, weighted according to which ones are closer or further from the specific agent position. This involves a lengthier bit of code, so the ```field2D``` object provides a convenient method for us:

```javascript
// get an interpolated value from the field, 
// using the nearest four cells to the agent's position:
agent.sense = sugar.sample(agent.pos);
```

We can test whether this is working by for example setting the hue of an agent before drawing:

```javascript
draw2D.color = hsl(agent.sense);
```

### Responding to the field

Once we have a sense, how should we respond? Here we need to equip our agent with some capabilities of taking **action**, as well as with a **decision-making** capability, sometimes known as **action selection**, that uses the input of sense to map to the output of action, in order to achieve a desired result. (The random walker's action was to change velocity, while decision-making was a simple mapping of a random number.)

When we look at microbiology we can find some remarkably simple action & decision-making mechanisms to achieve effective goal satisfaction. Let's look at chemotaxis again. For example, the E. Coli bacterium's *goal* is to find the highest sugar concentration. But it has no eyes or ears to sense at a distance, it can only sense the local sugar concentration at its current location. It has no sense of direction, nor any internal "map". Its range of actions are limited to twisting its flagella, resulting in just two modes of *locomotion*: 

- Move forward more or less straight
- Tumble about fairly randomly

<iframe width="720" height="540" src="https://www.youtube.com/embed/ZV5CfOkV6ek?rel=0" frameborder="0" allowfullscreen></iframe>

We can certainly model these two modes of locomotion in an agent, by varing the factors of our random walker:

```javascript
// tumbling behaviour:
agent.vel.rotate((random()-0.5)*2.0).len(0.0005);

// swimming behaviour:
agent.vel.rotate((random()-0.5)*0.1).len(0.005);
```

But how does this solve the problem? 

---

E. Coli uses a very simple chemical **memory** to detect whether the concentration at the current moment is better, worse, or not much different to how it was a few moments ago. That is, it detects the differential experienced, or gradient traversed. Knowing whether things are getting better or worse is used to select between the swimming or tumbling patterns. With just a few tuning parameters, the method can lead to a very rapid success. 

So all we need is to compare the sugar concentration with the agent's memory (a stored member variable) of the concentration on the last time step, and choose the behaviour accordingly (and of course, store our sensed value in memory for the next update).

```javascript
// sense field here
agent.sense = sugar.sample(agent.pos);
// is life getting worse?
if (agent.sense < agent.memory) {
	// tumbling behaviour:
	agent.vel.rotate((random()-0.5)*tumbleturn).len(agent.size * tumblespeed);
} else {
	// swimming behaviour:
	agent.vel.rotate((random()-0.5)*swimturn).len(agent.size *  swimspeed);
}
// remember this:
agent.memory = agent.sense;
```

Note that this method works when the variations of sugar concentration in the environment are fairly smooth, which is generally true for an environment in which concentrations diffuse. Try again with noisy or homogenous environments, and see how well the agent fares.


### Continuations

So far, our sugar field is static. It would be nice to see what a continuously dynamic field offers. 

For example, we could let the mouse add more sugar to the space, and watch it gradually diffuse away. Adding sugar in response to the mouse is fairly easy, by making use of the ```deposit``` method of field2D. This method accumulates into the field at a point coordinate, adding to its existing values. Note that the coordinate is in the normalized 0..1 range, and that it will spread the value over the nearest four cells:

```javascript
function mouse(e, pt) {
	// add one unit of sugar at the location of the mouse:
	sugar.deposit(1, pt);
}
```

We could also remove the need of human input by creating another kind of agent, as the "source", randomly wandering the space and depositing sugar as it goes. 

So far this isn't completely effective to attract agents, as there can be large spatial discontinuities. If agents happen to be on part of a drawn path, they might follow it, but otherwise they are unlikely to find it. 

To create a smoother gradient, we must diffuse the field continuously. To add continuous dynamics, we need to add field processing to our ```update()``` routine. And since the ```diffuse()``` method requires a distinct source field, we'll need to double buffer like before:

```javascript
let sugar_past = sugar.clone();

function update() {
	// swap fields:
	let tmp = sugar_past;
	sugar_past = sugar;
	sugar = tmp;
	// diffuse it
	sugar.diffuse(sugar_past, 0.1);

	//... update agents as before
}
```

Now the agents are able to find the areas of sugar more easily -- and might even show something like trail-following.

We might also notice that even when the sugar is quite dissipated, the agents can still find the strongest concentrations. If we don't find this realistic, one thing we might consider adding is a low level of background randomness. The rationale is that even if sensing is perfectly accurate, small fluctuations in the world (such as due to the Brownian motion of water and sugar molecules) make it impossible to discern very small differences. The randomness added must be signed noise, balanced around zero such that overall the total intensity is statistically preserved. Note that the amplitude of this noise will have to be extremely high if it is applied *before* the diffusion, or very low if applied *after* diffusion. The effective results are also quite different.

```javascript
	// applied after sugar.diffuse:
	// use field2D.map() to modify a cell value
	// adding a small random deviation
	// whose average is zero
	sugar.map(function(v) { 
		return v + 0.01*(random() - 0.5);
	});
```

Still, the sugar just seems to accumulate over time, and the more we draw, the more the screen tends to grey. This is because our diffuse() method spreads intensity out, but does not change the total quantity. We need some other process to reduce this total quantity to make a balance. One way to do that is to add a very weak overall decay to the field -- as if some particles of sugar occasionally evaporate:

```javascript
// in update():
	sugar.mul(0.99);
```

Of course, our agents aren't just looking for sugar to show it to us -- they want to eat it! We can also add the effect of this on the environment by *removing* intensity from the field by each agent. We can do this by calling the ```field2D.deposit()``` method with a negative argument (i.e. a debit!):

```javascript
	// get the sugar level at this location:
	var sense = Math.max(sugar.sample(a.pos), 0);
	// update the field to show that we removed sugar here:
	sugar.deposit(-sense, agent.pos);
```

Note however this might lead to some locations getting negative concentrations -- a physical impossibility? We could fix this by clamping the field values as another step:

```javascript
	sugar.map(function(v) { 
		return clamp(v, 0, 1);
	});
```
> **Aside**: A very different alternative to diffusion, scaling, adding noise, clamping etc. is to use something closer to an asynchronous CA, in continuous process, rather as we did before for field initialization. This makes a more challenging, but more interesting, dynamic landscape for the agents to navigate:

```javascript
  // some swaps:
  for (var i=0; i<10000; i++) {
    // pick a point at random
    var x = random(sugar.width);
    var y = random(sugar.height);
    // pick a neighbour
    var x1 = x + random(3)-1;
    var y1 = y + random(3)-1;
    // get the values
    var a = sugar.get(x, y);
    var b = sugar.get(x1, y1);
    // pick a random interpolation factor
    var t = 0.5*random();
    // blend a and b into each other accordingly
    var a1 = a + t*(b-a);
    var b1 = b + t*(a-b);
    // write these values back to the field
    sugar.set(a1, x, y);
    sugar.set(b1, x1, y1);
  }
  // some removals:
  for (var i=0; i<100; i++) {
    var x = random(sugar.width);
    var y = random(sugar.height);
    sugar.set(0, x, y);
  }
```

> Obviously there's a hint here of how it might be interesting to pair our agents with some other CAs for field processes... perhaps the Forest Fire model, for example.

<p class="codepen" data-height="300" data-theme-id="18447" data-default-tab="js,result" data-user="grrrwaaa" data-slug-hash="QYjpKb" data-preview="true" style="height: 300px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid black; margin: 1em 0; padding: 1em;" data-pen-title="2019 DATT4950 week 4: Agents">
  <span>See the Pen <a href="https://codepen.io/grrrwaaa/pen/QYjpKb/">
  2019 DATT4950 week 4: Agents</a> by Graham (<a href="https://codepen.io/grrrwaaa">@grrrwaaa</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://static.codepen.io/assets/embed/ei.js"></script>

## The model so far:

An agent-based system can comprise:

- a **population** of agents, each with:
	- **position** 
	- **mobility**, e.g. as velocity
	- other **properties** such as size, colour, etc.
	- **decision-making** that may relate the above with:
		- **input senses** such as field smell
		- **output actions** such as changes to velocity
		- **memory**
- an **environment**, with:
	- **boundary conditions**
	- **initial conditions**
	- **continuous processes** including addition, removal, diffusion, limiting, stochastics, etc.

<!-- 

All of 'what is an agent' up to Reynolds flocking.

[See the random walker example here](http://codepen.io/grrrwaaa/pen/mVBBPQ?editors=001). Rather than simple deviations to the current heading, this follows Reynold's method to generate headings based on deviations of an ideal point just ahead of the agent, which is more parametrically defined.

[And here are many walkers](http://codepen.io/grrrwaaa/pen/YwEbRO?editors=001) -- to help demonstrate how to support populations, and how quickly random walkers can cover a terrain. This is on reason why random walks feature in many foraging behaviours in nature.


> A variety of other *taxes* worth exploring can be found on the [wikipedia page](http://en.wikipedia.org/wiki/Taxis#Aerotaxis). Note how chemotaxis (and other taxes) can be divided into positive (attractive) and negative (repulsive) characters, just like forces (directly seen in steering forces). This is closely related to the concepts of positive and negative feedback and the explorations of cybernetics.

Continue at stigmergy?

Or consider the other kind of enviornment: each other?

Or continue at Birth & Death?



![Fish school](http://underthecblog.files.wordpress.com/2014/02/fishschool.gif)

Some of the most beautiful, fascinating or strange phenomena of nature can be understood as emerging from the behaviors of interacting agents. Widely acknowledged examples include the murmuration of birds (or swarming insects, schools of fish), and the societal 'superorganisms' of ant colonies. We have come to understand that despite the obvious organization that we see at the macro-scale, there is no hierarchical center of coordination, but rather the whole emerges from simple interactions at local levels. These have been suggested as examples of emergence, or of self-organization. Which is to say, the whole is greater than a naive sum of its parts. 
-->


---

## Path following

Another simple form of chemotactic behavior is to align movement along given "trails" -- paths of more intense chemical markers, such as the pheromone trails laid down by ants. Again, this can be achieved by a relatively simple mechanism. In this case, agents need two sensors, both ahead of the agent (to draw movement forward) and to the left and right of the agent (to discriminate which direction is better to turn). 

Let's call these sensors "antennae". A bit of math is needed to compute where each antenna is located in the world. Starting from a basic vector representing the antenna relative to tha agent, we can then scale, rotate, and translate the location, resulting in a location relative to the world:

```javascript
// antenna is 50% forward and 50% to the left of the agent:
let antennaleft = new vec2(0.5, 0.5);
// compute what this is as a world location:
antennaleft
	.mul(agent.size) // scale to agent size
	.rotate(agent.vel.angle()) // rotate to agent direction
	.add(agent.pos); // move to agent location
```

With this, and of course also `antennaright`, we can sample the environmental field at both locations to get two sensor values:

```javascript
let smellleft = sugar.sample(antennaleft);
let smellright = sugar.sample(antennaright);
```

Now the decision-making can respond to these values. We might consider which direction has a better smell (left or right), we might consider the difference between the smells, we might consider the total of the smells too, in order to determine which way to turn, and how much to turn:


<p class="codepen" data-height="300" data-theme-id="18447" data-default-tab="js,result" data-user="grrrwaaa" data-slug-hash="qgPZBK" data-preview="true" style="height: 300px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid black; margin: 1em 0; padding: 1em;" data-pen-title="line following agents">
  <span>See the Pen <a href="https://codepen.io/grrrwaaa/pen/qgPZBK/">
  line following agents</a> by Graham (<a href="https://codepen.io/grrrwaaa">@grrrwaaa</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://static.codepen.io/assets/embed/ei.js"></script>

From here it is relatively trivial to let the agents also *create* the trails, as well as following them:

<p class="codepen" data-height="300" data-theme-id="18447" data-default-tab="js,result" data-user="grrrwaaa" data-slug-hash="pGWbWx" data-preview="true" style="height: 300px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid black; margin: 1em 0; padding: 1em;" data-pen-title="trailblazing agents">
  <span>See the Pen <a href="https://codepen.io/grrrwaaa/pen/pGWbWx/">
  trailblazing agents</a> by Graham (<a href="https://codepen.io/grrrwaaa">@grrrwaaa</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://static.codepen.io/assets/embed/ei.js"></script>

---

## Neighbours

Agents might also be sensitive to each other directly -- as well as, or instead of, through fields. Since agents are mobile, the set of agents that are close neighbours to another can change over time. We thus need to add routines to maintain lists of near-neighbours on each frame.  

The simplest method is to compare each agent against each other and check the relative distance. (This method can be refined in many ways). 

```javascript
let visible_range = 0.1;
// find neighbours:
for (let a of agents) {
	// clear the neighbour list:
	a.neighbours = [];
	// consider all possible agents:
	for (let b of agents) {
		if (a == b) continue; // don't count self
		// consider if we are close enough:
		let dist = vec2.distance(a.pos, b.pos) - a.size - b.size;
		if (dist < visible_range) {
			// add to list:
			a.neighbours.push(b);
		}      
	}
}
```

Notice how:
- we reset the `a.neighbours` list on each frame -- otherwise it would grow infinitely!  
- we make sure not to count ourselves (`if (a == b) continue`)
- we take into account the sizes of agents in computing the distance, so that it is distance between their edges rather than distance between their centres

<p class="codepen" data-height="300" data-theme-id="18447" data-default-tab="js,result" data-user="grrrwaaa" data-slug-hash="VgrYXr" data-preview="true" style="height: 300px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid black; margin: 1em 0; padding: 1em;" data-pen-title="neighbours">
  <span>See the Pen <a href="https://codepen.io/grrrwaaa/pen/VgrYXr/">
  neighbours</a> by Graham (<a href="https://codepen.io/grrrwaaa">@grrrwaaa</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://static.codepen.io/assets/embed/ei.js"></script>

---

## Death Note: adding/removing agents from an array

If we want to extend our model to support death, such as being eaten by a predator, infected by a disease, starvation, poison, fire, etc., we will need a way to remove items from our array of agents. Assuming that we can mark death by some property (such as ```a.dead = true```), you might expect to remove it from the ```agents``` array as follows:

```javascript
if (agents[n].dead) {
	agents.splice(n, 1);
}
```

> (Note that ```delete agents[n]``` won't work at all, it doesn't reshuffle the array to accommodate the gap, it just leaves the gap right there.)

Similarly, if an agent gives birth, you might expect to add the child as follows:

```javascript
if (child) {
	agents.push(child);
}
```

But in general, **adding to or removing from an array is not safe while iterating the array**, which is almost certainly the time that you would want to do it. The reason is that you may end up skipping an item, or trying to iterate over an item that no longer exists, or visiting an item twice, because the exact positions of items and the array length have changed. This is one of the classic problems commonly encountered in many imperative programming languages (e.g. C++ too). 

Here are two suggested solutions:

**Iterate backwards**

It is safe to splice and push while iterating backwards, because reshuffling an array only affects later items:

```javascript
let i = agents.length;
while (i--) {
	let a = agents[i];

	//.. do stuff, 
	// possibly setting dead = true 
	// or creating a chil
	
	if (dead) {
		// remove safely:
		agents.splice(i, 1);
	} else if (child) {
		// add a child:
		agents.push(child);
	}
}
```

Note that in this case, new births will not be visited until the next frame. This is probably what you want, since otherwise you might end up creating an infinite loop!

<p class="codepen" data-height="300" data-theme-id="18447" data-default-tab="js,result" data-user="grrrwaaa" data-slug-hash="xMPbqE" data-preview="true" style="height: 300px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid black; margin: 1em 0; padding: 1em;" data-pen-title="birth and death">
  <span>See the Pen <a href="https://codepen.io/grrrwaaa/pen/xMPbqE/">
  birth and death</a> by Graham (<a href="https://codepen.io/grrrwaaa">@grrrwaaa</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://static.codepen.io/assets/embed/ei.js"></script>

**Double-buffer**

Rather than modifying the array in-place, we build a new array on each iteration, and replace the original when done. This has the advantage of working with for-of loops:

```javascript
// create new array for the next frame's population:
let new_population = [];
for (let a of agents) {
	
	//.. do stuff, 
	// possibly setting dead = true 
	// or creating a child
	
	// preserve only living agents:
	if (!dead) new_population.push(a);
	// add a child?
	if (child) new_population.push(child);		
}
// replace original
agents = new_population;
```

Note that new children are added to ```newagents```, ensuring they are visited next frame. If we added them to ```agents```, they would also be included in the iterating for loop on the current frame, which could potentially lead to an infinite loop. 

<p class="codepen" data-height="300" data-theme-id="18447" data-default-tab="js,result" data-user="grrrwaaa" data-slug-hash="RvjPMm" data-preview="true" style="height: 300px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid black; margin: 1em 0; padding: 1em;" data-pen-title="birth and death">
  <span>See the Pen <a href="https://codepen.io/grrrwaaa/pen/RvjPMm/">
  birth and death</a> by Graham (<a href="https://codepen.io/grrrwaaa">@grrrwaaa</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://static.codepen.io/assets/embed/ei.js"></script>

## Practical limits of population sizes

Clearly if a population ever drops to zero, we will never see any organisms again. This may be problematic for an ongoing exhibition! Methods to overcome this include preventing death of the last (few?) creatures, or introducing new randomly seeded organisms (perhaps out of view) at low population sizes. 

At the other end, a population that grows excessively large can slow down the simulation, perhaps even crash it. Again, this is problematic for an ongoing exhibition. It may be necessary to set an absolute population size limit (preventing new agents from being added at this point). 

It would be preferable if a simulation didn't hit these externally-imposed limits; or at least, not very often. It would be preferable if some kind of *endogenous* forces, some processes that are part of the world itself, automatically avoid these events. Perhaps an overly-large population is sporadically decimated by extreme weather events, or a mass infection, for example. Whatever the solution, it involves macroscopic behaviour (population size) affecting microscopic behaviour (individual agents reproduction/death).

### Energy dynamics

If we are careful to apply an energetic cost to every agent activity, and energetic gain through eating/respiration/metabolism, we can count the total energy balance over the entire system on each frame. We can then apply that energy deficit/surplus back into the system in an environmental way, ensuring that the total energy of the system remains constant. 

- Each agent needs a representation of its currently available potential energy. 
- Each activity of an agent: metabolism, moving, eating, growing, reproducing, etc., has some energetic cost that reduces the agent's store.
- Certain activities (eating, respiring, etc.) may increase the he agent's energy store.
- Total energy in a population can be computed by summing the store of each member agent

This is the population's **total energy expenditure** (which incidentally may also be a useful indicator of the liveliness of a system).

- Total energy in the environment (such as a 'sugar' field2D) by adding up the total in each field cell (by ```sugar.sum()```)

Adding together the population and environmental totals gives is the measure of the **total available energy** in the world. The goal is for this total available energy to remain fairly constant, at an **ideal energetic carrying capacity**. Compute the difference of `available - ideal`: if there is surplus, remove it from the environment; if there is deficit, distribute new energy to the environment. So, if this total energy level is below the chosen carrying capacity for the world, we can then introduce energy back in, to ensure that the whole system doesn't wind down to zero. Re-introducing energy could be done by distributing it somewhat randomly in the space, or by probabilistic expansion of a current growth area, etc. Similarly, if it somehow exceeds the capacity, it can be randomly or gradually removed from the environment. 

Energy dynamics should help keep a population size in reasonable ranges, however it may still be necessary to also implement the hard limit cases.



<!--
[Example](http://codepen.io/grrrwaaa/pen/PZxrbo?editors=0010)

[And here's that example combined with the chemotaxis model](http://codepen.io/grrrwaaa/pen/QKXaGb?editors=0010)
-->