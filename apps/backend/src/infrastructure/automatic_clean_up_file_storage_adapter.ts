import EventEmitter from 'events';
import fs from 'fs';
import path, { dirname } from 'path';
import { Request } from 'express';
import { FileInfo } from 'fly-share-api';
import { FileStoragePort } from '../ports/file_storage_port.js';
import { FileStorageEvent } from '../ports/events/file_storage_port_event.js';
import { FileStorageAdapter } from './file_storage_adapter.js';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Default lifetime of files in milliseconds (12 hours)
const DEFAULT_FILE_TTL = 12 * 60 * 60 * 1000; // TODO: use dotenv
// Default cleanup interval in milliseconds (6 hours)
const DEFAULT_CLEANUP_INTERVAL = 6 * 60 * 60 * 1000; // TODO: use dotenv

export class AutomaticCleanUpFileStorageAdapter extends EventEmitter implements FileStoragePort {
    private fileStorage: FileStorageAdapter;
    private cleanupInterval: NodeJS.Timeout | null = null;
    private fileTTL: number;
    private schedulerInterval: number;
    private isSchedulerActive: boolean = false;

    constructor(
        fileTTL: number = DEFAULT_FILE_TTL,
        cleanupInterval: number = DEFAULT_CLEANUP_INTERVAL
    ) {
        super();
        this.fileStorage = new FileStorageAdapter();
        this.fileTTL = fileTTL;
        this.schedulerInterval = cleanupInterval;

        this.forwardEvents();

        this.on(FileStorageEvent.FILE_ADDED, this.handleFileAdded.bind(this));

        this.checkAndManageScheduler();
    }

    private forwardEvents() {
        [FileStorageEvent.FILE_ADDED, FileStorageEvent.FILE_DELETED, FileStorageEvent.FILE_UPDATED].forEach(event => {
            this.fileStorage.on(event, (filename: string) => {
                this.emit(event, filename);
            });
        });
    }

    private handleFileAdded(filename: string) {
        if (!this.isSchedulerActive) {
            console.log('New file detected, restarting cleanup scheduler');
            this.startCleanupScheduler(this.schedulerInterval);
        }
    }

    private checkAndManageScheduler() {
        const files = this.getFiles();
        if (files.length > 0 && !this.isSchedulerActive) {
            // Files exist but scheduler is not active, start it
            this.startCleanupScheduler(this.schedulerInterval);
        } else if (files.length === 0 && this.isSchedulerActive) {
            // No files but scheduler is active, stop it
            this.stopCleanupScheduler();
        }
    }

    private startCleanupScheduler(interval: number) {
        if (this.isSchedulerActive) {
            return; // Already active
        }

        console.log(`Starting file cleanup scheduler with interval: ${interval}ms`);
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpiredFiles();
        }, interval);
        this.isSchedulerActive = true;
    }

    private stopCleanupScheduler() {
        if (!this.isSchedulerActive) {
            return; // Already stopped
        }

        console.log('Stopping cleanup scheduler as no files exist');
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.isSchedulerActive = false;
    }

    public cleanupExpiredFiles(): number {
        console.log('Running file cleanup process...');
        const now = Date.now();
        let deletedCount = 0;

        try {
            // Utiliser getFiles au lieu d'accéder directement au dossier
            const allFiles = this.getFiles();

            for (const file of allFiles) {
                const fileDate = file.date;
                const fileAge = now - fileDate.getTime();

                if (fileAge > this.fileTTL) {
                    console.log(`Deleting expired file: ${file.filename} (age: ${fileAge}ms)`);
                    this.fileStorage.deleteFile(file.filename);
                    deletedCount++;
                }
            }

            console.log(`Cleanup complete. Deleted ${deletedCount} expired files.`);

            // Check if we need to stop the scheduler after cleanup
            if (this.getFiles().length === 0) {
                this.stopCleanupScheduler();
            }

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

    public getCleanupSchedulerStatus(): boolean {
        return this.isSchedulerActive;
    }

    public forceStartScheduler(): void {
        this.startCleanupScheduler(this.schedulerInterval);
    }

    public forceStopScheduler(): void {
        this.stopCleanupScheduler();
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

    private getFiles(): any[] {
        return fs.readdirSync(this.fileStorage.getUploadDir()).map(file => {
            const filePath = path.join(this.fileStorage.getUploadDir(), file);
            const stats = fs.statSync(filePath);
            return {
                filename: file,
                date: stats.birthtime,
            };
        });
    }

    public getFile(filename: string): string | null {
        return this.fileStorage.getFile(filename);
    }

    public saveFile(filename: string, file: File): void {
        this.fileStorage.saveFile(filename, file);
    }

    public deleteFile(filename: string): void {
        this.fileStorage.deleteFile(filename);

        // Check if this was the last file and manage scheduler accordingly
        setTimeout(() => this.checkAndManageScheduler(), 100);
    }

} 