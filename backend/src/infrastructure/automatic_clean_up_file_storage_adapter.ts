import EventEmitter from 'events';
import fs from 'fs';
import path from 'path';
import { Request } from 'express';
import { FileInfo } from 'fly-share-api';
import { FileStoragePort } from '../ports/file_storage_port';
import { FileStorageEvent } from '../ports/events/file_storage_port_event';
import { FileStorageAdapter } from './file_storage_adapter';

// Default lifetime of files in milliseconds (24 hours)
const DEFAULT_FILE_TTL = 24 * 60 * 60 * 1000;
// Default cleanup interval in milliseconds (6 hours)
const DEFAULT_CLEANUP_INTERVAL = 6 * 60 * 60 * 1000;

export class AutomaticCleanUpFileStorageAdapter extends EventEmitter implements FileStoragePort {
    private fileStorage: FileStorageAdapter;
    private cleanupInterval: NodeJS.Timeout | null = null;
    private fileTTL: number;
    
    constructor(
        fileTTL: number = DEFAULT_FILE_TTL, 
        cleanupInterval: number = DEFAULT_CLEANUP_INTERVAL
    ) {
        super();
        this.fileStorage = new FileStorageAdapter();
        this.fileTTL = fileTTL;
        
        // Forward events from decorated object
        this.forwardEvents();
        
        // Start cleanup scheduler
        this.startCleanupScheduler(cleanupInterval);
    }

    private forwardEvents() {
        // Forward all events from the wrapped fileStorage to this decorator
        [FileStorageEvent.FILE_ADDED, FileStorageEvent.FILE_DELETED, FileStorageEvent.FILE_UPDATED].forEach(event => {
            this.fileStorage.on(event, (filename: string) => {
                this.emit(event, filename);
            });
        });
    }

    private startCleanupScheduler(interval: number) {
        console.log(`Starting file cleanup scheduler with interval: ${interval}ms`);
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpiredFiles();
        }, interval);
    }

    public cleanupExpiredFiles(): number {
        console.log('Running file cleanup process...');
        const now = Date.now();
        let deletedCount = 0;
        
        try {
            // Utiliser getFiles au lieu d'accéder directement au dossier
            const allFiles = this.fileStorage.getFiles();
            
            for (const fileInfo of allFiles) {
                const fileDate = fileInfo.date;
                const fileAge = now - fileDate.getTime();
                
                if (fileAge > this.fileTTL) {
                    console.log(`Deleting expired file: ${fileInfo.filename} (age: ${fileAge}ms)`);
                    this.fileStorage.deleteFile(fileInfo.filename);
                    deletedCount++;
                    // The deleteFile method will trigger the FILE_DELETED event from the wrapped adapter
                }
            }
            
            console.log(`Cleanup complete. Deleted ${deletedCount} expired files.`);
            return deletedCount;
        } catch (error) {
            console.error('Error during file cleanup:', error);
            return 0;
        }
    }

    public setFileTTL(ttl: number) {
        this.fileTTL = ttl;
    }

    public getFileTTL(): number {
        return this.fileTTL;
    }

    // Delegate methods to decorated object
    public closeWatcher() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.fileStorage.closeWatcher();
    }

    public handleSingleFileUpload() {
        return this.fileStorage.handleSingleFileUpload();
    }

    public getFileInfo(req: Request): FileInfo | null {
        return this.fileStorage.getFileInfo(req);
    }

    public getFiles(): FileInfo[] {
        return this.fileStorage.getFiles();
    }

    public getFile(filename: string): string | null {
        return this.fileStorage.getFile(filename);
    }

    public deleteFile(filename: string): void {
        this.fileStorage.deleteFile(filename);
    }
} 