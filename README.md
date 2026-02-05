# Blood Pressure Tracker

A desktop application for tracking blood pressure readings, built with Tauri v2 (Rust backend) and React frontend.

## Why Blood Pressure Tracker?

Monitoring blood pressure regularly is essential for managing hypertension and cardiovascular health. Many people track readings manually or rely on cloud-based apps that raise privacy concerns with sensitive health data.

Blood Pressure Tracker solves this by providing:

- **Privacy-first design** - All data stays on your device in an encrypted database. No accounts, no cloud sync, no data harvesting.
- **Simple logging** - Quickly record systolic, diastolic, and pulse readings with timestamps.
- **Insights at a glance** - Dashboard with trends, averages, and charts to share with your doctor.
- **Data portability** - Import/export CSV files to move data between devices or into spreadsheets.

## Quick Start

```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri dev
```

## Prerequisites

### Node.js
- Node.js v18 or later
- npm (comes with Node.js)

### Rust
Install Rust via rustup:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Platform-Specific Dependencies

**Linux (Debian/Ubuntu):**
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file \
  libssl-dev libayatana-appindicator3-dev librsvg2-dev
```

**Linux (Fedora):**
```bash
sudo dnf install webkit2gtk4.1-devel openssl-devel curl wget file \
  libappindicator-gtk3-devel librsvg2-devel
sudo dnf group install "C Development Tools and Libraries"
```

**macOS:**
```bash
xcode-select --install
```

**Windows:**
- Install [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) with "Desktop development with C++"
- Install [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (usually pre-installed on Windows 10/11)

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run tauri dev` | Start app in development mode with hot reload |
| `npm run tauri build` | Build production executable |
| `npm run dev` | Start Vite dev server only (no Tauri) |
| `npm run build` | Build frontend only |
| `npm run test` | Run end-to-end tests |
| `npm run lint-fix` | Format code with Prettier |

## Project Structure

```
blood-pressure-tauri/
├── src/                    # React frontend
│   ├── pages/              # Page components
│   ├── components/         # Reusable components
│   ├── layouts/            # Layout wrappers
│   ├── contexts/           # React contexts
│   ├── utils/              # Utilities and API wrapper
│   └── css/                # Stylesheets
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── main.rs         # Entry point
│   │   ├── lib.rs          # Command exports
│   │   ├── db/             # Database layer (SQLCipher)
│   │   ├── commands/       # Tauri commands
│   │   └── models/         # Data models
│   ├── Cargo.toml          # Rust dependencies
│   └── tauri.conf.json     # Tauri configuration
├── test/                   # E2E tests (WebdriverIO)
├── package.json            # Node dependencies
└── vite.config.js          # Vite configuration
```

## Tech Stack

**Frontend:**
- React 18
- React Router v6
- Chart.js for data visualization
- Lucide React for icons
- Vite for bundling

**Backend:**
- Tauri v2
- Rust
- SQLCipher (encrypted SQLite)
- bcrypt for password hashing

## Features

- User authentication (signup, login, logout)
- Blood pressure reading CRUD operations
- CSV import/export
- Dashboard with charts and statistics
- Profile management
- Light/dark theme support
- Offline-first with encrypted local database

## API Commands

The frontend communicates with the Rust backend via Tauri commands:

| Command | Description |
|---------|-------------|
| `login` | Authenticate user |
| `signup` | Create new account |
| `logout` | End session |
| `get_user` | Get current user |
| `list_readings` | Get all readings |
| `create_reading` | Add new reading |
| `update_reading` | Modify reading |
| `delete_reading` | Remove reading |
| `export_readings` | Export as CSV |
| `import_readings` | Import from CSV |
| `get_dashboard` | Get stats and chart data |
| `update_profile` | Update user profile |
| `delete_account` | Delete user account |

## Testing

Run end-to-end tests with WebdriverIO:
```bash
npm run test
```

Tests are located in the `test/` directory.

## Building for Production

```bash
npm run tauri build
```

Build artifacts are output to:
- **Linux:** `src-tauri/target/release/bundle/` (`.deb`, `.AppImage`)
- **macOS:** `src-tauri/target/release/bundle/` (`.dmg`)
- **Windows:** `src-tauri/target/release/bundle/` (`.msi`, `.exe`)

## Troubleshooting

**"webkit2gtk not found" on Linux:**
Install the WebKit development package for your distro (see prerequisites above).

**Rust compilation errors:**
```bash
rustup update
cargo clean
npm run tauri dev
```

**Port 5173 already in use:**
Kill the existing process or change the port in `vite.config.js`.

**Database issues:**
The app stores data in a local SQLite database. Delete `.db_key` and the database file to reset (location varies by OS).
