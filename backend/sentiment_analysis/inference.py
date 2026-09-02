from functools import cached_property
from .load_models import load_sentiment_pipeline
from .preprocessing import clean_texts
from .config import MAX_LENGTH, BATCH_SIZE


class SentimentModel:
    @cached_property
    def pipeline(self):
        return load_sentiment_pipeline()

    # Format the predictions returned by the sentiment pipeline into a structured dictionary.
    def _format_prediction(self, predictions: list[dict]) -> dict:
        best_prediction = max(
            predictions,
            key=lambda prediction: prediction["score"]
        )

        scores = {
            p["label"]: float(p["score"]) for p in predictions
        }

        return {
            "label": best_prediction["label"],
            "confidence": float(best_prediction["score"]),
            "scores": scores,
        }


    def predict_sentiment_batch(self, texts: list[str]) -> list[dict]:

        # Predict sentiment for multiple social-media posts.
        if not texts:
            return []

        cleaned_texts = clean_texts(texts)

        predictions_batch = self.pipeline(
            cleaned_texts,
            truncation=True,
            max_length=MAX_LENGTH,
            batch_size=BATCH_SIZE,
        )

        #returns list of dicts with sentiment, confidence and scores for each text
        return [
            self._format_prediction(predictions)
            for predictions in predictions_batch
        ]