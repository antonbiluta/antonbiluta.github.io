import TypeIt from "TypeIt"
function pause(s = 1){
    return new Promise(resolve => setTimeout(resolve, 1000*Number(s)));
}

async function input(pw){
    return new Promise(resolve => {
        const onKeyDown = event =>{
            if(event.KeyCode === 13) {
                event.preventDefault();
                let result = event.target.textContent;
                resolve(result);
            }
        };

        let terminal = document.querySelector(".terminal");
        let input = document.createElement("div");
        input.setAttribute("id", "input");
        input.setAttribute("contenteditable", true);
        input.addEventListener("keydown", onKeyDown);
        terminal.appendChild(input);
        input.focus();
    });
}


async function boot(){
    clear();
    await typer("Hello world");

    login();
}

async function main(){
    let command = await Input();
    await parse(command);

    main();
}

async function type(text, container) {
    await pause(1);
    let queue = text.split("");
    while (queue.length) {
        let char = queue.shift();
        container.appendChild(char);
        await pause(0.05);
    }

    await pause(0.5);
    container.classList.remove("active");
    return;
}


new TypeIt('#container', {
    strings: ["Hello", "world"],
    speed: 50,
    lifeLike: true,
    startDelay: 0,
    cursorChar: "■"
}).go();