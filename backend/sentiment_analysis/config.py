import torch

MODEL_NAME = "cardiffnlp/twitter-xlm-roberta-base-sentiment"

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
LOCAL_MODEL_DIR = "models/"