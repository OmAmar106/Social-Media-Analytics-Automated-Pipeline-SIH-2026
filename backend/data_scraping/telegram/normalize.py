import json

INPUT_FILE = "telegram_data.json"
OUTPUT_FILE = "normalized_telegram_data.json"


def normalize_message(message):

    reactions = message.get("reactions", {})

    total_reactions = sum(
        reactions.values()
    )

    return {
        "platform": "telegram",
        "post_id": str(
            message.get("message_id")
        ),
        "author_id": str(
            message.get("sender_id")
        ) if message.get("sender_id") is not None else None,
        "text": message.get("text"),
        "timestamp": message.get("timestamp"),
        "reply_to": (
            str(message["reply_to"])
            if message.get("reply_to") is not None
            else None
        ),
        "is_forwarded": message.get(
            "is_forwarded",
            False
        ),
        "engagement": {
            "reactions": reactions,
            "total_reactions": total_reactions,
            "reply_count": len(
                message.get("replies", [])
            )
        }
    }


with open(
    INPUT_FILE,
    "r",
    encoding="utf-8"
) as file:
    data = json.load(file)


normalized = [
    normalize_message(message)
    for message in data
]


with open(
    OUTPUT_FILE,
    "w",
    encoding="utf-8"
) as file:
    json.dump(
        normalized,
        file,
        ensure_ascii=False,
        indent=2
    )


print(
    f"Normalized {len(normalized)} messages."
)
print(
    f"Saved to {OUTPUT_FILE}"
)