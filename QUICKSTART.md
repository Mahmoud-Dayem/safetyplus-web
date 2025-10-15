# Quick Start Guide - Safety Plus Web App

## 🚀 Getting Started in 5 Minutes

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

Edit `.env` and add your Google Sheets URL (if using):
```env
REACT_APP_GOOGLE_SHEETS_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

### Step 3: Configure Firebase
Update `src/firebase/firebaseConfig.js` with your Firebase project credentials:
```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### Step 4: Run Development Server
```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

### Step 5: Create an Account
1. Click "Sign Up" on the authentication screen
2. Enter your email, password, and company ID
3. Click "Sign Up"

---

## 📱 Application Flow

### 1. Authentication (`/auth`)
- **Login**: Enter email and password
- **Sign Up**: Create new account with email, password, and company ID
- Password must be at least 6 characters

### 2. Home Dashboard (`/home`)
- View user information
- Access STOP Card creation
- View report history
- Logout

### 3. STOP Card (`/stopcard`)
#### Tab 1: Actions
- 6 categories of safety actions
- Check completed actions
- "All Safe" toggle for each category

#### Tab 2: Conditions
- 4 categories of workplace conditions
- Check completed conditions
- "All Safe" toggle for each category

#### Tab 3: Report
- **Safe Acts Observed**: Add multiple entries
- **Unsafe Acts Observed**: Add multiple entries
- **Date**: Select observation date
- **Site**: Choose from predefined list
- **Area**: Enter specific area
- **Shift**: Select shift (General, A, B, C)
- **Duration**: Time spent (minutes)
- **People Conducted**: Number of people conducting observation
- **People Observed**: Number of people observed
- **Suggestions**: Additional notes

**Submit Requirements:**
- Actions: Minimum 50% completion
- Conditions: Minimum 50% completion
- At least 1 safe act
- At least 1 unsafe act
- All required fields filled

### 4. Report History (`/reports`)
- View all submitted reports
- Sync with cloud (Firestore)
- Local cache for offline viewing
- Click any report to view details

---

## 🎨 Color Theme

The app uses a centralized color system from `src/constants/color.js`:
- **Primary**: #FF9500 (Orange)
- **Background**: #F9F9F9 (Light Gray)
- **Text**: #1C1C1E (Dark Gray)
- **Success**: #30D158 (Green)
- **Error**: #FF3B30 (Red)

---

## 🔧 Troubleshooting

### "Module not found" errors
```bash
npm install
```

### Firebase errors
- Check `firebaseConfig.js` credentials
- Verify Firebase project is active
- Enable Firestore and Authentication in Firebase console

### Google Sheets submission fails
- Verify `REACT_APP_GOOGLE_SHEETS_URL` in `.env`
- Check Google Apps Script deployment
- Ensure script accepts POST requests

### Route not found
- Clear browser cache
- Restart development server
- Check `App.js` route configuration

---

## 📦 Build for Production

```bash
npm run build
```

Creates optimized production build in `build/` folder.

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod
```

### Deploy to Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

---

## 🧪 Testing Checklist

Before deployment, test:
- ✅ Sign up new user
- ✅ Login existing user
- ✅ Navigate to STOP Card
- ✅ Fill Actions tab (50%+)
- ✅ Fill Conditions tab (50%+)
- ✅ Fill Report tab completely
- ✅ Submit report
- ✅ View report history
- ✅ Sync with cloud
- ✅ View report details in modal
- ✅ Logout

---

## 📚 Additional Resources

- [React Documentation](https://react.dev/)
- [React Router](https://reactrouter.com/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Create React App](https://create-react-app.dev/)

---

## 🆘 Need Help?

Check these files for detailed information:
- `CONVERSION-SUMMARY.md` - Complete conversion details
- `README.md` - Project overview
- `.env.example` - Environment variable template

---

**Happy Safety Observing! 🛡️**
