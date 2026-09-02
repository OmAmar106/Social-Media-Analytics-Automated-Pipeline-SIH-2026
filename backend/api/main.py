from flask import Flask, jsonify
from flask_cors import CORS

from analytics.analytics import (
    get_dashboard_stats,
    get_sentiment_stats,
    get_top_posts,
    get_platform_stats,
    get_keywords,
    get_trends,
)

app = Flask(__name__)
CORS(app)


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "message": "Social Media Analytics API is running"
    })


@app.route("/api/dashboard", methods=["GET"])
def dashboard():
    return jsonify(get_dashboard_stats())


@app.route("/api/sentiment", methods=["GET"])
def sentiment():
    return jsonify({
        "sentiment": get_sentiment_stats()
    })


@app.route("/api/posts", methods=["GET"])
def posts():
    return jsonify({
        "posts": get_top_posts(50)
    })


@app.route("/api/platforms", methods=["GET"])
def platforms():
    return jsonify({
        "platforms": get_platform_stats()
    })


@app.route("/api/keywords", methods=["GET"])
def keywords():
    return jsonify({
        "keywords": get_keywords()
    })


@app.route("/api/trends", methods=["GET"])
def trends():
    return jsonify({
        "trends": get_trends()
    })


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )