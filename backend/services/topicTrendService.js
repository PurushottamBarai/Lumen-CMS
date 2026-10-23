const STOP_WORDS = new Set(`a an the and or but if then else when while where what which who how why of in on at to from by for with about into through over under between after before during is are was were be been being have has had do does did can could should would will just very more most some any all each both other such than too also not no nor it its they them their we our you your this that these those as article articles guide introduction overview tips ways new using use used based make made`.split(/\s+/));
const GENERIC_TERMS = new Set(['other', 'general', 'uncategorized']);
const DAY = 24 * 60 * 60 * 1000;
const normalize = (value) => String(value ?? '').normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}+#]+/gu, ' ').trim().replace(/\s+/g, ' ');
const displayName = (value) => String(value ?? '').normalize('NFKC').replace(/[^\p{L}\p{N}+#]+/gu, ' ').trim().replace(/\s+/g, ' ').replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase());
const toTerms = (value) => normalize(value).split(' ').filter(Boolean);
function extractKeywords(article) {
  const candidates = new Map();
  const add = (raw, preserveCuratedPhrase = false) => {
    const key = normalize(raw);
    const words = key.split(' ').filter(Boolean);
    if (!key || GENERIC_TERMS.has(key) || words.length > 4 || (!preserveCuratedPhrase && words.some((word) => STOP_WORDS.has(word))) || words.every((word) => STOP_WORDS.has(word) || /^\d+$/.test(word))) return;
    if (!candidates.has(key)) candidates.set(key, { key, name: displayName(key), curated: preserveCuratedPhrase });
    else if (preserveCuratedPhrase) candidates.get(key).curated = true;
  };
  add(article.category);
  // Tags are curated labels. Preserve useful phrases such as "AI in Education"
  // even though free-text extraction removes stop words like "in".
  (Array.isArray(article.tags) ? article.tags : []).forEach((tag) => add(tag, true));
  const source = [article.title, article.description, article.summary, article.content].filter((part) => typeof part === 'string').join(' ').replace(/https?:\/\/\S+/giu, ' ').replace(/<[^>]*>/g, ' ');
  const tokens = toTerms(source);
  tokens.forEach((word) => { if (word.length >= 3 && !STOP_WORDS.has(word) && !/^\d+$/.test(word)) add(word); });
  for (let i = 0; i < tokens.length - 1; i += 1) {
    const phrase = tokens.slice(i, i + 2);
    if (phrase.every((word) => word.length >= 3 && !STOP_WORDS.has(word) && !/^\d+$/.test(word))) add(phrase.join(' '));
  }
  return [...candidates.values()];
}
function articleDate(article) {
  const value = article.publishedAt || article.createdAt || article.updatedAt;
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
function finiteMetric(article, field) {
  if (!Object.prototype.hasOwnProperty.call(article, field) || article[field] === null || article[field] === '') return null;
  const value = Number(article[field]);
  return Number.isFinite(value) && value >= 0 ? value : null;
}
function buildTopicTrends(inputArticles, now = new Date(), semanticGroups = []) {
  const articles = (Array.isArray(inputArticles) ? inputArticles : []).filter((article) => article && article.status === 'published');
  const currentStart = new Date(now.getTime() - 7 * DAY);
  const previousStart = new Date(now.getTime() - 14 * DAY);
  const topicAliases = new Map();
  for (const group of semanticGroups) {
    const canonicalKey = normalize(group?.name);
    if (!canonicalKey || !Array.isArray(group?.memberNames)) continue;
    for (const memberName of group.memberNames) {
      const memberKey = normalize(memberName);
      if (memberKey) topicAliases.set(memberKey, { key: canonicalKey, name: displayName(group.name) });
    }
  }
  const topics = new Map();
  for (const article of articles) {
    const date = articleDate(article);
    const terms = extractKeywords(article);
    const articleTopics = new Map();
    for (const term of terms) {
      const alias = topicAliases.get(term.key);
      const key = alias?.key || term.key;
      if (!articleTopics.has(key)) articleTopics.set(key, { name: alias?.name || term.name, members: [] });
      articleTopics.get(key).members.push(term);
    }
    for (const [key, articleTopic] of articleTopics) {
      const name = articleTopic.name;
      let topic = topics.get(key);
      if (!topic) {
        topic = { name, keywords: new Set(), categories: new Set(), articleCount: 0, recentArticles: 0, previousArticles: 0, undatedArticles: 0, engagement: {}, articles: [], curated: false };
        topics.set(key, topic);
      }
      topic.articleCount += 1;
      if (article.category) topic.categories.add(article.category);
      if (articleTopic.members.some((term) => term.curated)) topic.curated = true;
      articleTopic.members.forEach((term) => topic.keywords.add(term.name));
      if (!date) topic.undatedArticles += 1;
      else if (date > currentStart && date <= now) topic.recentArticles += 1;
      else if (date > previousStart && date <= currentStart) topic.previousArticles += 1;
      if (topic.articles.length < 5) topic.articles.push({ _id: String(article._id || article.id || ''), title: article.title || 'Untitled article', category: article.category || 'Other' });
      for (const field of ['views', 'likes', 'shares', 'comments']) {
        const value = finiteMetric(article, field);
        if (value !== null) topic.engagement[field] = (topic.engagement[field] || 0) + value;
      }
    }
  }
  const hasWindowData = articles.some((article) => { const date = articleDate(article); return date && date > previousStart && date <= now; });
  return [...topics.values()].map((topic) => {
    const growthPercent = topic.previousArticles > 0 ? Math.round(((topic.recentArticles - topic.previousArticles) / topic.previousArticles) * 100) : null;
    let trend = 'Insufficient data';
    if (hasWindowData) {
      if (topic.recentArticles > topic.previousArticles) trend = 'Rising';
      else if (topic.recentArticles === 0 && topic.previousArticles > 0) trend = 'Cooling';
      else if (topic.recentArticles > 0 && Math.abs(topic.recentArticles - topic.previousArticles) / Math.max(topic.recentArticles, topic.previousArticles, 1) <= 0.1) trend = 'Steady';
      else if (topic.recentArticles > 0) trend = 'Cooling';
    }
    return { name: topic.name, keywords: [...topic.keywords].filter((keyword) => normalize(keyword) !== normalize(topic.name)).slice(0, 8), categories: [...topic.categories], articleCount: topic.articleCount, recentArticles: topic.recentArticles, previousArticles: topic.previousArticles, undatedArticles: topic.undatedArticles, growthPercent, trend, popular: topic.articleCount >= Math.max(3, Math.ceil(articles.length * 0.2)), engagement: topic.engagement, articles: topic.articles, _curated: topic.curated };
  }).sort((a, b) => Number(b._curated) - Number(a._curated) || b.recentArticles - a.recentArticles || b.articleCount - a.articleCount || a.name.localeCompare(b.name)).slice(0, 20).map(({ _curated, ...topic }) => topic);
}
module.exports = { buildTopicTrends, extractKeywords, normalizeTopic: normalize };
