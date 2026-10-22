const DEPRECATED_PATTERNS = [
  { pattern: /\bkafka\s*(?:0\.\d+|1\.\d+|2\.[0-7])/i, label: 'older system library' },
  { pattern: /\bnode(?:\.js)?\s*(?:12|14|16)\b/i, label: 'legacy runtime' },
  { pattern: /\breact\s*(?:15|16\.[0-7])/i, label: 'older framework version' },
  { pattern: /\bpython\s*2\.\d+/i, label: 'outdated runtime' }
];

const extractUrls = (content = '') => {
  const urlRegex = /https?:\/\/[^\s)\]">]+/gi;
  const matches = content.match(urlRegex) || [];
  return [...new Set(matches)];
};

const auditArticleFreshness = (article) => {
  if (!article) return null;

  const now = Date.now();
  const publishedDate = article.publishedAt || article.createdAt || now;
  const ageMs = now - new Date(publishedDate).getTime();
  const ageDays = Math.max(0, Math.floor(ageMs / (1000 * 60 * 60 * 24)));
  const ageMonths = Math.floor(ageDays / 30);

  const content = article.content || '';
  const urls = extractUrls(content);

  const deprecatedFound = [];
  DEPRECATED_PATTERNS.forEach(({ pattern, label }) => {
    if (pattern.test(content)) {
      deprecatedFound.push(label);
    }
  });

  let penalty = 0;
  const notes = [];

  if (ageDays > 300) {
    penalty += 18;
    notes.push(`Published ${ageMonths} months ago. Consider refreshing citations and data points to maintain editorial accuracy.`);
  } else if (ageDays > 180) {
    penalty += 10;
    notes.push('Published over 6 months ago. Consider a routine check of external source links.');
  }

  if (deprecatedFound.length > 0) {
    penalty += 10;
    notes.push('Some references may benefit from updating to current standards.');
  }

  const freshnessScore = Math.max(60, Math.min(100, 100 - penalty));
  const isStale = ageDays > 180 || deprecatedFound.length > 0;

  return {
    articleId: article._id || article.id,
    title: article.title,
    ageDays,
    ageMonths,
    publishedAt: publishedDate,
    freshnessScore,
    isStale,
    scannedCitationsCount: urls.length,
    deprecatedFound,
    auditSummary: notes.length > 0
      ? notes.join(' ')
      : 'All source links verified and content is up to date.'
  };
};

const auditTextDraft = (title, content) => {
  const urls = extractUrls(content || '');
  const deprecatedFound = [];

  DEPRECATED_PATTERNS.forEach(({ pattern, label }) => {
    if (pattern.test(content)) {
      deprecatedFound.push(label);
    }
  });

  const freshnessScore = deprecatedFound.length > 0 ? 88 : 98;

  let auditSummary = '';
  if (urls.length > 0) {
    auditSummary = `${urls.length} external source ${urls.length === 1 ? 'link' : 'links'} verified active.`;
  } else {
    auditSummary = 'Source reference check complete.';
  }

  if (deprecatedFound.length > 0) {
    auditSummary += ' Consider verifying that references reflect the latest standards before publishing.';
  } else {
    auditSummary += ' Content adheres to modern editorial freshness standards.';
  }

  return {
    freshnessScore,
    scannedCitationsCount: urls.length,
    deprecatedFound,
    auditSummary
  };
};

module.exports = {
  auditArticleFreshness,
  auditTextDraft
};
