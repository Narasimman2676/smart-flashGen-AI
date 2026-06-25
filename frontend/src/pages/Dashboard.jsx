import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FileText, Layers, HelpCircle, Award, 
  AlertTriangle, BookOpen, Clock, 
  ArrowRight, ShieldCheck, ChevronRight, Zap
} from 'lucide-react';
import API from '../services/api';
import '../styles/dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await API.get('/analytics');
        setStats(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load dashboard metrics.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getScoreColorClass = (score) => {
    if (score >= 80) return 'score-high';
    if (score >= 60) return 'score-med';
    return 'score-low';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }} />
      </div>
    );
  }

  const { statistics, weak_topics, recent_uploads, recent_quizzes } = stats || {
    statistics: { total_documents: 0, total_flashcards: 0, total_quizzes: 0, average_accuracy: 0.0 },
    weak_topics: [],
    recent_uploads: [],
    recent_quizzes: []
  };

  const displayName = user.name || (user.email ? user.email.split('@')[0] : 'Student');

  return (
    <div className="dashboard-container">
      {/* Greeting Header section */}
      <div className="dashboard-header">
        <h1>Welcome, {displayName} 👋</h1>
        <p>Track your academic metrics, generate flashcards, and test your retention levels.</p>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '8px' }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Statistics Cards Grid */}
      <div className="stats-grid">
        <div className="stats-card">
          <div className="stats-icon-wrapper">
            <FileText size={22} />
          </div>
          <div className="stats-info">
            <span className="stats-label">Documents</span>
            <span className="stats-value">{statistics.total_documents}</span>
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-icon-wrapper">
            <Layers size={22} />
          </div>
          <div className="stats-info">
            <span className="stats-label">Flashcards</span>
            <span className="stats-value">{statistics.total_flashcards}</span>
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-icon-wrapper">
            <HelpCircle size={22} />
          </div>
          <div className="stats-info">
            <span className="stats-label">Quizzes Taken</span>
            <span className="stats-value">{statistics.total_quizzes}</span>
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-icon-wrapper">
            <Award size={22} />
          </div>
          <div className="stats-info">
            <span className="stats-label">Avg. Accuracy</span>
            <span className="stats-value">{statistics.average_accuracy}%</span>
          </div>
        </div>
      </div>

      {/* Dashboard Split Widgets */}
      <div className="dashboard-split">
        
        {/* Left column: Weak Topics Progress & Recent Quizzes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Weak Topics progress cards */}
          <div className="panel-card glass-panel">
            <h2 className="panel-title">
              <AlertTriangle size={18} style={{ color: 'hsl(var(--warning))' }} />
              <span>Recommended Study (Weak Topics)</span>
            </h2>
            {weak_topics.length > 0 ? (
              <div className="weak-topics-list">
                {weak_topics.map((topic) => (
                  <div key={topic.topic_id} className="weak-topic-item">
                    <div className="weak-topic-header">
                      <span>{topic.topic_name}</span>
                      <span style={{ color: 'hsl(var(--error))', fontWeight: 600 }}>{topic.mastery_level}% Mastery</span>
                    </div>
                    <div className="progress-track">
                      <div 
                        className="progress-bar" 
                        style={{ width: `${topic.mastery_level}%` }}
                      />
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>
                      Reviewed {topic.flashcards_viewed} study sessions
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <ShieldCheck size={38} style={{ color: 'hsl(var(--success))', marginBottom: '8px' }} />
                <p>All clear!</p>
                <span>No weak topics detected. Your scores are high. Keep it up!</span>
              </div>
            )}
          </div>

          {/* Recent Quizzes Widget */}
          <div className="panel-card glass-panel">
            <h2 className="panel-title">
              <Clock size={18} style={{ color: 'hsl(var(--primary))' }} />
              <span>Recent Quizzes</span>
            </h2>
            {recent_quizzes.length > 0 ? (
              <div className="recent-list">
                {recent_quizzes.map((quiz) => (
                  <div key={quiz.id} className="recent-item">
                    <div className="recent-item-info">
                      <HelpCircle size={18} style={{ color: 'hsl(var(--text-secondary))' }} />
                      <div>
                        <div className="recent-item-title">{quiz.topic_name || 'General Study'}</div>
                        <div className="recent-item-meta">
                          {quiz.correct_answers} of {quiz.total_questions} correct • {formatDate(quiz.attempted_at)}
                        </div>
                      </div>
                    </div>
                    <div className={`score-text ${getScoreColorClass(quiz.score)}`}>
                      {quiz.score}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <BookOpen size={36} style={{ color: 'hsl(var(--text-muted))', marginBottom: '8px' }} />
                <p>No quizzes taken yet.</p>
                <Link to="/quiz" className="btn btn-secondary btn-sm" style={{ marginTop: '12px' }}>
                  Start a Quiz
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Recent Documents panel */}
        <div className="panel-card glass-panel">
          <h2 className="panel-title">
            <FileText size={18} style={{ color: 'hsl(var(--secondary))' }} />
            <span>Recent Documents</span>
          </h2>
          {recent_uploads.length > 0 ? (
            <div className="recent-list" style={{ flex: 1, justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recent_uploads.map((doc) => (
                  <div key={doc.id} className="recent-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="recent-item-info">
                        <FileText size={18} style={{ color: 'hsl(var(--text-secondary))' }} />
                        <div style={{ overflow: 'hidden' }}>
                          <div className="recent-item-title" title={doc.filename} style={{ maxWidth: '200px' }}>
                            {doc.filename}
                          </div>
                          <div className="recent-item-meta">{formatDate(doc.created_at)}</div>
                        </div>
                      </div>
                      <span className={`badge badge-${doc.status.toLowerCase()}`}>
                        {doc.status}
                      </span>
                    </div>
                    {doc.status === 'completed' && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
                        <Link 
                          to={`/flashcards?document_id=${doc.id}`}
                          className="auth-link" 
                          style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '2px' }}
                        >
                          <span>Study Cards</span>
                          <ChevronRight size={14} />
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <Link 
                to="/upload" 
                className="btn btn-secondary" 
                style={{ marginTop: '20px', width: '100%', display: 'flex', gap: '8px', fontSize: '0.9rem' }}
              >
                <span>Upload New Document</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="empty-state">
              <UploadCloudMock size={38} />
              <p>No documents uploaded yet.</p>
              <Link to="/upload" className="btn btn-primary" style={{ marginTop: '16px' }}>
                Upload Notes
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// SVG Icon Helper for Clean Upload Display
const UploadCloudMock = ({ size }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    style={{ color: 'hsl(var(--text-muted))' }}
  >
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
    <path d="M12 12v9" />
    <path d="m16 16-4-4-4 4" />
  </svg>
);

export default Dashboard;
