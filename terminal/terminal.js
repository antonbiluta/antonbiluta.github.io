import { setVolume } from "./util/speak.js";
import { click } from "./sound/index.js";
import { on, off } from "./util/power.js";
import { toggleFullscreen } from "./util/screens.js";
import { type } from "./util/io.js";

async function onload() {
    const urlParams = new URLSearchParams(window.location.search);
    const command = urlParams.get("command");

    if(command) {
        const { power } = await import("./util/power.js");
        const { parse } = await import("./util/io.js");
        power();
        await type("> "+ command, {initialWait: 3000, finalWait: 1500});
        await parse(command);

        const { main } = await import("./util/screens.js");
        main();
    }
}