use std::fs;
use std::io::{BufRead, BufReader};
use std::{env, fs::File, thread, time::Duration};

use rodio::{Decoder, OutputStream, Sink};

use rand::Rng;

// takes a bit mask where the thirteen least significant bits represent the valid intervals that
// can be generated. returns two numbers that are the note numbers for the interval

#[tauri::command]
fn get_interval(valid_intervals: u16, weights: [f32; 13]) -> [u8; 2] {
    let mut rng = rand::thread_rng();

    let intervals: Vec<u8> = (0..=12)
        .filter(|&i| valid_intervals & (1 << i) != 0)
        .collect();

    // weighted random algorithm

    let interval_weights: Vec<f32> = intervals
        .iter()
        .map(|&index| weights[index as usize])
        .collect();
    let total_weight: f32 = interval_weights.iter().sum();
    let mut random_value = rng.gen_range(0.0..total_weight);
    let mut interval_size = intervals[0];

    for (index, &weight) in interval_weights.iter().enumerate() {
        if random_value < weight {
            interval_size = intervals[index];
            break;
        }

        random_value -= weight;
    }

    let starting_note_number = rng.gen_range(57..=82 - interval_size);

    [starting_note_number, starting_note_number + interval_size]
}

#[tauri::command]
fn load_weights() -> [f32; 13] {
    let file = File::open("src/data/weights.csv").unwrap();
    let reader = BufReader::new(file);

    // read weights for all the lines
    let mut lines = [0.0; 13];
    for (i, line) in reader.lines().take(13).enumerate() {
        lines[i] = line.unwrap().parse::<f32>().unwrap();
    }

    lines
}

#[tauri::command]
fn write_weights(weights: [f32; 13]) {
    let weights_path = "src/data/weights.csv";
    let weights_string = weights
        .iter()
        .map(|&w| w.to_string())
        .collect::<Vec<String>>()
        .join("\n");
    let _ = fs::write(weights_path, weights_string);
}

fn play_audio(note_number: String) -> Result<(), String> {
    // create a new thread for audio playcback

    thread::spawn(move || {
        // Initialize the audio stream
        let (_stream, stream_handle) = OutputStream::try_default().unwrap();

        let sink = Sink::try_new(&stream_handle).unwrap();

        let file_path = format!("src/assets/sine_waves/{}.wav", note_number);

        let file = File::open(&file_path)
            .map_err(|e| format!("Failed to open file '{}': {}", file_path, e))
            .unwrap();

        let source = Decoder::new(file).unwrap();
        sink.append(source);

        sink.sleep_until_end();
    });

    Ok(())
}

#[tauri::command]
fn write_settings(current_valid_intervals: u16) {
    let settings_path = "src/data/settings.txt";
    let _ = fs::write(settings_path, current_valid_intervals.to_string());
}

#[tauri::command]
fn load_settings() -> Vec<String> {
    let file = File::open("src/data/settings.txt").unwrap();
    let reader = BufReader::new(file);
    let lines: Vec<String> = reader.lines().filter_map(Result::ok).collect();

    lines
}

#[tauri::command]
fn play_interval_audio(interval_in_semitones: [u8; 2]) {
    thread::spawn(move || {
        let _ = play_audio(interval_in_semitones[0].to_string());

        thread::sleep(Duration::from_secs_f32(0.5));

        let _ = play_audio(interval_in_semitones[1].to_string());
    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            play_interval_audio,
            get_interval,
            write_settings,
            load_settings,
            write_weights,
            load_weights,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
