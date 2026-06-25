import React, { useEffect, useState, useRef } from 'react';
import { 
  HelpCircle, Clock, AlertTriangle, ChevronLeft, 
  ChevronRight, CheckCircle2, XCircle, Award, 
  RotateCcw, BookOpen, ChevronDown 
} from 'lucide-react';
import API from '../services/api';

const Quiz = () => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // flashcard_id -> selected_option
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Quiz navigation and timing states
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quizActive, setQuizActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [reviewMode, setReviewMode] = useState(false);
  
  const timerRef = useRef(null);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await API.post('/quiz', { num_questions: 10 });
      const quizQuestions = res.data.questions || [];
      setQuestions(quizQuestions);
      setAnswers({});
      setCurrentIndex(0);
      setResult(null);
      setReviewMode(false);
      
      if (quizQuestions.length > 0) {
        setQuizActive(true);
        setTimeLeft(300); // Reset timer to 5 minutes
      } else {
        setQuizActive(false);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate quiz. Make sure you have created flashcards.');
      setQuizActive(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuiz();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Timer countdown hook
  useEffect(() => {
    if (quizActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && quizActive) {
      // Auto submit when time runs out
      submitQuiz();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizActive, timeLeft]);

  const submitQuiz = async () => {
    setQuizActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    
    const payload = Object.entries(answers).map(([flashcardId, selectedOption]) => ({
      flashcard_id: Number(flashcardId),
      selected_option: selectedOption,
    }));

    // Fill in default empty values for unanswered questions to ensure they are graded as wrong
    questions.forEach((q) => {
      if (!answers[q.flashcard_id]) {
        payload.push({
          flashcard_id: q.flashcard_id,
          selected_option: '',
        });
      }
    });

    try {
      setLoading(true);
      const res = await API.post('/quiz/submit', { answers: payload });
      setResult(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to submit quiz grading.');
    } finally {
      setLoading(false);
    }
  };

  const selectOption = (flashcardId, option) => {
    if (!quizActive) return; // Prevent selection after submission
    setAnswers((prev) => ({ ...prev, [flashcardId]: option }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Convert seconds to MM:SS format
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const optionLetters = ['A', 'B', 'C', 'D'];

  // Current question data
  const currentQuestion = questions[currentIndex];
  const progressPercent = questions.length > 0 
    ? Math.round(((currentIndex + 1) / questions.length) * 100) 
    : 0;

  // Grade badge based on score accuracy
  const getGradeText = (score) => {
    if (score >= 90) return { title: 'Mastery Level: Outstanding', desc: 'You have solid retention of this material!' };
    if (score >= 75) return { title: 'Mastery Level: Advanced', desc: 'Excellent comprehension, just a few details to brush up.' };
    if (score >= 60) return { title: 'Mastery Level: Satisfactory', desc: 'Good progress, but review recommended for weak areas.' };
    return { title: 'Mastery Level: Needs Practice', desc: 'Try studying the flashcards again before re-taking.' };
  };

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Header Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '6px' }}>Examination Room</h1>
          <p style={{ color: 'hsl(var(--text-secondary))', margin: 0 }}>Multiple choice questions generated from your study material.</p>
        </div>
        
        {/* Top controls: Timer & New Quiz */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {quizActive && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              backgroundColor: timeLeft < 60 ? 'hsl(var(--error-glow))' : 'hsl(var(--border-light))',
              color: timeLeft < 60 ? 'hsl(var(--error))' : 'hsl(var(--text-primary))',
              padding: '8px 16px', 
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.95rem'
            }}>
              <Clock size={16} />
              <span>{formatTime(timeLeft)}</span>
            </div>
          )}
          <button onClick={loadQuiz} className="btn btn-secondary btn-sm">
            <RotateCcw size={14} />
            <span>Restart Quiz</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ margin: 0 }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="glass-panel" style={{ minHeight: '350px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="spinner" style={{ width: '36px', height: '36px' }} />
        </div>
      ) : questions.length === 0 ? (
        <div className="glass-panel" style={{ minHeight: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="empty-state">
            <HelpCircle size={40} style={{ color: 'hsl(var(--text-muted))' }} />
            <p>No questions generated.</p>
            <span>Ensure you have uploaded a document and generated flashcards first.</span>
          </div>
        </div>
      ) : quizActive && currentQuestion ? (
        /* ==========================================================================
           ACTIVE QUIZ VIEW (Single Question Carousel)
           ========================================================================== */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Progress bar at the top */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600 }}>
              <span style={{ color: 'hsl(var(--primary))' }}>Quiz Progress</span>
              <span style={{ color: 'hsl(var(--text-secondary))' }}>Question {currentIndex + 1} of {questions.length}</span>
            </div>
            <div className="progress-track" style={{ height: '8px' }}>
              <div 
                className="progress-bar" 
                style={{ width: `${progressPercent}%`, background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)))' }}
              />
            </div>
          </div>

          {/* Active Question Panel */}
          <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Question Text */}
            <div>
              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--text-secondary))', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                Question {currentIndex + 1}
              </span>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 600, lineHeight: 1.45, color: 'hsl(var(--text-primary))' }}>
                {currentQuestion.question}
              </h2>
            </div>

            {/* MCQ Options with prefix A, B, C, D */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {currentQuestion.options.map((option, optIdx) => {
                const isSelected = answers[currentQuestion.flashcard_id] === option;
                return (
                  <div 
                    key={option}
                    onClick={() => selectOption(currentQuestion.flashcard_id, option)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '14px 20px',
                      borderRadius: '10px',
                      border: isSelected ? '2px solid hsl(var(--primary))' : '1px solid hsl(var(--border-light))',
                      backgroundColor: isSelected ? 'hsl(var(--primary-glow))' : 'hsl(var(--bg-surface))',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: isSelected ? '0 4px 12px rgba(37,99,235,0.06)' : 'var(--shadow-sm)'
                    }}
                    className={!isSelected ? 'recent-item' : ''} /* Borrow hover effects from recent-item */
                  >
                    {/* Option letter bubble */}
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      backgroundColor: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--bg-main))',
                      color: isSelected ? '#ffffff' : 'hsl(var(--text-secondary))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      transition: 'all 0.2s ease'
                    }}>
                      {optionLetters[optIdx]}
                    </div>
                    <span style={{ 
                      fontSize: '0.98rem', 
                      fontWeight: isSelected ? 600 : 500,
                      color: isSelected ? 'hsl(var(--text-primary))' : 'hsl(var(--text-secondary))'
                    }}>
                      {option}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation footer buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button 
              onClick={handlePrev} 
              disabled={currentIndex === 0}
              className="btn btn-secondary"
            >
              <ChevronLeft size={18} />
              <span>Previous</span>
            </button>

            {currentIndex < questions.length - 1 ? (
              <button 
                onClick={handleNext} 
                disabled={!answers[currentQuestion.flashcard_id]}
                className="btn btn-secondary"
              >
                <span>Next</span>
                <ChevronRight size={18} />
              </button>
            ) : (
              <button 
                onClick={submitQuiz}
                className="btn btn-primary"
                style={{ padding: '12px 28px' }}
              >
                <span>Submit Quiz</span>
              </button>
            )}
          </div>
        </div>
      ) : result ? (
        /* ==========================================================================
           QUIZ RESULTS SCREEN
           ========================================================================== */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Results Summary Card */}
          <div className="glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '24px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'hsl(var(--success-glow))',
              color: 'hsl(var(--success))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(5,150,105,0.12)'
            }}>
              <Award size={40} />
            </div>

            <div>
              <h2 style={{ fontSize: '1.75rem', marginBottom: '4px' }}>Quiz Completed!</h2>
              <p style={{ color: 'hsl(var(--text-secondary))' }}>Excellent job finalizing your revision quiz session.</p>
            </div>

            <div style={{ display: 'flex', gap: '48px', margin: '12px 0', flexWrap: 'wrap', justifyContent: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'hsl(var(--text-secondary))', fontWeight: 600 }}>Score</span>
                <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'hsl(var(--primary))' }}>{result.score}%</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', borderLeft: '1px solid hsl(var(--border-light))', paddingLeft: '48px' }}>
                <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'hsl(var(--text-secondary))', fontWeight: 600 }}>Correct</span>
                <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'hsl(var(--success))' }}>{result.correct_answers} / {result.total_questions}</span>
              </div>
            </div>

            {/* Mastery Level message */}
            <div style={{ 
              maxWidth: '500px', 
              padding: '16px 20px', 
              borderRadius: '10px', 
              backgroundColor: 'hsl(var(--bg-main))',
              border: '1px solid hsl(var(--border-light))' 
            }}>
              <h4 style={{ fontSize: '0.98rem', fontWeight: 600, color: 'hsl(var(--text-primary))', marginBottom: '2px' }}>
                {getGradeText(result.score).title}
              </h4>
              <p style={{ fontSize: '0.88rem', color: 'hsl(var(--text-secondary))', margin: 0 }}>
                {getGradeText(result.score).desc}
              </p>
            </div>

            {/* Score actions */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
              <button 
                onClick={() => setReviewMode(true)}
                className={`btn ${reviewMode ? 'btn-primary' : 'btn-secondary'}`}
              >
                <BookOpen size={16} />
                <span>Review Answers</span>
              </button>
              <button onClick={loadQuiz} className="btn btn-secondary">
                <RotateCcw size={16} />
                <span>Retake Quiz</span>
              </button>
            </div>
          </div>

          {/* Detailed Question Review List (shown only in reviewMode) */}
          {reviewMode && result.evaluation && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fade-in 0.4s ease' }}>
              <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Answers Review Breakdown</span>
                <ChevronDown size={18} />
              </h3>
              
              {result.evaluation.map((evalItem, idx) => (
                <div 
                  key={evalItem.flashcard_id} 
                  className="glass-panel" 
                  style={{ 
                    padding: '24px', 
                    borderColor: evalItem.is_correct ? 'hsl(var(--success) / 20%)' : 'hsl(var(--error) / 20%)',
                    backgroundColor: evalItem.is_correct ? 'hsl(var(--success-glow) / 20%)' : 'hsl(var(--error-glow) / 20%)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px' 
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'hsl(var(--text-primary))', lineHeight: 1.4 }}>
                      {idx + 1}. {evalItem.question}
                    </h4>
                    <span style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px',
                      color: evalItem.is_correct ? 'hsl(var(--success))' : 'hsl(var(--error))',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em'
                    }}>
                      {evalItem.is_correct ? (
                        <>
                          <CheckCircle2 size={16} />
                          <span>Correct</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={16} />
                          <span>Incorrect</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Options with correctness highlights */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '12px' }}>
                    <div style={{ fontSize: '0.88rem', color: 'hsl(var(--text-secondary))', display: 'flex', gap: '8px' }}>
                      <span style={{ fontWeight: 600 }}>Your Answer:</span>
                      <span style={{ 
                        color: evalItem.is_correct ? 'hsl(var(--success))' : 'hsl(var(--error))', 
                        fontWeight: 600 
                      }}>
                        {evalItem.selected_option || '[Unanswered]'}
                      </span>
                    </div>
                    
                    {!evalItem.is_correct && (
                      <div style={{ fontSize: '0.88rem', color: 'hsl(var(--text-secondary))', display: 'flex', gap: '8px' }}>
                        <span style={{ fontWeight: 600, color: 'hsl(var(--success))' }}>Correct Answer:</span>
                        <span style={{ color: 'hsl(var(--success))', fontWeight: 600 }}>{evalItem.correct_answer}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default Quiz;
