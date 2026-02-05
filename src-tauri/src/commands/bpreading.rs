use crate::db::Database;
use crate::models::bpreading::BPReading;
use crate::commands::auth::get_user_from_token;
use tauri::State;
use csv::{Reader, Writer};

#[tauri::command]
pub fn list_readings(db: State<'_, Database>, token: String) -> Result<Vec<BPReading>, String> {
    let user = get_user_from_token(&db, &token)?
        .ok_or_else(|| "Unauthorized".to_string())?;

    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    BPReading::find_by_user(&conn, &user.id).map_err(|e| e.to_string())
}

fn validate_bp_reading(top_number: i32, bottom_number: i32, heart_rate: i32) -> Result<(), String> {
    // Validate systolic (top number): 60-300 mmHg
    if top_number < 60 || top_number > 300 {
        return Err("Systolic pressure must be between 60 and 300 mmHg".to_string());
    }

    // Validate diastolic (bottom number): 40-200 mmHg
    if bottom_number < 40 || bottom_number > 200 {
        return Err("Diastolic pressure must be between 40 and 200 mmHg".to_string());
    }

    // Validate heart rate: 30-250 bpm
    if heart_rate < 30 || heart_rate > 250 {
        return Err("Heart rate must be between 30 and 250 bpm".to_string());
    }

    // Systolic should be greater than diastolic
    if top_number <= bottom_number {
        return Err("Systolic pressure must be greater than diastolic pressure".to_string());
    }

    Ok(())
}

#[tauri::command]
pub fn create_reading(
    db: State<'_, Database>,
    token: String,
    top_number: i32,
    bottom_number: i32,
    heart_rate: i32,
    created_at: Option<i64>,
) -> Result<BPReading, String> {
    let user = get_user_from_token(&db, &token)?
        .ok_or_else(|| "Unauthorized".to_string())?;

    // Validate input
    validate_bp_reading(top_number, bottom_number, heart_rate)?;

    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    BPReading::create(&conn, &user.id, top_number, bottom_number, heart_rate, created_at)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_reading(
    db: State<'_, Database>,
    token: String,
    id: String,
    top_number: i32,
    bottom_number: i32,
    heart_rate: i32,
    created_at: i64,
) -> Result<BPReading, String> {
    let user = get_user_from_token(&db, &token)?
        .ok_or_else(|| "Unauthorized".to_string())?;

    // Validate input
    validate_bp_reading(top_number, bottom_number, heart_rate)?;

    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let updated = BPReading::update_simple(
        &conn,
        &id,
        &user.id,
        top_number,
        bottom_number,
        heart_rate,
        created_at,
    ).map_err(|e| e.to_string())?;

    if !updated {
        return Err("Reading not found or unauthorized".to_string());
    }

    BPReading::find_by_id(&conn, &id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Reading not found".to_string())
}

#[tauri::command]
pub fn delete_reading(
    db: State<'_, Database>,
    token: String,
    id: String,
) -> Result<bool, String> {
    let user = get_user_from_token(&db, &token)?
        .ok_or_else(|| "Unauthorized".to_string())?;

    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    BPReading::delete(&conn, &id, &user.id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn export_readings(db: State<'_, Database>, token: String) -> Result<String, String> {
    let user = get_user_from_token(&db, &token)?
        .ok_or_else(|| "Unauthorized".to_string())?;

    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let readings = BPReading::find_by_user(&conn, &user.id).map_err(|e| e.to_string())?;

    let mut wtr = Writer::from_writer(vec![]);

    // Write header
    wtr.write_record(&["topNumber", "bottomNumber", "heartRate", "createdAt"])
        .map_err(|e| e.to_string())?;

    // Write records
    for reading in readings {
        wtr.write_record(&[
            reading.top_number.to_string(),
            reading.bottom_number.to_string(),
            reading.heart_rate.to_string(),
            reading.created_at.to_string(),
        ]).map_err(|e| e.to_string())?;
    }

    let csv_data = String::from_utf8(wtr.into_inner().map_err(|e| e.to_string())?)
        .map_err(|e| e.to_string())?;

    Ok(csv_data)
}

#[tauri::command]
pub fn import_readings(
    db: State<'_, Database>,
    token: String,
    csv_data: String,
) -> Result<i32, String> {
    let user = get_user_from_token(&db, &token)?
        .ok_or_else(|| "Unauthorized".to_string())?;

    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut rdr = Reader::from_reader(csv_data.as_bytes());
    let headers = rdr.headers().map_err(|e| e.to_string())?.clone();

    // Find column indices
    let top_idx = headers.iter().position(|h| h == "topNumber" || h == "top_number")
        .ok_or_else(|| "Missing topNumber column".to_string())?;
    let bottom_idx = headers.iter().position(|h| h == "bottomNumber" || h == "bottom_number")
        .ok_or_else(|| "Missing bottomNumber column".to_string())?;
    let hr_idx = headers.iter().position(|h| h == "heartRate" || h == "heart_rate")
        .ok_or_else(|| "Missing heartRate column".to_string())?;
    let created_idx = headers.iter().position(|h| h == "createdAt" || h == "created_at")
        .ok_or_else(|| "Missing createdAt column".to_string())?;

    let mut count = 0;
    let mut errors = Vec::new();

    for (line_num, result) in rdr.records().enumerate() {
        match result {
            Ok(record) => {
                let top_number: i32 = record.get(top_idx)
                    .and_then(|v| v.parse().ok())
                    .unwrap_or(0);
                let bottom_number: i32 = record.get(bottom_idx)
                    .and_then(|v| v.parse().ok())
                    .unwrap_or(0);
                let heart_rate: i32 = record.get(hr_idx)
                    .and_then(|v| v.parse().ok())
                    .unwrap_or(0);
                let created_at: i64 = record.get(created_idx)
                    .and_then(|v| v.parse().ok())
                    .unwrap_or_else(|| chrono::Utc::now().timestamp_millis());

                // Validate the reading before importing
                if let Err(e) = validate_bp_reading(top_number, bottom_number, heart_rate) {
                    errors.push(format!("Line {}: {}", line_num + 2, e));
                } else {
                    match BPReading::create(&conn, &user.id, top_number, bottom_number, heart_rate, Some(created_at)) {
                        Ok(_) => count += 1,
                        Err(e) => errors.push(format!("Line {}: {}", line_num + 2, e)),
                    }
                }
            }
            Err(e) => {
                errors.push(format!("Line {}: {}", line_num + 2, e));
            }
        }
    }

    if count == 0 && !errors.is_empty() {
        return Err(errors.join("\n"));
    }

    Ok(count)
}
