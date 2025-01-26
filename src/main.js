const { invoke } = window.__TAURI__.core;

let currentInterval = [];
const intervalButtons = document.querySelectorAll(".interval-button");

async function get_new_interval() {
    currentInterval = await invoke("get_interval", { validIntervals: 8191 });
}

function play_interval_audio() {
    invoke("play_interval_audio", {
        intervalInSemitones: currentInterval,
    });
}

document.getElementById("testButton").addEventListener("click", () => {
    play_interval_audio();
});

async function handleButtonClick(event) {
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

    const currentInterval_semitones = currentInterval[1] - currentInterval[0];

    console.log(semitones);
    console.log(currentInterval_semitones);

    if (currentInterval_semitones == semitones) {
        // turn every button to white if the correct answer is given

        intervalButtons.forEach((button) => {
            button.style.backgroundColor = "white";
        });

        // blink the current button green then white on the correct button
        const currentButton = document.getElementById(buttonId);
        currentButton.style.backgroundColor = "#50C878";
        setTimeout(() => {
            currentButton.style.backgroundColor = "white";
        }, 300);

        // get a new interval
        await get_new_interval();
        play_interval_audio();
    } else {
        const currentButton = document.getElementById(buttonId);
        currentButton.style.backgroundColor = "#CD5C5C";
    }
}

intervalButtons.forEach((button) => {
    button.addEventListener("click", handleButtonClick);
});

window.addEventListener("DOMContentLoaded", async () => {
    await get_new_interval();
    play_interval_audio();
});
