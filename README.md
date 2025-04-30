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
│   │   │   └── websocket_controller.ts  # WebSocket event handling
│   │   ├── services/
│   │   │   └── storage_service.ts       # File storage operations
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
            └── file.ts      # File interface definitions
```

### Technical Design Choices

1. **Monorepo Structure**: The project uses a monorepo approach to keep related code in a single repository, simplifying dependency management and enabling code sharing between frontend and backend.

2. **TypeScript**: Both frontend and backend use TypeScript for type safety, better developer experience, and improved code quality.

3. **Shared Types**: Common type definitions are extracted into a shared package to ensure consistency between frontend and backend.

4. **Real-time Updates with WebSockets**: The application uses Socket.IO to provide real-time updates when files are added, modified, or deleted.

5. **File System Monitoring**: The backend utilizes Chokidar to watch for file system changes, enabling detection of files that might be added outside the application.

6. **Event-Driven Architecture**: The storage service emits events when file changes occur, which are then picked up by the WebSocket controller to notify connected clients.

7. **Clean UI with Tailwind CSS**: The frontend uses Tailwind CSS for rapid UI development with a clean, modern aesthetic.

8. **Containerization**: Docker and Docker Compose are used for consistent development environments and simplified deployment.

### WebSocket Implementation

The application uses WebSockets to provide real-time updates to all connected clients:

1. **Connection Handling**: When a client connects, it immediately receives the current list of available files.

2. **File Change Notifications**: The backend monitors the file system for changes and broadcasts updates to all connected clients when:
   - A new file is uploaded
   - A file is deleted
   - A file is modified

3. **Event Broadcasting**: All connected clients receive the same updated file list simultaneously, ensuring a consistent view for all users.

4. **Resilient Connections**: Socket.IO handles reconnection logic automatically, providing a robust experience even with unstable connections.

This real-time functionality creates a seamless user experience and ensures all users have up-to-date information without requiring manual page refreshes.

## License

MIT 