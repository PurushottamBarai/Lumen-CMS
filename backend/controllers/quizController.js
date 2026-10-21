const mongoose = require('mongoose');
const Quiz = require('../models/Quiz');
const Article = require('../models/Article');

const seededQuizzes = [
  {
    _id: 'quiz-crispr-1',
    id: 'quiz-crispr-1',
    title: 'Genetics & Biotechnology Knowledge Checkpoint',
    description: 'Test your understanding of CRISPR Cas9 and molecular gene editing.',
    articleId: '66c9f2b00000000000000001',
    status: 'approved',
    questions: [
      {
        _id: 'q1',
        question: 'What does CRISPR stand for?',
        options: [
          'Clustered Regularly Interspaced Short Palindromic Repeats',
          'Coded Recombinant Integrated Short Protein Repeats',
          'Clustered RNA Integrated Sequence Protein Replication',
          'Cellular Recombination in Short Palindromic Regions',
        ],
        correctAnswer: 'Clustered Regularly Interspaced Short Palindromic Repeats',
        explanation: 'CRISPR stands for Clustered Regularly Interspaced Short Palindromic Repeats, an essential component of bacterial adaptive immunity.',
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
        explanation: 'Jennifer Doudna and Emmanuelle Charpentier received the Nobel Prize for discovering the gene-editing tool.',
      },
    ],
  },
  {
    _id: 'quiz-internet-2',
    id: 'quiz-internet-2',
    title: 'History of ARPANET & Early Internet Checkpoint',
    description: 'Test your knowledge of the earliest electronic network transmissions.',
    articleId: '66c9f2b00000000000000002',
    status: 'approved',
    questions: [
      {
        _id: 'q1',
        question: 'What were the first two letters transmitted over ARPANET before the system crashed?',
        options: ['LO', 'IN', 'HI', 'GO'],
        correctAnswer: 'LO',
        explanation: 'The programmer typed "LOGIN", but the host system crashed after receiving the first two letters "LO".',
      },
      {
        _id: 'q2',
        question: 'Which university hosted the first host terminal in October 1969?',
        options: ['UCLA', 'MIT', 'Harvard', 'Stanford'],
        correctAnswer: 'UCLA',
        explanation: 'The first transmission was sent from UCLA to Stanford Research Institute.',
      },
      {
        _id: 'q3',
        question: 'What precursor network laid the groundwork for today\'s global internet?',
        options: ['ARPANET', 'ENIAC', 'ETHERNET', 'BITNET'],
        correctAnswer: 'ARPANET',
        explanation: 'ARPANET established packet switching standards that became the foundation of TCP/IP.',
      },
    ],
  },
];

let inMemoryQuizzes = [...seededQuizzes];

const validateQuestions = (questions) => {
  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return 'Quiz must have at least one question';
  }

  for (const question of questions) {
    if (!question.question || !question.question.trim()) {
      return 'Question text is required';
    }

    if (!question.options || !Array.isArray(question.options) || question.options.length !== 4) {
      return 'Each question must have exactly 4 options';
    }

    const trimmedOptions = question.options.map((option) => (option ? option.trim() : ''));

    if (trimmedOptions.some((option) => !option)) {
      return 'All options are required';
    }

    if (new Set(trimmedOptions).size !== 4) {
      return 'All options must be different';
    }

    if (!question.correctAnswer || !question.correctAnswer.trim()) {
      return 'Correct answer is required';
    }

    const correctAnswer = question.correctAnswer.trim();

    if (!trimmedOptions.includes(correctAnswer)) {
      return 'Correct answer must match one of the options';
    }
  }

  return null;
};

// Create Quiz
const createQuiz = async (req, res) => {
  try {
    const { title, description, articleId, questions } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Quiz title is required',
      });
    }

    const questionValidationError = validateQuestions(questions);
    if (questionValidationError) {
      return res.status(400).json({
        success: false,
        message: questionValidationError,
      });
    }

    const newQuizObj = {
      _id: `quiz-${Date.now()}`,
      id: `quiz-${Date.now()}`,
      title: title.trim(),
      description: description ? description.trim() : '',
      articleId: articleId || null,
      createdBy: req.user?._id || req.user?.id,
      questions,
      status: 'draft',
    };

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      const existingQuiz = await Quiz.findOne({ title: title.trim() });
      if (existingQuiz) {
        return res.status(400).json({
          success: false,
          message: 'A quiz with this title already exists',
        });
      }

      const quiz = await Quiz.create({
        title: title.trim(),
        description: description ? description.trim() : '',
        articleId: articleId && mongoose.Types.ObjectId.isValid(articleId) ? articleId : null,
        createdBy: req.user?._id || req.user?.id,
        questions,
        status: 'draft',
      });

      if (articleId && mongoose.Types.ObjectId.isValid(articleId)) {
        await Article.findByIdAndUpdate(articleId, { 'quiz.enabled': true });
      }

      return res.status(201).json({
        success: true,
        message: 'Quiz created successfully',
        quiz,
      });
    }

    inMemoryQuizzes.unshift(newQuizObj);

    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      quiz: newQuizObj,
    });
  } catch (error) {
    console.error('Create Quiz Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create quiz',
    });
  }
};

// Get All Quizzes
const getAllQuizzes = async (req, res) => {
  try {
    const { status, articleId } = req.query;

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      const filter = {};
      if (status && status !== 'all') filter.status = status;
      if (articleId) filter.articleId = articleId;

      const quizzes = await Quiz.find(filter)
        .populate('createdBy', 'name email role')
        .populate('articleId', 'title category')
        .sort({ createdAt: -1 });

      if (quizzes.length > 0) {
        return res.status(200).json({
          success: true,
          count: quizzes.length,
          quizzes,
        });
      }
    }

    let list = [...inMemoryQuizzes];
    if (status && status !== 'all') {
      list = list.filter((q) => q.status === status);
    }
    if (articleId) {
      list = list.filter((q) => q.articleId === articleId);
    }

    res.status(200).json({
      success: true,
      count: list.length,
      quizzes: list,
    });
  } catch (error) {
    console.error('Get Quizzes Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve quizzes',
    });
  }
};

// Get Quiz By ID
const getQuizById = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection && mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const quiz = await Quiz.findById(id)
        .populate('createdBy', 'name email role')
        .populate('articleId', 'title category');

      if (quiz) {
        return res.status(200).json({
          success: true,
          quiz,
        });
      }
    }

    const found = inMemoryQuizzes.find((q) => q._id === id || q.id === id);
    if (!found) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
    }

    res.status(200).json({
      success: true,
      quiz: found,
    });
  } catch (error) {
    console.error('Get Quiz Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Quiz not found',
    });
  }
};

// Get Quiz By Article ID
const getQuizByArticleId = async (req, res) => {
  try {
    const { articleId } = req.params;

    if (mongoose.connection && mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(articleId)) {
      const quiz = await Quiz.findOne({ articleId })
        .populate('createdBy', 'name email role');

      if (quiz) {
        return res.status(200).json({
          success: true,
          quiz,
        });
      }
    }

    const found = inMemoryQuizzes.find((q) => q.articleId === articleId);
    if (!found) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
    }

    res.status(200).json({
      success: true,
      quiz: found,
    });
  } catch (error) {
    console.error('Get Quiz By Article Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Quiz not found',
    });
  }
};

// Update Quiz
const updateQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, questions, articleId } = req.body;

    if (mongoose.connection && mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const quiz = await Quiz.findById(id);

      if (!quiz) {
        return res.status(404).json({ success: false, message: 'Quiz not found' });
      }

      if (title !== undefined && !title.trim()) {
        return res.status(400).json({ success: false, message: 'Quiz title is required' });
      }

      if (title !== undefined) {
        const existingQuiz = await Quiz.findOne({ title: title.trim(), _id: { $ne: id } });
        if (existingQuiz) {
          return res.status(400).json({ success: false, message: 'A quiz with this title already exists' });
        }
        quiz.title = title.trim();
      }

      if (description !== undefined) quiz.description = description.trim();

      if (questions !== undefined) {
        const questionValidationError = validateQuestions(questions);
        if (questionValidationError) {
          return res.status(400).json({ success: false, message: questionValidationError });
        }
        quiz.questions = questions;
      }

      if (articleId !== undefined) quiz.articleId = articleId;

      await quiz.save();
      return res.status(200).json({ success: true, message: 'Quiz updated successfully', quiz });
    }

    const quizIdx = inMemoryQuizzes.findIndex((q) => q._id === id || q.id === id);
    if (quizIdx !== -1) {
      if (title) inMemoryQuizzes[quizIdx].title = title;
      if (description) inMemoryQuizzes[quizIdx].description = description;
      if (questions) inMemoryQuizzes[quizIdx].questions = questions;
      if (articleId) inMemoryQuizzes[quizIdx].articleId = articleId;
      return res.status(200).json({ success: true, message: 'Quiz updated successfully', quiz: inMemoryQuizzes[quizIdx] });
    }

    return res.status(200).json({ success: true, message: 'Quiz updated successfully' });
  } catch (error) {
    console.error('Update Quiz Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update quiz' });
  }
};

// Delete Quiz
const deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection && mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const quiz = await Quiz.findById(id);

      if (!quiz) {
        return res.status(404).json({ success: false, message: 'Quiz not found' });
      }

      await quiz.deleteOne();
      return res.status(200).json({ success: true, message: 'Quiz deleted successfully' });
    }

    inMemoryQuizzes = inMemoryQuizzes.filter((q) => q._id !== id && q.id !== id);
    res.status(200).json({ success: true, message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Delete Quiz Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete quiz' });
  }
};

// Add Question
const addQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, options, correctAnswer, explanation } = req.body;

    const validation = validateQuestions([{ question, options, correctAnswer }]);
    if (validation) {
      return res.status(400).json({ success: false, message: validation });
    }

    if (mongoose.connection && mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const quiz = await Quiz.findById(id);
      if (!quiz) {
        return res.status(404).json({ success: false, message: 'Quiz not found' });
      }

      quiz.questions.push({ question, options, correctAnswer, explanation: explanation || '' });
      await quiz.save();
      return res.status(201).json({ success: true, message: 'Question added successfully', quiz });
    }

    const quiz = inMemoryQuizzes.find((q) => q._id === id || q.id === id);
    if (quiz) {
      quiz.questions.push({ _id: `q-${Date.now()}`, question, options, correctAnswer, explanation: explanation || '' });
      return res.status(201).json({ success: true, message: 'Question added successfully', quiz });
    }

    res.status(404).json({ success: false, message: 'Quiz not found' });
  } catch (error) {
    console.error('Add Question Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to add question' });
  }
};

// Update Question
const updateQuestion = async (req, res) => {
  try {
    const { id, questionId } = req.params;
    const { question, options, correctAnswer, explanation } = req.body;

    if (mongoose.connection && mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const quiz = await Quiz.findById(id);
      if (!quiz) {
        return res.status(404).json({ success: false, message: 'Quiz not found' });
      }

      const qDoc = quiz.questions.id(questionId);
      if (!qDoc) {
        return res.status(404).json({ success: false, message: 'Question not found' });
      }

      if (question !== undefined) qDoc.question = question;
      if (options !== undefined) qDoc.options = options;
      if (correctAnswer !== undefined) qDoc.correctAnswer = correctAnswer;
      if (explanation !== undefined) qDoc.explanation = explanation;

      await quiz.save();
      return res.status(200).json({ success: true, message: 'Question updated successfully', quiz });
    }

    res.status(200).json({ success: true, message: 'Question updated successfully' });
  } catch (error) {
    console.error('Update Question Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update question' });
  }
};

// Delete Question
const deleteQuestion = async (req, res) => {
  try {
    const { id, questionId } = req.params;

    if (mongoose.connection && mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const quiz = await Quiz.findById(id);
      if (!quiz) {
        return res.status(404).json({ success: false, message: 'Quiz not found' });
      }

      quiz.questions.pull({ _id: questionId });
      await quiz.save();
      return res.status(200).json({ success: true, message: 'Question deleted successfully', quiz });
    }

    res.status(200).json({ success: true, message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Delete Question Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete question' });
  }
};

// Attach Quiz to Article
const attachQuizToArticle = async (req, res) => {
  try {
    const { id, articleId } = req.params;

    if (mongoose.connection && mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const quiz = await Quiz.findById(id);
      if (!quiz) {
        return res.status(404).json({ success: false, message: 'Quiz not found' });
      }

      quiz.articleId = articleId;
      await quiz.save();

      if (mongoose.Types.ObjectId.isValid(articleId)) {
        await Article.findByIdAndUpdate(articleId, { 'quiz.enabled': true });
      }

      return res.status(200).json({ success: true, message: 'Quiz attached to article successfully', quiz });
    }

    res.status(200).json({ success: true, message: 'Quiz attached to article successfully' });
  } catch (error) {
    console.error('Attach Quiz Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to attach quiz to article' });
  }
};

// Submit Quiz for Review
const submitQuiz = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection && mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const quiz = await Quiz.findById(id);
      if (!quiz) {
        return res.status(404).json({ success: false, message: 'Quiz not found' });
      }

      quiz.status = 'submitted';
      await quiz.save();
      return res.status(200).json({ success: true, message: 'Quiz submitted for admin review', quiz });
    }

    const found = inMemoryQuizzes.find((q) => q._id === id || q.id === id);
    if (found) {
      found.status = 'submitted';
      return res.status(200).json({ success: true, message: 'Quiz submitted for admin review', quiz: found });
    }

    res.status(200).json({ success: true, message: 'Quiz submitted for admin review' });
  } catch (error) {
    console.error('Submit Quiz Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to submit quiz' });
  }
};

module.exports = {
  createQuiz,
  getAllQuizzes,
  getQuizById,
  getQuizByArticleId,
  updateQuiz,
  deleteQuiz,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  attachQuizToArticle,
  submitQuiz,
  inMemoryQuizzes,
};
