import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatFileSize } from '../utils/file_utils';
import { FileItem } from '../models/files';


const FileDownloader: React.FC = () => {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:4001/files');
            const fileNames = response.data;

            // Transform file names into FileItem objects
            const fileItems: FileItem[] = fileNames.map((filename: string) => {
                return {
                    filename: filename.split('-').slice(2).join('-'), // Remove unique prefix to show original filename
                    size: 0, // Size will be shown as 0 since we don't have it from the API
                    url: `http://localhost:4001/download/${filename}`
                };
            });

            setFiles(fileItems);
            setError(null);
        } catch (error) {
            console.error('Error fetching files:', error);
            setError('Failed to load files. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = (url: string, filename: string) => {
        // Create a temporary link element
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                    <p className="text-sm mt-2">Upload some files first!</p>
                </div>
            )}

            {files.length > 0 && (
                <div className="mt-4">
                    <ul className="divide-y divide-gray-200">
                        {files.map((file, index) => (
                            <li key={index} className="py-3 hover:bg-gray-50 transition">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {file.filename}
                                        </p>
                                        {file.size > 0 && (
                                            <p className="text-sm text-gray-500">
                                                {formatFileSize(file.size)}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleDownload(file.url, file.filename)}
                                        className="ml-4 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        Download
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-4 text-center">
                        <button
                            onClick={fetchFiles}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                            Refresh list
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileDownloader;