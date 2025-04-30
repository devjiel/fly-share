# Fly-Share

A local network file sharing application built with Node.js, Express, React, and Docker.

## Project Structure

```
fly-share/
├── backend/         # Express + TypeScript backend
├── frontend/        # React + TypeScript + Tailwind frontend
├── shared/          # Shared types and interfaces
└── docker/          # Docker configuration files
```

## Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose
- npm or yarn

## Development Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/fly-share.git
cd fly-share
```

2. Start the development environment:
```bash
docker-compose up
```

The application will be available at:
- Frontend: http://localhost:3001
- Backend API: http://localhost:4001

## Technical Overview

### Architecture

Fly-Share is built with a modern, modular architecture that separates concerns and promotes clean code practices:

```
fly-share/
├── backend/                 # Express.js backend
│   ├── src/
│   │   ├── exposition/      # Controllers for external interfaces
│   │   │   ├── api_controller.ts    # REST API endpoint handling
│   │   │   └── websocket_controller.ts  # WebSocket event handling
│   │   ├── services/
│   │   │   ├── storage_service.ts   # Low-level file storage operations
│   │   │   └── file_service.ts      # Business logic for file operations
│   │   └── index.ts         # Application entry point
│   ├── uploads/             # Directory for stored files
│   └── package.json         # Backend dependencies
│
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── FileDownloader.tsx  # File listing and download UI
│   │   │   └── FileUploader.tsx    # File upload UI 
│   │   ├── utils/           # Utility functions
│   │   └── App.tsx          # Main application component
│   └── package.json         # Frontend dependencies
│
└── shared/                  # Shared code between backend and frontend
    └── src/
        └── models/          # Shared type definitions
            ├── file.ts      # File interface definitions
            └── file_event.ts # Shared event type definitions
```

### Technical Design Choices

1. **Monorepo Structure**: The project uses a monorepo approach to keep related code in a single repository, simplifying dependency management and enabling code sharing between frontend and backend.

2. **TypeScript**: Both frontend and backend use TypeScript for type safety, better developer experience, and improved code quality.

3. **Shared Types**: Common type definitions and event constants are extracted into a shared package to ensure consistency between frontend and backend.

4. **Event-Driven Architecture**: The application uses a comprehensive event system:
   - Services emit events when operations occur (file uploads, processing, errors)
   - Controllers subscribe to these events and react accordingly
   - This creates a loosely coupled system where components communicate through events

5. **Layered Architecture**:
   - **Exposition Layer**: Controllers (API, WebSocket) handle external communication
   - **Service Layer**: Business logic and domain operations
   - **Storage Layer**: Low-level file system operations

6. **Real-time Updates with WebSockets**: The application uses Socket.IO to provide real-time updates for all file operations.

7. **File System Monitoring**: The backend utilizes Chokidar to watch for file system changes, enabling detection of files that might be added outside the application.

8. **Clean UI with Tailwind CSS**: The frontend uses Tailwind CSS for rapid UI development with a clean, modern aesthetic.

9. **Containerization**: Docker and Docker Compose are used for consistent development environments and simplified deployment.

### WebSocket Implementation

The application uses WebSockets to provide real-time updates to all connected clients:

1. **Connection Handling**: When a client connects, it immediately receives the current list of available files.

2. **File Operation Events**: The backend emits events for various file operations:
   - `FILES_CHANGED`: When the file list is updated

3. **File System Monitoring**: The storage service monitors the file system for changes and emits events when:
   - A new file is added
   - A file is deleted
   - A file is modified

4. **Event Broadcasting**: All connected clients receive real-time updates simultaneously, ensuring a consistent view for all users.

5. **Resilient Connections**: Socket.IO handles reconnection logic automatically, providing a robust experience even with unstable connections.

This real-time functionality creates a seamless user experience and ensures all users have up-to-date information without requiring manual page refreshes.

## License

MIT 