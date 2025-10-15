import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { collection, getDocs, setDoc, doc, getDoc } from "firebase/firestore";

import { getAuth, createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } from "firebase/auth";

// Get environment variables (for web)
const getEnvVar = (key, fallback = '') => {
  try {
    return process.env[`REACT_APP_${key}`] || fallback;
  } catch (error) {
    console.warn(`Failed to load environment variable: ${key}`, error);
    return fallback;
  }
};

 

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain:process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
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


export async function signup({ displayName,email, password,  companyId }) {

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    // Set display name
    await updateProfile(user, {
      displayName: displayName,
    });
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email,
      displayName,
      companyId,
      createdAt: new Date().toISOString(),
      isAdmin:false ,
      isPrivileged:false
    });



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

export async function signin({ email, password }) {

  const auth = getAuth();
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);
    const companyId = docSnap.data().companyId;
    const isAdmin = docSnap.data().isAdmin;
    const isPrivileged = docSnap.data().isPrivileged;
    // await AsyncStorage.setItem("companyId", companyId);

 
    return {
      status: 'ok',
      error: false,
      message: user,
      companyId,
      isAdmin,
      isPrivileged
    };
  } catch (error) {
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
