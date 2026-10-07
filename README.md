# TempFan — Auto Fan Control
## Temperature-Based Automatic Fan Speed Control System

[![System Status](https://img.shields.io/badge/System-Online-10b981.svg)](#)
[![Database](https://img.shields.io/badge/Database-MySQL%20(XAMPP)-00758F.svg)](#)
[![Hardware](https://img.shields.io/badge/Platform-ESP32-00d2aa.svg)](#)
[![Sensor](https://img.shields.io/badge/Sensor-DHT11-0284c7.svg)](#)
[![Transistor](https://img.shields.io/badge/Driver-2N2222%20NPN-8b5cf6.svg)](#)
[![Connectivity](https://img.shields.io/badge/Telemetry-Wi--Fi%20HTTP-f59e0b.svg)](#)

---

### 1. Official System Purpose
The **Temperature-Based Automatic Fan Speed Control System** (**TempFan**) continuously monitors environmental temperature and humidity using a **DHT11 sensor** and dynamically adjusts the fan speed:
- **Temperature increases**: Fan speed increases automatically to supply stronger cooling airflow.
- **Temperature decreases**: Fan speed scales down smoothly, eliminating unnecessary fan noise and power waste.

Applicable for:
- Student study desks & dormitories
- Households and residential rooms
- Workspaces and offices
- Automated climate & electronics cabinet cooling

---

### 2. MySQL Database Architecture (`tempfan_db`)

The application integrates with **MySQL** via PHP PDO (`php/database.php`). All telemetry logs, threshold configurations, control modes, and user sessions are stored directly in MySQL with seamless automatic fallback to local simulation if MySQL is offline.

### Project Directory Structure (Strictly Organized by Type)

```
c:\xampp\htdocs\TempFan\
├── html/               # ONLY .html files (alternate SPA entry point)
│   └── index.html      # Single Page Application shell (linked from php/setup.php)
├── css/                # ONLY .css files (Stylesheets & Design System)
│   └── style.css       # Complete master responsive stylesheet
├── js/                 # ONLY .js files (Frontend Controllers & Logic)
│   ├── app.js          # App orchestrator & router initialization
│   ├── state.js        # Reactive central state store & MySQL sync
│   ├── router.js       # Client-side hash & path router with guards
│   ├── simulator.js    # IoT hardware simulator & ESP32 USB diagnostic bridge
│   ├── chart.js        # Temperature Trend canvas line chart
│   ├── breeze.js       # Floating leaves & airflow particle canvas
│   ├── icons.js        # Vector SVG icon library
│   └── views/          # Dynamic page view renderers
│       ├── home.js
│       ├── login.js
│       ├── register.js
│       ├── shell.js
│       ├── dashboard.js
│       ├── settings.js
│       ├── history.js
│       └── about.js
├── php/                # ONLY .php files (Backend APIs & Database)
│   ├── database.php    # Resilient PDO MySQL database connection
│   ├── login.php       # Password-verified login API (POST)
│   ├── readings.php    # Telemetry readings REST API (GET/POST)
│   ├── register.php    # User registration API (POST)
│   ├── settings.php    # Control mode & manual fan speed API
│   ├── thresholds.php  # Temperature threshold configuration API
│   └── setup.php       # Browser-based database initializer
├── sql/                # ONLY .sql files (Database Schemas & Migrations)
│   └── init.sql        # MySQL database creation & seed queries
├── images/             # ONLY image files (Visual assets & backgrounds)
│   ├── fan_bg.png      # Fan background image (Home backdrop)
│   └── login-bg.png    # Login page background image
├── arduino/            # ONLY .ino files (Embedded Microcontroller Code)
│   └── tempfan_sketch.ino # ESP32 DHT11 Wi-Fi telemetry firmware
├── index.php           # Root server gateway (serves index.html)
├── index.html          # Main Single Page Application shell
├── .htaccess           # Apache rewrite configuration
└── README.md           # System documentation & developer guide
```

---

### 3. Actual Hardware Architecture

> **IMPORTANT**: The final system specification uses an **ESP32 Development Board** and a **DHT11 temperature and humidity sensor**, with Wi-Fi telemetry to the dashboard.

| Component | Specification | Function in Circuit |
| :--- | :--- | :--- |
| **Microcontroller** | **ESP32 Development Board** | Processes DHT11 readings, controls PWM fan speed, and sends telemetry to the dashboard over Wi-Fi. |
| **Temperature Sensor** | **DHT11 Temperature & Humidity Sensor** | Supplies digital temperature and humidity readings to the ESP32. |
| **Actuator** | **DC Fan / DC Motor** | Provides responsive cooling airflow depending on PWM input. |
| **Motor Driver** | **2N2222 NPN Transistor** | Switches the DC fan from the ESP32 PWM signal. |
| **Base Protection** | **1kΩ Resistor** | Limits base current from ESP32 GPIO 18 into the 2N2222 transistor base. |
| **Flyback Protection** | **1N4007 Diode** | Clamps inductive voltage spikes across the DC motor coils when switching. |
| **Connectivity** | **Wi-Fi HTTP JSON** | Sends real-time telemetry to the PHP/MySQL dashboard API. |
| **Supporting** | **Breadboard, jumper wires & 5V power supply** | Powers and connects the ESP32, DHT11, transistor, diode, and fan. |

#### Signal Flow Pipeline:
$$\text{DHT11} \xrightarrow{\text{GPIO 4}} \text{ESP32} \xrightarrow{\text{PWM GPIO 18}} \text{1kΩ} \to \text{2N2222 Base} \to \text{DC Fan} \parallel \text{1N4007 Diode}$$
$$\text{ESP32} \xrightarrow{\text{Wi-Fi HTTP JSON}} \text{PHP/MySQL Monitoring Dashboard}$$

---

### 4. Automatic Control Logic
Default programmed thresholds (configurable via Web UI Settings and stored in MySQL):
1. **Low Temperature ($\le 30^\circ\text{C}$)**:
   - Fan Speed: **30%** PWM (Quiet baseline circulation)
   - Status: **Low Speed**
2. **Medium Temperature ($31^\circ\text{C} - 35^\circ\text{C}$)**:
   - Fan Speed: **60%** PWM (Active temperature regulation)
   - Status: **Medium Speed**
3. **High Temperature ($\ge 36^\circ\text{C}$)**:
   - Fan Speed: **100%** PWM (Full cooling capacity)
   - Status: **High Speed**

---

### 5. Web Application Pages & Structure

- **Page 1: Home (`/` or `#/`)**
  - Full-screen dark green atmospheric fan background with air currents and floating leaves.
  - Hero branding: `TempFan` + luminous `Auto Fan Control`.
  - 5 Circular Feature badges: *Auto Fan Control*, *Temperature Monitoring*, *Energy Efficient*, *Smart Connectivity*, *Customizable Settings*.
  - Pill button: `Log In →`.
- **Page 2: Login (`/login` or `#/login`)**
  - Ambient fan artwork on left with "Welcome Back".
  - Translucent glassmorphism login card with thin turquoise border on right.
  - Email/username validation, password visibility eye toggle, remember me, forgot password modal, and Google authentication.
- **Page 3: Dashboard (`/dashboard` or `#/dashboard`)**
  - Dark forest green sidebar (`#061e17`) with live system status indicator.
  - Top header with live clock, Hardware Simulator pill, and profile dropdown.
  - 6 Stat Cards: *Current Temperature* (with status badge & sparkline), *Fan Status* (with rotating animated fan blade), *Fan Speed* (gauge & progress bar), *Energy Efficient*, *Automatic Control*, *System Uptime*.
  - *Temperature Trend* canvas line chart with area fill, hover tooltips, and highlighted latest reading pill callout.
- **Page 4: Settings (`/settings` or `#/settings`)**
  - Control mode segmented toggle: `Automatic` vs `Manual`.
  - 3 Temperature Threshold Cards (Low, Medium, High) synced with MySQL `thresholds` table.
  - Modal editor with mathematical boundary validation to prevent overlapping ranges.
  - Manual fan speed slider (0% to 100%) active when Manual mode is engaged.
  - Save Settings with MySQL persistence and real-time dashboard sync.
- **Page 5: History (`/history` or `#/history`)**
  - Filter bar: From Date, To Date, Control Mode (All, Automatic, Manual), Fan Status (All, ON, OFF), buttons: Filter, Reset, Today, All Time.
  - Data table: ID, Timestamp, Temperature (°C), Fan Speed (%), Fan Status (ON pill badge), Control Mode.
  - Pagination controls: `< Previous`, `1`, `2`, `3`, `Next >`.
  - Directly connected to MySQL `readings` table.
- **Page 6: About (`/about` or `#/about`)**
  - Project title and system summary.
  - Project Contributors: **Jenalyn Ytac**, **Jelyn Mabras**, **Jhon Louie Sanrojo**.
  - System Information table detailing the **ESP32**, **DHT11**, **2N2222**, **1N4007**, **1kΩ Resistor**, Wi-Fi telemetry, and DC fan.
  - Hardware signal flow architecture diagram.

---

### 6. Project Contributors
- **Jenalyn Ytac** — Hardware Systems & Circuit Integration
- **Jelyn Mabras** — Systems Testing & Energy Optimization
- **Jhon Louie Sanrojo** — Software Engineering & IoT Web Architecture

---

### 7. How to Run Locally with MySQL

#### Option A: Running via XAMPP (Apache + MySQL)
1. In the **XAMPP Control Panel**, start both **Apache** and **MySQL**.
2. Open your browser and navigate to:
   ```
   http://localhost/TempFan/
   ```
3. To initialize or verify the MySQL database, visit:
   ```
   http://localhost/TempFan/php/setup.php
   ```

#### Default dashboard account

| Username | Password |
| :--- | :--- |
| `admin` (or `admin@tempfan.io`) | `tempfan2026` |

The password is stored as a bcrypt hash and verified by `php/login.php`. Change this
default password before exposing the application outside a local development environment.

#### Option B: Running via PHP Built-in Server
Open PowerShell in `c:\xampp\htdocs\TempFan`:
```powershell
& "c:\xampp\php\php.exe" -S 127.0.0.1:8080 -t "c:\xampp\htdocs\TempFan"
```
Then navigate to `http://127.0.0.1:8080/`.

---

### 8. Physical ESP32 Wi-Fi Connection
1. Install the **DHT sensor library** in Arduino IDE and open `arduino/tempfan_sketch.ino`.
2. Set `WIFI_SSID`, `WIFI_PASSWORD`, and `TELEMETRY_URL`. Use the XAMPP computer's LAN IP address in the URL—not `localhost`.
3. Upload the sketch to the ESP32. Connect DHT11 data to GPIO 4 and the 2N2222 base resistor to GPIO 18.
4. The ESP32 posts temperature, humidity, fan status, and fan speed to MySQL through Wi-Fi; the dashboard refreshes the live data automatically.
