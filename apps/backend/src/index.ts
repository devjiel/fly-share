import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { WebSocketController } from './exposition/websocket_controller.js';
import { FileService } from './services/file_service.js';
import { AutomaticCleanUpFileStorageAdapter } from './infrastructure/automatic_clean_up_file_storage_adapter.js';
import { MetadataLowdbAdapter } from './infrastructure/metadata_lowdb_adapter.js';
import { createBunWebSocket } from 'hono/bun'
import type { ServerWebSocket } from 'bun'
import fs from 'fs';

const app = new Hono();
const port = parseInt(process.env.PORT || '4001', 10);

const { upgradeWebSocket, websocket } =
  createBunWebSocket<ServerWebSocket>()

// Initialize services
const storageAdapter = new AutomaticCleanUpFileStorageAdapter();
const metadataAdapter = new MetadataLowdbAdapter();
const fileService = new FileService(storageAdapter, metadataAdapter);

// Middleware
app.use('*', cors());
app.use('*', logger());

// API Routes
// Utilise directement le service avec la nouvelle interface
app.post('/upload', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const deleteOnDownload = formData.get('deleteOnDownload') as string;

    if (!file) {
      return c.json({ error: 'No file uploaded' }, 400);
    }

    const fileInfo = await fileService.uploadFile(file, deleteOnDownload === 'true');

    if (!fileInfo) {
      return c.json({ error: 'File processing failed' }, 400);
    }

    return c.json({
      message: 'File uploaded successfully',
      file: fileInfo
    }, 201);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error uploading file:', errorMessage);

    return c.json({
      error: 'Server error during file processing',
      message: errorMessage
    }, 500);
  }
});

app.get('/download/:filename', async (c) => {
  try {
    const filename = c.req.param('filename');
    const filePath = fileService.getFilePath(filename);

    if (!filePath) {
      return c.json({ error: 'File not found' }, 404);
    }

    // Get file metadata to determine content type
    const fileInfo = fileService.getFileMetadata(filename);

    // Create a stream from the file
    const fileStream = fs.createReadStream(filePath);

    // Create response with appropriate headers
    const response = new Response(fileStream as any, {
      headers: {
        'Content-Type': fileInfo?.mimetype || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileInfo?.displayName || filename}"`,
      }
    });

    // Delete the file after its content has been processed for the response
    response.clone().arrayBuffer()
      .then(() => {
        console.log(`Response body for ${filename} processed by server, checking if delete is needed`);
        fileService.deleteOnDownload(filename);
      })
      .catch(err => {
        console.error(`Error during server-side processing of response body or in deletion task for ${filename}:`, err);
      });

    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error downloading file:', errorMessage);

    return c.json({
      error: 'Server error during file download',
      message: errorMessage
    }, 500);
  }
});

app.get('/files', (c) => {
  const files = fileService.getFilesList();
  return c.json(files);
});

app.delete('/files/:filename', (c) => {
  const filename = c.req.param('filename');
  fileService.deleteFile(filename);
  return new Response(null, { status: 204 });
});

app.get(
  '/ws',
  upgradeWebSocket((c) => {
    return {
      onOpen(evt, ws) {
        console.log('Socket connection opened')
        const rawWs = ws.raw as ServerWebSocket;
        rawWs.subscribe('file');
        // Setup WebSocket controller
        const webSocketController = new WebSocketController(server, fileService);
        webSocketController.init();
      },
      onClose: (_, ws) => {
        const rawWs = ws.raw as ServerWebSocket;
        rawWs.unsubscribe('file');
        console.log('Socket connection closed')
      },
    }
  })
)

// Start server
const server = Bun.serve({
  fetch: app.fetch,
  port,
  websocket
});

export default app;

console.log(`Hono server is running on port ${port}`);
console.log(`Socket.IO server is running on port ${port + 1}`);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  fileService.closeWatcher();
  server.stop();
  // TODO websocket.close(test);
}); 