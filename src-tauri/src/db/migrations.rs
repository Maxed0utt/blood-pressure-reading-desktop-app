use rusqlite::{Connection, Result};
use super::schema;

pub fn run_migrations(conn: &Connection) -> Result<()> {
    // Create migrations table if it doesn't exist
    conn.execute(
        "CREATE TABLE IF NOT EXISTS migrations (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            applied_at INTEGER NOT NULL
        )",
        [],
    )?;

    // Run migrations
    run_migration(conn, "001_create_users", schema::CREATE_USERS_TABLE)?;
    run_migration(conn, "002_create_bp_readings", schema::CREATE_BP_READINGS_TABLE)?;
    run_migration(conn, "003_create_sessions", schema::CREATE_SESSIONS_TABLE)?;
    run_migration(conn, "004_create_bp_readings_index", schema::CREATE_BP_READINGS_USER_INDEX)?;
    run_migration(conn, "005_create_sessions_index", schema::CREATE_SESSIONS_USER_INDEX)?;
    run_migration(conn, "006_create_login_attempts", schema::CREATE_LOGIN_ATTEMPTS_TABLE)?;

    Ok(())
}

fn run_migration(conn: &Connection, name: &str, sql: &str) -> Result<()> {
    // Check if migration has been applied
    let count: i32 = conn.query_row(
        "SELECT COUNT(*) FROM migrations WHERE name = ?1",
        [name],
        |row| row.get(0),
    )?;

    if count == 0 {
        // Run migration
        conn.execute(sql, [])?;

        // Record migration
        let now = chrono::Utc::now().timestamp_millis();
        conn.execute(
            "INSERT INTO migrations (name, applied_at) VALUES (?1, ?2)",
            rusqlite::params![name, now],
        )?;
    }

    Ok(())
}
