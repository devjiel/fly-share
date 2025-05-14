import { FileInfo } from "fly-share-api";

export interface MetadataPort {
    getMetadata(filename: string): FileInfo | null;
    getMetadataList(): FileInfo[];
    saveMetadata(filename: string, metadata: FileInfo): Promise<void>;
    deleteMetadata(filename: string): Promise<void>;
}
