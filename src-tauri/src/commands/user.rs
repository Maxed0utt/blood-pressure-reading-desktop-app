use crate::db::Database;
use crate::models::user::{User, UserPublic};
use crate::commands::auth::get_user_from_token;
use tauri::State;

#[tauri::command]
pub fn update_profile(
    db: State<'_, Database>,
    token: String,
    full_name: Option<String>,
    email: Option<String>,
    profile_picture: Option<String>,
    current_password: Option<String>,
    password: Option<String>,
) -> Result<UserPublic, String> {
    let user = get_user_from_token(&db, &token)?
        .ok_or_else(|| "Unauthorized".to_string())?;

    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    // If changing password, verify current password
    if let Some(ref new_password) = password {
        let current = current_password
            .ok_or_else(|| "Current password required".to_string())?;

        let valid = bcrypt::verify(&current, &user.password_hash)
            .map_err(|e| e.to_string())?;

        if !valid {
            return Err("Current password is incorrect".to_string());
        }

        // Validate new password
        if new_password.len() < 8 {
            return Err("Password must be at least 8 characters".to_string());
        }

        let has_special = new_password.chars().any(|c| !c.is_alphanumeric());
        if !has_special {
            return Err("Password must contain a special character".to_string());
        }

        let password_hash = bcrypt::hash(new_password, bcrypt::DEFAULT_COST)
            .map_err(|e| e.to_string())?;

        User::update(&conn, &user.id, None, None, Some(&password_hash), None)
            .map_err(|e| e.to_string())?;
    }

    // Update email if provided and different
    if let Some(ref new_email) = email {
        if new_email != &user.email {
            // Check if email is already in use
            if let Some(_) = User::find_by_email(&conn, new_email).map_err(|e| e.to_string())? {
                return Err("Email already in use".to_string());
            }
            User::update(&conn, &user.id, Some(new_email), None, None, None)
                .map_err(|e| e.to_string())?;
        }
    }

    // Update full name if provided
    if let Some(ref new_name) = full_name {
        User::update(&conn, &user.id, None, Some(new_name), None, None)
            .map_err(|e| e.to_string())?;
    }

    // Update profile picture if provided
    if let Some(ref new_picture) = profile_picture {
        User::update(&conn, &user.id, None, None, None, Some(new_picture))
            .map_err(|e| e.to_string())?;
    }

    // Return updated user
    User::find_by_id(&conn, &user.id)
        .map_err(|e| e.to_string())?
        .map(|u| u.into())
        .ok_or_else(|| "User not found".to_string())
}

#[tauri::command]
pub fn delete_account(
    db: State<'_, Database>,
    token: String,
    password: String,
) -> Result<bool, String> {
    let user = get_user_from_token(&db, &token)?
        .ok_or_else(|| "Unauthorized".to_string())?;

    // Verify password
    let valid = bcrypt::verify(&password, &user.password_hash)
        .map_err(|e| e.to_string())?;

    if !valid {
        return Err("Invalid password".to_string());
    }

    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    // Delete all user data (cascades will handle readings and sessions)
    User::delete(&conn, &user.id).map_err(|e| e.to_string())?;

    Ok(true)
}
