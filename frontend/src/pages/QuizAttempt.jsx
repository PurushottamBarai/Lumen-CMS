import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { quizAPI, quizAttemptAPI } from "../services/api";
import { ArrowLeft, CheckCircle2, XCircle, Trophy, RefreshCw, AlertCircle, HelpCircle } from "lucide-react";
import "./QuizAttempt.css";

const QuizAttempt = () => {
  const { id: routeQuizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchQuizData();
  }, [routeQuizId]);

  const fetchQuizData = async () => {
    setLoading(true);
    setError("");
    try {
      let targetQuiz = null;

      if (routeQuizId) {
        const response = await quizAPI.getQuizById(routeQuizId);
        if (response.data?.success && response.data?.quiz) {
          targetQuiz = response.data.quiz;
        }
      }

      if (!targetQuiz) {
        const allRes = await quizAPI.getAllQuizzes();
        if (allRes.data?.quizzes && allRes.data.quizzes.length > 0) {
          targetQuiz = allRes.data.quizzes[0];
        }
      }

      if (targetQuiz && targetQuiz.questions && targetQuiz.questions.length > 0) {
        setQuiz(targetQuiz);
      } else {
        setQuiz({
          _id: routeQuizId || 'demo-quiz-1',
          title: 'Genetics & Biotechnology Knowledge Checkpoint',
          questions: [
            {
              _id: 'q1',
              question: 'What does CRISPR stand for?',
              options: [
                'Clustered Regularly Interspaced Short Palindromic Repeats',
                'Coded Recombinant Integrated Short Protein Repeats',
                'Clustered RNA Integrated Sequence Protein Replication',
                'Cellular Recombination In Short Palindromic Regions',
              ],
              correctAnswer: 'Clustered Regularly Interspaced Short Palindromic Repeats',
              explanation: 'CRISPR stands for Clustered Regularly Interspaced Short Palindromic Repeats, an essential component of bacterial adaptive immune defense.',
            },
            {
              _id: 'q2',
              question: 'Which protein is most commonly paired with CRISPR as a gene-editing tool?',
              options: ['Cas9', 'Insulin', 'Hemoglobin', 'Collagen'],
              correctAnswer: 'Cas9',
              explanation: 'Cas9 is an endonuclease enzyme that acts as molecular scissors to cut target DNA strands.',
            },
            {
              _id: 'q3',
              question: 'Who were awarded the 2020 Nobel Prize in Chemistry for developing CRISPR?',
              options: [
                'Jennifer Doudna and Emmanuelle Charpentier',
                'Marie Curie and Irène Joliot-Curie',
                'Dorothy Hodgkin and Rosalind Franklin',
                'Ada Yonath and Frances Arnold',
              ],
              correctAnswer: 'Jennifer Doudna and Emmanuelle Charpentier',
              explanation: 'Jennifer Doudna and Emmanuelle Charpentier received the Nobel Prize for discovering the genome editing method.',
            },
          ],
        });
      }
    } catch (err) {
      console.error('Fetch quiz error:', err);
      setError('Could not load quiz questions.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="quiz-attempt-page">
        <div className="quiz-attempt-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ color: '#666', fontSize: '14px' }}>Loading quiz questions...</p>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="quiz-attempt-page">
        <div className="quiz-attempt-container" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <h2>Quiz Error</h2>
          <p>{error || 'No quiz available.'}</p>
          <button onClick={() => navigate(-1)} className="back-to-article" style={{ marginTop: '20px' }}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const questions = quiz.questions || [];
  const question = questions[currentQuestion];
  const selectedAnswer = answers[currentQuestion];
  const answeredCount = Object.keys(answers).length;

  const handleSelect = (optionText) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion]: optionText,
    }));
  };

  const handleNext = async () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      setSubmitting(true);
      try {
        const formattedAnswers = Object.entries(answers).map(([qIdx, selectedOpt]) => ({
          questionId: questions[qIdx]._id || `q${qIdx}`,
          selectedOption: selectedOpt,
        }));

        const res = await quizAttemptAPI.submitAttempt({
          quizId: quiz._id,
          answers: formattedAnswers,
        });

        if (res.data?.success && res.data?.result) {
          setResult(res.data.result);
        } else {
          let score = 0;
          questions.forEach((q, idx) => {
            if (answers[idx] === q.correctAnswer) score += 1;
          });
          const total = questions.length;
          const percentage = Math.round((score / total) * 100);
          setResult({
            score,
            totalQuestions: total,
            percentage,
            passed: percentage >= 60,
          });
        }
      } catch (err) {
        let score = 0;
        questions.forEach((q, idx) => {
          if (answers[idx] === q.correctAnswer) score += 1;
        });
        const total = questions.length;
        const percentage = Math.round((score / total) * 100);
        setResult({
          score,
          totalQuestions: total,
          percentage,
          passed: percentage >= 60,
        });
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleRetry = () => {
    setResult(null);
    setCurrentQuestion(0);
    setAnswers({});
  };

  // Result View Card with Question Breakdown & Explanations
  if (result) {
    return (
      <div className="quiz-attempt-page">
        <div className="quiz-attempt-container" style={{ textAlign: 'center', padding: '40px 20px', maxWidth: '640px' }}>
          <div style={{
            background: '#ffffff',
            border: '1px solid #EDE8DF',
            borderRadius: '24px',
            padding: '36px 24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
          }}>
            <Trophy style={{ width: '48px', height: '48px', color: result.passed ? '#1A382B' : '#d97706', margin: '0 auto 16px' }} />
            
            <h1 style={{ fontFamily: 'serif', fontSize: '28px', fontWeight: 'bold', color: '#1c1917', marginBottom: '8px' }}>
              Quiz Evaluation
            </h1>
            
            <p style={{ fontSize: '13px', color: '#78716c', marginBottom: '24px' }}>
              {quiz.title}
            </p>

            <div style={{
              background: result.passed ? '#f0fdf4' : '#fffbeb',
              border: `1px solid ${result.passed ? '#bbf7d0' : '#fef3c7'}`,
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '28px'
            }}>
              <span style={{ fontSize: '36px', fontWeight: 'bold', color: result.passed ? '#166534' : '#92400e', display: 'block' }}>
                {result.score} / {result.totalQuestions}
              </span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: result.passed ? '#15803d' : '#b45309' }}>
                {result.percentage}% Score — {result.passed ? 'PASSED' : 'NEEDS PRACTICE'}
              </span>
            </div>

            {/* Per Question Explanations Breakdown */}
            <div style={{ textAlign: 'left', marginBottom: '28px' }}>
              <h3 style={{ fontFamily: 'serif', fontSize: '16px', fontWeight: 'bold', color: '#1c1917', marginBottom: '12px' }}>
                Question Breakdown & Explanations
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {questions.map((q, idx) => {
                  const userAns = answers[idx] || 'Not answered';
                  const isCorrect = userAns === q.correctAnswer;

                  return (
                    <div key={idx} style={{
                      padding: '14px 16px',
                      borderRadius: '12px',
                      background: isCorrect ? '#f0fdf4' : '#fef2f2',
                      border: `1px solid ${isCorrect ? '#dcfce7' : '#fecdd3'}`,
                      fontSize: '12px'
                    }}>
                      <div style={{ display: 'flex', items: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 'bold', color: '#1c1917' }}>Q{idx + 1}. {q.question}</span>
                        <span style={{ fontWeight: 'bold', color: isCorrect ? '#166534' : '#991b1b' }}>
                          {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                        </span>
                      </div>
                      <p style={{ margin: '2px 0', color: '#444' }}>
                        <strong>Your Answer:</strong> {userAns}
                      </p>
                      {!isCorrect && (
                        <p style={{ margin: '2px 0', color: '#166534' }}>
                          <strong>Correct Answer:</strong> {q.correctAnswer}
                        </p>
                      )}
                      {q.explanation && (
                        <p style={{ margin: '6px 0 0', color: '#666', fontStyle: 'italic', background: 'rgba(255,255,255,0.6)', padding: '6px 10px', borderRadius: '8px' }}>
                          💡 {q.explanation}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={handleRetry}
                style={{
                  padding: '10px 20px',
                  borderRadius: '12px',
                  background: '#EFECE6',
                  color: '#1c1917',
                  fontSize: '13px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Try Again
              </button>

              <button
                onClick={() => navigate('/browse')}
                style={{
                  padding: '10px 20px',
                  borderRadius: '12px',
                  background: '#1A382B',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Back to Articles
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-attempt-page">
      <div className="quiz-attempt-container">
        {/* Back Button */}
        <button className="back-to-article" onClick={() => navigate(-1)}>
          <span>←</span> Back to Article
        </button>

        {/* Question Header */}
        <div className="question-header">
          <span>
            QUESTION {currentQuestion + 1} OF {questions.length}
          </span>
          <span>
            {answeredCount} answered
          </span>
        </div>

        {/* Progress Bar */}
        <div className="quiz-progress">
          <div
            className="quiz-progress-fill"
            style={{
              width: `${((currentQuestion + 1) / questions.length) * 100}%`,
            }}
          />
        </div>

        {/* Question Card */}
        {question && (
          <div className="question-card">
            <h1>{question.question}</h1>

            <div className="options-container">
              {question.options.map((option, index) => {
                const letter = String.fromCharCode(65 + index);
                const isSelected = selectedAnswer === option;

                return (
                  <button
                    key={index}
                    className={`option-button ${isSelected ? "selected" : ""}`}
                    onClick={() => handleSelect(option)}
                  >
                    <span className="option-letter">{letter}</span>
                    <span className="option-text">{option}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Next / Submit Button */}
        <button
          className={`next-question-button ${
            selectedAnswer === undefined || submitting ? "disabled" : ""
          }`}
          disabled={selectedAnswer === undefined || submitting}
          onClick={handleNext}
        >
          {submitting
            ? "Evaluating..."
            : currentQuestion === questions.length - 1
            ? "Submit Quiz"
            : "Next Question"}
        </button>
      </div>
    </div>
  );
};

export default QuizAttempt;