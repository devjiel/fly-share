export interface FileInfo {
    filename: string;
    displayName: string;
    size: number;
    url: string;
    mimetype: string;
    date: Date | string;
    deleteOnDownload: boolean;
    metadata?: Record<string, any>;
} 