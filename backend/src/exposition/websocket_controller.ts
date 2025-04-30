import { Server, Socket } from 'socket.io';
import { FileInfo, FileEvent } from 'fly-share-api';
import { storageService, FileChangeEvent } from '../services/storage_service';
import { FileService, FileProcessingEvent } from '../services/file_service';

export class WebSocketController {
    private io: Server;
    private fileService: FileService;

    constructor(io: Server, fileService: FileService) {
        this.io = io;
        this.fileService = fileService;
    }

    public init(): void {
        this.io.on('connection', this.handleConnection.bind(this));

        // Subscribe to storage events
        storageService.on(FileChangeEvent.ADDED, this.handleFileAdded.bind(this));
        storageService.on(FileChangeEvent.DELETED, this.handleFileDeleted.bind(this));
        storageService.on(FileChangeEvent.UPDATED, this.handleFileChanged.bind(this));

        // Subscribe to file processing events
        this.fileService.on(FileProcessingEvent.PROCESSING_STARTED, this.handleFileProcessingStarted.bind(this));
        this.fileService.on(FileProcessingEvent.PROCESSING_COMPLETED, this.handleFileProcessingCompleted.bind(this));
        this.fileService.on(FileProcessingEvent.PROCESSING_ERROR, this.handleFileProcessingError.bind(this));
    }

    /**
     * Handle a new client connection
     */
    private handleConnection(socket: Socket): void {
        console.log('Client connected:', socket.id);

        // Send initial files list to the new client
        this.sendFilesList(socket);

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    }

    /**
     * Send the list of files to a specific client
     */
    private sendFilesList(socket: Socket): void {
        const files = storageService.getFiles();
        socket.emit(FileEvent.FILES_CHANGED, files);
    }

    /**
     * Notify all clients when the list of files changes
     */
    private broadcastFilesList(): void {
        const files = storageService.getFiles();
        this.io.emit(FileEvent.FILES_CHANGED, files);
    }

    /**
     * Handle file added event
     */
    private handleFileAdded(filename: string): void {
        console.log(`WebSocketService: File added notification: ${filename}`);
        this.broadcastFilesList();
    }

    /**
     * Handle file deleted event
     */
    private handleFileDeleted(filename: string): void {
        console.log(`WebSocketService: File deleted notification: ${filename}`);
        this.broadcastFilesList();
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
        this.io.emit('file-processing-started', data);
    }

    /**
     * Handle file processing completed event
     */
    private handleFileProcessingCompleted(data: { filename: string, fileInfo: FileInfo }): void {
        console.log(`WebSocketService: File processing completed: ${data.filename}`);
        this.io.emit('file-processing-completed', data);
    }

    /**
     * Handle file processing error event
     */
    private handleFileProcessingError(data: { filename: string, error: string }): void {
        console.log(`WebSocketService: File processing error: ${data.filename}, Error: ${data.error}`);
        this.io.emit('file-processing-error', data);
    }
} 