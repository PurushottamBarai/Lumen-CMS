const QuizAttempt = require('../models/QuizAttempt');
const Quiz = require('../models/Quiz');
const { createNotification } = require('./notificationController');
const mongoose = require('mongoose');

// Submit Quiz Attempt
const submitQuizAttempt = async (req, res) => {
  try {
    const { quizId, answers } = req.body;

    if (!quizId || !mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid Quiz ID is required',
      });
    }

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'Answers array is required',
      });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
    }

    // Evaluate answers
    let score = 0;
    const evaluatedAnswers = [];

    quiz.questions.forEach((q) => {
      const submittedAnswer = answers.find(
        (a) => a.questionId?.toString() === q._id.toString() || a.questionIndex?.toString() === q._id.toString()
      ) || answers.find(
        (a, idx) => quiz.questions[idx]?._id.toString() === q._id.toString()
      );

      const selectedOption = submittedAnswer ? submittedAnswer.selectedOption : '';
      const isCorrect = selectedOption === q.correctAnswer;

      if (isCorrect) score += 1;

      evaluatedAnswers.push({
        questionId: q._id,
        questionText: q.question,
        selectedOption: selectedOption || 'Not answered',
        correctAnswer: q.correctAnswer,
        isCorrect,
      });
    });

    const totalQuestions = quiz.questions.length;
    const percentage = Math.round((score / totalQuestions) * 100);
    const passed = percentage >= 60;

    let attempt = null;

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      attempt = await QuizAttempt.create({
        user: req.user._id,
        quiz: quiz._id,
        article: quiz.articleId || null,
        quizTitle: quiz.title,
        answers: evaluatedAnswers,
        score,
        totalQuestions,
        percentage,
        passed,
      });

      // Send notification to user
      await createNotification({
        user: req.user._id,
        title: `Quiz Result: ${quiz.title}`,
        message: `You scored ${score}/${totalQuestions} (${percentage}%). ${passed ? 'Great job, you passed!' : 'Keep practicing!'}`,
        type: 'quiz_result',
        link: '/profile',
      });
    } else {
      // In-memory response format if DB disconnected
      attempt = {
        _id: new mongoose.Types.ObjectId(),
        user: req.user._id,
        quiz: quiz._id,
        article: quiz.articleId,
        quizTitle: quiz.title,
        answers: evaluatedAnswers,
        score,
        totalQuestions,
        percentage,
        passed,
        createdAt: new Date(),
      };
    }

    res.status(201).json({
      success: true,
      message: 'Quiz attempt evaluated successfully',
      result: {
        score,
        totalQuestions,
        percentage,
        passed,
        evaluatedAnswers,
        attempt,
      },
    });
  } catch (error) {
    console.error('Submit Quiz Attempt Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to evaluate quiz attempt',
    });
  }
};

// Get My Quiz Attempts
const getMyQuizAttempts = async (req, res) => {
  try {
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        count: 0,
        attempts: [],
      });
    }

    const attempts = await QuizAttempt.find({ user: req.user._id })
      .populate('quiz', 'title description')
      .populate('article', 'title category')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: attempts.length,
      attempts,
    });
  } catch (error) {
    console.error('Get My Quiz Attempts Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz attempts',
    });
  }
};

// Get Attempts for a Quiz
const getQuizAttemptsByQuizId = async (req, res) => {
  try {
    const { quizId } = req.params;
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        count: 0,
        attempts: [],
      });
    }

    const attempts = await QuizAttempt.find({ quiz: quizId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: attempts.length,
      attempts,
    });
  } catch (error) {
    console.error('Get Quiz Attempts Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz attempts',
    });
  }
};

module.exports = {
  submitQuizAttempt,
  getMyQuizAttempts,
  getQuizAttemptsByQuizId,
};
