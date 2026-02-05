use crate::db::Database;
use crate::models::user::{Session, User, UserPublic};
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;

const MAX_LOGIN_ATTEMPTS: i32 = 5;
const LOCKOUT_DURATION_MS: i64 = 15 * 60 * 1000; // 15 minutes

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LoginResponse {
    pub token: String,
    pub user: UserPublic,
}

#[tauri::command]
pub fn login(
    db: State<'_, Database>,
    email: String,
    password: String,
) -> Result<LoginResponse, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let now = chrono::Utc::now().timestamp_millis();

    // Check if account is locked due to too many failed attempts
    let locked_until: Option<i64> = conn
        .query_row(
            "SELECT locked_until FROM login_attempts WHERE email = ?1",
            params![&email],
            |row| row.get(0),
        )
        .ok()
        .flatten();

    if let Some(locked) = locked_until {
        if locked > now {
            let remaining_mins = (locked - now) / 60000;
            return Err(format!(
                "Account temporarily locked. Try again in {} minute(s).",
                remaining_mins + 1
            ));
        }
    }

    // Find user by email
    let user = User::find_by_email(&conn, &email).map_err(|e| e.to_string())?;

    let login_result = match &user {
        Some(u) => {
            bcrypt::verify(&password, &u.password_hash).unwrap_or(false)
        }
        None => false,
    };

    if !login_result {
        // Record failed attempt
        record_failed_attempt(&conn, &email, now)?;
        return Err("Invalid email or password".to_string());
    }

    // Clear failed attempts on successful login
    conn.execute("DELETE FROM login_attempts WHERE email = ?1", params![&email])
        .map_err(|e| e.to_string())?;

    let user = user.unwrap();

    // Create session
    let session = Session::create(&conn, &user.id)
        .map_err(|e| e.to_string())?;

    Ok(LoginResponse {
        token: session.id,
        user: user.into(),
    })
}

fn record_failed_attempt(conn: &rusqlite::Connection, email: &str, now: i64) -> Result<(), String> {
    // Get current attempts
    let current: Option<(i32, Option<i64>)> = conn
        .query_row(
            "SELECT attempts, locked_until FROM login_attempts WHERE email = ?1",
            params![email],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .ok();

    match current {
        Some((attempts, _)) => {
            let new_attempts = attempts + 1;
            let locked_until = if new_attempts >= MAX_LOGIN_ATTEMPTS {
                Some(now + LOCKOUT_DURATION_MS)
            } else {
                None
            };

            conn.execute(
                "UPDATE login_attempts SET attempts = ?1, last_attempt = ?2, locked_until = ?3 WHERE email = ?4",
                params![new_attempts, now, locked_until, email],
            ).map_err(|e| e.to_string())?;
        }
        None => {
            conn.execute(
                "INSERT INTO login_attempts (email, attempts, last_attempt, locked_until) VALUES (?1, 1, ?2, NULL)",
                params![email, now],
            ).map_err(|e| e.to_string())?;
        }
    }

    Ok(())
}

#[tauri::command]
pub fn signup(
    db: State<'_, Database>,
    email: String,
    full_name: String,
    password: String,
) -> Result<LoginResponse, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    // Check if user already exists
    if let Some(_) = User::find_by_email(&conn, &email).map_err(|e| e.to_string())? {
        return Err("Email already in use".to_string());
    }

    // Validate password
    if password.len() < 8 {
        return Err("Password must be at least 8 characters".to_string());
    }

    let has_special = password.chars().any(|c| !c.is_alphanumeric());
    if !has_special {
        return Err("Password must contain a special character".to_string());
    }

    // Hash password
    let password_hash = bcrypt::hash(&password, bcrypt::DEFAULT_COST)
        .map_err(|e| e.to_string())?;

    // Create user
    let user = User::create(&conn, &email, &full_name, &password_hash)
        .map_err(|e| e.to_string())?;

    // Create session
    let session = Session::create(&conn, &user.id)
        .map_err(|e| e.to_string())?;

    Ok(LoginResponse {
        token: session.id,
        user: user.into(),
    })
}

#[tauri::command]
pub fn logout(db: State<'_, Database>, token: String) -> Result<bool, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    Session::delete(&conn, &token).map_err(|e| e.to_string())?;

    Ok(true)
}

#[tauri::command]
pub fn get_user(db: State<'_, Database>, token: String) -> Result<Option<UserPublic>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    // Find valid session
    let session = Session::find_valid(&conn, &token).map_err(|e| e.to_string())?;

    match session {
        Some(session) => {
            let user = User::find_by_id(&conn, &session.user_id)
                .map_err(|e| e.to_string())?;
            Ok(user.map(|u| u.into()))
        }
        None => Ok(None),
    }
}

pub fn get_user_from_token(db: &Database, token: &str) -> Result<Option<User>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let session = Session::find_valid(&conn, token).map_err(|e| e.to_string())?;

    match session {
        Some(session) => {
            User::find_by_id(&conn, &session.user_id).map_err(|e| e.to_string())
        }
        None => Ok(None),
    }
}
