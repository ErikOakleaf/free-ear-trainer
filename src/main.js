const { invoke } = window.__TAURI__.core;

document.getElementById("testButton").addEventListener("click", () => {
    invoke("play_audio", { filePath: "src/assets/sine_waves/69.wav" });
    console.log("test button pressed");
});

window.addEventListener("DOMContentLoaded", () => {
    console.log("dom content loaded event type thing");
});
