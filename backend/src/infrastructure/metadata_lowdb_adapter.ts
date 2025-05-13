import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { MetadataPort } from '../ports/metadata_port.js';
import * as path from 'path';
import * as fs from 'fs';
import { FileInfo } from 'fly-share-api';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

// Define the database schema
type FileMetadataDB = {
    files: Record<string, Record<string, any>>;
}

const METADATA_FILE = path.join(__dirname, '../../metadata/db.json');

export class MetadataLowdbAdapter implements MetadataPort {

    private db: Low<FileMetadataDB> = {} as Low<FileMetadataDB>;
    private metadataFile: string;
    constructor(metadataFile: string = METADATA_FILE) {
        this.metadataFile = metadataFile;

        // Ensure metadata directory exists
        const metadataDir = path.dirname(this.metadataFile);
        if (!fs.existsSync(metadataDir)) {
            fs.mkdirSync(metadataDir, { recursive: true });
            console.log(`Created metadata directory: ${metadataDir}`);
        }

        // Initialize lowdb
        this.initializeDB().catch(err => {
            console.error('Error initializing database:', err);
        });
    }

    private async initializeDB() {
        // Initialize lowdb with JSONFile adapter
        const adapter = new JSONFile<FileMetadataDB>(this.metadataFile);
        this.db = new Low<FileMetadataDB>(adapter, { files: {} });

        // Read data from JSON file
        await this.db.read();

        // If db.data is null, set default data
        if (this.db.data === null) {
            this.db.data = { files: {} };
            await this.db.write();
        }
    }

    /**
     * Get metadata for a file
     * @param filename File name
     * @returns Metadata for the file or null if no metadata exists
     */
    public getMetadata(filename: string): FileInfo | null {
        if (!this.db.data || !this.db.data.files[filename]) {
            return null;
        }

        const metadata = this.db.data.files[filename] as FileInfo;

        // Convertir la date de string en objet Date si nécessaire
        if (metadata.date && typeof metadata.date === 'string') {
            return {
                ...metadata,
                date: new Date(metadata.date)
            } as FileInfo;
        }

        return metadata;
    }

    /**
     * Get the list of all metadata
     * @returns List of all metadata
     */
    public getMetadataList(): FileInfo[] {
        if (!this.db.data) {
            return [];
        }

        return Object.entries(this.db.data.files).map(([filename, metadata]) => {
            return {
                filename,
                displayName: metadata.displayName || filename.split('-').slice(2).join('-') || filename,
                size: metadata.size || 0,
                url: `http://localhost:4001/download/${filename}`,
                mimetype: metadata.mimetype || 'application/octet-stream',
                date: metadata.date ? new Date(metadata.date) : new Date(),
                deleteOnDownload: metadata.deleteOnDownload || false,
            };
        });
    }

    /**
     * Save metadata for a file
     * @param filename File name
     * @param metadata Metadata to save
     */
    public async saveMetadata(filename: string, metadata: FileInfo): Promise<void> {
        try {
            if (!this.db.data) {
                this.db.data = { files: {} };
            }

            // Convertir la date en string pour le stockage
            const metadataToStore = {
                ...metadata,
                date: metadata.date instanceof Date
                    ? metadata.date.toISOString()
                    : metadata.date
            };

            this.db.data.files[filename] = metadataToStore;
            await this.db.write();
        } catch (error) {
            console.error(`Error saving metadata for ${filename}:`, error);
        }
    }

    /**
     * Delete metadata for a file
     * @param filename File name
     */
    public async deleteMetadata(filename: string): Promise<void> {
        try {
            if (this.db.data && this.db.data.files[filename]) {
                delete this.db.data.files[filename];
                await this.db.write();
            }
        } catch (error) {
            console.error(`Error deleting metadata for ${filename}:`, error);
        }
    }
}

// Singleton instance
export const metadataLowdbAdapter = new MetadataLowdbAdapter();