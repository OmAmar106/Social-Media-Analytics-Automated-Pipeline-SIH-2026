import os
import asyncio
import json
from pathlib import Path
from datetime import datetime, timezone

from dotenv import load_dotenv
from telethon import TelegramClient

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

API_ID = int(os.getenv("TELEGRAM_API_ID"))
API_HASH = os.getenv("TELEGRAM_API_HASH")
PHONE = os.getenv("TELEGRAM_PHONE")

# Put public Telegram usernames here.
CHANNELS = [
    "@DevelopmentNewsIndia",
    "@TechHub_Updates",
    "@Tech",
    "@TechOfficeUpdate",
]

SESSION_PATH = BASE_DIR / "telegram_session"
OUTPUT_PATH = BASE_DIR / "telegram_data.json"


async def collect_channel(client, channel, limit=1000):
    print()
    print(f"Collecting from {channel}...")

    messages = []

    try:
        entity = await client.get_entity(channel)

        async for message in client.iter_messages(entity, limit=limit):

            if not message.message:
                continue

            reactions = 0

            if message.reactions:
                for reaction in message.reactions.results:
                    reactions += reaction.count or 0

            comments = 0

            if message.replies:
                comments = message.replies.replies or 0

            created_at = None

            if message.date:
                created_at = message.date.astimezone(
                    timezone.utc
                ).replace(tzinfo=None).isoformat()

            collected_at = datetime.utcnow().isoformat()

            messages.append({
                "platform": "telegram",
                "external_id": str(message.id),
                "text": message.message,
                "channel_name": str(channel),
                "created_at": created_at,
                "views": message.views or 0,
                "reactions": reactions,
                "comments": comments,
                "post_url": (
                    f"https://t.me/"
                    f"{str(channel).lstrip('@')}/"
                    f"{message.id}"
                ),
                "collected_at": collected_at
            })

        print(
            f"{channel}: collected {len(messages)} text posts"
        )

    except Exception as error:
        print(
            f"ERROR collecting {channel}: {error}"
        )

    return messages


async def collect_all():
    client = TelegramClient(
        str(SESSION_PATH),
        API_ID,
        API_HASH
    )

    await client.start(phone=PHONE)

    all_messages = []

    for channel in CHANNELS:
        channel_messages = await collect_channel(
            client,
            channel,
            limit=1000
        )

        all_messages.extend(channel_messages)

    await client.disconnect()

    # Remove duplicates based on channel + message ID
    unique = {}

    for message in all_messages:
        key = (
            message["channel_name"],
            message["external_id"]
        )

        unique[key] = message

    all_messages = list(unique.values())

    with open(
        OUTPUT_PATH,
        "w",
        encoding="utf-8"
    ) as f:
        json.dump(
            all_messages,
            f,
            ensure_ascii=False,
            indent=2
        )

    print()
    print("=" * 50)
    print(
        f"TOTAL TEXT POSTS COLLECTED: "
        f"{len(all_messages)}"
    )
    print(
        f"Saved to: {OUTPUT_PATH}"
    )
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(collect_all())