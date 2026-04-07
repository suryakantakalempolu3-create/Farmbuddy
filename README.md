# 🌿 FarmBuddy

A farm-to-home marketplace connecting local farmers with customers.

## Stack
- **Frontend**: HTML, CSS, Vanilla JS (deployed on Render Static Site)
- **Backend**: Node.js + Express (deployed on Render Web Service)
- **Database**: MongoDB Atlas (cloud)
- **Auth**: JWT (JSON Web Tokens)

## Project Structure

```
farmbuddy/
├── backend/         ← Express API
│   ├── server.js
│   ├── models/      ← User, Product, Order (Mongoose)
│   ├── routes/      ← /api/auth, /api/products, /api/orders
│   └── middleware/  ← JWT auth guard
└── frontend/        ← Static HTML pages
    ├── js/api.js    ← Central API helper
    ├── index.html
    ├── login.html
    ├── register.html
    ├── products.html
    ├── cart.html
    └── farmer2.html ← Farmer dashboard
```

## API Endpoints

### Auth
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | /api/auth/register | Public | Register farmer or customer |
| POST | /api/auth/login | Public | Login, returns JWT |
| GET | /api/auth/me | Protected | Get current user |

### Products
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | /api/products | Public | Get all products |
| GET | /api/products/my | Farmer | Get my products |
| GET | /api/products/:id | Public | Get single product |
| POST | /api/products | Farmer | Add product |
| PUT | /api/products/:id | Farmer | Update product |
| DELETE | /api/products/:id | Farmer | Delete product |

### Orders
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | /api/orders | Customer | Place order |
| GET | /api/orders/my | Customer | My orders |
| GET | /api/orders/farmer | Farmer | Orders for my products |
| GET | /api/orders/:id | Auth | Single order |
| PATCH | /api/orders/:id/status | Farmer | Update order status |

## Local Development

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Fill in MONGODB_URI and JWT_SECRET in .env
npm run dev
```

### Frontend
Open `frontend/index.html` in a browser, or use Live Server in VS Code.

> **Note:** Update `API_BASE` in `frontend/js/api.js` to point to your backend URL.

## Deployment

### 1. MongoDB Atlas
1. Create free cluster at https://mongodb.com/cloud/atlas
2. Create DB user → Allow all IPs (0.0.0.0/0)
3. Copy connection string into Render env vars

### 2. Backend → Render Web Service
- Root directory: `backend`
- Build: `npm install`
- Start: `npm start`
- Environment variables:
  - `MONGODB_URI` = your Atlas connection string
  - `JWT_SECRET` = any long random string
  - `NODE_ENV` = production

### 3. Frontend → Render Static Site
- Root directory: `frontend`
- Update `API_BASE` in `js/api.js` to your Render backend URL

## Environment Variables (backend/.env)

```
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/farmbuddy
JWT_SECRET=some_very_long_random_secret_string
PORT=5000
NODE_ENV=development
```
