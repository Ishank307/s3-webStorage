import { useState ,useEffect} from 'react'
import './App.css'
import axios from 'axios'


const API_BASE_URL = 'http://localhost:8000/api';


const api=axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '', 
  withCredentials:true,
})

function HelpSection() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="help-section">
      <button 
        className="help-toggle" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? '📖 Hide Setup Guide' : '❓ Need Help Getting AWS Keys?'}
      </button>
      
      {isExpanded && (
        <div className="help-content">
          <h3>🚀 Quick AWS Setup Guide</h3>
          
          <div className="help-step">
            <h4>Step 1: Create AWS Account</h4>
            <p>Go to <a href="https://aws.amazon.com" target="_blank" rel="noopener noreferrer">aws.amazon.com</a> and sign up for a free account</p>
          </div>

          <div className="help-step">
            <h4>Step 2: Create S3 Bucket</h4>
            <ol>
              <li>Go to AWS Console → S3</li>
              <li>Click "Create bucket"</li>
              <li>Choose a unique bucket name</li>
              <li>Select your region (remember this!)</li>
              <li>Click "Create bucket"</li>
            </ol>
          </div>

          <div className="help-step">
            <h4>Step 3: Get Access Keys</h4>
            <ol>
              <li>Go to AWS Console → IAM</li>
              <li>Click "Users" → "Create user"</li>
              <li>Enter username → Next</li>
              <li>Select "Attach policies directly"</li>
              <li>Search and select "AmazonS3FullAccess"</li>
              <li>Click "Create user"</li>
              <li>Click on your new user → "Security credentials"</li>
              <li>Click "Create access key" → "Application running outside AWS"</li>
              <li>Copy your Access Key ID and Secret Access Key</li>
            </ol>
          </div>

          <div className="help-step">
            <h4>Step 4: Fill the Form Above</h4>
            <ul>
              <li><strong>Bucket Name:</strong> Your S3 bucket name</li>
              <li><strong>Region:</strong> Where you created the bucket (e.g., us-east-1, ap-south-1)</li>
              <li><strong>Access Key ID:</strong> From Step 3</li>
              <li><strong>Secret Access Key:</strong> From Step 3</li>
            </ul>
          </div>

          <div className="help-warning">
            <p>⚠️ <strong>Security Note:</strong> Never share your AWS keys publicly. This app stores them securely in your session only.</p>
          </div>
        </div>
      )}
    </div>
  );
}


function ConnectionForm({onConnection,connecting,message}){
  const[config,setConfig]=useState({
    accessKeyId:'',
    secretAccessKey:'',
    region:'ap-south-1',
    bucketName:'',
  })

   const handleChange = (e) => {
    setConfig({ ...config, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onConnection(config);
  };

    return (
    <>
      <div className="card connection-form">
        <h2>Connect to Your S3 Bucket</h2>
        <form onSubmit={handleSubmit}>
          <input name="bucketName" value={config.bucketName} onChange={handleChange} placeholder="Bucket Name" required />
          <input name="region" value={config.region} onChange={handleChange} placeholder="AWS Region (e.g., us-east-1)" required />
          <input name="accessKeyId" value={config.accessKeyId} onChange={handleChange} placeholder="AWS Access Key ID" type="password" required />
          <input name="secretAccessKey" value={config.secretAccessKey} onChange={handleChange} placeholder="AWS Secret Access Key" type="password" required />
          <button type="submit" disabled={connecting}>
            {connecting ? 'Connecting...' : 'Connect to S3'}
          </button>
          {message && <p className="message">{message}</p>}
        </form>
      </div>
      <HelpSection />
    </>
  );

};


function FileManager(){
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message,setMessage]=useState('');
  const [fileList,setFileList]=useState([]);
  const [isLoadingFiles,setIsLoadingFiles]=useState(true);

  const fetchFiles = async () => {
    try {
      const response = await api.get('/api/list-files');
      setFileList(response.data);
    } catch (error) {
      console.error('Error fetching files:', error);
      setMessage('Could not fetch file list.');
    } finally {
      setIsLoadingFiles(false);
    }
  };


  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFileChange = (e) => setSelectedFile(e.target.files[0]);


  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setMessage('Getting upload URL...');

    try {
      const response = await api.get('/api/generate-upload-url', {
        params: { fileName: selectedFile.name, contentType: selectedFile.type },
      });
      const { uploadUrl } = response.data;
      setMessage('Uploading file...');

      await axios.put(uploadUrl, selectedFile, { headers: { 'Content-Type': selectedFile.type } });
      setMessage('✅ File uploaded successfully!');
      setSelectedFile(null);
      document.getElementById('file-input').value = null;
      fetchFiles();
    } catch (error) {
      setMessage('❌ File upload failed.');
    } finally {
      setUploading(false);
    }
  };


     const handleDelete = async (fileKey) => {
    if (!window.confirm("Are you sure you want to delete this file?")) {
      return;
    }

    try {
      setMessage('Deleting file...');
      await api.delete(`/api/delete-file/${encodeURIComponent(fileKey)}`)
      setMessage('file deleted succesfully')
      fetchFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      setMessage('❌ Failed to delete file.');
    }
  };

 return (
    <>
      <div className="card upload-section">
        <h2>Upload a New File</h2>
        <input id="file-input" type="file" onChange={handleFileChange} />
        <button onClick={handleUpload} disabled={uploading || !selectedFile}>
          {uploading ? 'Uploading...' : 'Upload to S3'}
        </button>
        {message && <p className="message">{message}</p>}
      </div>
      <div className="card file-list-section">
        <h2>Uploaded Files</h2>
        {isLoadingFiles ? <p>Loading files...</p> : (
          <ul>
            {fileList.length > 0 ? fileList.map(file => (
              <li key={file.key}>
                <a href={file.url} target="_blank" rel="noopener noreferrer">{file.key.split('/').pop()}</a>
                <div className="file-actions">
                  <span>({(file.size / 1024).toFixed(2)} KB)</span>
                  <button className="delete-btn" onClick={() => handleDelete(file.key)}>
                    Delete
                  </button>
                </div>
              </li>
            )) : <p>No files found.</p>}
          </ul>
        )}
      </div>
    </>
  );
}


function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState('');

const handleConnect = async (config) => {
    setIsConnecting(true);
    setConnectionMessage('');
    try {
      const response = await api.post('/api/connect', config);
      setConnectionMessage(response.data.message);
      setIsConnected(true);
    } catch (error) {
      setConnectionMessage(error.response?.data?.message || 'Failed to connect.');
    } finally {
      setIsConnecting(false);
    }
  };



    const handleLogout = async () => {
    try {
      await api.post('/api/logout');
      setIsConnected(false);
      setConnectionMessage('');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className={`container ${!isConnected ? 'centered-view' : ''}`}>
      <header>
        <h1>AWS S3 File Manager</h1>
        {isConnected && (
          <div className='header-actions'>
            <button onClick={handleLogout} className='logout-btn'>Logout</button>
          </div>
        )}
      </header>

      {isConnected ? (
        <FileManager />
      ) : (
        <ConnectionForm
          onConnection={handleConnect}
          connecting={isConnecting}
          message={connectionMessage}
        />
      )}
    </div>
  );
}


export default App
