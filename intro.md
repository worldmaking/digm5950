<!--
{
	template: "slides.html",
	cover_image: "img/infranet_nyc_swpk_2019_2.jpg"
}
-->

# What is Life?

Easy to answer a long time ago, but not anymore... 

---youtube:QOCaacO8wus

---

**Reductionism:** Once we believed that if we could see the smallest components of life, down to the microscopia, we would understand life. But, what we found is that life & non-life were basically made of the same stuff. 

The only difference seems to be in how they are organized (or, rather, how they organize themselves). Life tends to slow down the processes of entropy, and complexify itself into highly unlikely structures and behaviours, by copying and rewriting itself as it interacts with a dynamic environment. <!-- .element: class="fragment" -->

Computing pioneer John von Neumann: "life is a process which can be abstracted away from any particular medium." <!-- .element: class="fragment" -->

But if so, there is no reason to suppose that life cannot occur in systems that are not part of our natural evolution, including digital media. <!-- .element: class="fragment" -->

# Artificial Life

A-Life examines systems related to life, its processes, and its evolution, through the use of simulations with computer models (*soft* Alife), robotics (*hard* Alife), and biochemistry (*wet* Alife). 

The discipline was named by Christopher Langton, an American computer scientist, in 1986, and began with a colorful collection of biologists, robot engineers, computer scientists, artists, and philosophers. Today aspects of Artificial Life recur in Biologically-Inspired Computing, Complexity Science, Bioinformatics, Synthetic Biology...

notes:

We will focus on the soft Alife in this course. 

ALife has always been highly transdisciplinary.

---

How would we recognize life that is "not as we know it"?

notes:

"...the study of artificial systems that exhibit behavior characteristic of natural living systems. It is the quest to explain life in any of its possible manifestations, without restriction to the particular examples that have evolved on earth... the ultimate goal is to extract the logical form of living systems." Christopher Langton, 1992.

Langton, C.G. (1989) "Artificial Life", in Artificial Life, Langton (ed), (Addison-Wesley:Reading, MA) page 1.

--- 

How life can emerge from non-life? 

notes:

It is a question upon which science can only speculate, as we have no readily available examples of the spontaneous emergence of life for empirical study. However the problem can be approached more generally as the modeling of the emergence of complex structures which evoke life-like characteristics, from simpler dynamic substrates.

# Artificial Life Contributions

- **Models** and simulations to extend understanding of biology. Success measured by predictive and/or explanatory capacity. Examples in Bioinformatics. 
- **Problem solving**: tools & optimization. Success measured by effectiveness/efficiency at solving a problem. Examples of: Genetic Algorithms, Neural Networks.
- **New Ontologies and Instantiations**. Diffuse boundaries of artificial and natural, exploring **"life-as-it-could-be"** rather than "life-as-we-know-it". Success in developing what we intuitively mean by "lifelike". Example: Artificial Life Art.

notes: 

[Etxeberria, Arantza. "Artificial evolution and lifelike creativity." Leonardo 35, no. 3 (2002): 275-281.](https://www.researchgate.net/profile/Arantza_Etxeberria2/publication/249562226_Artificial_Evolution_and_Lifelike_Creativity/links/5d6bf722458515088606478d/Artificial-Evolution-and-Lifelike-Creativity.pdf)

---

- Cellular automata among the oldest contributions, still widely used today. Read: [Wolfram](http://www.stephenwolfram.com/publications/articles/ca/).
- Evolutionary algorithms (genetic algorithm, evoluationary programming, swarm intelligence, ant colony optimization, ...): wide applicability in engineering/design optimization. Read: Holland, Koza. 
- Artificial chemistry: abstract chemical reactions to simulate the emergence of life. Read: Fontana.
- Agent-based systems: from scientific modeling to ubiquitous computing and robotics. 
- L-systems, rewriting systems and developmental modeling have been heavily used in computer graphics. Read: Lindenmeyer, Prusinkiewicz.


---youtube:JBgG_VSP7f8

[Sims, Karl. "Evolving virtual creatures." In Proceedings of the 21st annual conference on Computer graphics and interactive techniques, pp. 15-22. 1994.](http://www.karlsims.com/papers/siggraph94.pdf)

See also [3DEVC examples](https://www.youtube.com/watch?v=AJwGXiGKwrI&list=PLA6418CCA878BD139&ab_channel=CreatureMann)

---youtube:fjNPUtwURpc

11:45: "Nature is full of highly complicated objects, and their shape is the result of a growing process, which is dynamical.  One way to model it would be to put in all coordinates of every detail in a computer -- but that would be insane. **You have to construct it in the same way that it constructed itself.** If you could find a simple set of rules that could make a repeating pattern you could describe a whole tree with just those few rules. What [we are doing] is not only to make more accurate pictures, but to go beyond that, [to find] rules to grow the object in the way the real living thing does..."


# Emergent Systems

Rather than taking a specific system and investigating its prinicpal features **top-down**, A-Life tends to investigate living principles through a **bottom-up** approaches, investigating simulations in which complex behaviours or other **emergent phenomena** arise from:

- a simple set of rules,
- a population to follow those rules,
- a method to apply these rules.

Results are *emergent* in that they are not explicable, or predictable, from the rules themselves -- to some extent they go beyond the author of the system.

notes:

- The strategy of making possible complex phenomena by the simulation of simple components.
- In a bottom-up approach the individual base elements of the system are first specified in great detail. These elements are then linked together to form larger subsystems, which then in turn are linked, sometimes in many levels, until a complete top-level system is formed.
- [Wikipedia: Top-down and bottom-up design](https://en.wikipedia.org/wiki/Top-down_and_bottom-up_design)

---

How can we describe or explore the infinite, while being finite?

---

A-Life's bottom-up, emergent emphasis forms deep synergies with concerns of **Generative Art**, which is constructed in part according to sets of simple rules and processes that are to some degree outside the author's control. 

--- 

> "In essence, all generative art focuses on the process by which an artwork is made and this is required to have a degree of autonomy and independence from the artist who defines it." 

notes:

[McCormack, Jon, Oliver Bown, Alan Dorin, Jonathan McCabe, Gordon Monro, and Mitchell Whitelaw. "Ten questions concerning generative computer art." Leonardo 47, no. 2 (2014): 135-141.](http://jonmccormack.info/wp-content/uploads/2012/10/TenQuestionsV3.pdf)


---

> **"The idea becomes a machine that makes the art."**

notes:

Sol LeWitt (b.1928, Hartford, CT; d. 2007, New York) was a leading figure of Minimalism, a pioneer of Conceptual art, and a significant figure in the literature of Generative Art. He has been the subject of numerous one-artist exhibitions and his work is held in public collections worldwide. [In 2008, MASS MoCA opened Sol LeWitt: A Wall Drawing Retrospective, which will remain on view through 2033.](https://massmoca.org/sol-lewitt/)

LeWitt began to create works that utilized simple and impersonal geometric forms, exploring repetition and variations of a basic form or line to achieve complex works.

More importantly, he evolved a working method for creating artworks based on simple rules, works that could be executed by others rather than the artist. Formulated from an initial idea outlined in a diagrammatic sketch accompanied by a set of instructions, his works are installed on the wall of the gallery or museum by a team of assistants, who rigorously follow the artist’s directives. Some instructions are simple and straightforward, and some are long and complex. 



---image:img/Sol_LeWitt_wall_drawing_Metz.jpg

notes:

**The idea becomes a machine that makes the art.** 

*The ideas need not be complex.* Most ideas that are successful are ludicrously simple... In terms of ideas the artist is free even to surprise himself. 

*To work with a plan that is preset is one way of avoiding subjectivity.* It also obviates the necessity of designing each work in turn... Some plans would require millions of variations, and some a limited number, but both are finite. *Other plans imply infinity.*

When an artist uses a multiple modular method he usually chooses a simple and readily available form. The form itself is of very limited importance; it becomes the grammar for the total work. In fact, it is best that the basic unit be deliberately uninteresting so that it may more easily become an intrinsic part of the entire work... Using a simple form repeatedly concentrates the intensity to the arrangement of the form. This arrangement becomes the end while the form becomes the means." 

[Sol LeWitt (1928–2007), “Paragraphs on Conceptual Art,” Artforum 5, no. 10 (June 1967), pp. 79–83](https://www.corner-college.com/udb/cproVozeFxParagraphs_on_Conceptual_Art._Sol_leWitt.pdf)

---vimeo:98652491

`Drawing 797: The first drafter has a black marker and makes an irregular horizontal line near the top of the wall.  Then the second drafter tries to copy it (without touching it) using a red marker.  The third drafter does the same, using a yellow marker.  The fourth drafter does the same using a blue marker.  Then the second drafter followed by the third and fourth copies the last line drawn until the bottom of the wall is reached. October 1995, Black, red, yellow, blue marker`

Courtesy of the Estate of Sol LeWitt (Designated for Yale University Art Gallery)

First Installation: Mead Art Museum, Amherst College, Amherst

Location: MASS MoCA Building 7 Ground Floor. https://massmoca.org/event/walldrawing797/

---image:img/reas_lewitt.png

notes:

Artist and Software Designer Casey Reas, co-author of Processing, has often cited Sol Lewitt's importance and influence.

This was explicit in his **{Software} Structures**, which explores the relevance of conceptual art to the idea of software as art.

"The catalyst for this project is the work of Sol LeWitt, specifically his wall drawings. I had a simple question: 'Is the history of conceptual art relevant to the idea of software as art?'" explains Reas. "I began to answer the question by implementing three of Lewitt's drawings in software and then making modifications. 

- Whitney Museum of American Art [http://whitney.org/Exhibitions/Artport/Commissions/SoftwareStructures]()

---image:img/reas_structures.png

notes:

"After working with the LeWitt plans, I created three structures **unique to software**. These software structures are text descriptions outlining dynamic relations between elements. They develop in the vague domain of image and then mature in the more defined structures of natural language before any thought is given to a specific machine implementation. 

"Twenty-six pieces of software derived from these structures were written to isolate different components of software structures including interpretation, material, and process. For each, you may view the software, source code, and comments."

{Software} Structures was restored in 2016 to work well with contemporary web browsers using Javascript, explorable here:
[https://artport.whitney.org/commissions/softwarestructures/map.html]()


---vimeo:74304505

An **Element** is a simple machine comprised of a **Form** and one or more **Behaviours**. For example, **Element 5:**

- F2: Line
- B1: Move in a straight line
- B5: Enter from the opposite edge after moving off the surface
- B6: Orient toward the direciton of an Element that is touching
- B7: Deviate from the current direction

A **Process** defines an environment for Elements and determines how the relationships bwetween Elements are visualized. For example, **Process 18**: 

`A rectangular surface filled with instances of Element 5, each with a different size and gray value. Draw a quadrilateral connecting the endpoints of each pair of Elements that are touching. Increase the opacity of the quadrilateral while the Elements are touching and decrease while they are not.`

---

**A Framework for understanding Generative Art**

1. Entities
2. Processes
3. Environmental interaction
4. Sensory outcomes

notes:

[Dorin, Alan, Jonathan McCabe, Jon McCormack, Gordon Monro, and Mitchell Whitelaw. "A framework for understanding generative art." Digital Creativity 23, no. 3-4 (2012): 239-259.](http://www.tandfonline.com/doi/pdf/10.1080/14626268.2012.709940)

---

1. Entities
	- The subjects on which the artwork's processes act; real or conceptual, simulated, physical, chemical, biological or mechanical. 
	- Generally unitary/indivisible, though they have properties and states, and may form hierarchies
	- E.g. agent-based systems (whether monoculture or ecosystemic)
	- Perceived only via a *mapping*

---

2. Processes
	- May or may not be directly apparent
	- Operate on/by entities, possibly in process hierarchies
	- Describe via:
		- Initial conditions/initialization procedures
		- Possibly termination conditions
		- Continuation methods
		- Micro/macro events
		- Positive & negative feedbacks (cybernetics/regulation)
		- Statistical macrobehaviours/system dynamic tendencies

---
	
3. Environmental interaction

	- Flows of information between artwork/system and its operating environment
		- In both process of creation and final presentation (if separate)
	- Initial or continual, discrete or continuous, parametric
	- Physical sensors, human interaction, network...
	- Interactions in terms of frequency, range, and significance
	- How system output may influence subsequent input, also in frequency, range, and significance
	- Tweaking, selecting, filtering, rewriting


---

4. Sensory outcomes
	- visual, sonic, musical, literary, sculptural, etc.
		- static: snapshots, accretions, end-states
		- time-based: offline, real-time, interactive
	- multiplicity of results, framing/editing
		- flat: entities/processes are directly visible
		- mapping: transformation into perceptible outcomes, what should be perceived and how it should be mapped
			- natural mappings closely align in structure / entities & process match ontology of outcomes -- but not always possible


# Artificial life art

Langton accorded importance to the creative and aesthetic aspects of artificial life. "Life-as-it-could-be" asks us to be creators. 

For three decades artists have created artificial life art, or what Mitchell Whitelaw has called [Metacreation](https://mitpress.mit.edu/books/metacreation). Artificial life artists create works (processes) that seem to mutate, evolve, and respond and generate with a life of their own. Several works have been accoladed in scientific as well as art communities (and others). 


---image:img/latham_brain.png

notes: 
William Latham, "Artist As Gardener"

"A portrait of William Latham sketching a FormSynth drawing. Here, Latham is drawing according to the FormSynth rule set and using his brain as a graphics device." 1984.    
[http://latham-mutator.com/]()

(Brian Eno also made the "gardener" analogy for generative music)


William Latham is a designer of computer games, a computer artist and entrepreneur. Expertise in evolutionary art, graphics, generative art, genetics, and the entertainment and video games industries. From 1987 to 1994 he worked for IBM in their Advanced Computer Graphics and Visualisation Division at IBM Hursley near Winchester, and his Mutation work achieved world wide recognition at SIGGRAPH and other events and a number of IBM patents were published.

---image:img/latham_drawings.png

notes:

http://latham-mutator.com/

http://mutatorvr.co.uk/art/ 


---youtube:MZGOr94468w


---image:img/sims_evo_images.png

notes:

[Genetic Images](https://www.karlsims.com/genetic-images.html) is a media installation in which visitors can interactively "evolve" abstract still images. A supercomputer generates and displays 16 images on an arc of screens. Visitors stand on sensors in front of the most aesthetically pleasing images to select which ones will survive and reproduce to make the next generation.

[Sims, Karl. "Artificial evolution for computer graphics." In Proceedings of the 18th annual conference on Computer graphics and interactive techniques, pp. 319-328. 1991.](http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.226.7450&rep=rep1&type=pdf)

---youtube:0WG45k93pCA

[Sommerer, Christa, and Laurent Mignonneau. "A-Volve-an evolutionary artificial life environment." Artificial Life VC Langton and C. Shimohara Eds., MIT (1997): 167-175.](http://www.interface.ufg.ac.at/christa-laurent/WORKS/CONCEPTS/A-VolveConcept.html)

Sommerer & Mignonneau here worked with A-Life pioneer Thomas Ray, author of the Tierra computational ecosystem.

---vimeo:93056665

[Andy Lomas](https://andylomas.com/) - Morphogenetic Creations.

Exhibited at the Ars Electronica Festival and the Bridges 2014 conference of maths and art.

[The procedure is fully detailed in his paper "Cellular Forms: an Artistic Exploration of Morphogenesis".](https://andylomas.com/extra/andylomas_paper_cellular_forms_aisb50.pdf) It's worth reading this paper and considering the similarities and differences with the flocking algorithm, for example.

The animations use digital simulation of a simplified biological model of morphogenesis, with three-dimensional structures generated out of interconnected particles to represent cells. Each form starts with a initial spherical cluster of cells which is incrementally developed over time by adding iterative layers of complexity to the structure. The aim is to create forms emergently: exploring generic similarities between many different shapes in nature rather than emulating any particular organism, revealing universal archetypal forms that can come from growth-like processes rather than top-down externally engineered design. Cell division is controlled by accumulated nutrient levels. When the level in a cell exceeds a given threshold the cell divides, and various parameters control how both the parent and daughter cells re-connect to their immediate neighbours. New nutrient can be created by photons in cells hit by incident light rays. Nutrient can also be allowed to flow to adjacent cells. The simulation process is repeated over thousands of iterations and millions of particles, with each of the final structures comprising over fifty million cells.

---vimeo:120987833

Humans have always looked to nature for inspiration. As artists, we have done so in creating a family of ["Artificial Natures”](https://artificialnature.net/): interactive art installations surrounding humans with biologically-inspired complex systems experienced in immersive mixed reality. The invitation is to become part of an alien ecosystem rich in networks of complex feedback, but not as its central subject. Although artificial natures are computational, we draw our inspiration from the sense of open-ended continuation and the aesthetic integration of playful wonder with the tension of the unfamiliar recalled from childhood explorations in nature. By giving life to mixed reality we’re anticipating futures inevitably saturated in interconnected computational media. However we believe computation is not intrinsically utilitarian, nor in opposition to nature; we see it instead as a material means to plunge even more deeply into what nature is, and find our place within it. Artificial Nature springs from an inherent curiosity and aesthetic survival instinct to narrate alternate worlds in superposition to us, as a reminder that although the imaginable is greater than the known, the real is greater and weirder still.

---youtube:Ls26K2FKyI0

[A recent 45-minute presentation on Artificial Nature at Sensilab, Monash University](https://sensilab.monash.edu/forums/haru-ji-graham-wakefield/)

---image:img/yinyang-bg.png

<div style="text-align:center;">
Theory
<br/><br/><br/><br/><br/><br/><br/>
Practice
</div>

