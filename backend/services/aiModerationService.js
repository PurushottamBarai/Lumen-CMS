/**
 * AI Content Moderation Service
 * Uses Google Gemini 1.5 Flash for intelligent content analysis.
 * Falls back to rule-based keyword scanning if no API key is provided.
 *
 * Risk Levels:
 *   low      (0–39)  → Auto-publish
 *   moderate (40–69) → Send to admin review + warn author
 *   high     (70–100)→ Block immediately
 */

let GoogleGenerativeAI;
try {
  ({ GoogleGenerativeAI } = require('@google/generative-ai'));
} catch (_) {
  GoogleGenerativeAI = null;
}

// ─── Rule-Based Fallback ──────────────────────────────────────────────────────

const HIGH_RISK_RULES = [
  { pattern: /\b(kill|murder|massacre|genocide|terrorist|bomb|explosive|suicide\s+bomb)\b/gi, label: 'violent_threat' },
  { pattern: /\b(hate\s+speech|racial\s+slur|n[i*]gg[ae]r|f[a*]gg[o*]t)\b/gi, label: 'hate_speech' },
  { pattern: /\b(child\s+pornography|csam|pedophil|rape\s+children)\b/gi, label: 'child_safety' },
  { pattern: /\b(buy\s+drugs|sell\s+drugs|cocaine|heroin|meth\s+recipe)\b/gi, label: 'illicit_substances' },
  { pattern: /\b(hack\s+account|steal\s+password|ddos\s+attack)\b/gi, label: 'cyberattack_threat' },
];

const MODERATE_RISK_RULES = [
  { pattern: /\b(violence|violent|attack|assault|fight|weapon|gun|knife)\b/gi, label: 'violence' },
  { pattern: /\b(drug|marijuana|cannabis|alcohol\s+abuse|drunk)\b/gi, label: 'substance_reference' },
  { pattern: /\b(sex|porn|nude|naked|explicit|erotic)\b/gi, label: 'adult_content' },
  { pattern: /\b(fake\s+news|misinformation|conspiracy|hoax|scam|fraud)\b/gi, label: 'misinformation_or_scam' },
  { pattern: /\b(racist|racism|discrimination|bigot|sexist)\b/gi, label: 'discrimination_flag' },
  { pattern: /\b(hack|exploit|malware|virus|ransomware|phishing)\b/gi, label: 'security_concern' },
];

/**
 * Rule-based fallback moderation.
 * @param {string} text
 * @returns {{ score: number, level: string, flags: string[], reason: string }}
 */
const ruleBasedScan = (text) => {
  const flags = [];
  let score = 0;

  for (const rule of HIGH_RISK_RULES) {
    if (rule.pattern.test(text)) {
      flags.push(rule.label);
      score += 75;
    }
    rule.pattern.lastIndex = 0;
  }

  for (const rule of MODERATE_RISK_RULES) {
    if (rule.pattern.test(text)) {
      flags.push(rule.label);
      score += 45;
    }
    rule.pattern.lastIndex = 0;
  }

  score = Math.min(score, 100);

  const level = score >= 70 ? 'high' : score >= 40 ? 'moderate' : 'low';

  const reason =
    flags.length > 0
      ? `Rule-based scan detected potentially problematic content related to: ${[...new Set(flags)].slice(0, 3).join(', ')}.`
      : 'No policy violations detected by rule-based scan.';

  return { score, level, flags: [...new Set(flags)], reason };
};

// ─── Gemini AI Scan ───────────────────────────────────────────────────────────

const GEMINI_PROMPT = (contentType, title, body) => `
You are an AI content moderation assistant for an educational content management system.
Analyze the following ${contentType} and return a JSON risk assessment.

CONTENT TITLE: ${title}
CONTENT BODY: ${body.substring(0, 3000)}

Evaluate for:
1. Hate speech, discrimination, or offensive language
2. Violence, dangerous content, or threats
3. Misinformation or factually harmful claims
4. Adult/explicit content
5. Spam, scam, or deceptive content
6. Drug/weapon promotion
7. Privacy violations or doxxing

Return ONLY valid JSON (no markdown, no explanation outside JSON):
{
  "score": <integer 0-100>,
  "level": "<low|moderate|high>",
  "flags": ["<flag1>", "<flag2>"],
  "reason": "<one sentence explanation>"
}

Score guide:
- 0-39: Clean educational content, auto-publish safe
- 40-69: Mild concerns, needs human review
- 70-100: Clear violations, block immediately
`;

/**
 * Scans content using Gemini 1.5 Flash AI.
 * @param {string} contentType - 'article' or 'quiz'
 * @param {string} title
 * @param {string} body
 * @returns {Promise<{ score: number, level: string, flags: string[], reason: string }>}
 */
const geminiScan = async (contentType, title, body) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || !GoogleGenerativeAI) {
    console.log('[AI Moderation] No Gemini API key found — using rule-based fallback.');
    return ruleBasedScan(`${title} ${body}`);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

    const prompt = GEMINI_PROMPT(contentType, title, body);
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    // Strip any markdown code fences if present
    const jsonText = responseText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(jsonText);

    return {
      score: Math.min(100, Math.max(0, Number(parsed.score) || 0)),
      level: ['low', 'moderate', 'high'].includes(parsed.level) ? parsed.level : 'moderate',
      flags: Array.isArray(parsed.flags) ? parsed.flags.slice(0, 10) : [],
      reason: String(parsed.reason || 'AI moderation completed.'),
    };
  } catch (error) {
    console.error('[AI Moderation] Gemini API error — falling back to rule-based scan:', error.message);
    return ruleBasedScan(`${title} ${body}`);
  }
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Main entry point. Analyzes article or quiz content.
 *
 * @param {'article'|'quiz'} contentType
 * @param {string} title
 * @param {string} body  - article content OR serialized quiz questions
 * @returns {Promise<{ score, level, flags, reason, checkedAt }>}
 */
const scanContent = async (contentType, title, body) => {
  const result = await geminiScan(contentType, title, body);

  return {
    ...result,
    checkedAt: new Date(),
  };
};

module.exports = { scanContent };
