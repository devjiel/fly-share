import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { WebSocketController } from './exposition/websocket_controller.js';
import { ApiController } from './exposition/api_controller.js';
import { FileService } from './services/file_service.js';
import { AutomaticCleanUpFileStorageAdapter } from './infrastructure/automatic_clean_up_file_storage_adapter.js';
import { MetadataLowdbAdapter } from './infrastructure/metadata_lowdb_adapter.js';

const app = express();
const port = process.env.PORT || 4001;

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

const storageAdapter = new AutomaticCleanUpFileStorageAdapter();
const metadataAdapter = new MetadataLowdbAdapter();
const fileService = new FileService(storageAdapter, metadataAdapter);

const webSocketController = new WebSocketController(io, fileService);
webSocketController.init();

const apiController = new ApiController(fileService);
app.use('/', apiController.getRouter());

// Expose io instance
export { io };

// Start server
httpServer.listen(port, () => {
  console.log(`Server is running on port ${port}`);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('Shutting down server...');
    fileService.closeWatcher();
    httpServer.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
}); 