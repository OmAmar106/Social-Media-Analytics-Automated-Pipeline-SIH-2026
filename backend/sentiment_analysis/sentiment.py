from sqlalchemy import text
from database.connection import engine
from transformers import pipeline


MODEL_NAME = "cardiffnlp/twitter-xlm-roberta-base-sentiment"


print("Loading sentiment model...")

classifier = pipeline(
    "sentiment-analysis",
    model=MODEL_NAME,
    tokenizer=MODEL_NAME
)

print("Sentiment model loaded.")


def normalize_label(label):
    """Convert model labels into our database labels."""

    label = str(label).lower()

    if label in ("label_0", "negative"):
        return "negative"

    if label in ("label_1", "neutral"):
        return "neutral"

    if label in ("label_2", "positive"):
        return "positive"

    return label


def get_scores(text_to_analyze):
    """
    Run sentiment analysis and return:
    negative, neutral, positive scores.
    """

    output = classifier(
        text_to_analyze[:512],
        top_k=None
    )

    # Transformers can return:
    # [[{"label": "...", "score": ...}, ...]]
    # or:
    # [{"label": "...", "score": ...}, ...]

    if not output:
        return {
            "negative": 0.0,
            "neutral": 0.0,
            "positive": 0.0
        }

    # If first item is a dictionary, output is already
    # a list of score dictionaries.
    if isinstance(output[0], dict):
        results = output

    # Otherwise the first item contains the score dictionaries.
    elif isinstance(output[0], list):
        results = output[0]

    else:
        raise ValueError(
            f"Unexpected sentiment model output: {output}"
        )

    scores = {
        "negative": 0.0,
        "neutral": 0.0,
        "positive": 0.0
    }

    for item in results:

        if not isinstance(item, dict):
            continue

        label = normalize_label(item.get("label"))
        score = float(item.get("score", 0.0))

        if label in scores:
            scores[label] = score

    return scores


def analyze_posts():

    with engine.begin() as conn:

        posts = conn.execute(
            text("""
                SELECT id, text
                FROM posts
                WHERE processed = FALSE
                ORDER BY id
            """)
        ).fetchall()

        print(
            f"Posts waiting for sentiment analysis: {len(posts)}"
        )

        if not posts:
            print("No posts need sentiment analysis.")
            return

        processed_count = 0

        for post_id, post_text in posts:

            if not post_text or not post_text.strip():
                print(
                    f"Skipping post {post_id}: empty text"
                )
                continue

            try:

                scores = get_scores(post_text)

                label = max(
                    scores,
                    key=scores.get
                )

                confidence = scores[label]

                conn.execute(
                    text("""
                        INSERT INTO sentiments (
                            post_id,
                            label,
                            confidence,
                            negative_score,
                            neutral_score,
                            positive_score
                        )
                        VALUES (
                            :post_id,
                            :label,
                            :confidence,
                            :negative_score,
                            :neutral_score,
                            :positive_score
                        )
                        ON DUPLICATE KEY UPDATE
                            label = VALUES(label),
                            confidence = VALUES(confidence),
                            negative_score = VALUES(negative_score),
                            neutral_score = VALUES(neutral_score),
                            positive_score = VALUES(positive_score)
                    """),
                    {
                        "post_id": post_id,
                        "label": label,
                        "confidence": confidence,
                        "negative_score": scores["negative"],
                        "neutral_score": scores["neutral"],
                        "positive_score": scores["positive"]
                    }
                )

                conn.execute(
                    text("""
                        UPDATE posts
                        SET processed = TRUE
                        WHERE id = :post_id
                    """),
                    {
                        "post_id": post_id
                    }
                )

                processed_count += 1

                print(
                    f"Processed post {post_id}: "
                    f"{label} "
                    f"(confidence={confidence:.4f})"
                )

            except Exception as error:

                print(
                    f"ERROR processing post {post_id}: "
                    f"{error}"
                )

        print()
        print(
            f"Sentiment analysis completed. "
            f"Processed: {processed_count}/{len(posts)}"
        )


if __name__ == "__main__":
    analyze_posts()