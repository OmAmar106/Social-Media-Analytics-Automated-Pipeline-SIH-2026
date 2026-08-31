import re

def clean_text(text: str) -> str:

    if not isinstance(text, str):
        return ""
    
    text = re.sub(r"@\w+", "@user", text) # Replace @mentions with @user
    text = re.sub(r"https?://\S+|www\.\S+", "http", text)  # Replace URLs with http
    text = re.sub(r"\s+", " ", text)   # Collapse multiple spaces/newlines into a single space
    return text.strip()

# Apply clean_text to a list of posts
def clean_texts(texts: list[str]) -> list[str]:
    return [clean_text(t) for t in texts]