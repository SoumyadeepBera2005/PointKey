# 🚀 PointKey (pRent) Deployment Guide: Vercel & Render

এই গাইডে **PointKey (pRent) প্ল্যাটফর্ম** কীভাবে সম্পূর্ণ বিনামূল্যে **Render** (ব্যাকএন্ড ও ডাটাবেস) এবং **Vercel** (ফ্রন্টএন্ড) এ লাইভ ডিপ্লয় করবেন, তার প্রতিটি ধাপ বিস্তারিতভাবে দেওয়া হলো।

---

## 🏗️ আর্কিটেকচার ওভারভিউ (Architecture Overview)

```
[ ইউজার ব্রাউজার ] 
       │
       ▼
[ Vercel (Frontend: React + Vite) ]  ──> https://pointkey.vercel.app
       │
       ▼ (REST API / Socket.IO)
[ Render (Backend: Node.js Express) ] ──> https://pointkey-api.onrender.com
       │
       ▼ (MySQL Protocol)
[ Cloud MySQL Database ] (Aiven / TiDB / Clever Cloud - 100% Free)
```

| কম্পোনেন্ট | প্রযুক্তি | হোস্টিং প্ল্যাটফর্ম | খরচ |
| :--- | :--- | :--- | :--- |
| **Frontend** | React 18, Vite, TailwindCSS | **Vercel** | Free Tier |
| **Backend** | Node.js, Express, Socket.IO | **Render (Web Service)** | Free Tier |
| **Database** | MySQL 8.0 | **Aiven / TiDB Cloud** | Free Tier |

---

## 📌 ধাপ ১: গিটহাবে কোড আপলোড করা (Push Code to GitHub)

Render এবং Vercel উভয়েই সরাসরি GitHub রেপোজিটরি থেকে কোড নিয়ে অটোমেটিক ডিপ্লয় করে।

### ১.১ টার্মিনালে গিট ইনিশিয়ালাইজ ও কমিট করুন:
প্রজেক্টের রুট ফোল্ডারে (`d:\Downloads\pRent\prent-platform`) একটি টার্মিনাল বা PowerShell খুলুন:

```bash
# গিট চেক করুন ও প্রয়োজনীয় ফাইল স্টেজ করুন
git init
git add .
git commit -m "feat: complete PointKey platform with transparent navbar and dynamic location"
```

### ১.২ গিটহাবে একটি নতুন রেপোজিটরি তৈরি করুন:
1. আপনার ব্রাউজারে [github.com/new](https://github.com/new)-এ যান।
2. Repository name দিন: `pointkey-platform` (বা আপনার পছন্দের নাম)।
3. **Public** অথবা **Private** সিলেক্ট করুন।
4. "Create repository" বাটনে ক্লিক করুন।

### ১.৩ লোকাল কোড গিটহাবে পুশ করুন:
```bash
git branch -M main
git remote add origin https://github.com/<your-username>/pointkey-platform.git
git push -u origin main
```

---

## 🗄️ ধাপ ২: ক্লাউড MySQL ডাটাবেস সেটআপ (Cloud Database Setup)

> **নোট:** Render-এর নিজস্ব ফ্রি ডাটাবেস হচ্ছে PostgreSQL, কিন্তু PointKey ব্যাকএন্ডটি তৈরি হয়েছে **MySQL**-এর উপর। তাই সম্পূর্ণ ফ্রিতে ক্লাউড MySQL হোস্ট করার জন্য **Aiven for MySQL** অথবা **TiDB Cloud** ব্যবহার করা সবচেয়ে সুবিধাজনক।

### অপশন A: Aiven for MySQL (রেকমেন্ডেড — সম্পূর্ণ ফ্রি 5GB)
1. ব্রাউজারে [aiven.io](https://aiven.io)-তে যান এবং ফ্রি অ্যাকাউন্ট খুলুন (কোনো ক্রেডিট কার্ড লাগবে না)।
2. **Create Service**-এ ক্লিক করুন।
3. সিলেক্ট করুন **MySQL**।
4. Cloud Provider সিলেক্ট করুন **AWS** বা **Google Cloud** এবং রিজিয়ন সিলেক্ট করুন নিকটবর্তী (যেমন: **Singapore / Mumbai**)।
5. প্ল্যান সিলেক্ট করুন: **Free Plan** (Free tier)।
6. সার্ভিসের নাম দিন: `pointkey-mysql` এবং **Create Service**-এ ক্লিক করুন।
7. সার্ভিসটি তৈরি হলে Overview পেজে নিচের তথ্যগুলো পাবেন:
   * **Host:** `mysql-xxxx.aivencloud.com`
   * **Port:** `12345` (একটি ৫ সংখ্যার পোর্ট)
   * **User:** `avnadmin`
   * **Password:** `AVNS_xxxxx`
   * **Database:** `defaultdb`

### ২.১ ডাটাবেস টেবিল ও স্কিমা ইম্পোর্ট করা (Schema Import):
Aiven ড্যাশবোর্ডে বা আপনার লোকাল **MySQL Workbench / DBeaver / HeidiSQL** সফটওয়্যার দিয়ে কানেক্ট করুন এবং নিচের দুটি ফাইল ক্রমানুসারে রান করুন:
1. `database/schema.sql` (সব টেবিল যেমন `users`, `properties`, `visits`, `payments`, `ratings` ইত্যাদি তৈরি করবে)।
2. `database/seed.sql` (টেস্টিং এবং ডেমোর জন্য প্রয়োজনীয় প্রপার্টি ও ডেটা ইনসার্ট করবে)।

---

## ⚙️ ধাপ ৩: Render-এ ব্যাকএন্ড ডিপ্লয় করা (Backend Deployment on Render)

### ৩.১ রেন্ডারে অ্যাকাউন্ট ও ওয়েব সার্ভিস তৈরি:
1. ব্রাউজারে [render.com](https://render.com)-এ যান এবং **GitHub** দিয়ে লগইন করুন।
2. ড্যাশবোর্ডে **New +** বাটনে ক্লিক করে **Web Service** সিলেক্ট করুন।
3. আপনার গিটহাব একাউন্ট কানেক্ট করে `pointkey-platform` রেপোজিটরিটি সিলেক্ট করুন।

### ৩.২ ব্যাকএন্ড কনফিগারেশন সেটিংস:
| ফিল্ড (Field) | কী লিখবেন (Value) |
| :--- | :--- |
| **Name** | `pointkey-backend` (বা আপনার পছন্দের নাম) |
| **Region** | `Singapore` (এশিয়ার দ্রুত স্পিডের জন্য) |
| **Branch** | `main` |
| **Root Directory** | `backend-node` ⚠️ *(অবশ্যই এটি লিখবেন)* |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` ($0/month) |

### ৩.৩ Environment Variables (পরিবেশ ভেরিয়েবল সেটআপ):
একটু নিচের দিকে স্ক্রোল করে **Environment Variables** সেকশনে যান এবং নিচের ভেরিয়েবলগুলো অ্যাড করুন:

| Key | Value (উদাহরণ) | বিবরণ |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | প্রোডাকশন মোড |
| `PORT` | `10000` | রেন্ডারের পোর্ট |
| `DB_HOST` | `mysql-xxxx.aivencloud.com` | আপনার ক্লাউড ডাটাবেস হোস্ট |
| `DB_PORT` | `12345` | আপনার ক্লাউড ডাটাবেস পোর্ট |
| `DB_USER` | `avnadmin` | ডাটাবেস ইউজার নেম |
| `DB_PASSWORD` | `আপনার_ডাটাবেস_পাসওয়ার্ড` | ডাটাবেস পাসওয়ার্ড |
| `DB_NAME` | `defaultdb` (বা `prent_db`) | ডাটাবেসের নাম |
| `JWT_SECRET` | `pointkey_jwt_super_secret_key_2026` | র্যান্ডম সুরক্ষিত স্ট্রিং |
| `CLIENT_ORIGIN` | `*` (বা ধাপ ৪-এর পর Vercel URL) | CORS অ্যাক্সেসের জন্য |
| `RAZORPAY_KEY_ID` | `rzp_test_U0tMXJtWwouGCA` | রেজোরপে টেস্ট কি |
| `RAZORPAY_KEY_SECRET` | `q5t6iIwTTY7UhEZjhfg70gxb` | রেজোরপে সিক্রেট কি |
| `ADMIN_MFA_CODE` | `123456` | অ্যাডমিন লগইন MFA |

> **Redis নোট:** PointKey ব্যাকএন্ডে বিল্ট-ইন ইন-মেমোরি ক্যাশ ফলব্যাক রয়েছে, তাই Render-এ আলাদা রেডিস কানেক্ট না করলেও কোনো সমস্যা ছাড়া ওটিপি এবং সেশন স্বয়ংক্রিয়ভাবে কাজ করবে।

4. নিচে **Create Web Service** বাটনে ক্লিক করুন।
5. রেন্ডার স্বয়ংক্রিয়ভাবে ডিপ্লয় শুরু করবে। ২-৩ মিনিট পর আপনি দেখতে পাবেন:
   `==> Your service is live 🎉`
6. উপরে আপনার ব্যাকএন্ডের একটি ইউনিক URL পাবেন, যেমন:
   `https://pointkey-backend.onrender.com`
7. টেস্ট করার জন্য ব্রাউজারে খুলুন: `https://pointkey-backend.onrender.com/api/v1/health`
   রেসপন্স আসবে: `{"status":"ok","service":"prent-backend"}`।

---

## 🌐 ধাপ ৪: Vercel-এ ফ্রন্টএন্ড ডিপ্লয় করা (Frontend Deployment on Vercel)

Vercel-এ রিয়্যাক্ট এবং ভাইট (Vite) অত্যন্ত দ্রুত এবং হাই পারফরম্যান্স গ্লোবাল এজ সিডিএন-এ রান করে।

### ৪.১ ভার্সেলে প্রজেক্ট ইম্পোর্ট করুন:
1. ব্রাউজারে [vercel.com](https://vercel.com)-এ যান এবং আপনার **GitHub** দিয়ে লগইন করুন।
2. **Add New...** বাটনে ক্লিক করে **Project** সিলেক্ট করুন।
3. আপনার `pointkey-platform` রেপোজিটরির পাশে থাকা **Import** বাটনে ক্লিক করুন।

### ৪.২ ফ্রন্টএন্ড বিল্ড সেটিংস:
1. **Project Name:** `pointkey` (বা আপনার পছন্দের নাম)।
2. **Framework Preset:** `Vite` সিলেক্ট থাকবে।
3. **Root Directory:** পাশে **Edit** বাটনে ক্লিক করে `frontend-react` সিলেক্ট করুন এবং **Continue** দিন। ⚠️ *(অত্যন্ত গুরুত্বপূর্ণ)*
4. **Build and Output Settings:** 
   * Build Command: `npm run build`
   * Output Directory: `dist`
   * Install Command: `npm install`
   *(এগুলো ডিফল্টভাবেই সেট থাকে, পরিবর্তন করতে হবে না)*

### ৪.৩ Environment Variables যুক্ত করুন:
**Environment Variables** সেকশনে যান এবং নিচের ভেরিয়েবল দুটি দিন:

| Name | Value | বিবরণ |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://pointkey-backend.onrender.com/api/v1` | আপনার ধাপ ৩-এ পাওয়া Render API URL |
| `VITE_SOCKET_URL` | `https://pointkey-backend.onrender.com` | রিয়েলটাইম চ্যাট ও সকেটের জন্য Render URL |

*(⚠️ মনে রাখবেন: `https://pointkey-backend.onrender.com`-এর জায়গায় আপনার নিজস্ব Render URL-টি বসাবেন)*

### ৪.৪ ডিপ্লয় ক্লিক করুন:
1. **Deploy** বাটনে ক্লিক করুন।
2. ১ মিনিটের মধ্যে বিল্ড শেষ হবে এবং কনফেটি ফুটে উঠবে:
   `Congratulations! Your project is deployed.`
3. আপনার ফ্রন্টএন্ড লাইভ URL হবে:
   `https://pointkey.vercel.app` (বা অনুরূপ ডোমেন)।

---

## 🔗 ধাপ ৫: ব্যাকএন্ড ও ফ্রন্টএন্ড কানেক্ট নিশ্চিত করা (CORS Setup)

আপনার ফ্রন্টএন্ড URL তৈরি হয়ে গেলে Render ব্যাকএন্ডে গিয়ে CORS অ্যাক্সেস পুরোপুরি সুরক্ষিত করুন:
1. **Render Dashboard** -> আপনার `pointkey-backend` সার্ভিসে যান।
2. **Environment** ট্যাবে ক্লিক করুন।
3. `CLIENT_ORIGIN` ভেরিয়েবলটির মান পরিবর্তন করে আপনার Vercel ডোমেনটি দিন:
   `CLIENT_ORIGIN` = `https://pointkey.vercel.app`
4. **Save Changes** দিন। Render স্বয়ংক্রিয়ভাবে সার্ভিসটি রি-ডিপ্লয় করে নেবে।

---

## 📋 ডিপ্লয়মেন্ট পরবর্তী যাচাইকরণ চেকলিস্ট (Verification Checklist)

ডিপ্লয় শেষ হলে নিচের ফিচারগুলো একবার ব্রাউজারে চেক করে নিন:

- [ ] **Home Page & Transparent Navbar:** `https://pointkey.vercel.app/tenant` খুললে হিরো ইমেজের উপর স্বচ্ছ ফ্রস্টেড গ্লাস ন্যাভবার দেখাচ্ছে কিনা।
- [ ] **Center Tabs:** মাঝের `SearchKart`, `FacilityKart`, `BudgetKart` বাটনগুলো স্ক্রিনের ঠিক মাঝখানে থাকছে কিনা।
- [ ] **Location Detection:** ন্যাভবারে লোকেশন বাটন ও পপ-আপ ঠিকভাবে কাজ করছে কিনা এবং লোকেশন পরিবর্তনের সাথে সাথে সংশ্লিষ্ট এলাকার বাড়িগুলো শো করছে কিনা।
- [ ] **Authentication:** `/auth` পেজে গিয়ে ইউজার রেজিস্ট্রেশন ও লগইন সম্পন্ন হচ্ছে কিনা।
- [ ] **SPA Routing:** কোনো পেজে থাকা অবস্থায় ব্রাউজার রিফ্রেশ (F5) দিলে 404 এরর ছাড়াই পেজ রিলোড হচ্ছে কিনা (আমাদের `vercel.json` ফাইলটি এটি নিশ্চিত করে)।

---

## 💡 জরুরি টিপস ও ট্রাবলশুটিং (Troubleshooting Tips)

### ১. Render ফ্রি টায়ার কোল্ড স্টার্ট (Cold Start):
* **ঘটনা:** Render-এর ফ্রি সার্ভার ১৫ মিনিট কোনো রিকোয়েস্ট না পেলে সাময়িকভাবে স্লিপ মোডে (Spin Down) চলে যায়। ফলে প্রথমবার ওয়েবসাইট খোলার পর এপিআই রিকোয়েস্ট আসতে ৩০-৪০ সেকেন্ড দেরি হতে পারে।
* **সমাধান:** এটি সম্পূর্ণ স্বাভাবিক। প্রথমবার লোড হয়ে গেলে সার্ভিস আবার ফুল স্পিডে চলবে। চাইলে [cron-job.org](https://cron-job.org) বা [UptimeRobot](https://uptimerobot.com)-এ ফ্রি অ্যাকাউন্ট খুলে প্রতি ১০ মিনিট পর পর আপনার এপিআই হেলথ ইউআরএল (`https://your-backend.onrender.com/api/v1/health`) পিং করতে পারেন, তাহলে সার্ভার সবসময় সক্রিয় থাকবে।

### ২. কাস্টম ডোমেন অ্যাড করা (Custom Domain):
* আপনি যদি নিজস্ব ডোমেন (যেমন: `www.pointkey.in`) কেনেন:
  * **Vercel Settings -> Domains**-এ গিয়ে আপনার ডোমেন লিখবেন এবং আপনার ডোমেন প্রোভাইডারে (GoDaddy / Namecheap) Vercel-এর দেওয়া CNAME রেকর্ড বসিয়ে দিলেই কয়েক মিনিটে SSL সহ লাইভ হয়ে যাবে।
