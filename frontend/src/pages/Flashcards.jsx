import React, { useEffect, useMemo, useState } from 'react';
import { 
  Layers, Search, Star, Trash2, Edit2, 
  ChevronLeft, ChevronRight, Play, Grid, 
  Check, X, AlertTriangle, ArrowLeft 
} from 'lucide-react';
import API from '../services/api';

const Flashcards = () => {
  const [cards, setCards] = useState([]);
  const [search, setSearch] = useState('');
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [flipped, setFlipped] = useState(false); // Used for active study mode flip state
  const [gridFlipped, setGridFlipped] = useState({}); // Used for grid card flip states
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({ question: '', answer: '' });
  
  // Immersive Study View State
  const [viewMode, setViewMode] = useState('study'); // 'study' or 'grid'
  const [activeIndex, setActiveIndex] = useState(0);

  const pageSize = 6;

  const loadCards = async () => {
    try {
      setLoading(true);
      const res = await API.get('/flashcards', { params: { search, favorite: favoriteOnly } });
      setCards(res.data || []);
      setPage(1);
      setActiveIndex(0);
      setFlipped(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, [favoriteOnly]);

  const filteredCards = useMemo(() => {
    const q = search.toLowerCase();
    return cards.filter((card) => {
      if (!q) return true;
      return `${card.question} ${card.answer}`.toLowerCase().includes(q);
    });
  }, [cards, search]);

  const pagedCards = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCards.slice(start, start + pageSize);
  }, [filteredCards, page]);

  const totalPages = Math.max(1, Math.ceil(filteredCards.length / pageSize));

  // Study view active card
  const activeCard = filteredCards[activeIndex];

  const handleNextCard = () => {
    if (activeIndex < filteredCards.length - 1) {
      setFlipped(false);
      setTimeout(() => {
        setActiveIndex(activeIndex + 1);
      }, 150); // Slight delay for smooth fade
    }
  };

  const handlePrevCard = () => {
    if (activeIndex > 0) {
      setFlipped(false);
      setTimeout(() => {
        setActiveIndex(activeIndex - 1);
      }, 150);
    }
  };

  // Keyboard navigation listener for immersive study mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (viewMode !== 'study' || filteredCards.length === 0) return;
      
      if (e.code === 'Space') {
        e.preventDefault();
        setFlipped(!flipped);
      } else if (e.code === 'ArrowRight') {
        handleNextCard();
      } else if (e.code === 'ArrowLeft') {
        handlePrevCard();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, activeIndex, flipped, filteredCards]);

  const toggleFavorite = async (id, isFromActiveStudy = false) => {
    try {
      await API.post(`/flashcards/${id}/favorite`);
      // Update local state to prevent reloading and disrupting study view
      setCards(prev => prev.map(c => c.id === id ? { ...c, is_favorite: !c.is_favorite } : c));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteCard = async (id) => {
    try {
      await API.delete(`/flashcards/${id}`);
      loadCards();
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (card, e) => {
    if (e) e.stopPropagation();
    setEditingId(card.id);
    setEditDraft({ question: card.question, answer: card.answer });
  };

  const saveEdit = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await API.put(`/flashcards/${id}`, {
        question: editDraft.question,
        answer: editDraft.answer,
      });
      setEditingId(null);
      // Update local card values
      setCards(prev => prev.map(c => c.id === id ? { ...c, question: editDraft.question, answer: editDraft.answer } : c));
    } catch (err) {
      console.error(err);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'hsl(var(--success))';
      case 'medium': return 'hsl(var(--warning))';
      case 'hard': return 'hsl(var(--error))';
      default: return 'hsl(var(--primary))';
    }
  };

  // Study view progress calculation
  const progressPercent = filteredCards.length > 0 
    ? Math.round(((activeIndex + 1) / filteredCards.length) * 100) 
    : 0;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Header Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '6px' }}>Study Room</h1>
          <p style={{ color: 'hsl(var(--text-secondary))', margin: 0 }}>Active recall study session. Flip cards to reveal answers.</p>
        </div>
        
        {/* Study Mode vs Grid Mode Switcher */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className={`btn ${viewMode === 'study' ? 'btn-primary' : 'btn-secondary'}`} 
            onClick={() => setViewMode('study')}
            style={{ padding: '8px 16px', fontSize: '0.9rem' }}
          >
            <Play size={16} />
            <span>Study Mode</span>
          </button>
          <button 
            className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}`} 
            onClick={() => setViewMode('grid')}
            style={{ padding: '8px 16px', fontSize: '0.9rem' }}
          >
            <Grid size={16} />
            <span>Manage Cards</span>
          </button>
        </div>
      </div>

      {/* Main Study Area */}
      <div className="glass-panel" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
        
        {/* If in Grid Mode, show search filters at the top */}
        {viewMode === 'grid' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', borderBottom: '1px solid hsl(var(--border-light))', paddingBottom: '20px', marginBottom: '20px' }}>
            <div style={{ position: 'relative', minWidth: '260px' }}>
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search flashcards..."
                style={{ paddingLeft: '40px' }}
              />
              <Search 
                size={18} 
                style={{ position: 'absolute', left: '14px', top: '14px', color: 'hsl(var(--text-muted))' }} 
              />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'hsl(var(--text-secondary))', cursor: 'pointer', fontWeight: 500 }}>
              <input 
                type="checkbox" 
                checked={favoriteOnly} 
                onChange={() => setFavoriteOnly(!favoriteOnly)} 
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span>Starred only</span>
            </label>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <div className="spinner" style={{ width: '32px', height: '32px' }} />
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px 0' }}>
            <AlertTriangle size={42} style={{ color: 'hsl(var(--text-muted))' }} />
            <p>No flashcards found.</p>
            <span>Generate some cards by uploading class notes first.</span>
            <Link to="/upload" className="btn btn-primary btn-sm" style={{ marginTop: '16px' }}>
              Upload Notes
            </Link>
          </div>
        ) : viewMode === 'study' ? (
          /* ==========================================================================
             STUDY MODE (Immersive 3D Slider)
             ========================================================================== */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', flex: 1, justifyContent: 'space-between' }}>
            
            {/* Progress indicator */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600 }}>
                <span style={{ color: 'hsl(var(--primary))' }}>Active Progress</span>
                <span style={{ color: 'hsl(var(--text-secondary))' }}>Card {activeIndex + 1} of {filteredCards.length}</span>
              </div>
              <div className="progress-track" style={{ height: '8px' }}>
                <div 
                  className="progress-bar" 
                  style={{ width: `${progressPercent}%`, background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)))' }}
                />
              </div>
            </div>

            {/* Immersive Card Slider Frame */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', width: '100%', justifyContent: 'center' }}>
              {/* Prev Navigation */}
              <button 
                onClick={handlePrevCard} 
                disabled={activeIndex === 0}
                className="btn btn-secondary"
                style={{ borderRadius: '50%', width: '48px', height: '48px', padding: 0 }}
                title="Previous Card (←)"
              >
                <ChevronLeft size={24} />
              </button>

              {/* 3D Flipping Card container */}
              {activeCard && (
                <div className="flashcard-perspective">
                  <div 
                    className={`flashcard-inner ${flipped ? 'flipped' : ''}`}
                    onClick={() => setFlipped(!flipped)}
                  >
                    {/* Front Face: Question */}
                    <div className="flashcard-front">
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', position: 'absolute', top: '20px', padding: '0 24px' }}>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 700, 
                          color: getDifficultyColor(activeCard.difficulty),
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em'
                        }}>
                          {activeCard.difficulty}
                        </span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(activeCard.id, true);
                          }} 
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: activeCard.is_favorite ? 'hsl(var(--warning))' : 'hsl(var(--text-muted))' }}
                          title={activeCard.is_favorite ? "Unstar card" : "Star card"}
                        >
                          <Star size={18} fill={activeCard.is_favorite ? "currentColor" : "none"} />
                        </button>
                      </div>
                      
                      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--text-secondary))', fontWeight: 600 }}>Question</span>
                        <p style={{ fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.5, color: 'hsl(var(--text-primary))' }}>
                          {activeCard.question}
                        </p>
                      </div>
                      
                      <span style={{ position: 'absolute', bottom: '20px', fontSize: '0.78rem', color: 'hsl(var(--text-muted))', fontWeight: 500 }}>
                        Click card or press [Space] to reveal answer
                      </span>
                    </div>

                    {/* Back Face: Answer */}
                    <div className="flashcard-back">
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', position: 'absolute', top: '20px', padding: '0 24px' }}>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 700, 
                          color: getDifficultyColor(activeCard.difficulty),
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em'
                        }}>
                          {activeCard.difficulty}
                        </span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(activeCard.id, true);
                          }} 
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: activeCard.is_favorite ? 'hsl(var(--warning))' : 'hsl(var(--text-muted))' }}
                        >
                          <Star size={18} fill={activeCard.is_favorite ? "currentColor" : "none"} />
                        </button>
                      </div>
                      
                      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--primary))', fontWeight: 600 }}>Answer</span>
                        <p style={{ fontSize: '1.15rem', lineHeight: 1.6, color: 'hsl(var(--text-primary))' }}>
                          {activeCard.answer}
                        </p>
                      </div>
                      
                      <span style={{ position: 'absolute', bottom: '20px', fontSize: '0.78rem', color: 'hsl(var(--text-muted))', fontWeight: 500 }}>
                        Click to flip back
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Next Navigation */}
              <button 
                onClick={handleNextCard} 
                disabled={activeIndex === filteredCards.length - 1}
                className="btn btn-secondary"
                style={{ borderRadius: '50%', width: '48px', height: '48px', padding: 0 }}
                title="Next Card (→)"
              >
                <ChevronRight size={24} />
              </button>
            </div>

            {/* Quick Tips */}
            <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>
              Tip: Use the keyboard <kbd style={{ padding: '2px 6px', background: '#e2e8f0', borderRadius: '4px', fontStyle: 'normal' }}>Space</kbd> to flip, and <kbd style={{ padding: '2px 6px', background: '#e2e8f0', borderRadius: '4px', fontStyle: 'normal' }}>←</kbd> / <kbd style={{ padding: '2px 6px', background: '#e2e8f0', borderRadius: '4px', fontStyle: 'normal' }}>→</kbd> arrow keys to navigate.
            </div>
          </div>
        ) : (
          /* ==========================================================================
             GRID MODE (Manageable Grid list with inline edits)
             ========================================================================== */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1, justifyContent: 'space-between' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {pagedCards.map((card) => (
                <div key={card.id} className="glass-panel" style={{ padding: '20px', minHeight: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
                  
                  {/* Card top badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', alignItems: 'center' }}>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 700, 
                      color: getDifficultyColor(card.difficulty),
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em'
                    }}>
                      {card.difficulty}
                    </span>
                    <button 
                      onClick={() => toggleFavorite(card.id)} 
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: card.is_favorite ? 'hsl(var(--warning))' : 'hsl(var(--text-muted))' }}
                    >
                      <Star size={18} fill={card.is_favorite ? "currentColor" : "none"} />
                    </button>
                  </div>

                  {/* Dynamic editing form vs interactive flipped text */}
                  {editingId === card.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <textarea
                        value={editDraft.question}
                        onChange={(e) => setEditDraft({ ...editDraft, question: e.target.value })}
                        style={{ width: '100%', minHeight: '60px', padding: '8px 12px', fontSize: '0.9rem' }}
                        placeholder="Question"
                      />
                      <textarea
                        value={editDraft.answer}
                        onChange={(e) => setEditDraft({ ...editDraft, answer: e.target.value })}
                        style={{ width: '100%', minHeight: '60px', padding: '8px 12px', fontSize: '0.9rem' }}
                        placeholder="Answer"
                      />
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        <button 
                          onClick={(e) => saveEdit(card.id, e)} 
                          className="btn btn-primary btn-sm"
                          style={{ padding: '6px 12px' }}
                        >
                          <Check size={14} />
                          <span>Save</span>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(null);
                          }} 
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '6px 12px' }}
                        >
                          <X size={14} />
                          <span>Cancel</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        onClick={() => setGridFlipped((prev) => ({ ...prev, [card.id]: !prev[card.id] }))}
                        style={{ cursor: 'pointer', minHeight: '110px', display: 'flex', flexDirection: 'column', gap: '8px' }}
                      >
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-secondary))', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {gridFlipped[card.id] ? 'Answer' : 'Question'}
                        </span>
                        <p style={{ color: 'hsl(var(--text-primary))', fontSize: '0.95rem', lineHeight: 1.5, fontStyle: gridFlipped[card.id] ? 'italic' : 'normal' }}>
                          {gridFlipped[card.id] ? card.answer : card.question}
                        </p>
                      </div>
                      
                      {/* Action buttons at bottom */}
                      <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid hsl(var(--border-light))', paddingTop: '12px', marginTop: '12px' }}>
                        <button 
                          onClick={(e) => startEdit(card, e)} 
                          className="btn-logout"
                          style={{ padding: '4px 8px', fontSize: '0.8rem', display: 'inline-flex', gap: '4px', alignItems: 'center' }}
                          title="Edit Card"
                        >
                          <Edit2 size={14} />
                          <span>Edit</span>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCard(card.id);
                          }} 
                          className="btn-logout"
                          style={{ padding: '4px 8px', fontSize: '0.8rem', display: 'inline-flex', gap: '4px', alignItems: 'center' }}
                          title="Delete Card"
                        >
                          <Trash2 size={14} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid hsl(var(--border-light))', paddingTop: '20px' }}>
              <button 
                disabled={page === 1} 
                onClick={() => setPage(page - 1)} 
                className="btn btn-secondary btn-sm"
              >
                Previous
              </button>
              <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'hsl(var(--text-secondary))' }}>
                Page {page} of {totalPages}
              </span>
              <button 
                disabled={page === totalPages} 
                onClick={() => setPage(page + 1)} 
                className="btn btn-secondary btn-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Flashcards;
