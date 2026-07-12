import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export type UserRole = 'ADMIN' | 'ASSET_MANAGER' | 'DEPARTMENT_HEAD' | 'EMPLOYEE' | 'AUDITOR';
export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type AssetStatusType = 'AVAILABLE' | 'ALLOCATED' | 'RESERVED' | 'UNDER_MAINTENANCE' | 'LOST' | 'RETIRED' | 'DISPOSED';
export type AllocationStatusType = 'ACTIVE' | 'RETURNED' | 'OVERDUE' | 'TRANSFERRED';
export type TransferStatusType = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
export type BookingStatusType = 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
export type PriorityType = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type MaintenanceStatusType = 'REQUESTED' | 'REJECTED' | 'APPROVED' | 'TECHNICIAN_ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED';
export type AuditStatusType = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED';
export type AuditResultType = 'VERIFIED' | 'MISSING' | 'DAMAGED';
export type NotificationTypeType = 'ALLOCATION' | 'TRANSFER_REQUEST' | 'TRANSFER_APPROVED' | 'TRANSFER_REJECTED' | 'RETURN_REMINDER' | 'OVERDUE_RETURN' | 'MAINTENANCE_REQUEST' | 'MAINTENANCE_APPROVED' | 'MAINTENANCE_RESOLVED' | 'AUDIT_ASSIGNED' | 'AUDIT_CYCLE_CLOSED' | 'SYSTEM';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  departmentId?: string;
  department?: { id: string; name: string };
  photo?: string;
  phone?: string;
  createdAt: string;
}
