# KODBANK App

Small banking simulation app with **two apps**: **frontend** and **backend**. User authentication is done using JWT: on login a token is generated, stored in the database, and set as a cookie on the client. The dashboard shows **1. Check Balance** (working) and **2. Transfer Money** (coming later).

## Structure

- **backend/** – Node.js + Express API (register, login, check-balance). Connects to MySQL on **Aiven**.
- **frontend/** – Static pages: registration, login, dashboard (Check Balance works; Transfer Money disabled).
- **database.sql** – Creates database and two tables: **BankUser** (Cid, Cname, Cpwd, balance, email) and **BankUserJwt** (tokenid, tokenvalue, Cid, exp).

## Database (Aiven MySQL)

1. Create a MySQL service on Aiven and note host, port, user, password, and database name.
2. Run the schema on that database (Aiven’s “Query” or any MySQL client):

```bash
mysql -h YOUR_AIVEN_HOST -P YOUR_AIVEN_PORT -u YOUR_USER -p YOUR_DATABASE < database.sql
```

Or paste the contents of `database.sql` into Aiven’s SQL console.

## Setup

1. **Install dependencies**

```bash
npm install
```

2. **Configure backend (Aiven)**

- Copy `backend/.env.example` to `backend/.env`.
- Fill in your Aiven MySQL details and JWT secret:

```env
DB_HOST=your-aiven-mysql-host.aivencloud.com
DB_PORT=12345
DB_USER=avnadmin
DB_PASSWORD=your-password
DB_NAME=bank_user
DB_SSL=true
JWT_SECRET=your_long_random_secret
PORT=3000
NODE_ENV=development
```

3. **Run the app**

```bash
npm start
```

- Backend API + frontend: **http://localhost:3000**
- Open **http://localhost:3000/login.html** to login, or **http://localhost:3000/register.html** to register.

## Flow (as per tutor)

1. **Registration** – User signs up (name, email, password) → stored in **BankUser**.
2. **Login** – User submits email + password → backend checks **BankUser** → if correct, generates JWT → saves token in **BankUserJwt** → sends token to client as **HTTP-only cookie**.
3. **Dashboard** – User sees two options: **1. Check Balance**, **2. Transfer Money** (only Check Balance is implemented).
4. **Check Balance** – User clicks “Check Balance” → request goes to backend **with the JWT cookie** → backend **validates token** (signature, presence in **BankUserJwt**, expiry) → fetches balance from **BankUser** → returns balance → frontend displays it.

## Sample logins (after running database.sql)

| Email       | Password | Balance  |
|------------|----------|----------|
| om@kod.com | omkar    | 500000   |
| ab@kod.com | Abhay    | 600000   |

## API (backend)

- `POST /register` – body: `{ Cname, email, Cpwd }`
- `POST /login` – body: `{ email, password }` – sets `token` cookie and returns `{ success, Cname }`
- `GET /check-balance` – requires cookie `token` – returns `{ success, balance, customer_name }`
- `POST /transfer` – returns 501 “Coming soon”

All of this matches your tutor’s requirements: two tables (BankUser + BankUserJwt), JWT authentication, token stored in DB and sent as cookie, and only Check Balance working, with the database on Aiven.
