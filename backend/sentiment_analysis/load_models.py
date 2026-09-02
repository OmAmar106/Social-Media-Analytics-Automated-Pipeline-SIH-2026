from transformers import AutoTokenizer,AutoModelForSequenceClassification,pipeline
from .config import MODEL_NAME

def load_sentiment_pipeline():
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

    model = AutoModelForSequenceClassification.from_pretrained(
        MODEL_NAME,
        device_map="auto"
    )

    sentiment_pipeline = pipeline(
        "text-classification",
        model=model,
        tokenizer=tokenizer,
        top_k=None
    )
    
    return sentiment_pipeline