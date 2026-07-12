import { Role, Status, AssetStatus, AllocationStatus, TransferStatus, BookingStatus, Priority, MaintenanceStatus, AuditStatus, AuditResult, NotificationType } from '@prisma/client';

export type UserRole = Role;
export type UserStatus = Status;
export type AssetStatusType = AssetStatus;
export type AllocationStatusType = AllocationStatus;
export type TransferStatusType = TransferStatus;
export type BookingStatusType = BookingStatus;
export type PriorityType = Priority;
export type MaintenanceStatusType = MaintenanceStatus;
export type AuditStatusType = AuditStatus;
export type AuditResultType = AuditResult;
export type NotificationTypeType = NotificationType;

export interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
}
