use serde::{Deserialize, Serialize};
use rusqlite::{params, Connection, Result, Row};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BPReading {
    pub id: String,
    pub user_id: String,
    pub top_number: i32,
    pub bottom_number: i32,
    pub heart_rate: i32,
    pub created_at: i64,
    pub updated_at: i64,
}

impl BPReading {
    pub fn from_row(row: &Row) -> Result<Self> {
        Ok(BPReading {
            id: row.get(0)?,
            user_id: row.get(1)?,
            top_number: row.get(2)?,
            bottom_number: row.get(3)?,
            heart_rate: row.get(4)?,
            created_at: row.get(5)?,
            updated_at: row.get(6)?,
        })
    }

    pub fn find_by_id(conn: &Connection, id: &str) -> Result<Option<BPReading>> {
        let mut stmt = conn.prepare(
            "SELECT id, user_id, top_number, bottom_number, heart_rate, created_at, updated_at
             FROM bp_readings WHERE id = ?1"
        )?;

        let mut rows = stmt.query(params![id])?;

        if let Some(row) = rows.next()? {
            Ok(Some(BPReading::from_row(row)?))
        } else {
            Ok(None)
        }
    }

    pub fn find_by_user(conn: &Connection, user_id: &str) -> Result<Vec<BPReading>> {
        let mut stmt = conn.prepare(
            "SELECT id, user_id, top_number, bottom_number, heart_rate, created_at, updated_at
             FROM bp_readings WHERE user_id = ?1 ORDER BY created_at DESC"
        )?;

        let mut rows = stmt.query(params![user_id])?;
        let mut readings = Vec::new();

        while let Some(row) = rows.next()? {
            readings.push(BPReading::from_row(row)?);
        }

        Ok(readings)
    }

    pub fn find_by_user_in_period(
        conn: &Connection,
        user_id: &str,
        start_time: i64,
    ) -> Result<Vec<BPReading>> {
        let mut stmt = conn.prepare(
            "SELECT id, user_id, top_number, bottom_number, heart_rate, created_at, updated_at
             FROM bp_readings WHERE user_id = ?1 AND created_at >= ?2 ORDER BY created_at ASC"
        )?;

        let mut rows = stmt.query(params![user_id, start_time])?;
        let mut readings = Vec::new();

        while let Some(row) = rows.next()? {
            readings.push(BPReading::from_row(row)?);
        }

        Ok(readings)
    }

    pub fn create(
        conn: &Connection,
        user_id: &str,
        top_number: i32,
        bottom_number: i32,
        heart_rate: i32,
        created_at: Option<i64>,
    ) -> Result<BPReading> {
        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp_millis();
        let created_at = created_at.unwrap_or(now);

        conn.execute(
            "INSERT INTO bp_readings (id, user_id, top_number, bottom_number, heart_rate, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![id, user_id, top_number, bottom_number, heart_rate, created_at, now],
        )?;

        Ok(BPReading {
            id,
            user_id: user_id.to_string(),
            top_number,
            bottom_number,
            heart_rate,
            created_at,
            updated_at: now,
        })
    }

    pub fn update_simple(
        conn: &Connection,
        id: &str,
        user_id: &str,
        top_number: i32,
        bottom_number: i32,
        heart_rate: i32,
        created_at: i64,
    ) -> Result<bool> {
        let now = chrono::Utc::now().timestamp_millis();

        // Verify ownership
        let reading = Self::find_by_id(conn, id)?;
        if let Some(reading) = reading {
            if reading.user_id != user_id {
                return Ok(false);
            }
        } else {
            return Ok(false);
        }

        conn.execute(
            "UPDATE bp_readings SET top_number = ?1, bottom_number = ?2, heart_rate = ?3, created_at = ?4, updated_at = ?5
             WHERE id = ?6 AND user_id = ?7",
            params![top_number, bottom_number, heart_rate, created_at, now, id, user_id],
        )?;

        Ok(true)
    }

    pub fn delete(conn: &Connection, id: &str, user_id: &str) -> Result<bool> {
        let rows = conn.execute(
            "DELETE FROM bp_readings WHERE id = ?1 AND user_id = ?2",
            params![id, user_id],
        )?;
        Ok(rows > 0)
    }

    #[allow(dead_code)]
    pub fn delete_all_for_user(conn: &Connection, user_id: &str) -> Result<()> {
        conn.execute(
            "DELETE FROM bp_readings WHERE user_id = ?1",
            params![user_id],
        )?;
        Ok(())
    }
}
