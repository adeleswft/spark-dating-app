# Spark Dating App — Deployment Guide

## Quick Deploy (5 minutes)

### Option A: Railway + Vercel (Recommended)

#### Step 1: Deploy API to Railway

1. Go to [railway.app](https://railway.app) and sign up with GitHub
2. Click **"New Project" → "Deploy from GitHub repo"**
3. Select your `spark-app` repository
4. Railway will auto-detect the Dockerfile and build

5. **Add a PostgreSQL database:**
   - In your Railway project, click **"+ New" → "Database" → "PostgreSQL"**
   - Railway auto-generates `DATABASE_URL`

6. **Add environment variables** (Settings → Variables):
   ```
   JWT_SECRET=<run: openssl rand -hex 32>
   NODE_ENV=production
   PORT=3000
   ```

7. **Add persistent storage for uploads:**
   - In your Railway project, click **"+ New" → "Volume"**
   - Mount path: `/data/uploads`
   - This ensures uploaded photos survive container restarts

8. **Deploy** — Railway builds and deploys automatically

9. **Seed the database:**
   - Go to your API service → Settings → Deploy → Custom Start Command
   - Run: `npx tsx packages/api/src/seed.ts`
   - Then revert the start command to: `node --import tsx packages/api/src/index.ts`

10. **Note your API URL** — it'll be something like `https://spark-api.up.railway.app`

#### Step 2: Deploy Web Admin to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click **"Import Project"** and select your repo
3. **Configure:**
   - Root Directory: `apps/web`
   - Framework: Next.js
   - Build Command: `next build`
   - Output Directory: `.next`

4. **Add environment variable:**
   ```
   NEXT_PUBLIC_API_URL=https://spark-api.up.railway.app
   ```

5. **Deploy** — Vercel builds and deploys automatically

6. **Note your admin URL** — it'll be something like `https://spark-admin.vercel.app`

#### Step 3: Create Admin User

1. Go to your Railway API logs
2. The seed script already created an admin user:
   - **Email:** `admin@spark.dating`
   - **Password:** `admin123`

3. **Login to admin dashboard:**
   - Go to `https://spark-admin.vercel.app/admin/login`
   - Use the admin credentials above

4. **Change the admin password** (production):
   ```sql
   -- Connect to your Railway PostgreSQL and run:
   UPDATE users SET password_hash = '$(node -e "const b=require("bcryptjs");console.log(b.hashSync("YOUR_NEW_PASSWORD",10))")' WHERE email = 'admin@spark.dating';
   ```

---

### Option B: Docker (Self-Hosted)

#### Step 1: Clone and configure

```bash
git clone <your-repo>
cd spark-app
cp .env.example .env
# Edit .env with your values
```

#### Step 2: Start everything

```bash
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379
- API on port 3000
- AI Service on port 8000

#### Step 3: Seed the database

```bash
docker exec spark-api npx tsx packages/api/src/seed.ts
```

#### Step 4: Access

- **API:** http://localhost:3000
- **Health check:** http://localhost:3000/health
- **Admin dashboard:** Deploy `apps/web` separately or run `cd apps/web && npm run dev`

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | ✅ | Secret key for JWT tokens. Generate with `openssl rand -hex 32` |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `REDIS_URL` | ⬜ | Redis URL for rate limiting (optional, falls back to in-memory) |
| `PORT` | ⬜ | API port (default: 3000) |
| `NODE_ENV` | ✅ | Set to `production` |
| `SMTP_HOST` | ⬜ | Email server (for password reset) |
| `SMTP_USER` | ⬜ | Email username |
| `SMTP_PASS` | ⬜ | Email password |
| `APPLE_SHARED_SECRET` | ⬜ | Apple App Store receipt validation |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | ⬜ | Google Play receipt validation |
| `NEXT_PUBLIC_API_URL` | ✅ | API URL for web admin |

---

## Post-Deployment Checklist

- [ ] API is running and `/health` returns 200
- [ ] Admin dashboard loads and login works
- [ ] Mobile app connects to API (update `EXPO_PUBLIC_API_URL`)
- [ ] Email delivery works (test password reset)
- [ ] SSL/HTTPS is enabled (Railway/Vercel do this automatically)
- [ ] Custom domain configured (optional)
- [ ] Apple/Google receipt validation configured (when ready for payments)

---

## Updating

Both Railway and Vercel auto-deploy on push to `main`:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

Railway rebuilds the API, Vercel rebuilds the admin dashboard.

---

## Troubleshooting

### API won't start
- Check `DATABASE_URL` is correct
- Check `JWT_SECRET` is set
- Check Railway logs for errors

### Admin dashboard shows "Login failed"
- Verify `NEXT_PUBLIC_API_URL` points to your Railway API URL
- Check the API is running with `curl https://your-api.up.railway.app/health`

### Mobile app can't connect
- Update `EXPO_PUBLIC_API_URL` in `apps/mobile/.env`
- Rebuild the app: `eas build --platform android`

### Email not sending
- Set `SMTP_USER` and `SMTP_PASS`
- For Gmail: enable 2FA, then create an App Password
- For SendGrid: use API key as `SMTP_PASS`
