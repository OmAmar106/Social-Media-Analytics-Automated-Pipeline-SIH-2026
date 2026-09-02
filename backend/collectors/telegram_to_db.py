import json
from pathlib import Path
from datetime import datetime

from sqlalchemy import text

from database.connection import engine


BASE_DIR = Path(__file__).resolve().parent.parent

DATA_FILE = BASE_DIR / "telegram_data.json"


def parse_datetime(value):

    if not value:
        return None

    value = value.replace("Z", "+00:00")

    try:
        return datetime.fromisoformat(
            value
        ).replace(tzinfo=None)

    except ValueError:
        return None


def import_data():

    with open(
        DATA_FILE,
        "r",
        encoding="utf-8"
    ) as f:

        records = json.load(f)

    with engine.begin() as conn:

        platform_id = conn.execute(
            text("""
                SELECT id
                FROM platforms
                WHERE name = 'telegram'
            """)
        ).scalar()

        if not platform_id:

            conn.execute(
                text("""
                    INSERT INTO platforms
                    (name, enabled)
                    VALUES
                    ('telegram', TRUE)
                """)
            )

            platform_id = conn.execute(
                text("""
                    SELECT id
                    FROM platforms
                    WHERE name = 'telegram'
                """)
            ).scalar()

        inserted = 0

        for record in records:

            exists = conn.execute(
                text("""
                    SELECT id
                    FROM posts
                    WHERE platform_id = :platform_id
                    AND external_id = :external_id
                """),
                {
                    "platform_id": platform_id,
                    "external_id": record["external_id"]
                }
            ).scalar()

            if exists:
                continue

            result = conn.execute(
                text("""
                    INSERT INTO posts
                    (
                        platform_id,
                        external_id,
                        text,
                        post_url,
                        channel_name,
                        created_at,
                        collected_at,
                        processed
                    )
                    VALUES
                    (
                        :platform_id,
                        :external_id,
                        :text,
                        :post_url,
                        :channel_name,
                        :created_at,
                        :collected_at,
                        FALSE
                    )
                """),
                {
                    "platform_id": platform_id,
                    "external_id": record["external_id"],
                    "text": record["text"],
                    "post_url": record["post_url"],
                    "channel_name": record["channel_name"],
                    "created_at": parse_datetime(
                        record["created_at"]
                    ),
                    "collected_at": parse_datetime(
                        record["collected_at"]
                    )
                }
            )

            post_id = result.lastrowid

            conn.execute(
                text("""
                    INSERT INTO engagements
                    (
                        post_id,
                        comments,
                        views,
                        reactions
                    )
                    VALUES
                    (
                        :post_id,
                        :comments,
                        :views,
                        :reactions
                    )
                """),
                {
                    "post_id": post_id,
                    "comments": record["comments"],
                    "views": record["views"],
                    "reactions": record["reactions"]
                }
            )

            inserted += 1

        print(
            f"Inserted {inserted} new Telegram posts"
        )


if __name__ == "__main__":
    import_data()