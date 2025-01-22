const { invoke } = window.__TAURI__.core;

let greetInputEl;
let greetMsgEl;

async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    greetMsgEl.textContent = await invoke("greet", {
        name: greetInputEl.value,
    });
}

window.addEventListener("DOMContentLoaded", () => { console.log("dom content loaded event type thing")});
