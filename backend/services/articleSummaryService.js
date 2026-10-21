const calculateReadingStats = (text) => {
  const words = text ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  const timeSavedMinutes = Math.max(1, Math.round(words / 220));
  return { words, timeSavedMinutes };
};

const summarizeArticle = async ({ title, content, description }) => {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL;
  const baseUrl = process.env.GROQ_BASE_URL;

  if (!apiKey || !model || !baseUrl) {
    throw new Error('Groq API configuration missing (GROQ_API_KEY, GROQ_MODEL, or GROQ_BASE_URL).');
  }

  const fullText = [title, description, content].filter(Boolean).join('\n\n');
  const { words, timeSavedMinutes } = calculateReadingStats(fullText);

  const startTime = Date.now();

  const systemPrompt = `You are an expert editorial assistant for Lumen CMS.
Generate an executive summary and key takeaways for an article.
Respond ONLY with valid, raw JSON without markdown code fences or backticks.
The JSON object must match this exact schema:
{
  "executiveSummary": "A concise 2-3 sentence overview explaining what the article covers and its core significance.",
  "keyTakeaways": [
    {
      "id": 1,
      "title": "Short Bold Title (3-5 words)",
      "point": "Clear, informative explanation of this specific key finding or concept."
    }
  ]
}
Provide exactly 3 to 5 key takeaways depending on the length of the article and the content quality of the article. Do not include markdown codeblocks, just the pure JSON string.`;

  const userPrompt = `Article Title: ${title || 'Untitled'}\n\nArticle Content:\n${fullText.slice(0, 14000)}`;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Groq API returned status ${response.status}: ${errorBody}`);
  }

  const payload = await response.json();
  const rawContent = payload.choices?.[0]?.message?.content || '';

  let cleanJson = rawContent.trim();
  if (cleanJson.startsWith('```json')) {
    cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
  } else if (cleanJson.startsWith('```')) {
    cleanJson = cleanJson.replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
  }

  const parsed = JSON.parse(cleanJson);
  const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(1);

  const formattedTakeaways = Array.isArray(parsed.keyTakeaways)
    ? parsed.keyTakeaways.map((item, index) => ({
        id: item.id || index + 1,
        title: item.title || `Point ${index + 1}`,
        point: item.point || item.description || ''
      }))
    : [];

  return {
    executiveSummary: parsed.executiveSummary || '',
    keyTakeaways: formattedTakeaways,
    wordsAnalyzed: words,
    timeSavedMinutes: Math.max(1, timeSavedMinutes),
    generationTimeSeconds: durationSeconds,
    provider: 'groq-qwen'
  };
};

const chatWithArticle = async ({ title, content, userMessage, conversationHistory = [] }) => {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL;
  const baseUrl = process.env.GROQ_BASE_URL;

  if (!apiKey || !model || !baseUrl) {
    throw new Error('Groq API configuration missing (GROQ_API_KEY, GROQ_MODEL, or GROQ_BASE_URL).');
  }

  const systemPrompt = `You are an intelligent reading assistant for Lumen CMS.
You are helping a reader understand the article titled "${title || 'Untitled'}".
Here is the full text of the article for context:
---
${(content || '').slice(0, 12000)}
---
Answer the reader's questions clearly, concisely, and insightfully based on the article content.
Keep your answers focused, easy to read, and polite.`;

  const formattedHistory = Array.isArray(conversationHistory)
    ? conversationHistory.slice(-6).map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: String(msg.content || '')
      }))
    : [];

  const messages = [
    { role: 'system', content: systemPrompt },
    ...formattedHistory,
    { role: 'user', content: String(userMessage || '').trim() }
  ];

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.5,
      max_tokens: 800
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Groq API returned status ${response.status}: ${errorBody}`);
  }

  const payload = await response.json();
  const reply = payload.choices?.[0]?.message?.content || 'No response generated.';

  return { reply };
};

module.exports = {
  summarizeArticle,
  chatWithArticle
};
