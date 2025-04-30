import { Request } from 'express';
import { FileInfo } from 'fly-share-api';
import { StorageService } from './storage_service';
import EventEmitter from 'events';

/**
 * Événements émis par le service de fichiers
 */
export enum FileProcessingEvent {
    PROCESSING_STARTED = 'file-processing-started',
    PROCESSING_COMPLETED = 'file-processing-completed',
    PROCESSING_ERROR = 'file-processing-error'
}

/**
 * Service de gestion des fichiers
 * Intermédiaire entre les contrôleurs API et le service de stockage
 */
export class FileService extends EventEmitter {
    private storageService: StorageService;

    constructor(storageService: StorageService) {
        super();
        this.storageService = storageService;
    }

    /**
     * Retourne le middleware pour le téléversement d'un seul fichier
     */
    public getUploadMiddleware() {
        return this.storageService.handleSingleFileUpload();
    }

    /**
     * Traite le téléversement d'un fichier
     * @param req Requête Express
     * @returns Informations sur le fichier téléversé ou null en cas d'erreur
     */
    public async processFileUpload(req: Request): Promise<FileInfo | null> {
        // Récupérer le nom original du fichier pour la notification
        const originalFilename = req.file?.originalname || 'Unknown file';

        // Émettre l'événement de début de traitement
        this.emit(FileProcessingEvent.PROCESSING_STARTED, { filename: originalFilename });

        try {
            // Vérifier que le fichier a bien été uploadé
            if (!req.file) {
                this.emit(FileProcessingEvent.PROCESSING_ERROR, {
                    filename: originalFilename,
                    error: 'No file uploaded'
                });
                return null;
            }

            // Vérifications supplémentaires pourraient être ajoutées ici:
            // - Validation du type de fichier
            // - Vérification de la taille
            // - Scan antivirus
            // - etc.

            // Récupérer les informations du fichier
            const fileInfo = this.storageService.getFileInfo(req);

            if (!fileInfo) {
                this.emit(FileProcessingEvent.PROCESSING_ERROR, {
                    filename: originalFilename,
                    error: 'Failed to process file information'
                });
                return null;
            }

            // Émettre l'événement de fin de traitement avec succès
            this.emit(FileProcessingEvent.PROCESSING_COMPLETED, {
                filename: originalFilename,
                fileInfo
            });

            return fileInfo;
        } catch (error) {
            // Gestion des erreurs
            const errorMessage = error instanceof Error ? error.message : 'Unknown error during file processing';
            this.emit(FileProcessingEvent.PROCESSING_ERROR, {
                filename: originalFilename,
                error: errorMessage
            });

            throw error; // Propager l'erreur pour la gestion dans le contrôleur
        }
    }

    /**
     * Récupère le chemin complet d'un fichier
     * @param filename Nom du fichier
     * @returns Chemin complet ou null si le fichier n'existe pas
     */
    public getFilePath(filename: string): string | null {
        return this.storageService.getFile(filename);
    }

    /**
     * Récupère la liste des fichiers disponibles
     * @returns Liste des fichiers
     */
    public getFilesList(): FileInfo[] {
        return this.storageService.getFiles();
    }
} 