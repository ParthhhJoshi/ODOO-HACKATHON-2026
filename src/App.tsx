/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent, ReactNode } from "react";
import { 
  LayoutDashboard, 
  Truck, 
  MapPin, 
  Wrench, 
  Receipt, 
  Users, 
  BarChart3, 
  LogOut, 
  Plus, 
  Search, 
  Filter, 
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  Fuel
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// --- Types ---
type Role = "Manager" | "Dispatcher" | "Safety Officer" | "Financial Analyst";

interface User {
  id: number;
  username: string;
  role: Role;
}

interface Vehicle {
  id: number;
  name: string;
  license_plate: string;
  type: string;
  max_payload: number;
  odometer: number;
  acquisition_cost: number;
  status: string;
}

interface Driver {
  id: number;
  name: string;
  license_no: string;
  expiry_date: string;
  status: string;
  safety_score: number;
  total_trips: number;
  completed_trips: number;
}

interface Trip {
  id: number;
  vehicle_id: number;
  driver_id: number;
  vehicle_name: string;
  max_payload: number;
  driver_name: string;
  origin: string;
  destination: string;
  cargo_weight: number;
  revenue: number;
  status: string;
  start_time: string;
}

interface MaintenanceLog {
  id: number;
  vehicle_id: number;
  vehicle_name: string;
  issue: string;
  date: string;
  cost: number;
  status: string;
}

interface Expense {
  id: number;
  trip_id: number;
  vehicle_name: string;
  driver_name: string;
  fuel_cost: number;
  misc_expense: number;
  distance: number;
  liters: number;
  date: string;
}

interface Stats {
  activeFleet: number;
  maintenanceAlerts: number;
  utilizationRate: number;
  pendingCargo: number;
  totalRevenue: number;
  totalFuel: number;
  totalMaintenance: number;
}

// --- Components ---

const StatusPill = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    "Available": "bg-emerald-50 text-emerald-600 border-emerald-100",
    "On Duty": "bg-emerald-50 text-emerald-600 border-emerald-100",
    "On Trip": "bg-blue-50 text-blue-600 border-blue-100",
    "Dispatched": "bg-blue-50 text-blue-600 border-blue-100",
    "In Shop": "bg-amber-50 text-amber-600 border-amber-100",
    "Completed": "bg-slate-50 text-slate-600 border-slate-200",
    "Cancelled": "bg-rose-50 text-rose-600 border-rose-100",
    "Suspended": "bg-rose-50 text-rose-600 border-rose-100",
    "Off Duty": "bg-slate-100 text-slate-400 border-slate-200",
    "New": "bg-indigo-50 text-indigo-600 border-indigo-100",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${colors[status] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
      {status}
    </span>
  );
};

const Modal = ({ show, onClose, title, children }: { show: boolean, onClose: () => void, title: string, children: ReactNode }) => (
  <AnimatePresence>
    {show && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-xl font-black tracking-tight">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-400">✕</button>
          </div>
          <div className="p-8 max-h-[70vh] overflow-y-auto">
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const VehicleForm = ({ onComplete }: { onComplete: (msg?: string, type?: 'success' | 'error') => void }) => {
  const [form, setForm] = useState({ name: "", license_plate: "", type: "Truck", max_payload: 0, odometer: 0, acquisition_cost: 0 });
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    if (res.ok) onComplete("Vehicle Registered Successfully", "success");
    else onComplete("Failed to register vehicle", "error");
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Vehicle Model Name</label>
          <input required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">License Plate Number</label>
          <input required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" value={form.license_plate} onChange={e => setForm({ ...form, license_plate: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Vehicle Type</label>
          <select className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
            <option>Truck</option><option>Van</option><option>Trailer</option><option>Container</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Max Payload (kg)</label>
          <input type="number" required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" value={form.max_payload || ""} onChange={e => setForm({ ...form, max_payload: parseFloat(e.target.value) || 0 })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Current Odometer (km)</label>
          <input type="number" required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" value={form.odometer || ""} onChange={e => setForm({ ...form, odometer: parseFloat(e.target.value) || 0 })} />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Acquisition Cost (₹)</label>
          <input type="number" required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" value={form.acquisition_cost || ""} onChange={e => setForm({ ...form, acquisition_cost: parseFloat(e.target.value) || 0 })} />
        </div>
      </div>
      <button type="submit" className="w-full bg-indigo-600 text-white font-black uppercase tracking-[0.2em] py-5 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">Register Vehicle</button>
    </form>
  );
};

const DriverForm = ({ onComplete }: { onComplete: (msg?: string, type?: 'success' | 'error') => void }) => {
  const [form, setForm] = useState({ name: "", license_no: "", expiry_date: "" });
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/drivers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    if (res.ok) onComplete("Driver Registered Successfully", "success");
    else onComplete("Failed to register driver", "error");
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
        <input required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">License Number</label>
          <input required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" value={form.license_no} onChange={e => setForm({ ...form, license_no: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">License Expiry Date</label>
          <input type="date" required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value })} />
        </div>
      </div>
      <button type="submit" className="w-full bg-indigo-600 text-white font-black uppercase tracking-[0.2em] py-5 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">Register Driver</button>
    </form>
  );
};

const TripForm = ({ vehicles, drivers, onComplete }: { vehicles: Vehicle[], drivers: Driver[], onComplete: (msg?: string, type?: 'success' | 'error') => void }) => {
  const [form, setForm] = useState({ vehicle_id: "", driver_id: "", origin: "", destination: "", cargo_weight: 0, revenue: 0 });
  const selectedVehicle = vehicles.find(v => v.id === parseInt(form.vehicle_id));
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    if (res.ok) onComplete("Trip Dispatched Successfully", "success");
    else {
      const err = await res.json();
      onComplete(err.error || "Failed to dispatch trip", "error");
    }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Select Vehicle</label>
          <select required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" value={form.vehicle_id} onChange={e => setForm({ ...form, vehicle_id: e.target.value })}>
            <option value="">Choose Vehicle</option>
            {vehicles.filter(v => v.status === "Available").map(v => <option key={v.id} value={v.id}>{v.name} ({v.license_plate})</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Select Driver</label>
          <select required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" value={form.driver_id} onChange={e => setForm({ ...form, driver_id: e.target.value })}>
            <option value="">Choose Driver</option>
            {drivers.filter(d => d.status === "On Duty" || d.status === "Available").map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Origin</label>
          <input required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" value={form.origin} onChange={e => setForm({ ...form, origin: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Destination</label>
          <input required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Cargo Weight (kg)</label>
          <input type="number" required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" value={form.cargo_weight || ""} onChange={e => setForm({ ...form, cargo_weight: parseFloat(e.target.value) || 0 })} />
          {selectedVehicle && <p className={`text-[10px] font-bold mt-1 ${form.cargo_weight > selectedVehicle.max_payload ? "text-rose-500" : "text-emerald-500"}`}>Max Capacity: {selectedVehicle.max_payload} kg</p>}
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Expected Revenue (₹)</label>
          <input type="number" required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" value={form.revenue || ""} onChange={e => setForm({ ...form, revenue: parseFloat(e.target.value) || 0 })} />
        </div>
      </div>
      <button type="submit" className="w-full bg-indigo-600 text-white font-black uppercase tracking-[0.2em] py-5 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">Confirm Dispatch</button>
    </form>
  );
};

const MaintenanceForm = ({ vehicles, onComplete }: { vehicles: Vehicle[], onComplete: (msg?: string, type?: 'success' | 'error') => void }) => {
  const [form, setForm] = useState({ vehicle_id: "", issue: "", date: new Date().toISOString().split('T')[0], cost: 0 });
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    if (res.ok) onComplete("Maintenance Logged Successfully", "success");
    else onComplete("Failed to log maintenance", "error");
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Select Vehicle</label>
        <select required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" value={form.vehicle_id} onChange={e => setForm({ ...form, vehicle_id: e.target.value })}>
          <option value="">Choose Vehicle</option>
          {vehicles.map(v => <option key={v.id} value={v.id}>{v.name} ({v.license_plate})</option>)}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Issue Description</label>
        <textarea required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold min-h-[100px]" value={form.issue} onChange={e => setForm({ ...form, issue: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Service Date</label>
          <input type="date" required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Total Cost (₹)</label>
          <input type="number" required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" value={form.cost || ""} onChange={e => setForm({ ...form, cost: parseFloat(e.target.value) || 0 })} />
        </div>
      </div>
      <button type="submit" className="w-full bg-indigo-600 text-white font-black uppercase tracking-[0.2em] py-5 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">Log Maintenance</button>
    </form>
  );
};

const ExpenseForm = ({ trips, onComplete }: { trips: Trip[], onComplete: (msg?: string, type?: 'success' | 'error') => void }) => {
  const [form, setForm] = useState({ trip_id: "", fuel_cost: 0, misc_expense: 0, distance: 0, liters: 0, date: new Date().toISOString().split('T')[0] });
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trip = trips.find(t => t.id === parseInt(form.trip_id));
    if (!trip) return;
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, vehicle_id: trip.vehicle_id, driver_id: trip.driver_id })
    });
    if (res.ok) onComplete("Expense Added Successfully", "success");
    else onComplete("Failed to add expense", "error");
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Link to Trip</label>
        <select required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" value={form.trip_id} onChange={e => setForm({ ...form, trip_id: e.target.value })}>
          <option value="">Select Completed Trip</option>
          {trips.filter(t => t.status === "Completed").map(t => <option key={t.id} value={t.id}>#{t.id} - {t.vehicle_name} to {t.destination}</option>)}
          {trips.filter(t => t.status === "Completed").length === 0 && <option disabled>No completed trips available. Complete a trip first.</option>}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Fuel Cost (₹)</label>
          <input type="number" required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" value={form.fuel_cost || ""} onChange={e => setForm({ ...form, fuel_cost: parseFloat(e.target.value) || 0 })} />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Fuel Liters</label>
          <input type="number" step="0.01" required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" value={form.liters || ""} onChange={e => setForm({ ...form, liters: parseFloat(e.target.value) || 0 })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Distance (km)</label>
          <input type="number" required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" value={form.distance || ""} onChange={e => setForm({ ...form, distance: parseFloat(e.target.value) || 0 })} />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Misc. Expenses (₹)</label>
          <input type="number" required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" value={form.misc_expense || ""} onChange={e => setForm({ ...form, misc_expense: parseFloat(e.target.value) || 0 })} />
        </div>
      </div>
      <button type="submit" className="w-full bg-indigo-600 text-white font-black uppercase tracking-[0.2em] py-5 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">Add Expense Record</button>
    </form>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<Stats>({ activeFleet: 0, maintenanceAlerts: 0, utilizationRate: 0, pendingCargo: 0, totalRevenue: 0, totalFuel: 0, totalMaintenance: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showTripModal, setShowTripModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => { if (user) fetchData(); }, [user, view]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const safeJson = async (res: Response) => {
        if (!res.ok) throw new Error("Request failed");
        return res.json();
      };
      const [vRes, dRes, tRes, mRes, eRes, sRes] = await Promise.all([fetch("/api/vehicles"), fetch("/api/drivers"), fetch("/api/trips"), fetch("/api/maintenance"), fetch("/api/expenses"), fetch("/api/stats")]);
      const [vData, dData, tData, mData, eData, sData] = await Promise.all([safeJson(vRes), safeJson(dRes), safeJson(tRes), safeJson(mRes), safeJson(eRes), safeJson(sRes)]);
      setVehicles(vData); setDrivers(dData); setTrips(tData); setMaintenance(mData); setExpenses(eData); setStats(sData);
    } catch (e) { showNotification("Failed to sync with server", "error"); }
    finally { setLoading(false); }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(loginForm) });
    if (res.ok) setUser(await res.json());
    else alert("Invalid credentials");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#6366f1] via-[#a855f7] to-[#ec4899] flex items-center justify-center p-4 font-sans">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20">
          <div className="p-10">
            <div className="flex flex-col items-center mb-10">
              <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200 mb-4 rotate-3"><Truck className="text-white w-8 h-8" /></div>
              <h1 className="text-3xl font-black tracking-tighter text-gray-900">FleetFlow</h1>
              <p className="text-gray-500 text-sm font-medium mt-1">Logistics Management System</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5"><label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">Username</label><input type="text" className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-gray-900 font-medium" placeholder="admin, dispatcher, safety, analyst" value={loginForm.username} onChange={e => setLoginForm({ ...loginForm, username: e.target.value })} /></div>
              <div className="space-y-1.5"><label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">Password</label><input type="password" className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-gray-900 font-medium" placeholder="••••••••" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} /></div>
              <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold py-4 rounded-2xl hover:shadow-xl hover:shadow-indigo-200 transition-all active:scale-[0.98] mt-4">Sign In</button>
            </form>
            <div className="mt-10 pt-8 border-t border-gray-100 text-center"><div className="bg-slate-50 p-4 rounded-2xl text-left"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Demo Credentials</p><div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-600"><div>Manager: <span className="text-indigo-600">admin / admin</span></div><div>Dispatcher: <span className="text-indigo-600">dispatcher / dispatch</span></div><div>Safety: <span className="text-indigo-600">safety / safety</span></div><div>Analyst: <span className="text-indigo-600">analyst / analyst</span></div></div></div></div>
          </div>
        </motion.div>
      </div>
    );
  }

  const SidebarItem = ({ id, icon: Icon, label, roles }: { id: string, icon: any, label: string, roles: Role[] }) => {
    if (!roles.includes(user.role)) return null;
    return (
      <button onClick={() => setView(id)} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 ${view === id ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200" : "text-gray-500 hover:bg-indigo-50 hover:text-indigo-600"}`}>
        <Icon size={20} className={view === id ? "text-white" : "text-gray-400"} /><span className="font-bold text-sm tracking-tight">{label}</span>{view === id && <motion.div layoutId="active" className="ml-auto"><ChevronRight size={16} /></motion.div>}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900">
      <AnimatePresence>{notification && (<motion.div initial={{ opacity: 0, y: 50, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 50, x: '-50%' }} className={`fixed bottom-10 left-1/2 z-[100] px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm border ${notification.type === 'success' ? 'bg-emerald-900 text-emerald-100 border-emerald-500/30' : 'bg-rose-900 text-rose-100 border-rose-500/30'}`}>{notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}{notification.message}</motion.div>)}</AnimatePresence>
      <aside className="w-72 bg-white border-r border-slate-200/60 p-8 flex flex-col gap-10 shadow-sm">
        <div className="flex items-center gap-4 px-2"><div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100"><Truck className="text-white w-6 h-6" /></div><div><h1 className="text-2xl font-black tracking-tighter leading-none">FleetFlow</h1><p className="text-[10px] uppercase font-black tracking-[0.2em] text-indigo-500 mt-1">Enterprise</p></div></div>
        <nav className="flex-1 flex flex-col gap-2">
          <SidebarItem id="dashboard" icon={LayoutDashboard} label="Dashboard" roles={["Manager", "Dispatcher", "Safety Officer", "Financial Analyst"]} />
          <SidebarItem id="vehicles" icon={Truck} label="Vehicle Registry" roles={["Manager", "Dispatcher"]} />
          <SidebarItem id="trips" icon={MapPin} label="Trip Dispatcher" roles={["Manager", "Dispatcher"]} />
          <SidebarItem id="maintenance" icon={Wrench} label="Maintenance" roles={["Manager", "Financial Analyst"]} />
          <SidebarItem id="expenses" icon={Receipt} label="Trip & Expense" roles={["Manager", "Financial Analyst"]} />
          <SidebarItem id="drivers" icon={Users} label="Driver Profiles" roles={["Manager", "Safety Officer"]} />
          <SidebarItem id="analytics" icon={BarChart3} label="Analytics" roles={["Manager", "Financial Analyst"]} />
        </nav>
        <div className="pt-8 border-t border-slate-100">
          <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 mb-4"><div className="flex items-center gap-3"><div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-2xl flex items-center justify-center font-black text-indigo-600 text-lg shadow-inner">{user.username[0].toUpperCase()}</div><div className="flex-1"><p className="text-sm font-black leading-none text-slate-900">{user.username}</p><p className="text-[10px] uppercase font-black tracking-widest text-indigo-500 mt-1.5">{user.role}</p></div></div></div>
          <button onClick={() => setUser(null)} className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-rose-500 hover:bg-rose-50 transition-all font-bold text-sm"><LogOut size={18} />Logout</button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto overflow-x-auto p-10">
        <header className="flex items-center justify-between mb-12">
          <div><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-2"><div className="w-1 h-1 rounded-full bg-indigo-500" />Fleet Management</div><h2 className="text-4xl font-black tracking-tighter capitalize text-slate-900">{view.replace("-", " ")}</h2></div>
          <div className="flex items-center gap-6"><div className="relative group"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} /><input type="text" placeholder="Search fleet, drivers, trips..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-[1.5rem] text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none w-80 shadow-sm transition-all" /></div><button className="p-4 bg-white border border-slate-200 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"><Filter size={20} /></button></div>
        </header>
        <AnimatePresence mode="wait">
          {view === "dashboard" && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-10">
              <div className="grid grid-cols-4 gap-8">
                {[{ label: "Active Fleet", value: stats.activeFleet, icon: Truck, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" }, { label: "Maintenance Alerts", value: stats.maintenanceAlerts, icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" }, { label: "Utilization Rate", value: `${stats.utilizationRate}%`, icon: BarChart3, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" }, { label: "Pending Cargo", value: stats.pendingCargo, icon: Clock, color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-100" }].map((kpi, i) => (
                  <div key={i} className={`bg-white p-8 rounded-[2rem] border ${kpi.border} shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group`}><div className={`w-14 h-14 ${kpi.bg} ${kpi.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}><kpi.icon size={28} /></div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{kpi.label}</p><p className="text-4xl font-black tracking-tighter text-slate-900">{kpi.value}</p></div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-8">
                {[{ label: "Total Revenue", value: `₹${(stats.totalRevenue / 100000).toFixed(1)}L`, icon: BarChart3, color: "text-emerald-600" }, { label: "Fuel Spend", value: `₹${(stats.totalFuel / 100000).toFixed(1)}L`, icon: Fuel, color: "text-rose-600" }, { label: "Maintenance Cost", value: `₹${(stats.totalMaintenance / 100000).toFixed(1)}L`, icon: Wrench, color: "text-amber-600" }].map((stat, i) => (
                  <div key={i} className="bg-slate-900 p-8 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group"><div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform"><stat.icon size={80} /></div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{stat.label}</p><p className={`text-4xl font-black tracking-tighter ${stat.color}`}>{stat.value}</p></div>
                ))}
              </div>
              <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between"><div><h3 className="text-xl font-black tracking-tight">Live Fleet Status</h3><p className="text-xs text-slate-400 font-medium mt-1">Real-time monitoring of dispatched units.</p></div></div>
                <div className="overflow-x-auto"><table className="w-full text-left border-collapse"><thead><tr className="bg-slate-50/50 text-[10px] uppercase font-black tracking-[0.2em] text-slate-400"><th className="px-8 py-5">Trip ID</th><th className="px-8 py-5">Vehicle</th><th className="px-8 py-5">Driver</th><th className="px-8 py-5">Status</th><th className="px-8 py-5">Destination</th></tr></thead><tbody className="divide-y divide-slate-100">{trips.filter(t => t.vehicle_name.toLowerCase().includes(searchQuery.toLowerCase()) || t.driver_name.toLowerCase().includes(searchQuery.toLowerCase()) || t.destination.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5).map((trip) => (<tr key={trip.id} className="hover:bg-slate-50/50 transition-all group cursor-pointer"><td className="px-8 py-6 font-mono text-xs font-bold text-indigo-600">#{trip.id.toString().padStart(4, '0')}</td><td className="px-8 py-6"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors"><Truck size={16} /></div><span className="font-bold text-slate-700">{trip.vehicle_name}</span></div></td><td className="px-8 py-6 text-slate-500 font-medium">{trip.driver_name}</td><td className="px-8 py-6"><StatusPill status={trip.status} /></td><td className="px-8 py-6 text-slate-500 font-medium">{trip.destination}</td></tr>))}</tbody></table></div>
              </div>
            </motion.div>
          )}

          {view === "vehicles" && (
            <motion.div key="vehicles" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex justify-end"><button onClick={() => setShowVehicleModal(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest flex items-center gap-2 hover:shadow-xl hover:shadow-indigo-200 transition-all active:scale-95"><Plus size={18} />Add New Vehicle</button></div>
              <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden"><table className="w-full text-left border-collapse"><thead><tr className="bg-slate-50/50 text-[10px] uppercase font-black tracking-[0.2em] text-slate-400"><th className="px-8 py-5">#ID</th><th className="px-8 py-5">Plate</th><th className="px-8 py-5">Model</th><th className="px-8 py-5">Type</th><th className="px-8 py-5">Capacity</th><th className="px-8 py-5">Odometer</th><th className="px-8 py-5">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{vehicles.filter(v => v.name.toLowerCase().includes(searchQuery.toLowerCase()) || v.license_plate.toLowerCase().includes(searchQuery.toLowerCase())).map((v) => (<tr key={v.id} className="hover:bg-slate-50/50 transition-all group"><td className="px-8 py-6 font-mono text-xs font-bold text-slate-400">{v.id}</td><td className="px-8 py-6 font-black text-slate-900">{v.license_plate}</td><td className="px-8 py-6 font-bold text-slate-700">{v.name}</td><td className="px-8 py-6 text-slate-500 font-medium">{v.type}</td><td className="px-8 py-6 text-slate-500 font-medium">{(v.max_payload / 1000).toFixed(1)} Tons</td><td className="px-8 py-6 text-slate-500 font-medium">{v.odometer.toLocaleString()} km</td><td className="px-8 py-6"><StatusPill status={v.status} /></td></tr>))}</tbody></table></div>
            </motion.div>
          )}

          {view === "trips" && (
            <motion.div key="trips" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex justify-end"><button onClick={() => setShowTripModal(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest flex items-center gap-2 hover:shadow-xl hover:shadow-indigo-200 transition-all active:scale-95"><Plus size={18} />Dispatch New Trip</button></div>
              <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden overflow-x-auto"><table className="w-full text-left border-collapse min-w-[1000px]"><thead><tr className="bg-slate-50/50 text-[10px] uppercase font-black tracking-[0.2em] text-slate-400"><th className="px-8 py-5">Trip ID</th><th className="px-8 py-5">Vehicle</th><th className="px-8 py-5">Origin</th><th className="px-8 py-5">Destination</th><th className="px-8 py-5">Status</th><th className="px-8 py-5">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{trips.filter(t => t.vehicle_name.toLowerCase().includes(searchQuery.toLowerCase()) || t.id.toString().includes(searchQuery)).map((t) => (<tr key={t.id} className="hover:bg-slate-50/50 transition-all group"><td className="px-8 py-6 font-mono text-xs font-bold text-indigo-600">#{t.id}</td><td className="px-8 py-6 font-black text-slate-900">{t.vehicle_name}</td><td className="px-8 py-6 text-slate-500 font-medium">{t.origin}</td><td className="px-8 py-6 text-slate-500 font-medium">{t.destination}</td><td className="px-8 py-6"><StatusPill status={t.status} /></td><td className="px-8 py-6">{t.status === "Dispatched" && (<button onClick={async () => { const odo = prompt("Enter final odometer reading:"); if (odo) { await fetch(`/api/trips/${t.id}/complete`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ odometer: parseFloat(odo) }) }); fetchData(); } }} className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all">Mark Done</button>)}</td></tr>))}</tbody></table></div>
            </motion.div>
          )}

          {view === "maintenance" && (
            <motion.div key="maintenance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex justify-end"><button onClick={() => setShowMaintenanceModal(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest flex items-center gap-2 hover:shadow-xl hover:shadow-indigo-200 transition-all active:scale-95"><Plus size={18} />Log Service</button></div>
              <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden"><table className="w-full text-left border-collapse"><thead><tr className="bg-slate-50/50 text-[10px] uppercase font-black tracking-[0.2em] text-slate-400"><th className="px-8 py-5">Log ID</th><th className="px-8 py-5">Vehicle</th><th className="px-8 py-5">Issue</th><th className="px-8 py-5">Date</th><th className="px-8 py-5">Cost</th><th className="px-8 py-5">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{maintenance.map((m) => (<tr key={m.id} className="hover:bg-slate-50/50 transition-all group"><td className="px-8 py-6 font-mono text-xs font-bold text-slate-400">{m.id}</td><td className="px-8 py-6 font-black text-slate-900">{m.vehicle_name}</td><td className="px-8 py-6 text-slate-500 font-medium">{m.issue}</td><td className="px-8 py-6 text-slate-500 font-medium">{m.date}</td><td className="px-8 py-6 font-black text-slate-900">₹{m.cost.toLocaleString()}</td><td className="px-8 py-6"><StatusPill status={m.status} /></td></tr>))}</tbody></table></div>
            </motion.div>
          )}

          {view === "expenses" && (
            <motion.div key="expenses" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
              <div className="flex justify-between items-center"><h3 className="text-xl font-black tracking-tight">Active Trips</h3><button onClick={() => setShowExpenseModal(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest flex items-center gap-2 hover:shadow-xl hover:shadow-indigo-200 transition-all active:scale-95"><Plus size={18} />Add Expense</button></div>
              <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden overflow-x-auto"><table className="w-full text-left border-collapse min-w-[1000px]"><thead><tr className="bg-slate-50/50 text-[10px] uppercase font-black tracking-[0.2em] text-slate-400"><th className="px-8 py-5">Trip ID</th><th className="px-8 py-5">Vehicle</th><th className="px-8 py-5">Destination</th><th className="px-8 py-5">Status</th><th className="px-8 py-5">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{trips.filter(t => t.status === "Dispatched").map((t) => (<tr key={t.id} className="hover:bg-slate-50/50 transition-all group"><td className="px-8 py-6 font-mono text-xs font-bold text-indigo-600">#{t.id}</td><td className="px-8 py-6 font-black text-slate-900">{t.vehicle_name}</td><td className="px-8 py-6 text-slate-500 font-medium">{t.destination}</td><td className="px-8 py-6"><StatusPill status={t.status} /></td><td className="px-8 py-6"><button onClick={async () => { const odo = prompt("Enter final odometer reading:"); if (odo) { const res = await fetch(`/api/trips/${t.id}/complete`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ odometer: parseFloat(odo) }) }); if (res.ok) { showNotification("Trip Completed Successfully"); fetchData(); } } }} className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all">Complete Trip</button></td></tr>))}</tbody></table></div>
              <h3 className="text-xl font-black tracking-tight mt-10">Expense Records</h3>
              <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden overflow-x-auto"><table className="w-full text-left border-collapse min-w-[1000px]"><thead><tr className="bg-slate-50/50 text-[10px] uppercase font-black tracking-[0.2em] text-slate-400"><th className="px-8 py-5">Trip ID</th><th className="px-8 py-5">Vehicle</th><th className="px-8 py-5">Distance</th><th className="px-8 py-5">Fuel Cost</th><th className="px-8 py-5">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{expenses.map((e) => (<tr key={e.id} className="hover:bg-slate-50/50 transition-all group"><td className="px-8 py-6 font-mono text-xs font-bold text-indigo-600">#{e.trip_id}</td><td className="px-8 py-6 font-black text-slate-900">{e.vehicle_name}</td><td className="px-8 py-6 text-slate-500 font-medium">{e.distance} km</td><td className="px-8 py-6 text-slate-500 font-medium">₹{e.fuel_cost}</td><td className="px-8 py-6"><StatusPill status="Completed" /></td></tr>))}</tbody></table></div>
            </motion.div>
          )}

          {view === "drivers" && (
            <motion.div key="drivers" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex justify-end"><button onClick={() => setShowDriverModal(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest flex items-center gap-2 hover:shadow-xl hover:shadow-indigo-200 transition-all active:scale-95"><Plus size={18} />Register New Driver</button></div>
              <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden overflow-x-auto"><table className="w-full text-left border-collapse min-w-[1000px]"><thead><tr className="bg-slate-50/50 text-[10px] uppercase font-black tracking-[0.2em] text-slate-400"><th className="px-8 py-5">Name</th><th className="px-8 py-5">License#</th><th className="px-8 py-5">Safety Score</th><th className="px-8 py-5">Status</th><th className="px-8 py-5">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{drivers.map((d) => (<tr key={d.id} className="hover:bg-slate-50/50 transition-all group"><td className="px-8 py-6 font-black text-slate-900">{d.name}</td><td className="px-8 py-6 font-mono text-xs font-bold text-slate-400">{d.license_no}</td><td className="px-8 py-6"><div className="flex items-center gap-3"><div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${d.safety_score}%` }} /></div><span className="text-xs font-black text-emerald-600">{d.safety_score}%</span></div></td><td className="px-8 py-6"><StatusPill status={d.status} /></td><td className="px-8 py-6"><div className="flex items-center gap-4"><select className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-widest outline-none" value={d.status} onChange={async (e) => { await fetch(`/api/drivers/${d.id}/status`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: e.target.value }) }); fetchData(); }}><option>On Duty</option><option>Available</option><option>Off Duty</option><option>Suspended</option>{d.status === "On Trip" && <option>On Trip</option>}</select>{d.status === "On Trip" && (<button onClick={async () => { const activeTrip = trips.find(t => t.driver_id === d.id && t.status === "Dispatched"); if (activeTrip) { const odo = prompt(`Completing trip #${activeTrip.id} for ${d.name}.\nEnter final odometer reading:`); if (odo) { const res = await fetch(`/api/trips/${activeTrip.id}/complete`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ odometer: parseFloat(odo) }) }); if (res.ok) { showNotification("Trip Completed Successfully"); fetchData(); } } } }} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all whitespace-nowrap">Complete Trip</button>)}</div></td></tr>))}</tbody></table></div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Modal show={showVehicleModal} onClose={() => setShowVehicleModal(false)} title="New Vehicle Registration"><VehicleForm onComplete={(msg, type) => { setShowVehicleModal(false); fetchData(); if (msg) showNotification(msg, type); }} /></Modal>
      <Modal show={showDriverModal} onClose={() => setShowDriverModal(false)} title="New Driver Registration"><DriverForm onComplete={(msg, type) => { setShowDriverModal(false); fetchData(); if (msg) showNotification(msg, type); }} /></Modal>
      <Modal show={showTripModal} onClose={() => setShowTripModal(false)} title="New Trip Dispatch"><TripForm vehicles={vehicles} drivers={drivers} onComplete={(msg, type) => { setShowTripModal(false); fetchData(); if (msg) showNotification(msg, type); }} /></Modal>
      <Modal show={showMaintenanceModal} onClose={() => setShowMaintenanceModal(false)} title="Log New Service"><MaintenanceForm vehicles={vehicles} onComplete={(msg, type) => { setShowMaintenanceModal(false); fetchData(); if (msg) showNotification(msg, type); }} /></Modal>
      <Modal show={showExpenseModal} onClose={() => setShowExpenseModal(false)} title="Add New Expense"><ExpenseForm trips={trips} onComplete={(msg, type) => { setShowExpenseModal(false); fetchData(); if (msg) showNotification(msg, type); }} /></Modal>
    </div>
  );
}
