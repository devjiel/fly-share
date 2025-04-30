import React, { useState, useRef, ChangeEvent } from 'react';
import axios from 'axios';

interface UploadedFile {
    filename: string;
    path: string;
    size: number;
    mimetype: string;
}

const FileUploader: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
            setUploadedFile(null);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setError(null);
            setUploadedFile(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError("Please select a file");
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post('http://localhost:4001/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(progress);
                    }
                }
            });

            setUploadedFile(response.data.file);
            setFile(null);

            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) {
                setError(err.response.data.error || "Error uploading file");
            } else {
                setError("Server connection error");
            }
        } finally {
            setIsUploading(false);
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Upload a file</h2>

            <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                />

                {file ? (
                    <div className="py-2">
                        <p className="text-blue-600 font-medium">{file.name}</p>
                        <p className="text-gray-500 text-sm mt-1">{formatFileSize(file.size)}</p>
                    </div>
                ) : (
                    <div>
                        <p className="text-gray-500">Drag and drop your file here or click to select</p>
                        <p className="text-gray-400 text-sm mt-1">Share your files on your local network</p>
                    </div>
                )}
            </div>

            {file && (
                <div className="mt-4">
                    <button
                        onClick={handleUpload}
                        disabled={isUploading}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300 transition w-full"
                    >
                        {isUploading ? 'Uploading...' : 'Upload'}
                    </button>
                </div>
            )}

            {isUploading && (
                <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{ width: `${uploadProgress}%` }}
                        ></div>
                    </div>
                    <p className="text-center text-sm text-gray-500 mt-2">{uploadProgress}%</p>
                </div>
            )}

            {error && (
                <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
                    {error}
                </div>
            )}

            {uploadedFile && (
                <div className="mt-4 p-4 bg-green-50 rounded-md">
                    <h3 className="text-green-700 font-medium">File uploaded successfully!</h3>
                    <div className="mt-2">
                        <p className="text-sm"><span className="font-medium">Name:</span> {uploadedFile.filename}</p>
                        <p className="text-sm"><span className="font-medium">Size:</span> {formatFileSize(uploadedFile.size)}</p>
                        <p className="text-sm"><span className="font-medium">Type:</span> {uploadedFile.mimetype}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileUploader; 