# Firebase Hosting Deployment

## Prerequisites
1. Install Firebase CLI globally:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

## Deployment Steps

### First Time Setup
1. Make sure you're logged in to Firebase CLI
2. Verify your project is linked:
```bash
firebase projects:list
```

### Deploy to Firebase Hosting

Option 1 - Full deployment:
```bash
npm run deploy
```

Option 2 - Hosting only:
```bash
npm run deploy:hosting
```

Option 3 - Manual steps:
```bash
# Build the app
npm run build

# Deploy to Firebase
firebase deploy --only hosting
```

## What Gets Deployed
- The `build` folder contents are deployed to Firebase Hosting
- React Router is configured to work with direct URL access
- All routes are rewritten to `/index.html` for client-side routing

## Post-Deployment
- Your app will be available at: https://safetyplus-1b045.web.app
- Or custom domain: https://safetyplus-1b045.firebaseapp.com

## Troubleshooting

If deployment fails:
1. Make sure Firebase CLI is installed: `firebase --version`
2. Re-login: `firebase login --reauth`
3. Check project: `firebase use --add`
4. Try again: `npm run deploy`

## Environment Variables
Make sure your `.env` file has all required Firebase configuration.
The production build will use these environment variables.
