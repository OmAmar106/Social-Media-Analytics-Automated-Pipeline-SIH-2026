import torch

MODEL_NAME = "cardiffnlp/twitter-xlm-roberta-base-sentiment"

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
LOCAL_MODEL_DIR = "models/"
MAX_LENGTH = 512
BATCH_SIZE = 16