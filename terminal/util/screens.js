import clear from "../commands/clear.js";
import {parse, type, promt, input} from "./io.js";
import pause from "./pause.js";
import alert from "./alert.js";
import say from "./speak.js";


async function boot() {
    clear();
    await type([
        "Welcome to ECMA industries(TM) terminal",
		" ",
		"> SET TERMINAL/BOOT",
		"Loading........................",
		"Please wait........",
		"..........",
		"...",
		".",
		"OK.",
		" ",
		"> SET TERMINAL/LOGON",
		"USER AUTHENTICATION CHECK"
    ]);

    await pause();
    return login();
}

async function login() {
    clear();
    let user = await promt("Username:");
    let password = await promt("Password", true);

    if (user === "admin" && password === "admin") {
        await pause();
        say("AUTHENTICATION SUCCESSFUL");
        await alert("AUTHENTICATION SUCCESSFUL");
		clear();
		return main();
    } else {
        await type(["Incorrect user and/or password.", "Please try again"]);
		await pause(3);
		clear();
		return login();
    }
}

async function main() {
    let command = await input();
    try {
        await parse(command);
    } catch (e) {
        if(e.message) await type(e.message);
    }

    main();
}

function addClasses(el, ...cls) {
    let list = [...cls].filter(Boolean);
    el.classList.add(...list);
}

function getScreen(...cls) {
    let div = document.createElement("div");
    addClasses(div, "fullscreen", ...cls);
    document.querySelector("#crt").appendChild(div);
    return div;
}

function toggleFullscreen(isFullscreen) {
    document.body.classList.toggle("fullscreen", isFullscreen);
}

async function loadTemplates(path) {
    let txt = await fetch(path).then(res => res.text());
    let html = new DOMParser().parseFromString(txt, "text/html");
    let templates = html.querySelector("template");

    templates.forEach(template => {
        document.head.appendChild(template);
    });
}

async function addTemplate(id, container, options = {}) {
	let template = document.querySelector(`template#${id}`);
	if (!template) {
		throw Error("Template not found");
	}
	// Clone is the document fragment of the template
	let clone = document.importNode(template.content, true);

	if (template.dataset.type) {
		await type(clone.textContent, options, container);
	} else {
		container.appendChild(clone);
	}

	// We cannot return clone here
	// https://stackoverflow.com/questions/27945721/how-to-clone-and-modify-from-html5-template-tag
	return container.childNodes;
}

async function showTemplateScreen(id) {
	let screen = getScreen(id);
	await addTemplate(id, screen);
	return screen;
}

function el(type, container = document.querySelector(".terminal"), cls = "") {
	let el = document.createElement(type);
	addClasses(el, cls);

	container.appendChild(el);
	return el;
}

function div(...args) {
	return el("div", ...args);
}

export {
	boot,
	login,
	main,
	getScreen,
	toggleFullscreen,
	div,
	el,
	loadTemplates,
	addTemplate,
	showTemplateScreen
};