const { invoke } = window.__TAURI__.core;

document.getElementById("testButton").addEventListener("click", () => {
    invoke("play_interval_audio");
    console.log("test button pressed");
});

window.addEventListener("DOMContentLoaded", () => {
    console.log("dom content loaded event type thing");
});
