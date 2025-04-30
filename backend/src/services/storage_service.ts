import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { FileInfo } from 'fly-share-api';
import * as chokidar from 'chokidar';
import EventEmitter from 'events';

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

// File change events
export enum FileChangeEvent {
    ADDED = 'added',
    DELETED = 'deleted',
    UPDATED = 'updated',
    FILES_CHANGED = 'files-changed'
}

export class StorageService extends EventEmitter {
    private watcher: chokidar.FSWatcher | null = null;

    constructor() {
        super();
        this.initializeWatcher();
    }

    private initializeWatcher() {
        console.log(`Initializing file watcher for directory: ${UPLOAD_DIR}`);
        this.watcher = chokidar.watch(UPLOAD_DIR, {
            ignored: /(^|[\/\\])\../, // ignore dotfiles
            persistent: true,
            awaitWriteFinish: true
        });

        this.watcher
            .on('add', (filepath: string) => {
                console.log(`File ${filepath} has been added`);
                const filename = this.getFilenameFromPath(filepath);
                this.emit(FileChangeEvent.ADDED, filename);
            })
            .on('unlink', (filepath: string) => {
                console.log(`File ${filepath} has been removed`);
                const filename = this.getFilenameFromPath(filepath);
                this.emit(FileChangeEvent.DELETED, filename);
            })
            .on('change', (filepath: string) => {
                console.log(`File ${filepath} has been changed`);
                const filename = this.getFilenameFromPath(filepath);
                this.emit(FileChangeEvent.UPDATED, filename);
            })
            .on('ready', () => {
                console.log('Initial scan complete. Ready for changes.');
            })
            .on('error', (error: unknown) => {
                console.error(`Watcher error: ${error}`);
            });
    }

    private getFilenameFromPath(filePath: string): string {
        return path.basename(filePath);
    }

    /**
     * Close file watcher
     */
    public closeWatcher() {
        if (this.watcher) {
            this.watcher.close();
            this.watcher = null;
        }
    }

    /**
     * Single file upload
     * @param fieldName Name of the form field
     */
    public handleSingleFileUpload() {
        return upload.single('file');
    }

    /**
     * Get uploaded file info
     * @param req Express request with the file
     */
    public getFileInfo(req: Request): FileInfo | null {
        if (!req.file) {
            return null;
        }

        return {
            filename: req.file.filename,
            displayName: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
            url: `http://localhost:4001/download/${req.file.filename}`,
            date: new Date()
        };
    }

    /**
     * Get all files
     */
    public getFiles(): FileInfo[] {
        try {
            const files = fs.readdirSync(UPLOAD_DIR);
            return files.map(file => {
                const filePath = path.join(UPLOAD_DIR, file);
                const stats = fs.statSync(filePath);

                return {
                    filename: file,
                    displayName: file.split('-').slice(2).join('-') || file,
                    size: stats.size,
                    url: `http://localhost:4001/download/${file}`, // TODO: do not use hardcoded url
                    mimetype: 'application/octet-stream',
                    date: stats.birthtime
                };
            });
        } catch (error) {
            console.error('Error reading directory:', error);
            return [];
        }
    }

    /**
     * Get file
     * @param filename Name of the file
     */
    public getFile(filename: string) {
        const filePath = path.join(UPLOAD_DIR, filename);
        if (!fs.existsSync(filePath)) {
            return null;
        }

        return filePath;
    }
}

export const storageService = new StorageService();
