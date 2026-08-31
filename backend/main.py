import importlib.util
import json
import sys
from pathlib import Path
import sentiment_analysis.__init__ as model
from flask import Flask, jsonify, request

BASE_DIR = Path(__file__).resolve().parent
app = Flask(__name__)


@app.route("/update", methods=["GET"])
def update():
    data = []
    return jsonify({
        "status": "success",
        "count": len(data),
        "data": data,
    })


@app.route("/predict", methods=["GET", "POST"])
def predict():
    if request.method == "GET":
        text = request.args.get("text")
    else:
        payload = request.get_json(silent=True) or {}
        text = payload.get("text") or payload.get("message") or payload.get("input_text")

    if text is None or not str(text).strip():
        return jsonify({"error": "Text is required."}), 400

    result = model.predict_sentiment_batch()([str(text)])[0]
    return jsonify({
        "status": "success",
        "input": str(text),
        "prediction": result,
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)