const { invoke } = window.__TAURI__.core;

let currentInterval = [];
const intervalButtons = document.querySelectorAll(".interval-button");
const settingsIcon = document.getElementById("settingsIcon");
const mainView = document.getElementById("main");
const settingsView = document.getElementById("settings");
const settingsIntervalButtons = document.querySelectorAll(
    ".settings-interval-button",
);

async function get_new_interval(bitmask) {
    console.log(bitmask);
    currentInterval = await invoke("get_interval", { validIntervals: bitmask });

    // debug stuff here
    document.getElementById("testTag").innerHTML =
        currentInterval[1] - currentInterval[0];
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
        await get_new_interval(calculateBitmask());
        play_interval_audio();
    } else {
        const currentButton = document.getElementById(buttonId);
        currentButton.style.backgroundColor = "#CD5C5C";
    }
}

function calculateBitmask() {
    let bitmask = 0;

    settingsIntervalButtons.forEach((button, index) => {
        if (button.classList.contains("pressed")) {
            bitmask |= 1 << index;
        }
    });

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

document.getElementById("testButton").addEventListener("click", () => {
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
        await get_new_interval(calculateBitmask());
        play_interval_audio();
    }
});

intervalButtons.forEach((button) => {
    button.addEventListener("click", handleButtonClick);
});

settingsIntervalButtons.forEach((button) => {
    button.addEventListener("click", () => {
        button.classList.toggle("pressed");

        let bitmask = calculateBitmask();

        applyBitmask(bitmask);

        invoke("write_settings", { currentValidIntervals: bitmask });
    });
});

window.addEventListener("DOMContentLoaded", async () => {
    let settings = await invoke("load_settings");
    let bitmask = parseInt(settings[0]);

    await get_new_interval(bitmask);
    play_interval_audio();

    console.log(settings);

    console.log(bitmask);
    applyBitmask(bitmask);
    applySettingsBitmask(bitmask);
});
