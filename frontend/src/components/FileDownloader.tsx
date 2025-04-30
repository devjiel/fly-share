import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatFileSize } from '../utils/file_utils';
import { FileEvent, FileInfo } from 'fly-share-api';
import { io, Socket } from 'socket.io-client';

const FileDownloader: React.FC = () => {
    const [files, setFiles] = useState<FileInfo[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Connect to WebSocket server
        const socketInstance = io('http://localhost:4001');

        // Listen for file updates
        socketInstance.on(FileEvent.FILES_CHANGED, (updatedFiles: FileInfo[]) => {
            console.log('Received updated files via WebSocket:', updatedFiles);
            setFiles(updatedFiles);
        });

        // Initial fetch
        fetchFiles();

        // Cleanup on unmount
        return () => {
            socketInstance.disconnect();
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
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Available Files</h2>

            {loading && (
                <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            )}

            {error && (
                <div className="bg-red-100 text-red-700 p-4 rounded-md mb-4">
                    {error}
                </div>
            )}

            {!loading && files.length === 0 && !error && (
                <div className="text-center py-8 text-gray-500">
                    <p>No files available for download.</p>
                </div>
            )}

            {files.length > 0 && (
                <div className="mt-4">
                    <ul className="divide-y divide-gray-200">
                        {files.map((file) => (
                            <li key={file.filename} className="p-2 hover:bg-gray-50 transition cursor-pointer" onClick={() => handleDownload(file)}>
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate text-blue-600">
                                            {file.displayName}
                                        </p>
                                        {file.size > 0 && (
                                            <p className="text-sm text-gray-500">
                                                {formatFileSize(file.size)}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-400">
                                            {new Date(file.date).toLocaleString()}
                                        </p>
                                    </div>
                                    <button 
                                        className="ml-4 p-2 text-gray-400 hover:text-red-500 transition-colors"
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