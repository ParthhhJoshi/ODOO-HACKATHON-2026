import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("fleetflow.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT
  );

  CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    license_plate TEXT UNIQUE,
    type TEXT,
    max_payload REAL,
    odometer REAL,
    acquisition_cost REAL DEFAULT 0,
    status TEXT DEFAULT 'Available'
  );

  CREATE TABLE IF NOT EXISTS drivers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    license_no TEXT UNIQUE,
    expiry_date TEXT,
    status TEXT DEFAULT 'On Duty', -- On Duty, Off Duty, Suspended
    safety_score REAL DEFAULT 100,
    total_trips INTEGER DEFAULT 0,
    completed_trips INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS trips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER,
    driver_id INTEGER,
    origin TEXT,
    destination TEXT,
    cargo_weight REAL,
    revenue REAL DEFAULT 0,
    status TEXT DEFAULT 'Dispatched', -- Dispatched, Completed, Cancelled
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME,
    FOREIGN KEY(vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY(driver_id) REFERENCES drivers(id)
  );

  CREATE TABLE IF NOT EXISTS maintenance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER,
    issue TEXT,
    date TEXT,
    cost REAL,
    status TEXT DEFAULT 'New',
    FOREIGN KEY(vehicle_id) REFERENCES vehicles(id)
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER,
    vehicle_id INTEGER,
    driver_id INTEGER,
    fuel_cost REAL,
    misc_expense REAL,
    distance REAL,
    date TEXT,
    liters REAL DEFAULT 0,
    FOREIGN KEY(trip_id) REFERENCES trips(id),
    FOREIGN KEY(vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY(driver_id) REFERENCES drivers(id)
  );
`);

// Schema Migrations - Ensure columns exist
const migrate = () => {
  const tables = {
    vehicles: ['acquisition_cost'],
    trips: ['revenue'],
    expenses: ['liters'],
    drivers: ['total_trips', 'completed_trips']
  };

  for (const [table, columns] of Object.entries(tables)) {
    for (const column of columns) {
      try {
        db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} REAL DEFAULT 0`).run();
        console.log(`Added column ${column} to ${table}`);
      } catch (e) {
        // Column probably already exists
      }
    }
  }
};
migrate();

// Seed initial data
const ensureUsers = () => {
  const users = [
    { u: "admin", p: "admin", r: "Manager" },
    { u: "dispatcher", p: "dispatch", r: "Dispatcher" },
    { u: "safety", p: "safety", r: "Safety Officer" },
    { u: "analyst", p: "analyst", r: "Financial Analyst" }
  ];

  for (const user of users) {
    try {
      db.prepare("INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)").run(user.u, user.p, user.r);
    } catch (e) {
      console.error(`Failed to seed user ${user.u}`, e);
    }
  }
};
ensureUsers();

const userCount = db.prepare("SELECT count(*) as count FROM users").get() as { count: number };
if (userCount.count <= 4) { // If only seeded users or empty, seed some data
  const vehicleCount = db.prepare("SELECT count(*) as count FROM vehicles").get() as { count: number };
  if (vehicleCount.count === 0) {
    db.prepare("INSERT INTO vehicles (name, license_plate, type, max_payload, odometer, acquisition_cost, status) VALUES (?, ?, ?, ?, ?, ?, ?)").run("Trailer Truck", "MH 01 AB 1234", "Truck", 20000, 50000, 5000000, "Available");
    db.prepare("INSERT INTO vehicles (name, license_plate, type, max_payload, odometer, acquisition_cost, status) VALUES (?, ?, ?, ?, ?, ?, ?)").run("Mini Van", "MH 02 CD 5678", "Van", 1000, 12000, 800000, "Available");
  }
  
  const driverCount = db.prepare("SELECT count(*) as count FROM drivers").get() as { count: number };
  if (driverCount.count === 0) {
    db.prepare("INSERT INTO drivers (name, license_no, expiry_date, status) VALUES (?, ?, ?, ?)").run("John Doe", "DL-12345", "2026-12-31", "On Duty");
    db.prepare("INSERT INTO drivers (name, license_no, expiry_date, status) VALUES (?, ?, ?, ?)").run("Jane Smith", "DL-67890", "2024-06-30", "On Duty");
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Request logging middleware
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Auth API
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password) as any;
    if (user) {
      res.json({ id: user.id, username: user.username, role: user.role });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // Vehicles API
  app.get("/api/vehicles", (req, res) => {
    const vehicles = db.prepare("SELECT * FROM vehicles").all();
    res.json(vehicles);
  });

  app.post("/api/vehicles", (req, res) => {
    const { name, license_plate, type, max_payload, odometer, acquisition_cost } = req.body;
    try {
      const result = db.prepare("INSERT INTO vehicles (name, license_plate, type, max_payload, odometer, acquisition_cost) VALUES (?, ?, ?, ?, ?, ?)").run(name, license_plate, type, max_payload, odometer, acquisition_cost || 0);
      res.json({ id: result.lastInsertRowid });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Drivers API
  app.get("/api/drivers", (req, res) => {
    const drivers = db.prepare("SELECT * FROM drivers").all();
    res.json(drivers);
  });

  app.post("/api/drivers/:id/status", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    db.prepare("UPDATE drivers SET status = ? WHERE id = ?").run(status, id);
    res.json({ success: true });
  });

  // Trips API
  app.get("/api/trips", (req, res) => {
    const trips = db.prepare(`
      SELECT t.*, v.name as vehicle_name, v.max_payload, d.name as driver_name 
      FROM trips t
      JOIN vehicles v ON t.vehicle_id = v.id
      JOIN drivers d ON t.driver_id = d.id
      ORDER BY t.id DESC
    `).all();
    res.json(trips);
  });

  app.post("/api/trips", (req, res) => {
    const { vehicle_id, driver_id, origin, destination, cargo_weight, revenue } = req.body;
    
    // Check capacity
    const vehicle = db.prepare("SELECT max_payload, status FROM vehicles WHERE id = ?").get(vehicle_id) as any;
    if (!vehicle || vehicle.status !== 'Available') {
      return res.status(400).json({ error: "Vehicle is not available" });
    }
    if (cargo_weight > vehicle.max_payload) {
      return res.status(400).json({ error: `Cargo weight (${cargo_weight}kg) exceeds vehicle capacity (${vehicle.max_payload}kg)` });
    }

    // Check driver license expiry
    const driver = db.prepare("SELECT expiry_date, status FROM drivers WHERE id = ?").get(driver_id) as any;
    if (!driver || (driver.status !== 'On Duty' && driver.status !== 'Available')) {
      return res.status(400).json({ error: `Driver is currently ${driver?.status || 'Unknown'}. Must be On Duty or Available.` });
    }
    if (new Date(driver.expiry_date) < new Date()) {
      return res.status(400).json({ error: "Driver license has expired" });
    }

    const transaction = db.transaction(() => {
      const result = db.prepare("INSERT INTO trips (vehicle_id, driver_id, origin, destination, cargo_weight, revenue, status) VALUES (?, ?, ?, ?, ?, ?, 'Dispatched')").run(vehicle_id, driver_id, origin, destination, cargo_weight, revenue || 0);
      db.prepare("UPDATE vehicles SET status = 'On Trip' WHERE id = ?").run(vehicle_id);
      db.prepare("UPDATE drivers SET status = 'On Trip', total_trips = total_trips + 1 WHERE id = ?").run(driver_id);
      return result.lastInsertRowid;
    });

    try {
      const id = transaction();
      res.json({ id });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/trips/:id/complete", (req, res) => {
    const { id } = req.params;
    const { odometer } = req.body;
    
    const trip = db.prepare("SELECT * FROM trips WHERE id = ?").get(id) as any;
    if (!trip) return res.status(404).json({ error: "Trip not found" });

    const transaction = db.transaction(() => {
      db.prepare("UPDATE trips SET status = 'Completed', end_time = CURRENT_TIMESTAMP WHERE id = ?").run(id);
      db.prepare("UPDATE vehicles SET status = 'Available', odometer = ? WHERE id = ?").run(odometer, trip.vehicle_id);
      db.prepare("UPDATE drivers SET status = 'On Duty', completed_trips = completed_trips + 1 WHERE id = ?").run(trip.driver_id);
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Maintenance API
  app.get("/api/maintenance", (req, res) => {
    const logs = db.prepare(`
      SELECT m.*, v.name as vehicle_name 
      FROM maintenance m
      JOIN vehicles v ON m.vehicle_id = v.id
      ORDER BY m.id DESC
    `).all();
    res.json(logs);
  });

  app.post("/api/maintenance", (req, res) => {
    const { vehicle_id, issue, date, cost } = req.body;
    const transaction = db.transaction(() => {
      const result = db.prepare("INSERT INTO maintenance (vehicle_id, issue, date, cost) VALUES (?, ?, ?, ?)").run(vehicle_id, issue, date, cost);
      db.prepare("UPDATE vehicles SET status = 'In Shop' WHERE id = ?").run(vehicle_id);
      return result.lastInsertRowid;
    });

    try {
      const id = transaction();
      res.json({ id });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Expenses API
  app.get("/api/expenses", (req, res) => {
    const expenses = db.prepare(`
      SELECT e.*, v.name as vehicle_name, d.name as driver_name 
      FROM expenses e
      JOIN vehicles v ON e.vehicle_id = v.id
      JOIN drivers d ON e.driver_id = d.id
    `).all();
    res.json(expenses);
  });

  app.post("/api/expenses", (req, res) => {
    const { trip_id, vehicle_id, driver_id, fuel_cost, misc_expense, distance, liters, date } = req.body;
    try {
      const result = db.prepare("INSERT INTO expenses (trip_id, vehicle_id, driver_id, fuel_cost, misc_expense, distance, liters, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(trip_id, vehicle_id, driver_id, fuel_cost, misc_expense, distance, liters || 0, date);
      res.json({ id: result.lastInsertRowid });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Dashboard Stats API
  app.get("/api/stats", (req, res) => {
    try {
      const activeFleet = db.prepare("SELECT count(*) as count FROM vehicles WHERE status = 'On Trip'").get() as any;
      const maintenanceAlerts = db.prepare("SELECT count(*) as count FROM vehicles WHERE status = 'In Shop'").get() as any;
      const totalVehicles = db.prepare("SELECT count(*) as count FROM vehicles").get() as any;
      const pendingCargo = 20; // Mocked
      
      const totalRevenue = db.prepare("SELECT SUM(revenue) as total FROM trips WHERE status = 'Completed'").get() as any;
      const totalFuel = db.prepare("SELECT SUM(fuel_cost) as total FROM expenses").get() as any;
      const totalMaintenance = db.prepare("SELECT SUM(cost) as total FROM maintenance").get() as any;
      
      res.json({
        activeFleet: activeFleet.count,
        maintenanceAlerts: maintenanceAlerts.count,
        utilizationRate: totalVehicles.count > 0 ? Math.round((activeFleet.count / totalVehicles.count) * 100) : 0,
        pendingCargo,
        totalRevenue: totalRevenue.total || 0,
        totalFuel: totalFuel.total || 0,
        totalMaintenance: totalMaintenance.total || 0
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/drivers", (req, res) => {
    const { name, license_no, expiry_date } = req.body;
    try {
      const result = db.prepare("INSERT INTO drivers (name, license_no, expiry_date) VALUES (?, ?, ?)").run(name, license_no, expiry_date);
      res.json({ id: result.lastInsertRowid });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Catch-all for API routes to prevent HTML fallback
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
