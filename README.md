# Fly-Share

A local network file sharing application built with Node.js, Express, React, and Docker.

## Project Structure

```
fly-share/
├── backend/         # Express + TypeScript backend
├── frontend/        # React + TypeScript + Tailwind frontend
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

## Features

- Local network file sharing
- Modern React frontend with Tailwind CSS
- TypeScript support for both frontend and backend
- Containerized development environment

## License

MIT 