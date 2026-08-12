# Create database and tables on Aiven

Pick **one** of these ways.

---

## Option A: Run the schema from your machine (recommended)

1. **Get connection details from Aiven**
   - Open [Aiven Console](https://console.aiven.io/) → your MySQL service.
   - In **Connection information** (or **Overview**), note:
     - **Host**
     - **Port** (often not 3306, e.g. 12345)
     - **User** (e.g. `avnadmin`)
     - **Password**
   - If the service has **SSL** enabled (default), you need it for connections.

2. **Set env vars in `backend/.env`**
   - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME=bank_user` (already set).
   - Add the **port** from Aiven:
     ```env
     DB_PORT=12345
     ```
     (Replace `12345` with your service port.)
   - If the service uses SSL, add:
     ```env
     DB_SSL=true
     ```

3. **Run the schema script** (from project root):
   ```bash
   node scripts/run-schema.js
   ```
   You should see: `Database "bank_user" and tables BankUser, BankUserJwt created...`

---

## Option B: Run the SQL in Aiven’s web UI

1. In Aiven Console, open your MySQL service.
2. Open the **Query** tab (or **SQL** / **Console** – the place where you can run raw SQL).
3. Copy the **entire** contents of the project file **`database/database.sql`**.
4. Paste into the query box and run it.

This will create the database `bank_user`, the tables **BankUser** and **BankUserJwt**, and insert the sample rows (e.g. Omkar, Abhaya).

After that, ensure `backend/.env` has `DB_NAME=bank_user` and start your app with `npm start`.
