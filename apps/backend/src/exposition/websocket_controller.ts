
import { FileInfo, FileProcessingEvent, FileEvent } from 'fly-share-api';
import { FileService } from '../services/file_service.js';
import { Server } from 'bun';

/**
 * WebSocket controller for real-time communication
 */
export class WebSocketController {
    private server: Server;
    private fileService: FileService;
    private topic: string = 'file';

    constructor(server: Server, fileService: FileService) {
        this.server = server;
        this.fileService = fileService;
    }

    /**
     * Initialize the WebSocket controller
     */
    public init(): void {
        this.sendFilesList();

        // Subscribe to file system events
        this.fileService.onFileSystemEvent(FileEvent.FILES_CHANGED, this.handleFileChanged.bind(this));

        // Subscribe to file processing events
        this.fileService.onFileProcessingEvent(
            FileProcessingEvent.FILE_PROCESSING_STARTED,
            this.handleFileProcessingStarted.bind(this)
        );
        this.fileService.onFileProcessingEvent(
            FileProcessingEvent.FILE_PROCESSING_COMPLETED,
            this.handleFileProcessingCompleted.bind(this)
        );
        this.fileService.onFileProcessingEvent(
            FileProcessingEvent.FILE_PROCESSING_ERROR,
            this.handleFileProcessingError.bind(this)
        );
    }

    /**
     * Send the file list to a specific client
     */
    private sendFilesList(): void {
        const files = this.fileService.getFilesList();
        const message = {
            event: FileEvent.FILES_CHANGED,
            data: files
        }
        this.server.publish(this.topic, JSON.stringify(message));
    }

    /**
     * Notify all clients when the file list changes
     */
    private broadcastFilesList(): void {
        const files = this.fileService.getFilesList();
        const message = {
            event: FileEvent.FILES_CHANGED,
            data: files
        }
        this.server.publish(this.topic, JSON.stringify(message));
    }

    /**
     * Handle file changed event
     */
    private handleFileChanged(filename: string): void {
        console.log(`WebSocketService: File changed notification: ${filename}`);
        this.broadcastFilesList();
    }

    /**
     * Handle file processing started event
     */
    private handleFileProcessingStarted(data: { filename: string }): void {
        console.log(`WebSocketService: File processing started: ${data.filename}`);
        const message = {
            event: FileProcessingEvent.FILE_PROCESSING_STARTED,
            data: data
        }
        this.server.publish(this.topic, JSON.stringify(message));
    }

    /**
     * Handle file processing completed event
     */
    private handleFileProcessingCompleted(data: { filename: string; fileInfo?: FileInfo }): void {
        if (!data.fileInfo) {
            console.log(`WebSocketService: File processing completed without fileInfo: ${data.filename}`);
            return;
        }

        console.log(`WebSocketService: File processing completed: ${data.filename}`);
        const message = {
            event: FileProcessingEvent.FILE_PROCESSING_COMPLETED,
            data: data
        }
        this.server.publish(this.topic, JSON.stringify(message));

        // Broadcast updated file list
        this.broadcastFilesList();
    }

    /**
     * Handle file processing error event
     */
    private handleFileProcessingError(data: { filename: string; error?: string }): void {
        console.log(`WebSocketService: File processing error: ${data.filename}, Error: ${data.error || 'Unknown error'}`);
        const message = {
            event: FileProcessingEvent.FILE_PROCESSING_ERROR,
            data: data
        }
        this.server.publish(this.topic, JSON.stringify(message));
    }
} 