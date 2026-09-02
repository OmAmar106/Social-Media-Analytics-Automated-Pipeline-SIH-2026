import json
from pathlib import Path

from flask import Flask, jsonify, request

from sentiment_analysis import predict_sentiment_batch


BASE_DIR = Path(__file__).resolve().parent

TELEGRAM_DATA = (
    BASE_DIR
    / "data_scraping"
    / "telegram"
    / "dataset"
    / "sample_telegram_data.json"
)

TELEGRAM_SENTIMENT = (
    BASE_DIR
    / "data_scraping"
    / "telegram"
    / "dataset"
    / "telegram_sentiment.json"
)

app = Flask(__name__)


def load_json_file(path):
    if not path.exists():
        return []

    with open(path, "r", encoding="utf-8") as file:
        return json.load(file)


@app.route("/update", methods=["GET"])
def update():
    data = load_json_file(TELEGRAM_DATA)

    return jsonify({
        "status": "success",
        "count": len(data),
        "data": data
    })


@app.route("/predict", methods=["GET", "POST"])
def predict():

    if request.method == "GET":
        text = request.args.get("text")
    else:
        payload = request.get_json(silent=True) or {}

        text = (
            payload.get("text")
            or payload.get("message")
            or payload.get("input_text")
        )

    if text is None or not str(text).strip():
        return jsonify({
            "status": "error",
            "error": "Text is required."
        }), 400

    result = predict_sentiment_batch([str(text)])[0]

    return jsonify({
        "status": "success",
        "input": str(text),
        "prediction": result
    })


@app.route("/telegram/process", methods=["GET"])
def process_telegram():

    data = load_json_file(TELEGRAM_DATA)

    if not data:
        return jsonify({
            "status": "error",
            "error": "Telegram dataset is empty or missing."
        }), 404

    texts = []

    for item in data:

        if not isinstance(item, dict):
            texts.append("")
            continue

        text = (
            item.get("text")
            or item.get("message")
            or item.get("content")
            or ""
        )

        texts.append(str(text))

    predictions = predict_sentiment_batch(texts)

    processed_data = []

    for item, prediction in zip(data, predictions):

        record = dict(item)

        record["sentiment"] = prediction

        processed_data.append(record)

    with open(TELEGRAM_SENTIMENT, "w", encoding="utf-8") as file:

        json.dump(
            processed_data,
            file,
            ensure_ascii=False,
            indent=2
        )

    return jsonify({
        "status": "success",
        "count": len(processed_data),
        "output_file": str(TELEGRAM_SENTIMENT),
        "message": "Telegram sentiment analysis completed."
    })


@app.route("/telegram/results", methods=["GET"])
def telegram_results():

    data = load_json_file(TELEGRAM_SENTIMENT)

    return jsonify({
        "status": "success",
        "count": len(data),
        "data": data
    })


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000
    )