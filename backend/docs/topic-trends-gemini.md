# Gemini enrichment for Topic & Trend Detection

Topic trend frequency, engagement aggregation, popularity and classifications are calculated locally from published CMS articles. Gemini adds semantic grouping, concise summaries and evidence-based explanations; it cannot set numerical fields or trend labels.

## Configure

1. Create an API key in [Google AI Studio](https://aistudio.google.com/apikey).
2. Set `GEMINI_API_KEY` in the backend environment (for local development, use `backend/.env`). Keep the key server-side and do not commit `.env` or put the key in a `VITE_` variable.
3. Restart the backend. The configured model is `gemini-3.8-flash` through Google's official `@google/genai` JavaScript SDK.

The existing moderation code also reads this environment variable; this topic integration does not change the moderation module. No new database or database credential is required for topic enrichment.

## Run and verify

From the repository root, start the backend with `cd backend; npm run dev`, then in another terminal start the frontend with `cd frontend; npm run dev`. Sign in and open Admin → Topic & Trends. A topic labeled **Gemini** has validated semantic enrichment; **Rule-based** means that this response used deterministic extraction without Gemini enrichment.

Without a key, on provider errors, timeouts, rate limits, malformed JSON, or invalid topic mappings, the API returns the normal rule-based topic results. The API does not return provider errors or key information to the browser.

## Cache and data handling

Successful enrichment is held in a process-local cache for 15 minutes; provider failures or invalid output are briefly cached for one minute. Gemini requests have a 30-second timeout and at most one retry for transient HTTP failures. Simultaneous requests using the same source article data are coalesced. Changed source data gets a different cache key; the existing dashboard refresh requests current results, and enrichment refreshes automatically after its cache entry expires. Restarting the backend clears the cache. No Gemini call is made by rendering the React page itself.

The request contains only candidate topics, their calculated article-count/trend evidence, and up to five matching published article samples per topic (title, category, tags and a short text excerpt). Article text is treated as untrusted input. No author identity, account credentials, or user tokens are sent. AI article references are never accepted: related articles and all numerical fields are reconstructed from the CMS source records and deterministic trend engine.

Automated tests mock the SDK and do not consume Gemini quota. A real provider request is confirmed only after configuring a valid key and checking for a **Gemini** indicator in the dashboard.
