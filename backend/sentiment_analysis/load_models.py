from transformers import AutoTokenizer,AutoModelForSequenceClassification,pipeline
from sentiment_analysis.config import MODEL_NAME


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