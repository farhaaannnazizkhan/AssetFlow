import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare const getNotifications: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const markNotificationRead: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const markAllNotificationsRead: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=notificationController.d.ts.map