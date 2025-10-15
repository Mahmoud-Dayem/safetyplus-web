# Safety Plus Web Application

A workplace safety management web application converted from React Native to standard React. This app provides STOP Card (Safety Task Observation Program) functionality for conducting and tracking safety observations.

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Features

- **User Authentication**: Secure login and signup with Firebase Authentication
- **STOP Card Creation**: Comprehensive safety observation forms with:
  - Actions assessment (6 categories)
  - Conditions assessment (4 categories)
  - Report submission to Google Sheets and Firestore
  - Real-time validation and progress tracking
- **Report History**: View and manage past safety observations
- **Cloud Sync**: Data synchronization with Firebase Firestore
- **Offline Cache**: Local storage for viewing reports offline

## Tech Stack

- **React**: 19.2.0 (Web)
- **React Router DOM**: 7.9.4 for navigation
- **Redux Toolkit**: 2.9.0 for state management
- **Firebase**: Firestore for database and Authentication
- **CSS**: Custom styling with color theme constants

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase project with Firestore enabled
- Google Apps Script for data submission (optional)

## Environment Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Configure environment variables in `.env`:
   ```
   REACT_APP_GOOGLE_SHEETS_URL=your_google_script_url
   ```

3. Update Firebase configuration in `src/firebase/firebaseConfig.js` with your Firebase project credentials.

## Installation

```bash
npm install
```

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
