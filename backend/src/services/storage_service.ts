import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

const UPLOAD_DIR = path.join(__dirname, '../../uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req: Express.Request, file: Express.Multer.File, cb: Function) {
        cb(null, UPLOAD_DIR);
    },
    filename: function (req: Express.Request, file: Express.Multer.File, cb: Function) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ storage });

export interface FileResponse {
    filename: string;
    path: string;
    size: number;
    mimetype: string;
}

export class StorageService {
    /**
     * Middleware for single file upload
     * @param fieldName Name of the form field
     */
    public handleSingleFileUpload() {
        return upload.single('file');
    }

    /**
     * Get uploaded file info
     * @param req Express request with the file
     */
    public getFileInfo(req: Request): FileResponse | null {
        if (!req.file) {
            return null;
        }

        return {
            filename: req.file.filename,
            path: req.file.path,
            size: req.file.size,
            mimetype: req.file.mimetype
        };
    }
}

export const storageService = new StorageService();
