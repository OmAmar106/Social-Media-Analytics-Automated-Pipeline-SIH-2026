import json
from pathlib import Path

from backend.sentiment_analysis import predict_sentiment_batch


BASE_DIR = Path(__file__).resolve().parent
INPUT_FILE = BASE_DIR / "dataset" / "sample_telegram_data.json"
OUTPUT_FILE = BASE_DIR / "dataset" / "telegram_sentiment.json"


def main():
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, list):
        raise ValueError("Expected Telegram dataset to be a JSON list.")

    texts = []

    for item in data:
        text = (
            item.get("text")
            or item.get("message")
            or item.get("content")
            or ""
        )

        texts.append(str(text))

    print(f"Loaded {len(data)} Telegram records.")
    print("Running sentiment analysis...")

    predictions = predict_sentiment_batch(texts)

    output = []

    for item, prediction in zip(data, predictions):
        record = dict(item)
        record["sentiment"] = prediction
        output.append(record)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"Saved processed dataset to: {OUTPUT_FILE}")
    print(f"Processed records: {len(output)}")


if __name__ == "__main__":
    main()