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
const METADATA_DIR = path.join(__dirname, '../../metadata');

export class FileStorageAdapter extends EventEmitter implements FileStoragePort {
    private watcher: chokidar.FSWatcher | null = null;
    private uploadDir: string;
    private metadataDir: string;
    private storage: multer.StorageEngine;
    private upload: multer.Multer;

    constructor(uploadDir: string = UPLOAD_DIR, metadataDir: string = METADATA_DIR) {
        super();
        this.uploadDir = uploadDir;
        this.metadataDir = metadataDir;
        
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
        
        if (!fs.existsSync(this.metadataDir)) {
            fs.mkdirSync(this.metadataDir, { recursive: true });
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

    public getFileInfo(req: Request): FileInfo | null { // TODO: move to a service
        if (!req.file) {
            return null;
        }

        const fileInfo: FileInfo = {
            filename: req.file.filename,
            displayName: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
            url: `http://localhost:4001/download/${req.file.filename}`,
            date: new Date()
        };

        // Load metadata if exists
        const metadata = this.getMetadata(req.file.filename);
        if (metadata) {
            fileInfo.metadata = metadata;
        }

        return fileInfo;
    }

    public getFiles(): FileInfo[] {
        try {
            const files = fs.readdirSync(this.uploadDir);
            return files.map(file => {
                const filePath = path.join(this.uploadDir, file);
                const stats = fs.statSync(filePath);
                
                const fileInfo: FileInfo = {
                    filename: file,
                    displayName: file.split('-').slice(2).join('-') || file,
                    size: stats.size,
                    url: `http://localhost:4001/download/${file}`,
                    mimetype: 'application/octet-stream',
                    date: stats.birthtime
                };

                // Load metadata if exists
                const metadata = this.getMetadata(file);
                if (metadata) {
                    fileInfo.metadata = metadata;
                }

                return fileInfo;
            });
        } catch (error) {
            console.error('Error reading directory:', error);
            return [];
        }
    }
    public getFile(filename: string): string | null {
        const filePath = path.join(this.uploadDir, filename);
        if (!fs.existsSync(filePath)) {
            return null;
        }

        return filePath;
    }

    public deleteFile(filename: string): void {
        const filePath = path.join(this.uploadDir, filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
    
    /**
     * Update metadata for a specific file
     * @param filename The filename to update metadata for
     * @param metadata The metadata to update or add
     * @returns Updated FileInfo or null if file doesn't exist
     */
    public updateFileMetadata(filename: string, metadata: Record<string, any>): FileInfo | null {
        const filePath = path.join(this.uploadDir, filename);
        if (!fs.existsSync(filePath)) {
            return null;
        }

        // Get existing metadata or initialize empty object
        const existingMetadata = this.getMetadata(filename) || {};
        
        // Merge with new metadata
        const updatedMetadata = { ...existingMetadata, ...metadata };
        
        // Save merged metadata
        this.saveMetadata(filename, updatedMetadata);
        
        // Emit file updated event
        this.emit(FileStorageEvent.FILE_UPDATED, filename);
        
        // Return updated file info
        const stats = fs.statSync(filePath);
        return {
            filename,
            displayName: filename.split('-').slice(2).join('-') || filename,
            size: stats.size,
            url: `http://localhost:4001/download/${filename}`,
            mimetype: 'application/octet-stream',
            date: stats.birthtime,
            metadata: updatedMetadata
        };
    }
    
    /**
     * Get metadata for a file
     * @param filename File name
     * @returns Metadata for the file or null if no metadata exists
     */
    private getMetadata(filename: string): Record<string, any> | null {
        const metadataPath = path.join(this.metadataDir, `${filename}.json`);
        if (!fs.existsSync(metadataPath)) {
            return null;
        }
        
        try {
            const metadataContent = fs.readFileSync(metadataPath, 'utf8');
            return JSON.parse(metadataContent);
        } catch (error) {
            console.error(`Error reading metadata for ${filename}:`, error);
            return null;
        }
    }
    
    /**
     * Save metadata for a file
     * @param filename File name
     * @param metadata Metadata to save
     */
    private saveMetadata(filename: string, metadata: Record<string, any>): void {
        const metadataPath = path.join(this.metadataDir, `${filename}.json`);
        try {
            fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
        } catch (error) {
            console.error(`Error saving metadata for ${filename}:`, error);
        }
    }
    
    public getUploadDir(): string {
        return this.uploadDir;
    }
}

// Singleton
export const fileStorageAdapter = new FileStorageAdapter(); 