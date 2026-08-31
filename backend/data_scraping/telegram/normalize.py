import json


def normalize_telegram_data():
    with open(
        "telegram_data.json",
        "r",
        encoding="utf-8"
    ) as file:
        telegram_data = json.load(file)

    normalized_data = []

    for post in telegram_data:

        normalized_post = {
            "platform": "telegram",

            "content": {
                "id": str(post["message_id"]),
                "text": post["text"] or "",
                "timestamp": post["timestamp"]
            },

            "author": {
                "id": (
                    str(post["sender_id"])
                    if post["sender_id"] is not None
                    else None
                )
            },

            "parent_id": (
                str(post["reply_to"])
                if post["reply_to"] is not None
                else None
            ),

            "engagement": {
                "reactions": post["reactions"],
                "is_forwarded": post["is_forwarded"]
            },

            "replies": []
        }

        for reply in post.get("replies", []):

            normalized_reply = {
                "id": str(reply["message_id"]),

                "author_id": (
                    str(reply["sender_id"])
                    if reply["sender_id"] is not None
                    else None
                ),

                "text": reply["text"] or "",
                "timestamp": reply["timestamp"],
                "parent_id": str(reply["reply_to"])
            }

            normalized_post["replies"].append(
                normalized_reply
            )

        normalized_data.append(normalized_post)

    with open(
        "normalized_telegram_data.json",
        "w",
        encoding="utf-8"
    ) as file:
        json.dump(
            normalized_data,
            file,
            ensure_ascii=False,
            indent=4
        )

    print(
        f"Normalized {len(normalized_data)} posts."
    )


if __name__ == "__main__":
    normalize_telegram_data()