import { Response } from 'express';
export declare const uploadMiddleware: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const generateAssetTag: () => Promise<string>;
export declare const createAsset: (req: any, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getAssets: (req: any, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getAssetById: (req: any, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateAsset: (req: any, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const retireAsset: (req: any, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=assetController.d.ts.map