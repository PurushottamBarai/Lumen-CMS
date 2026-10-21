# AI Topic & Trend Detection — implementation notes

## What it does

The Browse Articles page now displays a **Topics on the Rise** section. It identifies recurring topics from published article categories, tags, titles, and descriptions, then compares publishing frequency over the most recent seven days with the preceding seven days.

For each topic, the API returns its article count, recent and previous-week publication counts, total views and likes across matched articles, and a simple label (`Rising`, `Steady`, `Cooling`, or `Popular`).

## API

`GET /api/articles/topics/trends`

The endpoint is public and only analyzes articles with `status: "published"`. It is registered before the generic `GET /api/articles/:id` route so `topics/trends` is not interpreted as an article ID.

## Implementation files

- `backend/services/topicTrendService.js` — keyword and phrase extraction, topic aggregation, and week-over-week comparison.
- `backend/controllers/articleController.js` — loads published articles and returns the trend analysis.
- `backend/routes/articleRoutes.js` — exposes the API route.
- `frontend/src/pages/Placeholders.jsx` — displays the topic cards and lets readers explore articles by clicking a topic.
- `backend/tests/topicTrends.test.js` — focused tests for topic counts and rising-topic classification.

## Important data limitation

The current Article model stores the current total `views` and `likes`, but does not store dated view/like events or historical snapshots. Therefore, this implementation determines whether a topic is rising from **publication frequency**, not from week-over-week engagement growth. Views and likes are shown as current totals for context. A later iteration could add interaction-event records or periodic snapshots for more accurate engagement trends.

The topic extraction is a lightweight, dependency-free NLP approach (tags, categories, filtered keywords, and two-word phrases); it does not call a generative AI model. This keeps the feature usable without requiring an additional API key or paid model call.
