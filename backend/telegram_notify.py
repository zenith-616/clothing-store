import os

import requests
from dotenv import load_dotenv

load_dotenv()
BOT_TOKEN = os.getenv("BOT_TOKEN")


def notify_customer(telegram_id: int | None, text: str):
    if not telegram_id or not BOT_TOKEN:
        return
    try:
        requests.post(
            f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage",
            json={"chat_id": telegram_id, "text": text},
            timeout=5,
        )
    except Exception:
        pass