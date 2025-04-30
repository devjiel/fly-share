import { Request, Response, Router } from 'express';
import { StorageService } from '../services/storage_service';

export class ApiController {
    private router: Router;
    private storageService: StorageService;

    constructor(storageService: StorageService) {
        this.router = Router();
        this.storageService = storageService;
        this.setupRoutes();
    }

    /**
     * Configure les routes API
     */
    private setupRoutes(): void {
        // Upload endpoint
        this.router.post('/upload', this.storageService.handleSingleFileUpload(), this.uploadFile.bind(this));

        // Download endpoint
        this.router.get('/download/:filename', this.downloadFile.bind(this));

        // List files endpoint
        this.router.get('/files', this.listFiles.bind(this));
    }

    /**
     * Endpoint pour téléverser un fichier
     */
    private uploadFile(req: Request, res: Response): void {
        const fileInfo = this.storageService.getFileInfo(req);

        if (!fileInfo) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        res.status(201).json({
            message: 'File uploaded successfully',
            file: fileInfo
        });
    }

    /**
     * Endpoint pour télécharger un fichier
     */
    private downloadFile(req: Request, res: Response): void {
        const { filename } = req.params;
        const filePath = this.storageService.getFile(filename);

        if (!filePath) {
            res.status(404).json({ error: 'File not found' });
            return;
        }

        res.download(filePath);
    }

    /**
     * Endpoint pour lister tous les fichiers
     */
    private listFiles(req: Request, res: Response): void {
        const files = this.storageService.getFiles();
        res.json(files);
    }

    /**
     * Retourne le routeur Express
     */
    public getRouter(): Router {
        return this.router;
    }
} 