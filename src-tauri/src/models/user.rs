use serde::{Deserialize, Serialize};
use rusqlite::{params, Connection, Result, Row};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct User {
    pub id: String,
    pub email: String,
    pub full_name: String,
    pub initials: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub profile_picture: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserPublic {
    pub id: String,
    pub email: String,
    pub full_name: String,
    pub initials: String,
    pub profile_picture: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

impl From<User> for UserPublic {
    fn from(user: User) -> Self {
        UserPublic {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            initials: user.initials,
            profile_picture: user.profile_picture,
            created_at: user.created_at,
            updated_at: user.updated_at,
        }
    }
}

impl User {
    pub fn from_row(row: &Row) -> Result<Self> {
        Ok(User {
            id: row.get(0)?,
            email: row.get(1)?,
            full_name: row.get(2)?,
            initials: row.get(3)?,
            password_hash: row.get(4)?,
            profile_picture: row.get(5)?,
            created_at: row.get(6)?,
            updated_at: row.get(7)?,
        })
    }

    pub fn generate_initials(full_name: &str) -> String {
        full_name
            .split_whitespace()
            .filter_map(|word| word.chars().next())
            .take(2)
            .collect::<String>()
            .to_uppercase()
    }

    pub fn find_by_id(conn: &Connection, id: &str) -> Result<Option<User>> {
        let mut stmt = conn.prepare(
            "SELECT id, email, full_name, initials, password_hash, profile_picture, created_at, updated_at
             FROM users WHERE id = ?1"
        )?;

        let mut rows = stmt.query(params![id])?;

        if let Some(row) = rows.next()? {
            Ok(Some(User::from_row(row)?))
        } else {
            Ok(None)
        }
    }

    pub fn find_by_email(conn: &Connection, email: &str) -> Result<Option<User>> {
        let mut stmt = conn.prepare(
            "SELECT id, email, full_name, initials, password_hash, profile_picture, created_at, updated_at
             FROM users WHERE email = ?1"
        )?;

        let mut rows = stmt.query(params![email])?;

        if let Some(row) = rows.next()? {
            Ok(Some(User::from_row(row)?))
        } else {
            Ok(None)
        }
    }

    pub fn create(
        conn: &Connection,
        email: &str,
        full_name: &str,
        password_hash: &str,
    ) -> Result<User> {
        let id = uuid::Uuid::new_v4().to_string();
        let initials = Self::generate_initials(full_name);
        let now = chrono::Utc::now().timestamp_millis();

        conn.execute(
            "INSERT INTO users (id, email, full_name, initials, password_hash, profile_picture, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, NULL, ?6, ?7)",
            params![id, email, full_name, initials, password_hash, now, now],
        )?;

        Ok(User {
            id,
            email: email.to_string(),
            full_name: full_name.to_string(),
            initials,
            password_hash: password_hash.to_string(),
            profile_picture: None,
            created_at: now,
            updated_at: now,
        })
    }

    pub fn update(
        conn: &Connection,
        id: &str,
        email: Option<&str>,
        full_name: Option<&str>,
        password_hash: Option<&str>,
        profile_picture: Option<&str>,
    ) -> Result<()> {
        let now = chrono::Utc::now().timestamp_millis();

        if let Some(email) = email {
            conn.execute(
                "UPDATE users SET email = ?1, updated_at = ?2 WHERE id = ?3",
                params![email, now, id],
            )?;
        }

        if let Some(full_name) = full_name {
            let initials = Self::generate_initials(full_name);
            conn.execute(
                "UPDATE users SET full_name = ?1, initials = ?2, updated_at = ?3 WHERE id = ?4",
                params![full_name, initials, now, id],
            )?;
        }

        if let Some(password_hash) = password_hash {
            conn.execute(
                "UPDATE users SET password_hash = ?1, updated_at = ?2 WHERE id = ?3",
                params![password_hash, now, id],
            )?;
        }

        if let Some(profile_picture) = profile_picture {
            conn.execute(
                "UPDATE users SET profile_picture = ?1, updated_at = ?2 WHERE id = ?3",
                params![profile_picture, now, id],
            )?;
        }

        Ok(())
    }

    pub fn delete(conn: &Connection, id: &str) -> Result<()> {
        conn.execute("DELETE FROM users WHERE id = ?1", params![id])?;
        Ok(())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Session {
    pub id: String,
    pub user_id: String,
    pub created_at: i64,
    pub expires_at: i64,
}

impl Session {
    pub fn create(conn: &Connection, user_id: &str) -> Result<Session> {
        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp_millis();
        // 10 years expiration (matching original behavior)
        let expires_at = now + (10 * 365 * 24 * 60 * 60 * 1000_i64);

        conn.execute(
            "INSERT INTO sessions (id, user_id, created_at, expires_at)
             VALUES (?1, ?2, ?3, ?4)",
            params![id, user_id, now, expires_at],
        )?;

        Ok(Session {
            id,
            user_id: user_id.to_string(),
            created_at: now,
            expires_at,
        })
    }

    pub fn find_valid(conn: &Connection, token: &str) -> Result<Option<Session>> {
        let now = chrono::Utc::now().timestamp_millis();
        let mut stmt = conn.prepare(
            "SELECT id, user_id, created_at, expires_at
             FROM sessions WHERE id = ?1 AND expires_at > ?2"
        )?;

        let mut rows = stmt.query(params![token, now])?;

        if let Some(row) = rows.next()? {
            Ok(Some(Session {
                id: row.get(0)?,
                user_id: row.get(1)?,
                created_at: row.get(2)?,
                expires_at: row.get(3)?,
            }))
        } else {
            Ok(None)
        }
    }

    pub fn delete(conn: &Connection, id: &str) -> Result<()> {
        conn.execute("DELETE FROM sessions WHERE id = ?1", params![id])?;
        Ok(())
    }

    #[allow(dead_code)]
    pub fn delete_for_user(conn: &Connection, user_id: &str) -> Result<()> {
        conn.execute("DELETE FROM sessions WHERE user_id = ?1", params![user_id])?;
        Ok(())
    }
}
