import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare const getAssetUtilization: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getBookingHeatmap: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const exportAssetReportCSV: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=reportController.d.ts.map