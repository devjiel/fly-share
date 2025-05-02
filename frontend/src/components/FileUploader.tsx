import React, { useState, useRef, ChangeEvent } from 'react';
import axios from 'axios';
import { formatFileSize } from '../utils/file_utils';
import toast, { Toaster } from 'react-hot-toast';
import { Button } from "./ui/button"


const FileUploader: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);
    const [deleteOnDownload, setDeleteOnDownload] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError("No file selected");
            return;
        }
        setIsUploading(true);
        setUploadProgress(0);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('deleteOnDownload', deleteOnDownload.toString());
        try {
            await axios.post('http://localhost:4001/upload', formData, {
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

            toast.success('File sent successfully', {
                duration: 2500,
                position: 'top-right',
                style: {
                    background: '#4ade80',
                    color: '#fff'
                }
            });

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

    return (
        <div className="bg-dark-card rounded-lg shadow-md p-6 border border-dark-border">
            <Toaster />
            <h2 className="text-xl font-semibold mb-4 text-dark-text">Upload a file</h2>

            <div
                className="border-2 border-dashed border-dark-border rounded-lg p-8 text-center cursor-pointer hover:bg-dark-secondary transition"
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
                        <p className="text-sm hyperlink truncate">{file.name}</p>
                        <p className="text-dark-muted text-sm mt-1">{formatFileSize(file.size)}</p>
                    </div>
                ) : (
                    <div>
                        <p className="text-dark-muted">Drag and drop your file here or click to select</p>
                    </div>
                )}
            </div>

            {isUploading && (
                <div className="mt-4">
                    <div className="w-full bg-dark-secondary rounded-full h-2.5">
                        <div
                            className="bg-dark-accent h-2.5 rounded-full"
                            style={{ width: `${uploadProgress}%` }}
                        ></div>
                    </div>
                    <p className="text-center text-sm text-dark-muted mt-2">{uploadProgress}%</p>
                </div>
            )}

            {file && (
                <div className="mt-4 flex justify-end items-center">
                    <label className="flex items-center cursor-pointer">
                        <span className="mr-4 text-dark-muted">Delete on download</span>
                        <div className="relative">
                            <input
                                type="checkbox"
                                className="sr-only"
                                checked={deleteOnDownload}
                                onChange={(e) => setDeleteOnDownload(e.target.checked)}
                            />
                            <div className={`w-11 h-6 bg-dark-secondary rounded-full shadow-inner transition-colors duration-300 ease-in-out ${deleteOnDownload ? 'bg-dark-accent' : 'bg-dark-secondary'}`}></div>
                            <div
                                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-dark-text rounded-full shadow transform transition-transform duration-300 ease-in-out ${deleteOnDownload ? 'translate-x-5' : ''}`}
                            ></div>
                        </div>
                    </label>
                    <div className="w-4" />
                    <Button variant="outline" onClick={() => handleUpload()}>
                        Upload
                    </Button>
                </div>
            )}

            {error && (
                <div className="mt-4 p-3 bg-red-900/20 text-red-400 rounded border border-red-900/50">
                    {error}
                </div>
            )}
        </div>
    );
};

export default FileUploader; 