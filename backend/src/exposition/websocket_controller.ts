import { Server, Socket } from 'socket.io';
import { FileEvent, FileInfo } from 'fly-share-api';
import { storageService, FileChangeEvent } from '../services/storage_service';

export class WebSocketController {
    private io: Server;

    constructor(io: Server) {
        this.io = io;
    }

    public init(): void {
        this.io.on('connection', this.handleConnection.bind(this));

        // Abonnement aux événements du service de stockage
        storageService.on(FileChangeEvent.ADDED, this.handleFileAdded.bind(this));
        storageService.on(FileChangeEvent.DELETED, this.handleFileDeleted.bind(this));
        storageService.on(FileChangeEvent.UPDATED, this.handleFileChanged.bind(this));
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
} 