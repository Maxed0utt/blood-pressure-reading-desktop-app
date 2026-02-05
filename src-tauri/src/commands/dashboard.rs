use crate::db::Database;
use crate::models::bpreading::BPReading;
use crate::commands::auth::get_user_from_token;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PeriodAverage {
    pub top_number: i32,
    pub bottom_number: i32,
    pub heart_rate: i32,
    pub count: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DashboardAverages {
    pub weekly: Option<PeriodAverage>,
    pub monthly: Option<PeriodAverage>,
    pub quarterly: Option<PeriodAverage>,
    pub semi_annual: Option<PeriodAverage>,
    pub annual: Option<PeriodAverage>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DashboardResponse {
    pub averages: DashboardAverages,
    pub readings: Vec<BPReading>,
}

fn calculate_average(readings: &[BPReading]) -> Option<PeriodAverage> {
    if readings.is_empty() {
        return None;
    }

    let count = readings.len() as i32;
    let sum_top: i32 = readings.iter().map(|r| r.top_number).sum();
    let sum_bottom: i32 = readings.iter().map(|r| r.bottom_number).sum();
    let sum_hr: i32 = readings.iter().map(|r| r.heart_rate).sum();

    Some(PeriodAverage {
        top_number: sum_top / count,
        bottom_number: sum_bottom / count,
        heart_rate: sum_hr / count,
        count,
    })
}

#[tauri::command]
pub fn get_dashboard(db: State<'_, Database>, token: String) -> Result<DashboardResponse, String> {
    let user = get_user_from_token(&db, &token)?
        .ok_or_else(|| "Unauthorized".to_string())?;

    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let now = chrono::Utc::now().timestamp_millis();

    // Time periods in milliseconds
    let week_ms = 7 * 24 * 60 * 60 * 1000_i64;
    let month_ms = 30 * 24 * 60 * 60 * 1000_i64;
    let quarter_ms = 90 * 24 * 60 * 60 * 1000_i64;
    let semi_annual_ms = 180 * 24 * 60 * 60 * 1000_i64;
    let annual_ms = 365 * 24 * 60 * 60 * 1000_i64;

    // Get all readings for the year (we'll filter client-side for different periods)
    let all_readings = BPReading::find_by_user_in_period(&conn, &user.id, now - annual_ms)
        .map_err(|e| e.to_string())?;

    // Calculate averages for each period
    let weekly_readings: Vec<_> = all_readings.iter()
        .filter(|r| r.created_at >= now - week_ms)
        .cloned()
        .collect();

    let monthly_readings: Vec<_> = all_readings.iter()
        .filter(|r| r.created_at >= now - month_ms)
        .cloned()
        .collect();

    let quarterly_readings: Vec<_> = all_readings.iter()
        .filter(|r| r.created_at >= now - quarter_ms)
        .cloned()
        .collect();

    let semi_annual_readings: Vec<_> = all_readings.iter()
        .filter(|r| r.created_at >= now - semi_annual_ms)
        .cloned()
        .collect();

    let averages = DashboardAverages {
        weekly: calculate_average(&weekly_readings),
        monthly: calculate_average(&monthly_readings),
        quarterly: calculate_average(&quarterly_readings),
        semi_annual: calculate_average(&semi_annual_readings),
        annual: calculate_average(&all_readings),
    };

    Ok(DashboardResponse {
        averages,
        readings: all_readings,
    })
}
