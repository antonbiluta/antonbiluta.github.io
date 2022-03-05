import pause from "./pause";

let prev = getHistory();
let historyIndex = -1;
let tmp = "";
let interval;

function getHistory() {
    let storage = localStorage.getItem("commandHistory");
    let prev;
    if(storage) {
        try{
            let json = JSON.parse(storage);
            prev = Array.isArray(json) ? json:[];
        } catch(e) {
            prev = [];
        }
    } else {
        prev = [];
    }
    return prev;
}

function addToHistory(cmd) {
    prev = [cmd, ...prev];
    historyIndex = -1;
    tmp = "";

    try {
        localStorage.setItem("commandHistory", JSON.stringify(prev));
    } catch (e) {}
}


function getChar(char){
    let result;
    if(typeof char === "string") {
        if(char === "\n") {
            result = document.createElement("br");
        } else if (char === "\t"){
            let tab = document.createElement("span");
            tab.innerHTML = "&nbsp;&nbsp;&nbsp;";
            result = tab;
        } else if (char === " "){
            let space = document.createElement("span");
            space.innerHTML = "&nbsp;";
            space.classList.add("char");
            result = space;
        } else {
            let span = document.createElement("span");
            span.classList.add("char");
            span.textContent = char;
            result = span;
        }
    }
    return result;
}

async function type(
    text,
    {
        wait = 50,
        initialWait = 1000,
        finalWait = 500,
        typerClass = "",
        useContainer = false,
        stopBlinking = true,
        processChars = true,
        clearContainer = false
    } = {},
    container = document.querySelector(".terminal")
) {
    return new Promise(async resolve => {
        if(interval) {
            clearInterval(interval);
            interval = null;
        }

        let typer = useContainer ? container : document.createElement("div");
        typer.classList.add("typer", "active");

        if (typerClass){
            typer.classList.add(typerClass);
        }

        if(clearContainer){
            container.innerHTML = "&nbsp;";
        }

        if(!useContainer){
            container.appendChild(typer);
        }

        if(initialWait){
            await pause(initialWait / 1000);
        }

        let queue = text;
        if(processChars) {
            if(Array.isArray(text)){
                text = text.join("\n");
            }
            queue = text.split("");
        }

        let prev;
        say(text);

        interval = setInterval(async () =>{
            if(queue.length) {
                let char = queue.shift();

                if (processChars && prev) {
                    prev.remove();
                    if(
                        prev.firstChild &&
                        prev.firstChild.nodeType === Node.TEXT_NODE
                    ) {
                        typer.innerHTML += prev.innerHTML;
                    } else {
                        typer.appendChild(prev);
                    }
                }
                let element = processChars ? getChar(char) : char;
                if (element) {
                    typer.appendChild(element);

                    if (element.nodeName == "BR"){
                        scroll(container);
                    }
                }
                prev = element;
            } else {
                clearInterval(interval);
                await pause(finalWait / 1000);
                if (stopBlinking) {
                    typer.classList.remove("active");
                }
                resolve();
            }
        }, wait);
    });
}

function isPrintable(keycode) {
    return (
        (keycode > 47 && keycode < 58) ||
        keycode === 32 ||
        (keycode>64 && keycode < 91) ||
        (keycode > 95 && keycode < 112) ||
        (keycode > 185 && keycode < 193) ||
        (keycode > 218 && keycode < 223)
    );
}

function moveCaretToEnd(el) {
    var range, selection;
    if(document.createRange) {
        range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }
}


async function input(pw) {
    return new Promise(resolve => {
        const onKeyDown = event =>{
            typeSound();
            
            // ENTER
            if (event.keyCode == 13) {
                event.preventDefault();
                event.target.setAttribute("contenteditable", false);
                let result = cleanInput(event.target.textContent);

                // history
                addToHistory(result);
                resolve(result);
            }
            // UP
            else if (event.keyCode == 38) {
                if(hostoryIndex === -1) tmp = event.target.textContent;
                historyIndex = Math.min(prev.length - 1, historyIndex + 1);
                let text = prev[historyIndex];
                event.target.textContent = text;
            }
            // DOWN
            else if (event.keyCode === 40) {
                historyIndex = Math.max(-1, historyIndex - 1);
                let text = prev[historyIndex] || tmp;
                event.target.textContent = text;
            }
            // BACKSPACE
            else if (event.keyCode === 8) {
                if (event.target.textContent.length === 1) {
                    event.preventDefault();
                    event.target.innerHTML = "";
                }
            }

            else if (isPrintable(event.keyCode) && !event.ctrlKey) {
                event.preventDefault();
                let span = document.createElement("span");

                let keyCode = event.keyCode;
                let chrCode = keyCode - 48 * Math.floor(keyCode / 48);
                let chr = String.fromCharCode(
                    96 <= keyCode ? chrCode : keyCode
                );

                span.classList.add("char");
                span.textContent = chr;
                event.target.appendChild(span);

                if (pw) {
                    let length = event.target.textContent.length;
                    event.target.setAttribute(
                        "data-pw",
                        Array(length).fill("*").join("")
                    );
                }
                moveCaretToEnd(event.target);
            }
        };

        let terminal = document.querySelector(".terminal");
        let input = document.createElement("span");
        input.setAttribute("id", "input");
        if(pw){
            input.classList.add("password");
        }
        input.setAttribute("contenteditable", true);
        input.addEventListener("keydown", onKeyDown);
        terminal.appendChild(input);
        input.focus();
    });
}


async function parse(input) {
    input = cleanInput(input);

    if(!input){
        return;
    }

    let matches = String(input).match(/^(\w+)(?:\s((?:\w+(?:\s\w+)*)))?$/);

	if (!matches) {
		throw new Error("Invalid command");
	}
	let command = matches[1];
	let args = matches[2];

    let naughty = ["fuck", "shit", "die", "ass", "cunt"];
	if (naughty.some(word => command.includes(word))) {
		throw new Error("Please don't use that language");
	}

    let module;

	try {
		module = await import(`../commands/${command}.js`);
	} catch (e) {
		console.error(e);
		if (e instanceof TypeError) {
			return await type("Unknown command");
		} else {
			return await type("Error while executing command");
		}
	}

    if (module && module.stylesheet) {
        addStylesheet(module.stylesheet);
    }

    if (module && module.template) {
        await loadTemplates(`../templates/${module.template}.html`);
    }

    if (module && module.output) {
        await type(module.output);
    }

    await pause();

    if (module.default) {
        await module.default(args);
    }
    return;
}

function cleanInput(input) {
    return input.toLowerCase().trim();
}

function scroll(el = document.querySelector(".terminal")){
    el.scrollTop = el.scrollHeight;
}

async function prompt(text, pw=false){
    await type(text);
    return input(pw);
}

async function waitForKey() {
    return new Promise(resolve => {
        const handle = () => {
            document.removeEventListener("keyup", handle);
            document.removeEventListener("click", handle);
            resolve();
        };
        document.addEventListener("keyup", handle);
        document.addEventListener("click", handle);
    });
}

function addStylesheet(file) {
    let head = document.getElementsByTagName("HEAD")[0];

    let link = document.createElement("link");

    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = `style/${file}.css`;

    head.appendChild(link);
}

export {prompt, input, cleanInput, type, parse, scroll, waitForKey};