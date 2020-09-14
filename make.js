const fs = require("fs"),
	path = require("path")

const JSON5 = require("json5")
const marked = require("marked")
const hljs   = require('highlight.js')
const template = require('es6-dynamic-template')

marked.setOptions({
	highlight: function(code, lang) {
	  return hljs.highlight(lang, code).value;
	}
});

// add some library words to the highlighter:
hljs.getLanguage("javascript").keywords.built_in += " now dt random wrap shuffle write draw2D field2D vec2 hashspace2D mouse key update draw reset "

const meta_default = {
	author: "Graham Wakefield",
	template: "template.html",
	title: "",
	description: "",
	cover_image: "img/collaborative_coding.jpg"
}


function generate(file) {
	let src = fs.readFileSync(path.format(file), "utf8");

	console.log("parsing", file.name)
	// lazy deep copy of meta defaults:
	let meta = JSON.parse(JSON.stringify(meta_default)) 
	// update metadata from JSON header:
	let match = (/<!--\s*(\{[\S\s]+?\})\s*-->/gm).exec(src)
	if (match) {
		try {
			let header = JSON5.parse(match[1])
			Object.assign(meta, header);
			src = src.replace(/<!--\s*(\{[\S\s]+?\})\s*-->/gm, "")
		} catch (e) {
			//console.warn("unable to find/parse JSON header for", file.name)
		}
	}
	//  parse title from md:
	try {
		if (!meta.title) meta.title = (/\n#\s+(.+)/gm).exec(src)[1];
	} catch (e) {
		//console.warn("unable to find/parse title")
	}

	// TODO create TOC

	// https://vimeo.zendesk.com/hc/en-us/articles/360001494447-Using-Player-Parameters
	meta.src = src
		// auto slide break at heading 1 titles:
		.replace(/\n(#\s[^\n]+)/g, "\n---\n\n$1")
		// replace @image:path as background contain 
		.replace(/\n---image:([^\s]+)/g, `\n---\n<!-- .slide: data-background-image="$1" data-background-size="contain" -->`)
		// // replace @youtube:ID as background video
		.replace(/\n---youtube:([^\s]+)/g, `\n---\n<!-- .slide: data-background-interactive data-background-iframe="https://youtube.com/embed/$1?rel=0&autoplay=1&start=0" -->\n\nnotes:\n`)
		.replace(/\n---vimeo:([^\s]+)/g, `\n---\n<!-- .slide: data-background-interactive data-background-iframe="https://player.vimeo.com/video/$1?rel=0&autoplay=1&start=0&muted=0" -->\n\nnotes:\n`)

	meta.body = marked(meta.src);

	let html = template(fs.readFileSync(meta.template, "utf8"), meta);

	const writepath = path.join(__dirname, `${file.name}.html`)
	fs.writeFileSync(writepath, html)
	return writepath;
}

console.log("written:", fs.readdirSync(__dirname, "utf8").map(file=>path.parse(file)).filter(file=>file.ext==".md").map(generate))



