import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, UploadCloud, Layers, 
  HelpCircle, BarChart3, LogOut, Zap, Menu, X 
} from 'lucide-react';
import API from '../services/api';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Mobile drawer state
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  if (!token) return null;

  const handleLogout = async () => {
    try {
      // Notify backend to blocklist token
      await API.post('/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear storage and route to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const isActive = (path) => location.pathname === path;
  const username = user.name || (user.email ? user.email.split('@')[0] : 'User');
  const userInitials = username.substring(0, 2).toUpperCase();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/upload', label: 'Upload Notes', icon: UploadCloud },
    { path: '/flashcards', label: 'Flashcards', icon: Layers },
    { path: '/quiz', label: 'Quiz', icon: HelpCircle },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 }
  ];

  return (
    <>
      {/* Mobile Top Header (only visible on mobile screens) */}
      <header className="mobile-header">
        <Link to="/" className="sidebar-logo" style={{ padding: 0 }}>
          <Zap className="sidebar-logo-icon" size={20} />
          <span style={{ fontSize: '1.15rem' }}>FlashGen AI</span>
        </Link>
        <button 
          className="mobile-menu-btn" 
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-label="Toggle menu"
        >
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar overlay for mobile drawer backdrop */}
      {isMobileOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Main Vertical Sidebar */}
      <aside className={`sidebar ${isMobileOpen ? 'open' : ''}`}>
        <div className="sidebar-top">
          {/* Logo Brand section */}
          <Link to="/" className="sidebar-logo" onClick={() => setIsMobileOpen(false)}>
            <Zap className="sidebar-logo-icon" size={22} />
            <span>FlashGen AI</span>
          </Link>
          
          {/* Sidebar navigation list */}
          <nav className="sidebar-nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
                  onClick={() => setIsMobileOpen(false)}
                >
                  <Icon className="sidebar-link-icon" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: User details & Logout action */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar" title={username}>
              {userInitials}
            </div>
            <div className="sidebar-user-details">
              <span className="sidebar-username" title={username}>{username}</span>
              <span className="sidebar-useremail" title={user.email}>{user.email}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="sidebar-btn-logout" title="Logout">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Navbar;
