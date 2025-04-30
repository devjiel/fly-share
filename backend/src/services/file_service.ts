import { Request } from 'express';
import { FileEvent, FileInfo, FileProcessingEvent } from 'fly-share-api';
import EventEmitter from 'events';
import { FileStoragePort } from '../ports/file_storage_port';
import { FileStorageEvent } from '../ports/events/file_storage_port_event';

export class FileService {
    private storageAdapter: FileStoragePort;
    private eventEmitter: EventEmitter;

    constructor(storageAdapter: FileStoragePort) {
        this.storageAdapter = storageAdapter;
        this.eventEmitter = new EventEmitter();

        this.setupInfrastructureEventListeners();
    }

    private setupInfrastructureEventListeners(): void {
        this.storageAdapter.on(FileStorageEvent.FILE_ADDED, (filename: string) => {
            this.eventEmitter.emit(FileEvent.FILES_CHANGED, filename);
        });

        this.storageAdapter.on(FileStorageEvent.FILE_DELETED, (filename: string) => {
            this.eventEmitter.emit(FileEvent.FILES_CHANGED, filename);
        });

        this.storageAdapter.on(FileStorageEvent.FILE_UPDATED, (filename: string) => {
            this.eventEmitter.emit(FileEvent.FILES_CHANGED, filename);
        });
    }

    /**
     * Handle the upload of a single file
     * @param req Express request
     * @returns File information or null if there is an error
     */
    public async processFileUpload(req: Request): Promise<FileInfo | null> {
        const originalFilename = req.file?.originalname || 'Unknown file';

        this.emit(FileProcessingEvent.FILE_PROCESSING_STARTED, { filename: originalFilename });

        try {            // Vérifier que le fichier a bien été uploadé
            if (!req.file) {
                this.emit(FileProcessingEvent.FILE_PROCESSING_ERROR, { filename: originalFilename, error: 'No file uploaded' });
                return null;
            }

            const fileInfo = this.storageAdapter.getFileInfo(req);

            if (!fileInfo) {
                this.emit(FileProcessingEvent.FILE_PROCESSING_ERROR, { filename: originalFilename, error: 'Failed to process file information' });
                return null;
            }

            this.emit(FileProcessingEvent.FILE_PROCESSING_COMPLETED, { filename: originalFilename, fileInfo });

            return fileInfo;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error during file processing';
            this.emit(FileProcessingEvent.FILE_PROCESSING_ERROR, { filename: originalFilename, error: errorMessage });

            throw error;
        }
    }

    /**
     * Get the full path of a file
     * @param filename File name
     * @returns Full path or null if the file does not exist
     */
    public getFilePath(filename: string): string | null {
        return this.storageAdapter.getFile(filename);
    }

    /**
     * Get the list of available files
     * @returns List of files
     */
    public getFilesList(): FileInfo[] {
        return this.storageAdapter.getFiles();
    }

    public deleteFile(filename: string): void {
        this.storageAdapter.deleteFile(filename);
    }

    public onFileSystemEvent(event: FileEvent, listener: (filename: string) => void): void {
        this.eventEmitter.on(event, listener);
    }

    public onFileProcessingEvent(
        event: FileProcessingEvent,
        listener: (data: { filename: string, fileInfo?: FileInfo, error?: string }) => void
    ): void {
        this.eventEmitter.on(event, listener);
    }

    private emit(event: FileProcessingEvent, data: { filename: string, fileInfo?: FileInfo, error?: string }): void {
        this.eventEmitter.emit(event, data);
    }

    public getUploadMiddleware() {
        return this.storageAdapter.handleSingleFileUpload();
    }

    public closeWatcher(): void {
        this.storageAdapter.closeWatcher();
    }
} 