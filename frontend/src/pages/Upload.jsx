import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UploadCloud, FileText, CheckCircle, 
  AlertTriangle, Trash2, ArrowRight, Layers, HelpCircle 
} from 'lucide-react';
import API from '../services/api';
import '../styles/upload.css';

const Upload = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [file, setFile] = useState(null);
  const [numCards, setNumCards] = useState(10);
  const [topicId, setTopicId] = useState('');
  const [newTopicName, setNewTopicName] = useState('');
  
  const [topicsList, setTopicsList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [activeStep, setActiveStep] = useState(0); // 0: Idle, 1: Uploading, 2: Parsing, 3: Generating, 4: Done
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await API.get('/progress');
        setTopicsList(response.data);
      } catch (err) {
        console.error('Failed to load topics:', err);
      }
    };
    fetchTopics();
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    setError('');
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const handleFileChange = (e) => {
    setError('');
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    const allowedExtensions = ['pdf', 'docx', 'txt'];
    const extension = selectedFile.name.split('.').pop().toLowerCase();
    
    if (!allowedExtensions.includes(extension)) {
      setError("Unsupported file format. Please upload PDF, DOCX, or TXT files.");
      return;
    }
    
    // Increased upload limit to 100MB as requested
    if (selectedFile.size > 100 * 1024 * 1024) {
      setError("File size exceeds the 100MB limit.");
      return;
    }
    
    setFile(selectedFile);
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const removeSelectedFile = (e) => {
    e.stopPropagation();
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    setUploading(true);
    setError('');
    
    // Step 1: Uploading File
    setActiveStep(1);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      // POST file upload
      const uploadResp = await API.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const doc = uploadResp.data.document;
      
      // Step 2: Extracting Text & Parsing
      setActiveStep(2);
      await new Promise(resolve => setTimeout(resolve, 1500)); // Slight pause for visual transition
      
      // Step 3: Flashcard Generation Pipeline
      setActiveStep(3);
      
      await API.post('/generate', {
        document_id: doc.id,
        num_cards: parseInt(numCards),
        topic_id: topicId ? parseInt(topicId) : null,
        topic_name: newTopicName.trim() || null
      });

      // Step 4: Done
      setActiveStep(4);
      
      setTimeout(() => {
        // Redirect to Flashcards list to study cards
        navigate(`/flashcards?document_id=${doc.id}`);
      }, 2000);

    } catch (err) {
      const msg = err.response?.data?.error || "Pipeline failure. Please check file formatting.";
      setError(msg);
      setActiveStep(0);
      setUploading(false);
    }
  };

  const stepLabels = ['Select File', 'Uploading', 'Extracting Text', 'Generating Cards', 'Complete'];

  return (
    <div className="upload-container">
      {/* Header section */}
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '6px' }}>Upload Study Notes</h1>
        <p style={{ color: 'hsl(var(--text-secondary))' }}>Upload documents to dynamically extract key terms and generate interactive flashcards.</p>
      </div>

      <div className="glass-panel upload-card">
        {/* Visual Steps progression timeline */}
        <div className="upload-steps">
          {stepLabels.map((label, idx) => (
            <div 
              key={label} 
              className={`step-indicator ${
                activeStep === idx ? 'active' : activeStep > idx ? 'completed' : ''
              }`}
            >
              <div className="step-dot">
                {activeStep > idx ? '✓' : idx + 1}
              </div>
              <div className="step-label">{label}</div>
            </div>
          ))}
        </div>

        {error && (
          <div className="alert alert-error" style={{ margin: 0 }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Dynamic Display based on Uploading stages */}
        {!uploading ? (
          <form onSubmit={handleSubmit} className="auth-form" style={{ gap: '24px' }}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.docx,.txt"
              style={{ display: 'none' }}
            />
            
            {/* File Selection area */}
            {!file ? (
              <div 
                className={`dropzone ${dragging ? 'dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerFileSelect}
              >
                <div className="dropzone-icon-container">
                  <UploadCloud size={32} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span className="dropzone-title">Drag & drop your file here, or browse</span>
                  <span className="dropzone-subtitle">Supports PDF, DOCX, and TXT files up to 100MB</span>
                </div>
              </div>
            ) : (
              <div className="file-preview-card">
                <div className="file-preview-info">
                  <FileText className="file-icon" size={32} />
                  <div className="file-name-meta">
                    <span className="file-name" title={file.name}>{file.name}</span>
                    <span className="file-size">{formatBytes(file.size)}</span>
                  </div>
                </div>
                <button 
                  type="button" 
                  className="btn-remove-file" 
                  onClick={removeSelectedFile}
                  title="Remove file"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            )}

            {/* Custom parameters (Topic & Flashcards Count) */}
            <div className="upload-form-options">
              <div className="form-group">
                <label className="form-label">Associate with Topic</label>
                <select 
                  value={topicId} 
                  onChange={(e) => {
                    setTopicId(e.target.value);
                    if (e.target.value) setNewTopicName('');
                  }}
                  disabled={!!newTopicName}
                >
                  <option value="">-- Select Existing Topic --</option>
                  {topicsList.map((t) => (
                    <option key={t.topic_id} value={t.topic_id}>{t.topic_name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Or Create New Topic</label>
                <input
                  type="text"
                  placeholder="e.g. Physics Midterm"
                  value={newTopicName}
                  onChange={(e) => {
                    setNewTopicName(e.target.value);
                    if (e.target.value) setTopicId('');
                  }}
                  disabled={!!topicId}
                />
              </div>
            </div>

            <div className="upload-form-options">
              <div className="form-group">
                <label className="form-label">Number of Flashcards to Generate</label>
                <select 
                  value={numCards} 
                  onChange={(e) => setNumCards(e.target.value)}
                >
                  <option value={5}>5 Flashcards</option>
                  <option value={10}>10 Flashcards (Recommended)</option>
                  <option value={15}>15 Flashcards</option>
                  <option value={20}>20 Flashcards</option>
                </select>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={!file}
              style={{ width: '100%', marginTop: '8px' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Generate Flashcards</span>
                <ArrowRight size={16} />
              </span>
            </button>
          </form>
        ) : (
          /* Pipeline progress animations */
          <div style={{ padding: '32px 0' }}>
            {activeStep < 4 ? (
              <div className="pipeline-progress-container">
                <div className="pipeline-status-text">
                  {activeStep === 1 && "Uploading document files..."}
                  {activeStep === 2 && "Running NLP text extraction..."}
                  {activeStep === 3 && "Extracting keywords & formulating flashcards..."}
                </div>
                <div className="pipeline-progress-track">
                  <div className="pipeline-progress-bar" />
                </div>
                <span style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))' }}>
                  Please do not close this window. The AI pipeline is generating your study material.
                </span>
              </div>
            ) : (
              /* Success confirmation panel */
              <div className="upload-success-panel">
                <CheckCircle className="success-icon-animate" size={48} />
                <h3 style={{ fontSize: '1.4rem', marginTop: '16px', marginBottom: '6px' }}>Generation Complete!</h3>
                <span style={{ color: 'hsl(var(--text-secondary))' }}>Redirecting to study room to review your new flashcards...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Upload;
