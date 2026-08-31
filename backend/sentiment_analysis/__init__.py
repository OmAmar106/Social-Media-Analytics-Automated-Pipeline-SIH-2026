from sentiment_analysis.inference import SentimentModel

_default_model = SentimentModel()

# # Predict sentiment for a single text using the default model.
# def predict_sentiment(text: str) -> dict:
#     return _default_model.predict_sentiment(text)

# Predict sentiment for multiple texts using the default model.
def predict_sentiment_batch(texts: list[str]) -> list[dict]:
    return _default_model.predict_sentiment_batch(texts)