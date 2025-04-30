import { Server, Socket } from 'socket.io';
import { FileInfo, FileProcessingEvent, FileEvent } from 'fly-share-api';
import { FileService } from '../services/file_service';

/**
 * WebSocket controller for real-time communication
 */
export class WebSocketController {
    private io: Server;
    private fileService: FileService;

    constructor(io: Server, fileService: FileService) {
        this.io = io;
        this.fileService = fileService;
    }

    /**
     * Initialize the WebSocket controller
     */
    public init(): void {
        this.io.on('connection', this.handleConnection.bind(this));

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
     * Handle new client connection
     */
    private handleConnection(socket: Socket): void {
        console.log('Client connected:', socket.id);

        // Send initial file list to the new client
        this.sendFilesList(socket);

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    }

    /**
     * Send the file list to a specific client
     */
    private sendFilesList(socket: Socket): void {
        const files = this.fileService.getFilesList();
        socket.emit(FileEvent.FILES_CHANGED, files);
    }

    /**
     * Notify all clients when the file list changes
     */
    private broadcastFilesList(): void {
        const files = this.fileService.getFilesList();
        this.io.emit(FileEvent.FILES_CHANGED, files);
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
        this.io.emit(FileProcessingEvent.FILE_PROCESSING_STARTED, data);
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
        this.io.emit(FileProcessingEvent.FILE_PROCESSING_COMPLETED, data);

        // Broadcast updated file list
        this.broadcastFilesList();
    }

    /**
     * Handle file processing error event
     */
    private handleFileProcessingError(data: { filename: string; error?: string }): void {
        console.log(`WebSocketService: File processing error: ${data.filename}, Error: ${data.error || 'Unknown error'}`);
        this.io.emit(FileProcessingEvent.FILE_PROCESSING_ERROR, data);
    }
} 