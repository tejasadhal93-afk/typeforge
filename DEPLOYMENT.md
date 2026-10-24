# 🚀 How to Deploy TypeForge to the Internet (100% Free)

You can deploy TypeForge in **3 simple steps** using:
- **MongoDB Atlas** (Free Cloud Database)
- **Render.com** (Free Full-Stack Web Service)
- **GitHub** (Code Repository)

Because we configured TypeForge to serve the React frontend directly from the Express backend, you only need **ONE single service** on Render!

---

## Step 1: Set Up Free Cloud MongoDB (MongoDB Atlas)

1. Go to **[mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)** and sign up for a free account.
2. Click **Create a Deployment** and select the **M0 Free** cluster tier (Shared).
3. Under **Security Quickstart**:
   - Create a database username and password (e.g. user `admin`, password `mypassword123`).
   - Under **Where would you like to connect from?**, choose **Allow Access from Anywhere** (`0.0.0.0/0`).
4. Click **Connect** → choose **Drivers** (Node.js).
5. Copy your connection string. It will look like:
   ```
   mongodb+srv://admin:<password>@cluster0.abcde.mongodb.net/typeforge?retryWrites=true&w=majority
   ```
   *(Replace `<password>` with your actual password!)*

---

## Step 2: Push Your Code to GitHub

Open your terminal in `C:\Users\Asus\.gemini\antigravity\scratch\typeforge-react`:

```powershell
# 1. Initialize git
git init

# 2. Add all files
git add .

# 3. Commit
git commit -m "Initial commit of TypeForge full-stack app"

# 4. Create a new repository on https://github.com/new (name it "typeforge")
# 5. Link and push to GitHub:
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/typeforge.git
git branch -M main
git push -u origin main
```

---

## Step 3: Deploy on Render.com (Free)

1. Go to **[render.com](https://render.com)** and sign in with GitHub.
2. Click **New +** → select **Web Service**.
3. Connect your **typeforge** GitHub repository.
4. Fill in the settings:
   - **Name**: `typeforge` (or any name you choose)
   - **Language**: `Node`
   - **Build Command**:
     ```bash
     npm install && cd server && npm install && cd .. && npm run build
     ```
   - **Start Command**:
     ```bash
     node server/server.js
     ```
   - **Instance Type**: `Free`
5. Scroll down to **Environment Variables** and add:
   - `MONGODB_URI` = *(your MongoDB Atlas connection string from Step 1)*
   - `JWT_SECRET` = *(any random secret key, e.g. `typeforge_super_secure_key_2026`)*
   - `NODE_ENV` = `production`
6. Click **Deploy Web Service**!

---

## 🎉 That is it!

Render will build the app and give you a public URL like:
👉 **`https://typeforge.onrender.com`**

Anyone with the link can now visit your site, sign up, play Meteor Defense, race the Pace Car, and save scores to your cloud MongoDB database!
