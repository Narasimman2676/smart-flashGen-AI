import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertTriangle, Eye, EyeOff, Zap, ArrowRight } from 'lucide-react';
import API from '../services/api';
import studyIllustration from '../assets/study_illustration.png';
import '../styles/auth.css';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const response = await API.post('/login', {
        email: email.trim(),
        password: password
      });

      const { access_token, user } = response.data;
      
      // Save credentials to localStorage
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));

      // Redirect to Dashboard
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.error || "Login failed. Please check your credentials.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card-split">
        {/* Left illustrative panel */}
        <div className="auth-sidebar-panel">
          <div className="auth-brand">
            <Zap className="brand-icon" size={24} />
            <span>FlashGen AI</span>
          </div>
          
          <div className="auth-illustration-container">
            <img 
              src={studyIllustration} 
              alt="Educational Study Scene" 
              className="auth-illustration"
            />
          </div>
          
          <div className="auth-sidebar-footer">
            <p className="auth-sidebar-quote">
              "An investment in knowledge pays the best interest."
            </p>
            <span className="auth-sidebar-author">— Benjamin Franklin</span>
          </div>
        </div>

        {/* Right form panel */}
        <div className="auth-form-panel">
          <div className="auth-form-header">
            <h2 className="auth-form-title">Welcome Back</h2>
            <p className="auth-form-subtitle">Log in to manage your flashcards and study quizzes</p>
          </div>

          {error && (
            <div className="alert alert-error">
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="password-input-wrapper">
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
                <span className="password-toggle-btn" style={{ cursor: 'default' }}>
                  <Mail size={18} />
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading} 
              style={{ width: '100%', marginTop: '8px' }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.2)', borderTopColor: '#fff' }} />
                  <span>Logging in...</span>
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Log In</span>
                  <ArrowRight size={16} />
                </span>
              )}
            </button>
          </form>

          <div className="auth-footer">
            Don't have an account? <Link to="/signup" className="auth-link">Sign Up</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
