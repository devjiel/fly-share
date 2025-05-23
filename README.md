# Fly-Share

A local network file sharing application built with Bun, Express, React.

## Project Structure

```
fly-share/
├── apps/
│   ├── backend/    # Express + TypeScript backend
│   ├── frontend/   # React + TypeScript + Tailwind frontend
│   └── shared/     # Shared types and interfaces
```

## Prerequisites

- Bun (v1.0 ou supérieur) : https://bun.sh/docs/installation

## Développement avec Bun

1. Clone le dépôt :
```bash
git clone https://github.com/yourusername/fly-share.git
cd fly-share
```

2. Installe les dépendances (à la racine) :
```bash
bun install
```

3. Lancer le backend en mode développement (hot reload natif Bun) :
```bash
bun run dev:backend
```

4. Lancer le frontend :
```bash
bun run dev:frontend
```

5. Builder la lib partagée :
```bash
bun run build:shared
```

## Development with Docker

Fly-Share can be easily run using Docker containers:

1. Start the complete application with Docker Compose:
```bash
docker-compose up
```

2. Or use the startup script for a better experience:
```bash
./start.sh
```

3. Access the applications:
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:4001

4. View logs in real-time:
```bash
docker-compose logs --follow
```

5. Stop the containers:
```bash
docker-compose down
```

The Docker setup uses Bun for all services (shared library, backend, and frontend), ensuring consistent runtime environments and fast performance.

## Scripts principaux

Les scripts principaux sont définis dans le package.json racine :
```json
"scripts": {
  "dev:backend": "bun run --cwd apps/backend dev",
  "build:backend": "bun run --cwd apps/backend build",
  "test:backend": "bun run --cwd apps/backend test",
  "dev:frontend": "bun run --cwd apps/frontend start",
  "build:frontend": "bun run --cwd apps/frontend build",
  "test:frontend": "bun run --cwd apps/frontend test",
  "build:shared": "bun run --cwd apps/shared build"
}
```

## Notes spécifiques Bun

- Bun gère les dépendances de tous les sous-projets via la configuration des workspaces dans `bunfig.toml` et le `package.json` racine.
- Utilise le hot reload natif de Bun pour le backend (`bun --hot run ...`).
- Les dépendances partagées sont installées à la racine.

## Pour le reste de la documentation technique

Le reste de la documentation (architecture, choix techniques, etc.) reste valable et décrit la structure et les principes du projet.

---

*Ce projet utilise désormais Bun pour une gestion plus rapide et moderne des dépendances et du développement monorepo.*

## Automatic File Cleanup

For ecological reasons, the application automatically deletes files after a specified period:

1. **Default Configuration**:
   - Files are automatically deleted after 12 hours
   - Cleanup occurs every 6 hours

2. **Ecological Optimization**:
   - The cleanup scheduler automatically stops when there are no files to save resources
   - The scheduler restarts automatically when new files are uploaded
   - This reduces unnecessary system resource usage when the system is idle

## Delete on Download Feature

Files can be configured to be automatically deleted after being downloaded once

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
│   │   ├── ports/           # Interfaces defining the contracts between layers
│   │   │   ├── events/      # Event definitions for different layers
│   │   │   │   └── file_storage_port_event.ts  # Storage-related events
│   │   │   └── file_storage_port.ts # Storage port interface
│   │   ├── infrastructure/  # Implementation of low-level interfaces
│   │   │   └── file_storage_adapter.ts # File system adapter
│   │   ├── services/        # Business logic layer
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

4. **Ports and Adapters Architecture**: The application implements a hexagonal architecture:
   - **Ports**: Define interfaces for different capabilities (file storage, events)
   - **Adapters**: Provide concrete implementations of these interfaces
   - This allows for easy substitution of implementations and better testability

5. **Automatic File Cleanup**: For ecological reasons, the system implements automatic deletion of old files:
   - **Decorator Pattern**: Uses composition to add file cleanup functionality to the storage adapter
   - **Configurable TTL**: Time-to-live settings for files can be configured (default: 24 hours)
   - **Scheduled Cleanup**: Periodically checks and removes expired files (default: every 6 hours)
   - **Resource Optimization**: Automatically pauses the cleanup scheduler when no files exist
   - **Event-Driven Activation**: Listens for file uploads to restart the scheduler when needed
   - **Event Notification**: Cleanup operations emit events that propagate through the system

6. **Clear Separation of Event Types**:
   - **FileEvent**: Client-facing events shared between frontend and backend
   - **FileStorageEvent**: Internal events for file system changes
   - **FileProcessingEvent**: Events related to file processing operations

7. **Event-Driven Architecture**: The application uses a comprehensive event system:
   - Infrastructure components emit low-level events (file added, deleted, updated)
   - Services translate these to domain events and add business logic
   - Controllers subscribe to domain events and communicate with clients
   - This creates a loosely coupled system where components interact through well-defined events

8. **Layered Architecture**:
   - **Exposition Layer**: Controllers (API, WebSocket) handle external communication
   - **Service Layer**: Business logic and domain operations
   - **Infrastructure Layer**: Low-level file system operations and adapters

9. **Real-time Updates with WebSockets**: The application uses Socket.IO to provide real-time updates for all file operations.

10. **File System Monitoring**: The backend utilizes Chokidar to watch for file system changes, enabling detection of files that might be added outside the application.

11. **Clean UI with Tailwind CSS**: The frontend uses Tailwind CSS for rapid UI development with a clean, modern aesthetic.

### WebSocket Implementation

The application uses WebSockets to provide real-time updates to all connected clients:

1. **Connection Handling**: When a client connects, it immediately receives the current list of available files.

2. **File Operation Events**: The backend emits events for various file operations:
   - `FILES_CHANGED`: When the file list is updated

3. **File System Monitoring**: The storage adapter monitors the file system for changes and emits events when:
   - A new file is added (`FILE_ADDED`)
   - A file is deleted (`FILE_DELETED`)
   - A file is modified (`FILE_UPDATED`)

4. **Event Translation**: The file service translates these low-level events into business domain events and provides methods for accessing file data.

5. **Event Broadcasting**: All connected clients receive real-time updates simultaneously, ensuring a consistent view for all users.

6. **Resilient Connections**: Socket.IO handles reconnection logic automatically, providing a robust experience even with unstable connections.

This real-time functionality creates a seamless user experience and ensures all users have up-to-date information without requiring manual page refreshes.

## License

MIT 