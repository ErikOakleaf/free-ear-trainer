const { invoke } = window.__TAURI__.core;
const { appWindow } = window.__TAURI__.window;
const { listen } = window.__TAURI__.event;

// define global scope variables

let currentInterval = [];
let weights = [];
let settings = [];
let weightApplied = false;
let enableWeights = true;
let bitmask = 0;

// define the html elements as variables

const intervalButtons = document.querySelectorAll(".interval-button");
const settingsIcon = document.getElementById("settingsIcon");
const mainView = document.getElementById("main");
const settingsView = document.getElementById("settings");
const settingsIntervalButtons = document.querySelectorAll(
    ".settings-interval-button",
);
const enableWeightsButton = document.getElementById("enableWeightsButton");

async function get_new_interval(bitmask) {
    currentInterval = await invoke("get_interval", {
        validIntervals: bitmask,
        weights: weights,
        enableWeights: enableWeights,
    });
}

function play_interval_audio() {
    invoke("play_interval_audio", {
        intervalInSemitones: currentInterval,
    });
}

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

    const currentIntervalInSemitones = currentInterval[1] - currentInterval[0];

    if (currentIntervalInSemitones == semitones) {
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

        // add weight to interval
        if (!weightApplied && enableWeights) {
            applyWeightToInterval(currentIntervalInSemitones, true);
            invoke("write_weights", { weights: weights });
            invoke("write_accuracy", {
                index: currentIntervalInSemitones,
                answerCorrect: true,
            });
        }

        weightApplied = false;

        // get a new interval
        await get_new_interval(bitmask);
        play_interval_audio();
    } else {
        const currentButton = document.getElementById(buttonId);
        currentButton.style.backgroundColor = "#CD5C5C";

        if (!weightApplied && enableWeights) {
            applyWeightToInterval(currentIntervalInSemitones, false);
            weightApplied = true;
            invoke("write_weights", { weights: weights });
            invoke("write_accuracy", {
                index: currentIntervalInSemitones,
                answerCorrect: false,
            });
        }
    }
}

function applyWeightToInterval(interval, answer_is_correct) {
    if (answer_is_correct) {
        weights[interval] = weights[interval] * 0.9;
    } else {
        weights[interval] = weights[interval] * 1.2;
    }
}

function calculateBitmask() {
    let bitmask = 0;

    settingsIntervalButtons.forEach((button, index) => {
        if (button.classList.contains("pressed")) {
            bitmask |= 1 << index;
        }
    });

    if (bitmask === 0) {
        bitmask = 1;
    }

    return bitmask;
}

function applyBitmask(bitmask) {
    intervalButtons.forEach((button, index) => {
        if ((bitmask & (1 << index)) !== 0) {
            button.style.display = "flex";
        } else {
            button.style.display = "none";
        }
    });
}

function applySettingsBitmask(bitmask) {
    settingsIntervalButtons.forEach((button, index) => {
        if ((bitmask & (1 << index)) !== 0) {
            button.classList.add("pressed");
        }
    });
}

document.getElementById("playButton").addEventListener("click", () => {
    play_interval_audio();
});

settingsIcon.addEventListener("click", async () => {
    // toggle the views between flex and none
    if (settingsView.style.display === "none") {
        mainView.style.display = "none";
        settingsView.style.display = "flex";
        settingsIcon.src = "assets/cross-out-mark.svg";
    } else {
        mainView.style.display = "flex";
        settingsView.style.display = "none";
        settingsIcon.src = "assets/settings-cog.svg";

        invoke("write_settings", {
            currentValidIntervals: bitmask,
            enableWeights: enableWeights,
        });

        invoke("write_weights", { weights: weights });

        await get_new_interval(bitmask);
        play_interval_audio();
    }
});

intervalButtons.forEach((button) => {
    button.addEventListener("click", handleButtonClick);
});

settingsIntervalButtons.forEach((button) => {
    button.addEventListener("click", () => {
        button.classList.toggle("pressed");

        bitmask = calculateBitmask();

        applyBitmask(bitmask);
    });
});

enableWeightsButton.addEventListener("click", function() {
    enableWeights = !enableWeights;
    this.classList.toggle("pressed");
});

document.getElementById("resetWeightsButton").addEventListener("click", () => {
    weights = new Array(13).fill(1.0);
});

window.addEventListener("DOMContentLoaded", async (event) => {
    event.preventDefault();

    weights = await invoke("load_weights");

    settings = await invoke("load_settings");
    bitmask = parseInt(settings[0]);

    // apply the correct class to the enable weights settings button
    enableWeights = JSON.parse(settings[1]);
    if (enableWeights) {
        enableWeightsButton.classList.add("pressed");
    }

    await get_new_interval(bitmask);
    play_interval_audio();

    applyBitmask(bitmask);
    applySettingsBitmask(bitmask);
});
