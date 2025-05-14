import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { FileInfo } from 'fly-share-api';
import * as chokidar from 'chokidar';
import EventEmitter from 'events';
import { FileStoragePort } from '../ports/file_storage_port.js';
import { FileStorageEvent } from '../ports/events/file_storage_port_event.js';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const UPLOAD_DIR = path.join(__dirname, '../../uploads');

export class FileStorageAdapter extends EventEmitter implements FileStoragePort {
    private watcher: chokidar.FSWatcher | null = null;
    private uploadDir: string;
    private storage: multer.StorageEngine;
    private upload: multer.Multer;

    constructor(uploadDir: string = UPLOAD_DIR) {
        super();
        this.uploadDir = uploadDir;

        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
        // Capture uploadDir in a local variable to use in callbacks
        const dirPath = this.uploadDir;

        this.storage = multer.diskStorage({
            destination: function (_: Express.Request, __: Express.Multer.File, cb: Function) {
                cb(null, dirPath);
            },
            filename: function (_: Express.Request, file: Express.Multer.File, cb: Function) {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                cb(null, uniqueSuffix + '-' + file.originalname);
            }
        });

        this.upload = multer({ storage: this.storage });

        this.initializeWatcher();
    }

    private initializeWatcher() {
        console.log(`Initializing file watcher for directory: ${this.uploadDir}`);
        this.watcher = chokidar.watch(this.uploadDir, {
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
        return multer({ storage: this.storage }).single('file');
    }

    public getFile(filename: string): string | null {
        const filePath = path.join(this.uploadDir, filename);
        if (!fs.existsSync(filePath)) {
            return null;
        }

        return filePath;
    }

    public async saveFile(filename: string, file: File): Promise<void> {
        const filePath = path.join(this.uploadDir, filename);
        const buffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(filePath, buffer);

        this.emit(FileStorageEvent.FILE_ADDED, filename);
    }

    public deleteFile(filename: string): void {
        const filePath = path.join(this.uploadDir, filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }

    public getUploadDir(): string {
        return this.uploadDir;
    }
}

// Singleton
export const fileStorageAdapter = new FileStorageAdapter(); 