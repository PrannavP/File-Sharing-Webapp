const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";

interface UploadResponse {
    fileId: string;
}

const App = () => {
    // Upload states
    const [password, setPassword] = useState<string>('');
    const [fileId, setFileId] = useState<string>('');
    const [file, setFile] = useState<File | null>(null);
    
    // Download states
    const [enteredFileId, setEnteredFileId] = useState<string>('');
    const [downloadPassword, setDownloadPassword] = useState<string>('');
    const [downloadError, setDownloadError] = useState<string>('');
    const [isDownloading, setIsDownloading] = useState<boolean>(false);

    const { getRootProps, getInputProps } = useDropzone({
        onDrop: (acceptedFiles: File[]) => {
            setFile(acceptedFiles[0]);
        }
    });

    const handleUpload = async () => {
        if (!file) {
            alert('Please select a file first');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('password', password);

        try {
            const response = await axios.post<UploadResponse>(
                `${API_BASE}/api/upload`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            setFileId(response.data.fileId);
            alert(`File uploaded successfully! Share this ID: ${response.data.fileId}`);
        } catch (error) {
            alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const handleDownload = async () => {
        if (!enteredFileId || !downloadPassword) {
            setDownloadError('Please enter both File ID and Password');
            return;
        }
    
        setIsDownloading(true);
        setDownloadError('');
    
        try {
            const response = await axios.post(
                import.meta.env.VITE_API_BASE + '/api/download',
                { fileId: enteredFileId, password: downloadPassword },
                {
                    responseType: 'blob',
                    transformResponse: [(data, headers) => {
                        // Preserve MIME type from headers
                        return new Blob([data], { 
                            type: headers['content-type'] 
                        });
                    }]
                }
            );
    
            // Extract filename from headers
            const contentDisposition = response.headers['content-disposition'];
            let fileName = `file-${Date.now()}`;
            
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename="?(.+?)"?(;|$)/);
                if (fileNameMatch && fileNameMatch[1]) {
                    fileName = fileNameMatch[1];
                }
            }
    
            // Create download link
            const url = window.URL.createObjectURL(response.data);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            
            // Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(link);
            
            // Reset form
            setEnteredFileId('');
            setDownloadPassword('');
    
        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response) {
                switch (error.response.status) {
                    case 401:
                        setDownloadError('Invalid password');
                        break;
                    case 404:
                        setDownloadError('File not found');
                        break;
                    default:
                        setDownloadError('Download failed. Please try again.');
                }
            } else {
                setDownloadError('Network error. Check your connection.');
            }
        } 
        finally {
            setIsDownloading(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
            {/* Upload Section */}
            <div style={{ marginBottom: '40px', padding: '20px', border: '1px solid #eee' }}>
                <h2>Upload File</h2>
                <div {...getRootProps()} style={dropzoneStyle}>
                    <input {...getInputProps()} />
                    {file ? file.name : 'Drag file here or click to select'}
                </div>

                <input
                    type="password"
                    placeholder="Set encryption password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={inputStyle}
                />

                <button onClick={handleUpload} style={buttonStyle}>
                    Upload File
                </button>

                {fileId && (
                    <div style={{ marginTop: '20px', color: '#666' }}>
                        <p>Share this File ID: <strong>{fileId}</strong></p>
                        <p>Password: <strong>{password}</strong></p>
                    </div>
                )}
            </div>

            {/* Download Section */}
            <div style={{ padding: '20px', border: '1px solid #eee' }}>
                <h2>Download File</h2>
                <input
                    type="text"
                    placeholder="Enter File ID"
                    value={enteredFileId}
                    onChange={(e) => setEnteredFileId(e.target.value)}
                    style={inputStyle}
                />
                <input
                    type="password"
                    placeholder="Enter password"
                    value={downloadPassword}
                    onChange={(e) => setDownloadPassword(e.target.value)}
                    style={inputStyle}
                />
                <button onClick={handleDownload} style={buttonStyle}>
                    Download File
                </button>
                {downloadError && <p style={{ color: 'red', marginTop: '10px' }}>{downloadError}</p>}
            </div>
        </div>
    );
};

const dropzoneStyle: React.CSSProperties = {
    border: '2px dashed #cccccc',
    borderRadius: '4px',
    padding: '20px',
    textAlign: 'center',
    margin: '20px 0',
    cursor: 'pointer'
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px',
    margin: '10px 0',
    border: '1px solid #ddd',
    borderRadius: '4px'
};

const buttonStyle: React.CSSProperties = {
    backgroundColor: '#007bff',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    width: '100%'
};

export default App;