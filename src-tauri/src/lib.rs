use std::{env, fs::File, thread, time::Duration};

use rodio::{Decoder, OutputStream, Sink};

use rand::prelude::SliceRandom;
use rand::Rng;

#[tauri::command]
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

// takes a bit mask where the thirteen least significant bits represent the valid intervals that
// can be generated. returns two numbers that are the note numbers for the interval

fn get_interval(valid_intervals: u16) -> [u8; 2] {
    let mut rng = rand::thread_rng();
    let intervals: Vec<u8> = (0..=12)
        .filter(|&i| valid_intervals & (1 << i) != 0)
        .collect();
    let &interval_size = intervals
        .choose(&mut rng)
        .expect("No valid intervals provided");
    let starting_note_number = rng.gen_range(57..=82 - interval_size);

    [starting_note_number, starting_note_number + interval_size]
}

#[tauri::command]
fn play_interval_audio() {
    let interval = get_interval(8191);

    println!("{}, {}", interval[0], interval[1]);

    thread::spawn(move || {
        let _ = play_audio(interval[0].to_string());

        thread::sleep(Duration::from_secs_f32(0.5));

        let _ = play_audio(interval[1].to_string());
    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![play_audio, play_interval_audio])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
