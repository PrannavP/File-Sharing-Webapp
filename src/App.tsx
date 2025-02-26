import { useState } from "react";

interface UploadResponse {
    fileId: string;
}
import { useDropzone } from "react-dropzone";
import axios from "axios";

const App = () => {
	const [password, setPassword] = useState<string>('');
    const [fileId, setFileId] = useState<string>('');
    const [file, setFile] = useState<File | null>(null);
    const [downloadPassword, setDownloadPassword] = useState<string>('');

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
                'http://localhost:5000/api/upload',
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            setFileId(response.data.fileId);
        } catch (error) {
            alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const handleDownload = async () => {
        if (!fileId || !downloadPassword) return;

        try {
            const response = await axios.post(
                'http://localhost:5000/api/download',
                { fileId, password: downloadPassword },
                { responseType: 'blob' }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `decrypted_${fileId}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch {
            alert('Download failed: Invalid password or expired file');
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
            <div {...getRootProps()} style={dropzoneStyle}>
                <input {...getInputProps()} />
                {file ? file.name : 'Drag file here or click to select'}
            </div>

            <input
                type="password"
                placeholder="Encryption password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
            />

            <button onClick={handleUpload} style={buttonStyle}>
                Upload File
            </button>

            {fileId && (
                <div style={{ marginTop: '20px' }}>
                    <h3>File ID: {fileId}</h3>
                    <input
                        type="password"
                        placeholder="Enter password to download"
                        value={downloadPassword}
                        onChange={(e) => setDownloadPassword(e.target.value)}
                        style={inputStyle}
                    />
                    <button onClick={handleDownload} style={buttonStyle}>
                        Download File
                    </button>
                </div>
            )}
        </div>
    );
};

export default App;

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