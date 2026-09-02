import re
from collections import Counter
from sqlalchemy import text

from database.connection import engine


STOPWORDS = {
    "the", "and", "for", "that", "this", "with", "from", "are",
    "was", "were", "have", "has", "had", "will", "would", "could",
    "should", "about", "into", "over", "after", "before", "their",
    "there", "they", "them", "then", "than", "when", "where",
    "what", "which", "while", "also", "just", "more", "most",
    "very", "your", "you", "our", "out", "not", "but", "all",
    "can", "may", "its", "it's", "been", "being", "who", "how",
    "why", "one", "two", "three", "today", "now", "new",
    "via", "https", "http", "www", "com",    "channel", "channels",
    "group", "groups",
    "first", "second",
    "users", "user",
    "display", "displays",
    "like", "likes",
    "years", "year",
    "system", "systems",
    "series",
    "launching",
    "price", "prices",
    "post", "posts",
    "message", "messages",
    "join", "joined",
    "link", "links",
    "today", "tomorrow", "telegram"
}


def get_dashboard_stats():
    with engine.connect() as conn:

        total_posts = conn.execute(
            text("SELECT COUNT(*) FROM posts")
        ).scalar() or 0

        total_views = conn.execute(
            text("SELECT COALESCE(SUM(views),0) FROM engagements")
        ).scalar() or 0

        total_reactions = conn.execute(
            text("SELECT COALESCE(SUM(reactions),0) FROM engagements")
        ).scalar() or 0

        total_comments = conn.execute(
            text("SELECT COALESCE(SUM(comments),0) FROM engagements")
        ).scalar() or 0

        sentiment_rows = conn.execute(
            text("""
                SELECT label, COUNT(*)
                FROM sentiments
                GROUP BY label
            """)
        ).fetchall()

        sentiment = {
            "positive": 0,
            "neutral": 0,
            "negative": 0
        }

        for label, count in sentiment_rows:
            if label in sentiment:
                sentiment[label] = int(count)

        total_sentiment = sum(sentiment.values())

        sentiment_percent = {
            key: round(
                value / total_sentiment * 100, 2
            ) if total_sentiment else 0
            for key, value in sentiment.items()
        }

        platform_rows = conn.execute(
            text("""
                SELECT
                    p.name,
                    COUNT(DISTINCT po.id),
                    COALESCE(SUM(e.comments),0),
                    COALESCE(SUM(e.reactions),0),
                    COALESCE(SUM(e.views),0)
                FROM platforms p
                LEFT JOIN posts po
                    ON po.platform_id = p.id
                LEFT JOIN engagements e
                    ON e.post_id = po.id
                GROUP BY p.id, p.name
                ORDER BY COUNT(DISTINCT po.id) DESC
            """)
        ).fetchall()

        platforms = []

        for row in platform_rows:
            platforms.append({
                "platform": row[0],
                "posts": int(row[1]),
                "comments": int(row[2]),
                "reactions": int(row[3]),
                "views": int(row[4])
            })

        return {
            "total_posts": int(total_posts),
            "total_views": int(total_views),
            "total_reactions": int(total_reactions),
            "total_comments": int(total_comments),
            "total_engagement": int(
                total_reactions + total_comments
            ),
            "total_likes": 0,
            "total_shares": 0,
            "sentiment": sentiment,
            "sentiment_percent": sentiment_percent,
            "platforms": platforms,
            "top_posts": get_top_posts(10)
        }


def get_sentiment_stats():
    with engine.connect() as conn:

        rows = conn.execute(
            text("""
                SELECT
                    label,
                    COUNT(*) AS count,
                    AVG(confidence) AS average_confidence
                FROM sentiments
                GROUP BY label
                ORDER BY count DESC
            """)
        ).fetchall()

        return [
            {
                "label": row[0],
                "count": int(row[1]),
                "average_confidence": round(
                    float(row[2] or 0),
                    4
                )
            }
            for row in rows
        ]


def get_top_posts(limit=20):
    with engine.connect() as conn:

        rows = conn.execute(
            text("""
                SELECT
                    po.id,
                    po.text,
                    po.channel_name,
                    po.created_at,
                    COALESCE(e.views,0),
                    COALESCE(e.reactions,0),
                    COALESCE(e.comments,0),
                    COALESCE(s.label,'neutral'),
                    COALESCE(s.confidence,0)
                FROM posts po
                LEFT JOIN engagements e
                    ON e.post_id = po.id
                LEFT JOIN sentiments s
                    ON s.post_id = po.id
                ORDER BY
                    COALESCE(e.views,0)
                    + COALESCE(e.reactions,0)
                    + COALESCE(e.comments,0)
                    DESC
                LIMIT :limit
            """),
            {"limit": limit}
        ).fetchall()

        return [
            {
                "id": str(row[0]),
                "text": row[1],
                "channel": row[2],
                "created_at": (
                    row[3].isoformat()
                    if row[3]
                    else None
                ),
                "views": int(row[4]),
                "reactions": int(row[5]),
                "comments": int(row[6]),
                "sentiment": row[7],
                "confidence": float(row[8])
            }
            for row in rows
        ]


def get_platform_stats():
    with engine.connect() as conn:

        rows = conn.execute(
            text("""
                SELECT
                    p.name,
                    COUNT(DISTINCT po.id),
                    COALESCE(SUM(e.reactions),0),
                    COALESCE(SUM(e.comments),0),
                    COALESCE(SUM(e.views),0)
                FROM platforms p
                LEFT JOIN posts po
                    ON po.platform_id = p.id
                LEFT JOIN engagements e
                    ON e.post_id = po.id
                GROUP BY p.id, p.name
            """)
        ).fetchall()

        return [
            {
                "platform": row[0],
                "posts": int(row[1]),
                "reactions": int(row[2]),
                "comments": int(row[3]),
                "views": int(row[4])
            }
            for row in rows
        ]


def extract_words():
    with engine.connect() as conn:

        rows = conn.execute(
            text("""
                SELECT text
                FROM posts
                WHERE text IS NOT NULL
            """)
        ).fetchall()

    counter = Counter()

    for (post_text,) in rows:

        hashtags = re.findall(
            r"#([A-Za-z0-9_]+)",
            post_text
        )

        for tag in hashtags:
            if len(tag) >= 3:
                counter[f"#{tag.lower()}"] += 3

        words = re.findall(
            r"\b[A-Za-z][A-Za-z0-9_]{3,}\b",
            post_text.lower()
        )

        for word in words:

            if word in STOPWORDS:
                continue

            if word.isdigit():
                continue

            counter[word] += 1

    return counter


def get_keywords():
    counter = extract_words()

    results = []

    for index, (term, volume) in enumerate(
        counter.most_common(50),
        start=1
    ):

        if volume < 3:
            continue

        results.append({
            "id": f"keyword-{index}",
            "term": term,
            "volume": int(volume),
            "growth": round(
                min(95, 5 + volume / 10),
                2
            ),
            "velocity": round(
                volume / 10,
                2
            ),
            "sentiment": 0,
            "engagement": int(volume),
            "platforms": ["telegram"],
            "firstDetected": "",
            "related": [],
            "cluster": "telegram",
            "series": []
        })

    return results[:30]


def get_trends():
    counter = extract_words()

    results = []

    for index, (term, volume) in enumerate(
        counter.most_common(15),
        start=1
    ):

        if volume < 5:
            continue

        if volume >= 100:
            status = "surging"
        elif volume >= 50:
            status = "rising"
        elif volume >= 20:
            status = "steady"
        else:
            status = "cooling"

        results.append({
            "id": f"trend-{index}",
            "name": term,
            "category": "Technology & Current Affairs",
            "status": status,
            "growth": round(
                min(100, volume / 5),
                2
            ),
            "velocity": round(
                volume / 10,
                2
            ),
            "posts": int(volume),
            "engagement": int(volume),
            "sentiment": 0,
            "sentimentSplit": {
                "positive": 0,
                "neutral": 100,
                "negative": 0
            },
            "firstDetected": "",
            "peakActivity": "",
            "platforms": ["telegram"],
            "creators": 0,
            "summary": (
                f"{term} appears frequently "
                f"across the collected Telegram dataset."
            ),
            "series": [],
            "platformBreakdown": [
                {
                    "platform": "telegram",
                    "mentions": int(volume),
                    "engagement": int(volume),
                    "sentiment": 0
                }
            ],
            "sparkline": [
                max(1, int(volume * x / 10))
                for x in range(5, 11)
            ]
        })

    return results


if __name__ == "__main__":

    print("Dashboard:")
    print(get_dashboard_stats())

    print()
    print("Sentiment:")
    print(get_sentiment_stats())

    print()
    print("Keywords:")
    print(get_keywords()[:10])

    print()
    print("Trends:")
    print(get_trends()[:10])