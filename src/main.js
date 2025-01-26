const { invoke } = window.__TAURI__.core;

let current_interval = [];

document.getElementById("testButton").addEventListener("click", () => {
    invoke("get_interval", { validIntervals: 8191 }).then((interval) => {
        current_interval = interval;
        console.log(current_interval);
        invoke("play_interval_audio", {
            intervalInSemitones: current_interval,
        });
    });
});

document.querySelectorAll(".interval-button").forEach((button) => {
    button.addEventListener("click", (event) => {
        // button id will represnt the interval as a string
        const buttonId = event.target.id;

        // converting string to int that represents the interval in semitones

        const intervalToSemitones = {
            unison: 0,
            minorSecond: 1,
            majorSecond: 2,
            minorThird: 3,
            majorThird: 4,
            perfectFourth: 5,
            tritone: 6,
            perfectFifth: 7,
            minorSixth: 8,
            majorSixth: 9,
            minorSeventh: 10,
            majorSeventh: 11,
            perfectOctave: 12,
        };

        const semitones = intervalToSemitones[buttonId];

        const current_interval_semitones =
            current_interval[1] - current_interval[0];

        console.log(semitones);
        console.log(current_interval_semitones);

        if (current_interval_semitones == semitones) {
            console.log("correct");
        } else {
            console.log("false");
        }
    });
});

window.addEventListener("DOMContentLoaded", () => { });
