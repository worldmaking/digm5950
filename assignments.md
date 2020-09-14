# Assignments

Assignments/projects are assessed by the following criteria:

1. Execution: How well instructions were followed and conceptual goals of the assignment were met. 
2. Technical completeness: Functionality, accuracy, efficiency, creativity, and clear structure in the development and in the results.
3. Novel contribution: Ingenuity in response to unanticipated challenges, comprehension and creativity beyond what is demonstrated in labs, and vision in further extension.
4. Aesthetic qualities: The clear and consistent articulation and composition of a creative whole, and the experiential and/or conceptual depth thereof, within the frame of the given assignment and context of the course. 

Graduate students are expected to achieve a higher calibre of work and depth of research underlying the realization of the assignments and project. 

## Take Notes

Take notes as you go. You might find more than one interesting behaviour, or variant; try to find out what the key features or differences are. If you had an idea that seemed interesting but was difficult to implement or did not lead to interesting results, write that down too (with an explanation of why you think it did not work or did not do what you expected); this is just as important a part of research! 

## Dividing Time

- You might spend roughly a third of your time choosing what to try and design, 
- a third actually implementing it, 
- and a third exploring it for interesting parameters, initial conditions, rule variations etc. 

## Formatting Code

Before submitting code, ensure that it meets all of the following formatting requirements:

- Put a `block comment` at the top of your code with the following information (that is, a multi-line comment starting with `/*` and ending with `*/`):
  - Your student number
  - The assignment number
  - Your name
  - The **title** of your work
  - A description of any **interactions** it supports, or interesting variations of global parameters. E.g. if the viewer should use mouse or specific keys to make things happen; or whether to reset it several times and see how differently it runs. Also, whether there are any specific variables that are worth modifying to see significantly different behaviour.
- After this comes your code. 
  - Ensure that there are enough comments in the code. 
    - A good rule of thumb is that at least 30% of the lines in your script should be comments (not including the block comments at top & bottom); or another rule of thumb is to expect comments every 1-4 lines. 
    - Comments should actually illuminate the code meaningfully (e.g. "set x to 3" is NOT a useful comment for `x = 3`). Use the comments to say WHY. 
    - All functions should have a comment to say what they can be used for, what the arguments are expected to be, and what they will return.
  - Ensure that you use meaningful variable names: they should help describe what they refer to, as this makes code easier to understand. 
    - Single-letter names are usually only used briefly. 
    - Boolean variables tend to begin with "is" or "has" etc. 
    - Arrays may use plural rather than singular names. Etc.
  - Ensure you have properly indented your code. This is pretty easy in Codepen: choose "Format Code" in the drop-down menu at the top-right of the "JS" window in Codepen. 
    - Code that isn't indented properly is really hard to read, and can often lead to strange bugs. Being in the habit of frequently indenting properly helps avoid these bugs.
- Put another `block comment` at the **end** of the code. This one will contain all your notes gathered while developing your script, as per the guidelines above. In particular:
  - A **description** of the idea of the system, how it works (or why it doesn't), and why it is interesting, surprising, etc (or why it didn't meet your expectations). What kinds of long-term behaviors it supports. 
  - A description of the **technical realization**. (Perhaps you tried a few different algorithms until it worked as expected?) If you were inspired by another system, mention it.
  - Ideas for possible **future extensions** of the project.

## Assignment 1

**Cellular automata**

The first assignment is to construct a new cellular system. You can start from one of the existing systems we have looked at and modify it, or design and create a new one to explore an idea you have. Use the starter-kit from the [labs](labs.html). 

Look through the [cellular systems](ca.html) page for ideas of variations to try and implement. 

Follow all the guidelines above on taking notes, formatting your code, and recording comments. 
