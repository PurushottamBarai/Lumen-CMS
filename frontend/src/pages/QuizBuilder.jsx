import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, Edit3, Eye, CheckCircle, AlertCircle, HelpCircle, Save, X, Search, Filter } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://content-management-system-2-he9n.onrender.com/api';

const QuizBuilder = () => {
  const { user, isAuthenticated } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Active quiz being edited or created
  const [isEditing, setIsEditing] = useState(false);
  const [quizId, setQuizId] = useState(null);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [questions, setQuestions] = useState([
    {
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: '',
    },
  ]);

  // Quiz Modal View
  const [viewingQuiz, setViewingQuiz] = useState(null);

  // Fetch quizzes
  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('lumen_token');
      const res = await fetch(`${API_URL}/quizzes`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.quizzes) {
        setQuizzes(data.quizzes);
      }
    } catch (err) {
      console.error('Fetch quizzes error:', err);
      setError('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const resetForm = () => {
    setIsEditing(false);
    setQuizId(null);
    setQuizTitle('');
    setQuizDescription('');
    setQuestions([
      {
        question: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        explanation: '',
      },
    ]);
  };

  // Add Question
  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        question: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        explanation: '',
      },
    ]);
  };

  // Remove Question
  const handleRemoveQuestion = (idx) => {
    if (questions.length === 1) {
      setError('Quiz must have at least one question');
      return;
    }
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  // Question Field Handlers
  const handleQuestionTextChange = (idx, text) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[idx].question = text;
      return copy;
    });
  };

  const handleOptionChange = (qIdx, optIdx, text) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIdx].options[optIdx] = text;
      return copy;
    });
  };

  const handleCorrectAnswerChange = (qIdx, answer) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIdx].correctAnswer = answer;
      return copy;
    });
  };

  const handleExplanationChange = (qIdx, text) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIdx].explanation = text;
      return copy;
    });
  };

  // Submit/Save Quiz
  const handleSaveQuiz = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!quizTitle.trim()) {
      setError('Quiz title is required');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        setError(`Question ${i + 1} text is required`);
        return;
      }
      if (q.options.some((opt) => !opt.trim())) {
        setError(`All 4 options are required for Question ${i + 1}`);
        return;
      }
      if (new Set(q.options.map((o) => o.trim())).size !== 4) {
        setError(`Options must be unique for Question ${i + 1}`);
        return;
      }
      if (!q.correctAnswer.trim()) {
        setError(`Please select a correct answer for Question ${i + 1}`);
        return;
      }
    }

    try {
      const token = localStorage.getItem('lumen_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const payload = {
        title: quizTitle.trim(),
        description: quizDescription.trim(),
        questions,
      };

      let res;
      if (isEditing && quizId) {
        res = await fetch(`${API_URL}/quizzes/${quizId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_URL}/quizzes`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to save quiz');
      }

      setSuccessMsg(isEditing ? 'Quiz updated successfully!' : 'Quiz created successfully!');
      resetForm();
      fetchQuizzes();
    } catch (err) {
      console.error('Save quiz error:', err);
      setError(err.message || 'Failed to save quiz');
    }
  };

  const handleEditClick = (quiz) => {
    setIsEditing(true);
    setQuizId(quiz._id || quiz.id);
    setQuizTitle(quiz.title || '');
    setQuizDescription(quiz.description || '');
    setQuestions(
      quiz.questions && quiz.questions.length > 0
        ? quiz.questions.map((q) => ({
            question: q.question || '',
            options: q.options || ['', '', '', ''],
            correctAnswer: q.correctAnswer || '',
            explanation: q.explanation || '',
          }))
        : [
            {
              question: '',
              options: ['', '', '', ''],
              correctAnswer: '',
              explanation: '',
            },
          ]
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;
    try {
      const token = localStorage.getItem('lumen_token');
      const res = await fetch(`${API_URL}/quizzes/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setSuccessMsg('Quiz deleted successfully');
        fetchQuizzes();
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete quiz');
    }
  };

  // Filtered quizzes
  const filteredQuizzes = quizzes.filter((q) => {
    const matchesSearch =
      q.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold text-stone-900">Quiz Builder & Management</h1>
        <p className="text-xs text-stone-500 mt-1">Create interactive knowledge checkpoints for readers.</p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quiz Creation / Editing Form */}
      <div className="bg-white border border-[#EDE8DF] rounded-3xl p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-[#EDE8DF] pb-4">
          <h2 className="font-serif text-xl font-bold text-stone-900">
            {isEditing ? 'Edit Quiz' : 'Create New Quiz'}
          </h2>
          {isEditing && (
            <button
              onClick={resetForm}
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSaveQuiz} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                Quiz Title
              </label>
              <input
                type="text"
                placeholder="e.g. CRISPR Cas9 Knowledge Checkpoint"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#EDE8DF] rounded-xl text-xs text-stone-800 focus:outline-none focus:border-[#1A382B]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                Description / Overview
              </label>
              <input
                type="text"
                placeholder="Brief summary of what this quiz tests..."
                value={quizDescription}
                onChange={(e) => setQuizDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#EDE8DF] rounded-xl text-xs text-stone-800 focus:outline-none focus:border-[#1A382B]"
              />
            </div>
          </div>

          {/* Questions Section */}
          <div className="space-y-6 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-stone-800">Questions ({questions.length})</h3>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="px-3.5 py-2 bg-[#1A382B] text-white hover:bg-[#11261D] text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Question</span>
              </button>
            </div>

            {questions.map((q, qIdx) => (
              <div key={qIdx} className="bg-[#FAF7F2] border border-[#EDE8DF] rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1A382B]">
                    Question {qIdx + 1}
                  </span>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIdx)}
                      className="text-rose-500 hover:text-rose-700 text-xs font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  )}
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Enter question text..."
                    value={q.question}
                    onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-[#EDE8DF] rounded-xl text-xs text-stone-800 focus:outline-none focus:border-[#1A382B]"
                  />
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {q.options.map((opt, optIdx) => (
                    <div key={optIdx} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-stone-500">
                        <span>Option {optIdx + 1}</span>
                        <label className="inline-flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name={`correct-${qIdx}`}
                            checked={q.correctAnswer === opt && opt.trim() !== ''}
                            onChange={() => handleCorrectAnswerChange(qIdx, opt)}
                            className="accent-[#1A382B]"
                          />
                          <span className="text-[10px] font-semibold text-[#1A382B]">Mark Correct</span>
                        </label>
                      </div>
                      <input
                        type="text"
                        placeholder={`Option ${optIdx + 1}`}
                        value={opt}
                        onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#EDE8DF] rounded-xl text-xs text-stone-800 focus:outline-none focus:border-[#1A382B]"
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Explanation (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Provide context or explanation for the correct answer..."
                    value={q.explanation || ''}
                    onChange={(e) => handleExplanationChange(qIdx, e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#EDE8DF] rounded-xl text-xs text-stone-700 focus:outline-none focus:border-[#1A382B]"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              className="px-6 py-3 bg-[#1A382B] hover:bg-[#11261D] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Update Quiz' : 'Save Quiz'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Quiz List & Filtering Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-[#EDE8DF] rounded-2xl p-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search quizzes by title or topic..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#FAF7F2] border border-[#EDE8DF] rounded-xl text-xs text-stone-700 focus:outline-none focus:border-[#1A382B]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-[#FAF7F2] border border-[#EDE8DF] rounded-xl text-xs text-stone-700 focus:outline-none focus:border-[#1A382B]"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
            </select>

            {/* SINGLE Clear Filters Button */}
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition shrink-0"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* SINGLE No Quizzes Found Block */}
        {filteredQuizzes.length === 0 && !loading && (
          <div className="bg-white border border-[#EDE8DF] rounded-3xl p-12 text-center space-y-2">
            <HelpCircle className="w-8 h-8 text-stone-300 mx-auto" />
            <p className="text-sm font-semibold text-stone-700">No quizzes found.</p>
            <p className="text-xs text-stone-400">Try changing your search or filter settings.</p>
          </div>
        )}

        {/* Quizzes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredQuizzes.map((quiz) => (
            <div key={quiz._id || quiz.id} className="bg-white border border-[#EDE8DF] rounded-3xl p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-serif font-bold text-stone-900 text-base">{quiz.title}</h4>
                  <p className="text-xs text-stone-500 mt-0.5 line-clamp-2">{quiz.description || 'No description'}</p>
                </div>
                <span className="px-2.5 py-1 bg-stone-100 text-stone-700 text-[10px] font-bold uppercase tracking-wider rounded-full border border-stone-200 shrink-0">
                  {quiz.status || 'approved'}
                </span>
              </div>

              <div className="text-xs text-stone-500 flex items-center gap-4 border-t border-[#EDE8DF] pt-3">
                <span>{quiz.questions?.length || 0} Questions</span>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setViewingQuiz(quiz)}
                  className="px-3 py-1.5 bg-[#FAF7F2] hover:bg-[#EDE8DF] text-stone-700 text-xs font-semibold rounded-xl flex items-center gap-1 transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View
                </button>
                <button
                  onClick={() => handleEditClick(quiz)}
                  className="px-3 py-1.5 bg-[#1A382B]/10 hover:bg-[#1A382B]/20 text-[#1A382B] text-xs font-semibold rounded-xl flex items-center gap-1 transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteClick(quiz._id || quiz.id)}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-1 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quiz Viewing Modal */}
      {viewingQuiz && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#EDE8DF] rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EDE8DF] pb-3">
              <h3 className="font-serif text-xl font-bold text-stone-900">{viewingQuiz.title}</h3>
              <button onClick={() => setViewingQuiz(null)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-stone-600">{viewingQuiz.description}</p>

            <div className="space-y-4">
              {viewingQuiz.questions?.map((q, idx) => (
                <div key={idx} className="bg-[#FAF7F2] border border-[#EDE8DF] rounded-2xl p-4 space-y-2">
                  <p className="text-xs font-bold text-stone-800">
                    Q{idx + 1}: {q.question}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {q.options?.map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        className={`p-2 rounded-xl text-xs border ${
                          opt === q.correctAnswer
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                            : 'bg-white border-[#EDE8DF] text-stone-700'
                        }`}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizBuilder;
