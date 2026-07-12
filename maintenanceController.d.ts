import multer from 'multer';
import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare const uploadMiddleware: multer.Multer;
export declare const createMaintenanceRequest: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const approveMaintenance: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const rejectMaintenance: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const resolveMaintenance: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getMaintenanceRequests: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=maintenanceController.d.ts.map