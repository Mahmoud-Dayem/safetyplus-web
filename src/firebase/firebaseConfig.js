import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { collection, getDocs, setDoc, doc, getDoc } from "firebase/firestore";

import { getAuth, createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";

// Get environment variables (for web)
// const getEnvVar = (key, fallback = '') => {
//   try {
//     return process.env[`REACT_APP_${key}`] || fallback;
//   } catch (error) {
//     console.warn(`Failed to load environment variable: ${key}`, error);
//     return fallback;
//   }
// };



const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Validate Firebase config
const validateConfig = () => {
  const required = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missing = required.filter(key => !firebaseConfig[key]);

  if (missing.length > 0) {
    console.error('Missing Firebase configuration:', missing);
    throw new Error(`Missing Firebase config: ${missing.join(', ')}`);
  }
};

// Validate configuration
validateConfig();

const app = initializeApp(firebaseConfig);
// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);


export async function signup({ displayName, email, password, companyId }) {

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    // Set display name
    await updateProfile(user, {
      displayName: displayName,
    });
    // Prevent companyId hijacking: block if companyId already claimed
    const targetUserDocRef = doc(db, "users", companyId);
    const targetUserDoc = await getDoc(targetUserDocRef);
    if (targetUserDoc.exists()) {
      // Revert auth session and abort
      await getAuth().signOut();
      return {
        status: 'error',
        error: true,
        message: 'This Company ID is already in use. Please contact your administrator or use your own Company ID.',
      };
    }
    // Primary user doc keyed by companyId (legacy app expectation)
    await setDoc(targetUserDocRef, {
      uid: user.uid,
      email,
      displayName: displayName.toUpperCase(),
      companyId,
      createdAt: new Date().toISOString(),
      isAdmin: false,
      isPrivileged: false,

    });

    // Secondary mapping keyed by uid to support secure rules and fast lookup
    try {
      await setDoc(
        doc(db, "users_by_uid", user.uid),
        {
          uid: user.uid,
          email,
          displayName: displayName.toUpperCase(),
          companyId,
          companyIdNum: parseInt(companyId, 10),
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (e) {
      console.warn("Failed to write users_by_uid mapping:", e);
    }



    return {
      status: 'ok',
      error: false,
      message: user,
    };
  } catch (error) {
    return {
      status: 'error',
      error: true,
      message: error.message,
    };
  }
}

export async function signin({ email, password, companyId }) {
  const companyIdString = companyId.toString();
  const auth = getAuth();
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
 
    // Fetch user document by company ID
    const docRef = doc(db, "users", companyIdString);
    const docSnap = await getDoc(docRef);

    // Check if document exists
    if (!docSnap.exists()) {
      await auth.signOut(); // Sign out the user
      return {
        status: 'error',
        error: true,
        message: "Company ID not found. Please check your Company ID and try again.",
      };
    }

    const userData = docSnap.data();
    const storedCompanyId = userData?.companyId;
    const isAdmin = userData?.isAdmin || false;
    const isPrivileged = userData?.isPrivileged || false;
    const userId = userData?.uid;

 
    // Verify user email matches the company ID
    if (userId === user.uid) {
      // Maintain users_by_uid mapping for rules and lookups
      try {
        await setDoc(
          doc(db, "users_by_uid", user.uid),
          {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || null,
            companyId: storedCompanyId,
            companyIdNum: parseInt(storedCompanyId, 10),
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (e) {
        console.warn("Failed to upsert users_by_uid mapping on signin:", e);
      }
       return {
        status: 'ok',
        error: false,
        message: user,
        companyId: storedCompanyId,
        isAdmin,
        isPrivileged
      };
    } else {
      // Sign out the user since they're not authorized for this company ID
      await auth.signOut();
      return {
        status: 'error',
        error: true,
        message: "Email address does not match the provided Company ID. Please verify your credentials.",
      };
    }

  } catch (error) {
    console.error('Sign in error:', error);
    return {
      status: 'error',
      error: true,
      message: error.message,
    };
  }
}
export const db = getFirestore(app);

/* use it to get detailed tasks from firestore */

export const updateDetailedTasks = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "allTasks"));
    const tasks = [];

    querySnapshot.forEach((doc) => {
      tasks.push({ id: doc.id, ...doc.data() });
    });

    // Save to cache
    await storeData('cached_tasks', tasks);

  } catch (error) {
    console.error("Error fetching tasks:", error);
  }
};


//  updateDetailedTasks();

const storeData = async (key, value) => {
  try {
    const jsonValue = JSON.stringify(value);
    localStorage.setItem(key, jsonValue);
  } catch (e) {
    console.error('Error saving to storage', e);
  }
};


export const loadData = async (key) => {
  try {
    const jsonValue = localStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error('Failed to load data from cache', e);
    return null;
  }
};


// const cached  = await loadData('cached_tasks');
//
//
//
//
export const updateSpares = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "spares"));
    const spares = [];

    querySnapshot.forEach((doc) => {
      spares.push({ id: doc.id, ...doc.data() });
    });

    // Save to cache
    await storeData('cached_spares', spares);

  } catch (error) {
    console.error("Error fetching spares:", error);
  }
};


//  Load spares from cache();
export const loadSpares = async (key) => {
  try {
    const jsonValue = localStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error('Failed to load data from cache', e);
    return null;
  }
};
////////////////////////// Load favorites
export const loadFavorites = async (key) => {
  try {
    const jsonValue = localStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error('Failed to load favorites from cache', e);
    return null;
  }
};

//////////////////// update to favorites
export const storeFavorites = async (key, value) => {

  try {
    const jsonValue = JSON.stringify(value);
    localStorage.setItem(key, jsonValue);
  } catch (e) {
    console.error('Error saving to storage', e);
  }
};

//////////////////


/**
 * Loads the companyId for the current user.
 * 1. Checks AsyncStorage first
 * 2. If not found, fetch from Firestore
 * 3. Cache it in AsyncStorage
 */
export async function loadCompanyId() {
  const auth = getAuth();

  try {
    // 1️⃣ Check localStorage first
    const cachedId = localStorage.getItem("companyId");
    if (cachedId) {
      return cachedId;
    }

    // 2️⃣ Get from Firestore if not cached
    const user = auth.currentUser;
    if (!user) {
      throw new Error("No user is signed in");
    }

    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error("User document not found");
    }

    const companyId = docSnap.data().companyId;
    if (!companyId) {
      throw new Error("companyId is missing in user document");
    }

    // 3️⃣ Save to localStorage for future use
    localStorage.setItem("companyId", companyId);

    return companyId;
  } catch (error) {
    console.error("Error loading companyId:", error);
    return null;
  }
}

// Password reset function with custom settings
export async function resetPassword(email) {
  try {
    // Custom action code settings to reduce spam likelihood
    const actionCodeSettings = {
      // URL the user will be redirected to after clicking the email link
      url: `${window.location.origin}/login?mode=resetPassword`,
      handleCodeInApp: false,
    };

    await sendPasswordResetEmail(auth, email, actionCodeSettings);
    return {
      status: "ok",
      message: "Password reset email sent successfully. Please check your inbox and spam folder."
    };
  } catch (error) {
    console.error("Password reset error:", error);
    let errorMessage = "Failed to send password reset email.";
    
    if (error.code === 'auth/user-not-found') {
      errorMessage = "No account found with this email address.";
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = "Invalid email address.";
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = "Too many reset attempts. Please try again later.";
    }
    
    return {
      status: "error",
      message: errorMessage
    };
  }
}
