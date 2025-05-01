export interface FileInfo {
    filename: string;
    displayName: string;
    size: number;
    url: string;
    mimetype: string;
    date: Date;
    metadata?: Record<string, any>;
} 