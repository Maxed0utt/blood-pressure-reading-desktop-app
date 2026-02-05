pub mod migrations;
pub mod schema;

use rand::Rng;
use rusqlite::{Connection, Result};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::AppHandle;
use tauri::Manager;

pub struct Database {
    pub conn: Mutex<Connection>,
}

impl Database {
    pub fn new(app_handle: &AppHandle) -> Result<Self> {
        let app_dir = app_handle
            .path()
            .app_data_dir()
            .expect("Failed to get app data directory");

        std::fs::create_dir_all(&app_dir).expect("Failed to create app data directory");

        let db_path: PathBuf = app_dir.join("blood_pressure.db");
        let key_path: PathBuf = app_dir.join(".db_key");

        // Get or generate encryption key
        let key = Self::get_or_create_key(&key_path)?;

        let conn = Connection::open(&db_path)?;

        // Set the encryption key using SQLCipher PRAGMA
        conn.pragma_update(None, "key", &key)?;

        // Enable foreign keys
        conn.execute("PRAGMA foreign_keys = ON", [])?;

        Ok(Database {
            conn: Mutex::new(conn),
        })
    }

    fn get_or_create_key(key_path: &PathBuf) -> Result<String> {
        if key_path.exists() {
            // Read existing key
            let key = fs::read_to_string(key_path)
                .map_err(|e| rusqlite::Error::InvalidParameterName(e.to_string()))?;
            Ok(key.trim().to_string())
        } else {
            // Generate a new 256-bit key (32 bytes = 64 hex chars)
            let mut rng = rand::thread_rng();
            let key_bytes: [u8; 32] = rng.gen();
            let key = hex::encode(key_bytes);

            // Store the key with restricted permissions
            #[cfg(unix)]
            {
                use std::os::unix::fs::OpenOptionsExt;
                let mut options = fs::OpenOptions::new();
                options.write(true).create(true).mode(0o600);
                let mut file = options.open(key_path)
                    .map_err(|e| rusqlite::Error::InvalidParameterName(e.to_string()))?;
                use std::io::Write;
                file.write_all(key.as_bytes())
                    .map_err(|e| rusqlite::Error::InvalidParameterName(e.to_string()))?;
            }

            #[cfg(not(unix))]
            {
                fs::write(key_path, &key)
                    .map_err(|e| rusqlite::Error::InvalidParameterName(e.to_string()))?;
            }

            Ok(key)
        }
    }

    pub fn init(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        migrations::run_migrations(&conn)?;
        Ok(())
    }
}
