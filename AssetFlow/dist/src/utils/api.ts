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

export interface AssetCategory {
  id: string;
  name: string;
  customFields?: any;
  status: string;
  _count?: { assets: number };
}

export interface Asset {
  id: string;
  assetTag: string;
  name: string;
  description?: string;
  categoryId: string;
  category?: AssetCategory;
  serialNumber?: string;
  status: AssetStatusType;
  condition?: string;
  location?: string;
  departmentId?: string;
  department?: { id: string; name: string };
  purchaseDate?: string;
  purchaseCost?: number;
  photo?: string;
  currentHolderId?: string;
  createdAt: string;
  updatedAt: string;
  allocations?: any[];
  bookings?: any[];
  maintenanceRequests?: any[];
  auditItems?: any[];
}

export interface Allocation {
  id: string;
  assetId: string;
  userId: string;
  allocatedBy: string;
  status: AllocationStatusType;
  expectedReturnDate?: string;
  conditionNotes?: string;
  returnedAt?: string;
  createdAt: string;
  updatedAt: string;
  asset: Asset;
  user: { id: string; name: string; email: string };
}

export interface TransferRequest {
  id: string;
  allocationId: string;
  fromId: string;
  toId: string;
  status: TransferStatusType;
  reason?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedAt?: string;
  createdAt: string;
  updatedAt: string;
  from: { id: string; name: string; email: true };
  to: { id: string; name: string; email: true };
  allocation: { asset: { id: string; assetTag: string; name: string } };
}

export interface Booking {
  id: string;
  assetId: string;
  userId: string;
  startTime: string;
  endTime: string;
  status: BookingStatusType;
  purpose?: string;
  createdAt: string;
  updatedAt: string;
  asset: { id: string; assetTag: string; name: true };
  user: { id: string; name: string; email: true };
}

export interface MaintenanceRequest {
  id: string;
  assetId: string;
  requestedBy: string;
  description: string;
  priority: PriorityType;
  status: MaintenanceStatusType;
  photo?: string;
  approvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  asset: { id: string; assetTag: string; name: string; status: string };
  user: { id: string; name: string; email: true };
}

export interface AuditCycle {
  id: string;
  name: string;
  description?: string;
  scope: string;
  startDate: string;
  endDate: string;
  status: AuditStatusType;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string; email: true };
  assignedAudits: any[];
  auditItems: any[];
}

export interface AuditItem {
  id: string;
  auditCycleId: string;
  assignedAuditId: string;
  assetId: string;
  result?: AuditResultType;
  notes?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
  asset: { id: string; assetTag: string; name: string };
  assignedAudit: { auditor: { id: string; name: string; email: true } };
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationTypeType;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  headId?: string;
  parentId?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  head?: { id: string; name: string; email: true };
  parent?: { id: string; name: true };
  _count: { users: number; assets: number };
}

export const getNotifications = async () => {
  const res = await api.get('/notifications');
  return res.data;
};

export const markAllNotificationsRead = async () => {
  const res = await api.put('/notifications/read-all');
  return res.data;
};
