import { FileInfo } from 'fly-share-api';
import { Request } from 'express';
import { EventEmitter } from 'events';

export interface FileStoragePort extends EventEmitter {
    /**
     * Get the middleware for uploading a single file
     */
    handleSingleFileUpload(): any;

    /**
     * Get the path of a file
     * @param filename File name
     */
    getFile(filename: string): string | null;

    /**
     * Close the watcher of files
     */
    closeWatcher(): void;

    /**
     * Save a file
     * @param filename File name
     * @param file File
     */
    saveFile(filename: string, file: File): void;

    /**
     * Delete a file
     * @param filename File name
     */
    deleteFile(filename: string): void;
} 