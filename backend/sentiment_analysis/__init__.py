from .inference import SentimentModel

_default_model = SentimentModel()

# Predict sentiment for multiple texts using the default model
def predict_sentiment_batch(texts: list[str]) -> list[dict]:
    return _default_model.predict_sentiment_batch(texts)