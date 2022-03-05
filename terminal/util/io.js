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