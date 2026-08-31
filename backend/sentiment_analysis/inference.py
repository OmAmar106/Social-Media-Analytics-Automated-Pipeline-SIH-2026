from sentiment_analysis.config import LABEL_MAP
from sentiment_analysis.load_models import sentiment_pipeline
from sentiment_analysis.preprocessing import clean_text, clean_texts

# Format the predictions returned by the sentiment pipeline into a structured dictionary.
def _format_prediction(predictions: list[dict]) -> dict:
    best_prediction = max(
        predictions,
        key=lambda prediction: prediction["score"]
    )

    scores = {
        p["label"]: float(p["score"])
        for p in predictions
    }

    return {
        "sentiment": best_prediction["label"],
        "confidence": float(best_prediction["score"]),
        "scores": scores,
    }


class SentimentModel:
    def predict_sentiment(self, text: str) -> dict:
        cleaned_text = clean_text(text)
        if not cleaned_text:
            return {
                "sentiment": "neutral",
                "confidence": 0.0,
                "scores": {label: 0.0 for label in LABEL_MAP.values()},
            }

        predictions = sentiment_pipeline(
            cleaned_text,
            truncation=True,
            max_length=512,
        )

        return _format_prediction(predictions)

    def predict_sentiment_batch(self, texts: list[str]) -> list[dict]:
        if not texts:
            return []

        cleaned_texts = clean_texts(texts)

        predictions_batch = sentiment_pipeline(
            cleaned_texts,
            truncation=True,
            max_length=512,
            batch_size=16,
        )

        return [
            _format_prediction(predictions)
            for predictions in predictions_batch
        ]


def predict_sentiment(text: str) -> dict:
    model = SentimentModel()
    return model.predict_sentiment(text)


def predict_sentiment_batch(texts: list[str]) -> list[dict]:
    model = SentimentModel()
    return model.predict_sentiment_batch(texts)