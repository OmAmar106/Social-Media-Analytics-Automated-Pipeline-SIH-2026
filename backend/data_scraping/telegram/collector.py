import os
import json

from dotenv import load_dotenv
from telethon import TelegramClient

load_dotenv()

api_id = int(os.getenv("TELEGRAM_API_ID"))
api_hash = os.getenv("TELEGRAM_API_HASH")

CHANNEL = "DevelopmentNewsIndia"
MESSAGE_LIMIT = 1500
REPLY_LIMIT = 10

client = TelegramClient(
    "telegram_session",
    api_id,
    api_hash
)


def extract_reactions(message):
    reactions = {}

    if not message.reactions:
        return reactions

    for reaction_count in message.reactions.results:
        reaction = reaction_count.reaction

        if hasattr(reaction, "emoticon"):
            name = reaction.emoticon
        elif hasattr(reaction, "document_id"):
            name = f"custom_{reaction.document_id}"
        else:
            name = str(reaction)

        reactions[name] = reaction_count.count

    return reactions


async def main():

    messages = []

    print(
        f"Collecting up to {MESSAGE_LIMIT} "
        f"messages from {CHANNEL}..."
    )

    async for message in client.iter_messages(
        CHANNEL,
        limit=MESSAGE_LIMIT
    ):

        data = {
            "platform": "telegram",
            "channel": CHANNEL,
            "message_id": message.id,
            "sender_id": message.sender_id,
            "text": message.text,
            "timestamp": (
                message.date.isoformat()
                if message.date else None
            ),
            "reply_to": (
                message.reply_to.reply_to_msg_id
                if message.reply_to
                else None
            ),
            "is_forwarded": (
                message.forward is not None
            ),
            "reactions": extract_reactions(message),
            "replies": []
        }

        if (
            message.replies
            and message.replies.replies
        ):
            try:

                async for reply in client.iter_messages(
                    CHANNEL,
                    reply_to=message.id,
                    limit=REPLY_LIMIT
                ):

                    reply_data = {
                        "message_id": reply.id,
                        "sender_id": reply.sender_id,
                        "text": reply.text,
                        "timestamp": (
                            reply.date.isoformat()
                            if reply.date
                            else None
                        ),
                        "reply_to": message.id
                    }

                    data["replies"].append(
                        reply_data
                    )

            except Exception as e:

                print(
                    f"Could not collect replies "
                    f"for message {message.id}: {e}"
                )

        messages.append(data)

        if len(messages) % 100 == 0:
            print(
                f"Collected {len(messages)} "
                f"/ {MESSAGE_LIMIT} posts"
            )

    with open(
        "telegram_data.json",
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            messages,
            file,
            ensure_ascii=False,
            indent=2
        )

    print()
    print(
        f"Finished. Collected "
        f"{len(messages)} posts."
    )
    print(
        "Saved to telegram_data.json"
    )


with client:
    client.loop.run_until_complete(main())