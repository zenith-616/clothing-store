# Zenith — kiyim do'koni boshqaruv tizimi

Kiyim do'koni uchun to'liq tizim: mahsulot va ombor boshqaruvi, buyurtmalar, mijozlar, statistika hamda xaridorlar uchun Telegram bot va Web App.

**Muallif:** [Dusboyev Rahmatulloh] — Toshkent Axborot Texnologiyalari Universiteti, Dasturiy injiniring fakulteti

## Jonli havolalar

| Qism | Havola |
|---|---|
| Admin panel | https://clothing-store-admin-eu9q.onrender.com |
| Backend API hujjatlari (Swagger) | https://clothing-store-backend-k9z7.onrender.com/docs |
| Telegram bot | [@kiyimdodkoni_bot](https://t.me/kiyimdodkoni_bot) |

> Server bepul tarifda ishlaydi, uzoq foydalanilmasa "uxlab qoladi". Birinchi so'rov 30–60 soniya davom etishi mumkin.

## Tizim qanday ishlaydi

```
Admin panel (frontend) ──┐
                         ├──►  Backend (FastAPI, REST API)  ──►  PostgreSQL
Telegram Web App ────────┘              │
Telegram bot ◄──── status xabarlari ────┘          Cloudinary (mahsulot rasmlari)
```

Barcha qismlar yagona REST API orqali ishlaydi. Admin panel va Telegram Web App backend'ga JSON formatida so'rov yuboradi.

## Texnologiyalar

| Qism | Texnologiya |
|---|---|
| Backend | Python, FastAPI, SQLAlchemy |
| Ma'lumotlar bazasi | PostgreSQL (production), SQLite (mahalliy ishlab chiqish) |
| Autentifikatsiya | JWT, bcrypt, rollar (admin / operator) |
| Admin panel | HTML, CSS, Bootstrap 5, JavaScript |
| Telegram bot | aiogram 3 |
| Telegram Web App | HTML, CSS, JavaScript |
| Rasm saqlash | Cloudinary |
| Joylashtirish (deploy) | Render.com, UptimeRobot (monitoring) |

## Imkoniyatlar

### Admin panel
- Login va chiqish (JWT token), noto'g'ri parol 3 marta kiritilsa kirish vaqtincha bloklanadi
- Bosh sahifa: bugungi buyurtmalar va daromad, oxirgi 7 kunlik daromad grafigi, eng ko'p sotilgan mahsulotlar
- Mahsulotlar: qo'shish, tahrirlash, o'chirish, rasm yuklash, o'lcham/rang/ombor variantlari, holat belgilari (Sotuvda, Kam qolgan, Tugagan, Nofaol)
- Buyurtmalar: ro'yxat, status bo'yicha filtr, statusni ruxsat etilgan ketma-ketlikda o'zgartirish
- Mijozlar: qidiruv, tahrirlash, buyurtmalar tarixi
- Xodimlar: yangi operator yoki admin qo'shish (kuchli parol talab qilinadi)
- Mobil qurilmalarga moslashgan (responsive) interfeys

### Telegram bot va Web App
- Kategoriyalar bo'yicha katalog, mahsulot rasmlari
- O'lcham va rang tanlash, savat
- Buyurtma berish (ism, telefon va manzil tekshiriladi)
- Buyurtma holati o'zgarganda botdan avtomatik xabar

## Xavfsizlik

- Parollar bcrypt bilan xeshlanadi, ochiq matnda saqlanmaydi
- Barcha o'zgartiruvchi so'rovlar (POST, PUT, DELETE) JWT token talab qiladi
- Xodimlarni boshqarish faqat admin roli uchun
- Yangi xodim paroli: kamida 8 ta belgi, 1 ta raqam va 1 ta katta harf (frontend va backend'da tekshiriladi)
- Login formasida 3 marta noto'g'ri urinishdan keyin tugma 30 soniyaga bloklanadi
- CORS faqat admin panel manziliga ruxsat beradi
- Maxfiy kalitlar kodda emas, muhit o'zgaruvchilarida saqlanadi (`.env`)
- Buyurtmada ishlatilgan mahsulot yoki variantni o'chirib bo'lmaydi

## Loyiha tuzilmasi

```
clothing-store/
├── backend/     # FastAPI backend (routers/, models.py, schemas.py, security.py)
├── frontend/    # Admin panel
├── webapp/      # Telegram Web App (backend orqali /app/ manzilida xizmat qiladi)
└── bot/         # Telegram bot
```

## Mahalliy ishga tushirish

### 1. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
```

`backend/.env` faylini yarating (namuna: `.env.example`):

```
SECRET_KEY=uzun_tasodifiy_matn
BOT_TOKEN=telegram_bot_tokeni
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

Birinchi adminni yarating va serverni ishga tushiring:

```bash
python create_admin.py
uvicorn main:app --reload
```

API hujjatlari: http://127.0.0.1:8000/docs

> `DATABASE_URL` berilmasa, avtomatik SQLite (`store.db`) ishlatiladi.

### 2. Admin panel

`frontend/js/api.js` ichidagi `API_URL` ni backend manziliga moslang va `frontend/index.html` ni Live Server bilan oching.

### 3. Telegram bot

```bash
cd bot
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

`bot/.env`:

```
BOT_TOKEN=telegram_bot_tokeni
WEBAPP_URL=https://backend-manzilingiz/app/
```

```bash
python bot.py
```

## Deploy (Render.com)

| Xizmat | Turi | Muhim sozlamalar |
|---|---|---|
| Backend | Web Service | Root: `backend`, start: `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| Admin panel | Static Site | Root: `frontend`, publish: `.` |
| Bot | Web Service | Root: `bot`, start: `python bot.py` |
| Baza | PostgreSQL | Backend'ga `DATABASE_URL` sifatida ulanadi |

Backend uchun muhit o'zgaruvchilari: `SECRET_KEY`, `BOT_TOKEN`, `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

Bot uchun: `BOT_TOKEN`, `WEBAPP_URL`.

## Ma'lumotlar bazasi

| Jadval | Vazifasi |
|---|---|
| categories, brands | Kategoriya va brendlar |
| products | Mahsulotlar (nom, narx, tavsif, rasm havolasi) |
| product_variants | O'lcham, rang va ombordagi soni |
| customers | Mijozlar (Telegram ID bilan) |
| orders, order_items | Buyurtmalar va ularning tarkibi (narx buyurtma vaqtida saqlanadi) |
| users | Admin va operator xodimlar |

## Skrinshotlar

<!-- Skrinshotlarni docs/ papkasiga joylab, shu yerga qo'shing: -->
<!-- ![Bosh sahifa](docs/dashboard.png) -->
<!-- ![Mahsulotlar](docs/products.png) -->
<!-- ![Telegram bot](docs/bot.png) -->