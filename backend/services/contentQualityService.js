const STOP_WORDS = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'but',
  'if',
  'then',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'to',
  'of',
  'in',
  'on',
  'for',
  'with',
  'at',
  'by',
  'from',
  'as',
  'this',
  'that',
  'these',
  'those',
  'it',
  'its',
  'into',
  'about',
  'than',
  'can',
  'will',
  'would',
  'should',
  'could',
  'has',
  'have',
  'had',
  'do',
  'does',
  'did',
  'not',
  'we',
  'you',
  'they',
  'he',
  'she',
  'their',
  'our',
  'your',
]);

// ------------------------------------------------------
// Text helpers
// ------------------------------------------------------

const normalizeText = (text = '') =>
  String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const getWords = (text = '') =>
  normalizeText(text)
    .split(' ')
    .filter(Boolean);

const getSentences = (text = '') =>
  String(text)
    .replace(/\s+/g, ' ')
    .split(/[.!?]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

const getKeywords = (text = '') => {
  const words = getWords(text);
  const frequency = {};

  words.forEach((word) => {
    if (word.length > 2 && !STOP_WORDS.has(word)) {
      frequency[word] = (frequency[word] || 0) + 1;
    }
  });

  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);
};

// ------------------------------------------------------
// Readability
// ------------------------------------------------------

const estimateSyllables = (word) => {
  word = String(word).toLowerCase();

  if (word.length <= 3) {
    return 1;
  }

  const cleaned = word
    .replace(/(?:[^aeiouy]e)$/, '')
    .replace(/^y/, '');

  const matches = cleaned.match(/[aeiouy]{1,2}/g);

  return Math.max(1, matches ? matches.length : 1);
};

const calculateReadability = (content = '') => {
  const words = getWords(content);
  const sentences = getSentences(content);

  const wordCount = words.length;
  const sentenceCount = Math.max(sentences.length, 1);

  if (wordCount === 0) {
    return {
      score: 0,
      level: 'No content',
      wordCount: 0,
      sentenceCount: 0,
      averageWordsPerSentence: 0,
    };
  }

  const syllableCount = words.reduce(
    (total, word) => total + estimateSyllables(word),
    0
  );

  const wordsPerSentence = wordCount / sentenceCount;
  const syllablesPerWord = syllableCount / wordCount;

  // Approximate Flesch Reading Ease
  let score =
    206.835 -
    1.015 * wordsPerSentence -
    84.6 * syllablesPerWord;

  score = Math.max(0, Math.min(100, Math.round(score)));

  let level;

  if (score >= 80) {
    level = 'Easy';
  } else if (score >= 60) {
    level = 'Standard';
  } else if (score >= 40) {
    level = 'Intermediate';
  } else if (score >= 20) {
    level = 'Difficult';
  } else {
    level = 'Very Difficult';
  }

  return {
    score,
    level,
    wordCount,
    sentenceCount,
    averageWordsPerSentence: Number(
      wordsPerSentence.toFixed(1)
    ),
  };
};

// ------------------------------------------------------
// Grammar / Writing checks
// ------------------------------------------------------

const analyzeGrammar = (content = '') => {
  const issues = [];
  const sentences = getSentences(content);

  sentences.forEach((sentence, index) => {
    const trimmed = sentence.trim();

    if (!trimmed) {
      return;
    }

    // Sentence capitalization
    if (/^[a-z]/.test(trimmed)) {
      issues.push({
        type: 'capitalization',
        message: `Sentence ${index + 1} should begin with a capital letter.`,
      });
    }

    // Extra spaces
    if (/\s{2,}/.test(trimmed)) {
      issues.push({
        type: 'spacing',
        message: `Sentence ${index + 1} contains unnecessary extra spaces.`,
      });
    }

    // Repeated helping verbs
    if (
      /\b(is|are|was|were)\s+(are|is|was|were)\b/i.test(trimmed)
    ) {
      issues.push({
        type: 'grammar',
        message: `Sentence ${index + 1} may contain repeated helping verbs.`,
      });
    }

    // Repeated articles
    if (/\b(a|an)\s+(a|an)\b/i.test(trimmed)) {
      issues.push({
        type: 'grammar',
        message: `Sentence ${index + 1} may contain repeated articles.`,
      });
    }

    // Long sentences
    if (trimmed.split(/\s+/).length > 35) {
      issues.push({
        type: 'readability',
        message: `Sentence ${index + 1} is very long. Consider splitting it.`,
      });
    }
  });

  // Repeated-word errors
  const repeatedWords = String(content).match(
    /\b([a-zA-Z]+)\s+\1\b/gi
  );

  if (repeatedWords) {
    repeatedWords.forEach((match) => {
      issues.push({
        type: 'repeated-word',
        message: `Repeated word detected: "${match}".`,
      });
    });
  }

  return {
    issueCount: issues.length,
    issues: issues.slice(0, 20),
  };
};

// ------------------------------------------------------
// Structure analysis
// ------------------------------------------------------

const analyzeStructure = ({
  title = '',
  description = '',
  content = '',
  category = '',
  tags = [],
}) => {
  const checks = [];
  let score = 0;

  // Title
  if (title && title.trim()) {
    score += 20;

    checks.push({
      name: 'Title',
      passed: true,
      message: 'Article has a title.',
    });
  } else {
    checks.push({
      name: 'Title',
      passed: false,
      message: 'Add a clear article title.',
    });
  }

  // Description
  if (description && description.trim()) {
    score += 15;

    checks.push({
      name: 'Description',
      passed: true,
      message: 'Article has a description.',
    });
  } else {
    checks.push({
      name: 'Description',
      passed: false,
      message: 'Add a short description.',
    });
  }

  // Content length
  const wordCount = getWords(content).length;

  if (wordCount >= 300) {
    score += 25;

    checks.push({
      name: 'Content length',
      passed: true,
      message: 'Article has sufficient content.',
    });
  } else {
    checks.push({
      name: 'Content length',
      passed: false,
      message: 'Consider expanding the article to at least 300 words.',
    });
  }

  // Category
  if (category && category.trim()) {
    score += 15;

    checks.push({
      name: 'Category',
      passed: true,
      message: 'Article has a category.',
    });
  } else {
    checks.push({
      name: 'Category',
      passed: false,
      message: 'Select an article category.',
    });
  }

  // Tags
  if (Array.isArray(tags) && tags.length > 0) {
    score += 15;

    checks.push({
      name: 'Tags',
      passed: true,
      message: 'Article has tags.',
    });
  } else {
    checks.push({
      name: 'Tags',
      passed: false,
      message: 'Add relevant tags.',
    });
  }

  // Markdown headings
  const headings =
    String(content).match(/^#{1,6}\s+.+/gm) || [];

  if (headings.length > 0) {
    score += 10;

    checks.push({
      name: 'Headings',
      passed: true,
      message: 'Content contains headings.',
    });
  } else {
    checks.push({
      name: 'Headings',
      passed: false,
      message: 'Consider adding headings to improve structure.',
    });
  }

  return {
    score,
    checks,
  };
};

// ------------------------------------------------------
// Similarity
// ------------------------------------------------------

const calculateSimilarity = (textA = '', textB = '') => {
  const wordsA = getKeywords(textA);
  const wordsB = getKeywords(textB);

  if (!wordsA.length || !wordsB.length) {
    return 0;
  }

  const setA = new Set(wordsA);
  const setB = new Set(wordsB);

  const intersection = [...setA].filter((word) =>
    setB.has(word)
  );

  const union = new Set([...setA, ...setB]);

  if (union.size === 0) {
    return 0;
  }

  return Math.round(
    (intersection.length / union.size) * 100
  );
};

const analyzeDuplicates = ({
  title = '',
  content = '',
  existingArticles = [],
}) => {
  const currentText = `${title} ${content}`;

  const matches = existingArticles
    .map((article) => {
      const articleText = `${article.title || ''} ${
        article.content || ''
      }`;

      const titleSimilarity = calculateSimilarity(
        title,
        article.title || ''
      );

      const contentSimilarity = calculateSimilarity(
        currentText,
        articleText
      );

      const similarity = Math.round(
        titleSimilarity * 0.4 +
        contentSimilarity * 0.6
      );

      return {
        articleId: article._id,
        title: article.title,
        category: article.category,
        similarity,
      };
    })
    .filter((article) => article.similarity >= 40)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5);

  const duplicates = matches.filter(
    (article) => article.similarity >= 80
  );

  return {
    duplicateDetected: duplicates.length > 0,
    duplicates,
    similarArticles: matches,
  };
};

// ------------------------------------------------------
// Suggestions
// ------------------------------------------------------

const generateSuggestions = ({
  grammar,
  readability,
  structure,
  duplicateResult,
}) => {
  const suggestions = [];

  if (grammar.issueCount > 0) {
    suggestions.push(
      'Review the grammar and writing issues identified in the article.'
    );
  }

  if (readability.score < 60) {
    suggestions.push(
      'Use shorter sentences and simpler wording to improve readability.'
    );
  }

  if (structure.score < 80) {
    suggestions.push(
      'Improve the article structure by adding missing metadata or headings.'
    );
  }

  if (duplicateResult.duplicateDetected) {
    suggestions.push(
      'Review the highly similar articles before submitting this article.'
    );
  } else if (duplicateResult.similarArticles.length > 0) {
    suggestions.push(
      'Review the similar articles to ensure your content provides a distinct perspective.'
    );
  }

  if (suggestions.length === 0) {
    suggestions.push(
      'Content structure and quality checks look good. Review the article once before submission.'
    );
  }

  return suggestions;
};

// ------------------------------------------------------
// Overall analysis
// ------------------------------------------------------

const analyzeContent = ({
  title = '',
  description = '',
  content = '',
  category = '',
  tags = [],
  existingArticles = [],
}) => {
  const grammar = analyzeGrammar(content);

  const readability = calculateReadability(content);

  const structure = analyzeStructure({
    title,
    description,
    content,
    category,
    tags,
  });

  const duplicateResult = analyzeDuplicates({
    title,
    content,
    existingArticles,
  });

  const grammarScore = Math.max(
    0,
    100 - grammar.issueCount * 10
  );

  const duplicateScore = duplicateResult.duplicateDetected
    ? 40
    : 100;

  const overallScore = Math.round(
    grammarScore * 0.25 +
    readability.score * 0.30 +
    structure.score * 0.25 +
    duplicateScore * 0.20
  );

  const suggestions = generateSuggestions({
    grammar,
    readability,
    structure,
    duplicateResult,
  });

  return {
    score: overallScore,
    grammar,
    readability,
    structure,
    duplicates: duplicateResult,
    suggestions,
  };
};

// ------------------------------------------------------
// Exports
// ------------------------------------------------------

module.exports = {
  analyzeContent,
  analyzeGrammar,
  calculateReadability,
  analyzeDuplicates,
};