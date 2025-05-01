import { Request, Response, Router } from 'express';
import { FileService } from '../services/file_service';

export class ApiController {
    private router: Router;
    private fileService: FileService;

    constructor(fileService: FileService) {
        this.router = Router();
        this.fileService = fileService;
        this.setupRoutes();
    }

    /**
     * Configure les routes API
     */
    private setupRoutes(): void {
        // Upload endpoint
        this.router.post('/upload', this.fileService.getUploadMiddleware(), this.uploadFile.bind(this));

        // Download endpoint
        this.router.get('/download/:filename', this.downloadFile.bind(this));

        // List files endpoint
        this.router.get('/files', this.listFiles.bind(this));

        // Delete file endpoint
        this.router.delete('/files/:filename', this.deleteFile.bind(this));
    }

    /**
     * Endpoint pour téléverser un fichier
     */
    private async uploadFile(req: Request, res: Response): Promise<void> {
        try {
            const fileInfo = await this.fileService.processFileUpload(req);

            if (!fileInfo) {
                res.status(400).json({ error: 'No file uploaded' });
                return;
            }

            res.status(201).json({
                message: 'File uploaded successfully',
                file: fileInfo
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Error uploading file:', errorMessage);

            res.status(500).json({
                error: 'Server error during file processing',
                message: errorMessage
            });
        }
    }

    /**
     * Endpoint pour télécharger un fichier
     */
    private downloadFile(req: Request, res: Response): void {
        const { filename } = req.params;
        const filePath = this.fileService.getFilePath(filename);

        if (!filePath) {
            res.status(404).json({ error: 'File not found' });
            return;
        }

        const metadata = this.fileService.getFileMetadata(filename);

        if (metadata?.deleteOnDownload && metadata.deleteOnDownload === true) {
            setTimeout(() => {
                this.fileService.deleteFile(filename);
            }, 5000);
        }

        res.download(filePath);
    }

    /**
     * Endpoint pour lister tous les fichiers
     */
    private listFiles(req: Request, res: Response): void {
        const files = this.fileService.getFilesList();
        res.json(files);
    }

    /**
     * Retourne le routeur Express
     */
    public getRouter(): Router {
        return this.router;
    }

    private deleteFile(req: Request, res: Response): void {
        const { filename } = req.params;
        this.fileService.deleteFile(filename);
        res.status(204);
    }
} 