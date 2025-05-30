import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatFileSize } from '../utils/file_utils';
import { FileEvent, FileInfo } from 'fly-share-api';


const FileDownloader: React.FC = () => {
    const [files, setFiles] = useState<FileInfo[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Connect to WebSocket server
        const socket = new WebSocket('ws://localhost:4001/ws');

        socket.onopen = (event) => {
            console.log('WebSocket client opened', event);
        };

        // Listen for file updates

        socket.onmessage = (event) => {
            console.log('WebSocket client received message:', event);
            const message = JSON.parse(event.data);
            if (message.event === FileEvent.FILES_CHANGED) {
                setFiles(message.data);
            }
        };


        // Initial fetch
        fetchFiles();

        // Cleanup on unmount
        return () => {
            socket.close();
        };
    }, []);

    const fetchFiles = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:4001/files');
            const files = response.data;

            console.log('Initial files loaded:', files);
            setFiles(files);
            setError(null);
        } catch (error) {
            console.error('Error fetching files:', error);
            setError('Failed to load files. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (file: FileInfo) => {
        try {

            const response = await axios.get(
                file.url,
                {
                    responseType: 'blob'
                }
            );

            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', file.displayName || file.filename);
            document.body.appendChild(link);
            link.click();

            window.URL.revokeObjectURL(url);
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error downloading file:', error);
            setError('Failed to download file. Please try again later.');
        }
    };

    const handleDelete = async (filename: string) => {
        try {
            await axios.delete(`http://localhost:4001/files/${filename}`);
            fetchFiles();
        } catch (error) {
            console.error('Error deleting file:', error);
            setError('Failed to delete file. Please try again later.');
        }
    };

    return (
        <div className="rounded-lg shadow-md p-6 border border-dark-border">
            <h2 className="text-xl font-semibold mb-4 text-dark-text">Available Files</h2>

            {loading && (
                <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dark-accent"></div>
                </div>
            )}

            {error && (
                <div className="bg-red-900/20 text-red-400 p-4 rounded-md mb-4 border border-red-900/50">
                    {error}
                </div>
            )}

            {!loading && files.length === 0 && !error && (
                <div className="text-center py-8 text-dark-muted">
                    <p>No files available for download.</p>
                </div>
            )}

            {files.length > 0 && (
                <div className="mt-4">
                    <ul className="divide-y divide-dark-border">
                        {files.map((file) => (
                            <li key={file.filename} className="p-4 hover:bg-dark-secondary rounded-lg transition cursor-pointer" onClick={() => handleDownload(file)}>
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm hyperlink truncate">
                                            {file.displayName}
                                        </p>
                                        <p className="pt-1 text-xs text-dark-muted">
                                            {new Date(file.date).toLocaleString()} - {formatFileSize(file.size)}
                                        </p>
                                    </div>
                                    <button
                                        className="ml-4 p-2 text-dark-muted hover:text-red-400 transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(file.filename);
                                        }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default FileDownloader;