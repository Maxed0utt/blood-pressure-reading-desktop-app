mod commands;
mod db;
mod models;

use db::Database;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let db = Database::new(&app.handle()).expect("Failed to initialize database");
            db.init().expect("Failed to run migrations");
            app.manage(db);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Auth commands
            commands::login,
            commands::signup,
            commands::logout,
            commands::get_user,
            // BP Reading commands
            commands::list_readings,
            commands::create_reading,
            commands::update_reading,
            commands::delete_reading,
            commands::export_readings,
            commands::import_readings,
            // Dashboard commands
            commands::get_dashboard,
            // User commands
            commands::update_profile,
            commands::delete_account,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
