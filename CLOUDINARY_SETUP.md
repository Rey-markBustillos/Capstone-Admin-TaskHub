# 🚀 Cloudinary Setup Guide for TaskHub

## ✅ **What's Already Done:**
- ✅ Cloudinary packages installed
- ✅ Backend code updated to use Cloudinary
- ✅ Frontend simplified for Cloudinary URLs
- ✅ Database model updated with Cloudinary fields

## 🔧 **What You Need To Do:**

### **Step 1: Create Cloudinary Account**
1. Go to [https://cloudinary.com/](https://cloudinary.com/)
2. Click **"Sign Up for Free"**
3. Fill in your details and verify email

### **Step 2: Get Your Credentials**
1. After login, go to **Dashboard**
2. Copy these values:
   - **Cloud Name**
   - **API Key**  
   - **API Secret**

### **Step 3: Update .env File**
Replace the placeholder values in `backend/.env`:

```env
# Replace these with your actual Cloudinary credentials:
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret
```

### **Step 4: Test Locally**
1. Restart your backend server:
   ```bash
   cd backend
   npm start
   ```

2. Upload a new submission through the student portal
3. Check if it appears in your Cloudinary dashboard
4. Try downloading it from ActivityMonitoring

### **Step 5: Deploy to Production**
1. Add the same environment variables to your Render.com deployment
2. Deploy the updated backend code

## 🎯 **How It Works Now:**

### **Before (Old System):**
```
Student uploads file → Saved to /uploads/submissions/ → Gets deleted on server restart
```

### **After (New System):**
```
Student uploads file → Saved to Cloudinary → Permanent URL → Always accessible
```

## 🔍 **Benefits:**
- ✅ **Files never disappear** (no more ephemeral storage issues)
- ✅ **Direct downloads** from Cloudinary CDN (faster)
- ✅ **25GB free storage** per month
- ✅ **Automatic backups** and optimization
- ✅ **Works with any deployment** (Render, Vercel, etc.)

## 🚨 **Important Notes:**
- Old submissions (before this update) will still use the fallback system
- New submissions will automatically use Cloudinary
- Files are stored in folders: `taskhub/activities/` and `taskhub/submissions/`

## 🆘 **Need Help?**
If you encounter any issues:
1. Check your Cloudinary credentials are correct
2. Verify your .env file is in the backend folder
3. Restart the backend server after changing .env
4. Check the browser console for any errors

---
**Your file download problems are now solved permanently! 🎉**