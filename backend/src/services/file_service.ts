import { Request } from 'express';
import { FileEvent, FileInfo, FileProcessingEvent } from 'fly-share-api';
import EventEmitter from 'events';
import { FileStoragePort } from '../ports/file_storage_port';
import { FileStorageEvent } from '../ports/events/file_storage_port_event';
import { MetadataPort } from '../ports/metadata_port';
export class FileService {
    private storageAdapter: FileStoragePort;
    private metadataAdapter: MetadataPort;
    private eventEmitter: EventEmitter;

    constructor(storageAdapter: FileStoragePort, metadataAdapter: MetadataPort) {
        this.storageAdapter = storageAdapter;
        this.metadataAdapter = metadataAdapter;
        this.eventEmitter = new EventEmitter();

        this.setupInfrastructureEventListeners();
    }

    private setupInfrastructureEventListeners(): void {
        this.storageAdapter.on(FileStorageEvent.FILE_ADDED, (filename: string) => {
            this.eventEmitter.emit(FileEvent.FILES_CHANGED, filename);
        });

        this.storageAdapter.on(FileStorageEvent.FILE_DELETED, (filename: string) => {
            this.metadataAdapter.deleteMetadata(filename);
            this.eventEmitter.emit(FileEvent.FILES_CHANGED, filename);
        });

        this.storageAdapter.on(FileStorageEvent.FILE_UPDATED, (filename: string) => {

            const metadata = this.metadataAdapter.getMetadata(filename);
            if (!metadata) {
                this.emit(FileProcessingEvent.FILE_PROCESSING_ERROR, { filename: filename, error: 'Failed to get metadata' });
                return;
            }
            const updatedFileInfo = { ...metadata, deleteOnDownload: metadata?.deleteOnDownload || false };

            this.metadataAdapter.saveMetadata(filename, updatedFileInfo);
            this.eventEmitter.emit(FileEvent.FILES_CHANGED, filename);
        });
    }

    /**
     * Handle the upload of a single file
     * @param req Express request
     * @returns File information or null if there is an error
     */
    public async uploadFile(req: Request): Promise<FileInfo | null> {
        const originalFilename = req.file?.originalname || 'Unknown file';
        const deleteOnDownload = req.body.deleteOnDownload || false;

        this.emit(FileProcessingEvent.FILE_PROCESSING_STARTED, { filename: originalFilename });

        try {
            if (!req.file) {
                this.emit(FileProcessingEvent.FILE_PROCESSING_ERROR, { filename: originalFilename, error: 'No file uploaded' });
                return null;
            }

            const fileInfo = this.getFileInfo(req);

            if (!fileInfo) {
                this.emit(FileProcessingEvent.FILE_PROCESSING_ERROR, { filename: originalFilename, error: 'Failed to process file information' });
                return null;
            }

            const updatedFileInfo = { ...fileInfo, deleteOnDownload: deleteOnDownload === 'true' };

            this.metadataAdapter.saveMetadata(fileInfo.filename, updatedFileInfo);

            if (updatedFileInfo) {
                this.emit(FileProcessingEvent.FILE_PROCESSING_COMPLETED, { filename: originalFilename, fileInfo: updatedFileInfo });
                return updatedFileInfo;
            }

            this.emit(FileProcessingEvent.FILE_PROCESSING_COMPLETED, { filename: originalFilename, fileInfo });

            return fileInfo;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error during file processing';
            this.emit(FileProcessingEvent.FILE_PROCESSING_ERROR, { filename: originalFilename, error: errorMessage });

            throw error;
        }
    }

    public deleteOnDownload(filename: string): void {
        const fileInfo = this.metadataAdapter.getMetadata(filename);
        if (!fileInfo) {
            return;
        }

        if (fileInfo.deleteOnDownload) {
            this.deleteFile(filename);
        }
    }

    private getFileInfo(req: Request): FileInfo | null { // TODO: move to a service
        if (!req.file) {
            return null;
        }

        const fileInfo: FileInfo = {
            filename: req.file.filename,
            displayName: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
            url: `http://localhost:4001/download/${req.file.filename}`,
            date: new Date(),
            deleteOnDownload: req.body.deleteOnDownload || false
        };

        return fileInfo;
    }

    /**
     * Get the metadata of a file
     * @param filename File name
     * @returns File metadata or null if the file does not exist
     */
    public getFileMetadata(filename: string): FileInfo | null {
        return this.metadataAdapter.getMetadata(filename);
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
        return this.metadataAdapter.getMetadataList();
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

    private scheduleFileDeletion(filename: string, delayMs: number = 5000): void {
        setTimeout(() => {
            this.deleteFile(filename);
        }, delayMs);
    }
} 