import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { FileInfo } from 'fly-share-api';
import * as chokidar from 'chokidar';
import EventEmitter from 'events';
import { FileStoragePort } from '../ports/file_storage_port';
import { FileStorageEvent } from '../ports/events/file_storage_port_event';

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

export class FileStorageAdapter extends EventEmitter implements FileStoragePort {
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
                this.emit(FileStorageEvent.FILE_ADDED, filename);
            })
            .on('unlink', (filepath: string) => {
                console.log(`File ${filepath} has been removed`);
                const filename = this.getFilenameFromPath(filepath);
                this.emit(FileStorageEvent.FILE_DELETED, filename);
            })
            .on('change', (filepath: string) => {
                console.log(`File ${filepath} has been changed`);
                const filename = this.getFilenameFromPath(filepath);
                this.emit(FileStorageEvent.FILE_UPDATED, filename);
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

    public closeWatcher() {
        if (this.watcher) {
            this.watcher.close();
            this.watcher = null;
        }
    }

    public handleSingleFileUpload() {
        return upload.single('file');
    }

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
                    url: `http://localhost:4001/download/${file}`,
                    mimetype: 'application/octet-stream',
                    date: stats.birthtime
                };
            });
        } catch (error) {
            console.error('Error reading directory:', error);
            return [];
        }
    }
    public getFile(filename: string): string | null {
        const filePath = path.join(UPLOAD_DIR, filename);
        if (!fs.existsSync(filePath)) {
            return null;
        }

        return filePath;
    }

    public deleteFile(filename: string): void {
        const filePath = path.join(UPLOAD_DIR, filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
}

// Singleton
export const fileStorageAdapter = new FileStorageAdapter(); 