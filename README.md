# Kiyim do'koni — admin panel va Telegram bot

Kiyim do'koni uchun to'liq boshqaruv tizimi: mahsulotlarni boshqarish, buyurtmalarni kuzatish va mijozlar bilan Telegram orqali ishlash.

## Loyiha haqida

Bu loyiha uchta qismdan iborat:

- **Backend (API)** — barcha ma'lumotlarni saqlaydi va boshqaradi
- **Admin panel** — do'kon egasi/xodimlari uchun web boshqaruv paneli
- **Telegram bot + Web App** — xaridorlar uchun katalog va buyurtma berish

## Texnologiyalar

| Qism | Texnologiya |
|---|---|
| Backend | Python, FastAPI, SQLAlchemy, SQLite |
| Autentifikatsiya | JWT (JSON Web Token), bcrypt |
| Admin panel | HTML, Bootstrap 5, JavaScript |
| Telegram bot | aiogram 3 |
| Telegram Web App | HTML, CSS, JavaScript |

## Imkoniyatlar

### Admin panel
- Login va autentifikatsiya (JWT)
- Dashboard: kunlik statistika, daromad, eng ko'p sotilgan mahsulotlar
- Mahsulotlar: qo'shish, tahrirlash, variantlar (o'lcham, rang, ombor)
- Buyurtmalar: ro'yxat, filtr, status boshqaruvi
- Mijozlar: ro'yxat, qidiruv, buyurtma tarixi

### Telegram bot va Web App
- Kategoriya va mahsulotlar katalogi
- O'lcham/rang tanlash, savat
- Buyurtma berish
- Status o'zgarganda avtomatik xabar

## Loyiha tuzilmasi



## O'rnatish va ishga tushirish

### 1. Backend

\`\`\`bash
cd backend
python -m venv venv
venv\Scripts\activate          # Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
\`\`\`

`.env` fayl yarating (`.env.example` namunasidan foydalaning):

\`\`\`
SECRET_KEY=tasodifiy_uzun_matn
BOT_TOKEN=telegram_bot_tokeningiz
\`\`\`

Birinchi adminni yarating:

\`\`\`bash
python create_admin.py
\`\`\`

Serverni ishga tushiring:

\`\`\`bash
uvicorn main:app --reload
\`\`\`

API hujjatlari: `http://127.0.0.1:8000/docs`

### 2. Admin panel

`frontend/index.html` faylini Live Server (yoki istalgan statik server) bilan oching.

### 3. Telegram bot

\`\`\`bash
cd bot
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
\`\`\`

`.env` fayl yarating:

\`\`\`
BOT_TOKEN=telegram_bot_tokeningiz
WEBAPP_URL=web_app_manzilingiz
\`\`\`

\`\`\`bash
python bot.py
\`\`\`

## Ma'lumotlar bazasi sxemasi

- **categories** — kategoriyalar
- **brands** — brendlar
- **products** — mahsulotlar
- **product_variants** — o'lcham, rang, ombor soni
- **customers** — mijozlar
- **orders** / **order_items** — buyurtmalar
- **users** — admin/xodimlar

## Muallif

[Rahmatulloh] — Software Engineering talabasi

## Litsenziya

O'quv loyihasi sifatida yaratilgan.