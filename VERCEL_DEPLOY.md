# Vercel Deploy Guide 🚀

## Problem Fixed

Vercel ko `pnpm-lock.yaml` outdated mil raha tha. Ab fix ho gaya hai!

## Changes Made

1. ✅ **pnpm-lock.yaml deleted** - Ab npm use hoga
2. ✅ **package-lock.json updated** - Fresh dependencies
3. ✅ **vercel.json configured** - Proper build settings
4. ✅ **api/index.ts created** - Vercel serverless function

## Deploy Steps

### Step 1: Git Commit & Push

```bash
git add .
git commit -m "Fix Vercel deployment - remove pnpm-lock.yaml"
git push origin main
```

### Step 2: Vercel Dashboard

1. Vercel dashboard mein jao: https://vercel.com
2. Project select karein
3. **Settings** → **General**
4. **Build & Development Settings** check karein:
   - **Framework Preset**: Other
   - **Build Command**: `npm run build` (ya empty)
   - **Output Directory**: `.` (current directory)
   - **Install Command**: `npm install`

### Step 3: Environment Variables (if needed)

Agar koi environment variables chahiye:
- **Settings** → **Environment Variables**
- Add karein (abhi zarurat nahi hai)

### Step 4: Redeploy

1. **Deployments** tab mein jao
2. Latest deployment pe click karein
3. **Redeploy** button click karein

Ya phir automatically redeploy ho jayega jab aap push karein.

## Important Files

- ✅ `vercel.json` - Vercel configuration
- ✅ `api/index.ts` - Serverless API handler
- ✅ `package-lock.json` - npm lockfile (updated)
- ✅ `.vercelignore` - Files to ignore

## Build Configuration

```json
{
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "outputDirectory": "."
}
```

## API Routes

Vercel pe ye routes available honge:

- `GET /api/clients` - All clients
- `GET /api/users` - All users
- `GET /api/users/:id` - User by ID
- `GET /api/users/email/:email` - User by email
- `POST /api/users` - Add user
- `PUT /api/users/:id` - Update user

## Troubleshooting

### Issue: Build fails
- Check `package.json` scripts
- Verify all dependencies are in `dependencies` not `devDependencies`
- Check Vercel logs

### Issue: API not working
- Verify `api/index.ts` exists
- Check routes in `vercel.json`
- Verify serverless function is deployed

### Issue: Static files not loading
- Check `public/` folder
- Verify routes in `vercel.json`
- Check file paths in HTML

## Success! 🎉

Deploy hone ke baad:
1. Vercel URL pe jao
2. Browser mein app open hoga
3. API routes work karengi
4. Database (db.json) Vercel storage mein save hoga

## Notes

- Vercel serverless functions use karta hai
- `db.json` file Vercel filesystem mein save hogi
- Each deployment fresh start hota hai (data persist nahi hoga production mein)
- Production ke liye proper database (MongoDB, PostgreSQL) use karein

