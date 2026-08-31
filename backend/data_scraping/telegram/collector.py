import os
import json

from dotenv import load_dotenv
from telethon import TelegramClient

load_dotenv()

api_id = int(os.getenv("TELEGRAM_API_ID"))
api_hash = os.getenv("TELEGRAM_API_HASH")

client = TelegramClient("telegram_session", api_id, api_hash)


async def main():
    channel = "DevelopmentNewsIndia"

    messages = []

    async for message in client.iter_messages(channel, limit=10):

        data = {
            "platform": "telegram",
            "channel": channel,
            "message_id": message.id,
            "sender_id": message.sender_id,
            "text": message.text,
            "timestamp": message.date.isoformat(),
            "reply_to": (
                message.reply_to.reply_to_msg_id
                if message.reply_to
                else None
            ),
            "is_forwarded": message.forward is not None,
            "reactions": str(message.reactions)
            if message.reactions
            else None,
            "replies": []
        }

        # Collect replies/comments when available
        if message.replies and message.replies.replies:

            try:
                async for reply in client.iter_messages(
                    channel,
                    reply_to=message.id,
                    limit=50
                ):
                    reply_data = {
                        "message_id": reply.id,
                        "sender_id": reply.sender_id,
                        "text": reply.text,
                        "timestamp": reply.date.isoformat(),
                        "reply_to": message.id
                    }

                    data["replies"].append(reply_data)

            except Exception as e:
                print(
                    f"Could not collect replies for "
                    f"message {message.id}: {e}"
                )

        messages.append(data)

    with open(
        "telegram_data.json",
        "w",
        encoding="utf-8"
    ) as file:
        json.dump(
            messages,
            file,
            ensure_ascii=False,
            indent=4
        )

    print(f"Collected {len(messages)} posts.")
    print("Saved data to telegram_data.json")


with client:
    client.loop.run_until_complete(main())