import asyncio
import os

from aiogram import Bot, Dispatcher
from aiogram.filters import CommandStart
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, Message, WebAppInfo
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
WEBAPP_URL = os.getenv("WEBAPP_URL")

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()


@dp.message(CommandStart())
async def start(message: Message):
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="🛍 Katalogni ochish", web_app=WebAppInfo(url=WEBAPP_URL))]
        ]
    )
    await message.answer(
        "Assalomu alaykum! Kiyim do'konimizga xush kelibsiz 👋\n\n"
        "Katalogni ko'rish va buyurtma berish uchun quyidagi tugmani bosing.",
        reply_markup=keyboard,
    )


async def main():
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())