export interface Vehicle {
  id: number;
  name: string;
  license_plate: string;
  type: string;
  max_payload: number;
  odometer: number;
  status: string;
  acquisition_cost: number;
}

export interface Driver {
  id: number;
  name: string;
  license_no: string;
  expiry_date: string;
  status: string;
  safety_score: number;
  total_trips: number;
  completed_trips: number;
}

export interface Trip {
  id: number;
  vehicle_id: number;
  driver_id: number;
  vehicle_name: string;
  driver_name: string;
  origin: string;
  destination: string;
  cargo_weight: number;
  revenue: number;
  status: string;
  start_time: string;
  end_time: string;
}

export interface Expense {
  id: number;
  trip_id: number;
  vehicle_id: number;
  driver_id: number;
  vehicle_name: string;
  driver_name: string;
  fuel_cost: number;
  liters: number;
  distance: number;
  misc_expense: number;
  date: string;
}

export const APP_NAME = "FleetFlow Pro";
export const ROLES = ["Manager", "Dispatcher", "Safety Officer", "Financial Analyst"];
export const VEHICLE_TYPES = ["Truck", "Van", "Trailer", "Container"];
