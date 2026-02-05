pub const CREATE_USERS_TABLE: &str = r#"
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    initials TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    profile_picture TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
)
"#;

pub const CREATE_BP_READINGS_TABLE: &str = r#"
CREATE TABLE IF NOT EXISTS bp_readings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    top_number INTEGER NOT NULL,
    bottom_number INTEGER NOT NULL,
    heart_rate INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)
"#;

pub const CREATE_SESSIONS_TABLE: &str = r#"
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)
"#;

pub const CREATE_BP_READINGS_USER_INDEX: &str = r#"
CREATE INDEX IF NOT EXISTS idx_bp_readings_user_id ON bp_readings(user_id)
"#;

pub const CREATE_SESSIONS_USER_INDEX: &str = r#"
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)
"#;

pub const CREATE_LOGIN_ATTEMPTS_TABLE: &str = r#"
CREATE TABLE IF NOT EXISTS login_attempts (
    email TEXT PRIMARY KEY,
    attempts INTEGER NOT NULL DEFAULT 0,
    last_attempt INTEGER NOT NULL,
    locked_until INTEGER
)
"#;
