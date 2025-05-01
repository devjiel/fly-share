import { FileInfo } from 'fly-share-api';
import { Request } from 'express';
import { EventEmitter } from 'events';

export interface FileStoragePort extends EventEmitter {
    /**
     * Get the middleware for uploading a single file
     */
    handleSingleFileUpload(): any;

    /**
     * Get the information about a uploaded file
     * @param req Express request containing the file
     */
    getFileInfo(req: Request): FileInfo | null;

    /**
     * Get the path of a file
     * @param filename File name
     */
    getFile(filename: string): string | null;

    /**
     * Get the list of all files
     */
    getFiles(): FileInfo[];

    /**
     * Fermer le watcher de fichiers
     */
    closeWatcher(): void;

    /**
     * Delete a file
     * @param filename File name
     */
    deleteFile(filename: string): void;

    /**
     * Update file metadata
     * @param filename File name
     * @param metadata Metadata to update or add
     * @returns Updated file info or null if file doesn't exist
     */
    updateFileMetadata(filename: string, metadata: Record<string, any>): FileInfo | null;
} 