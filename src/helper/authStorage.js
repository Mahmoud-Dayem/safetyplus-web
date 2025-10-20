const USER_KEY = 'safetyplus_user_auth';
const BACKUP_KEY = 'safetyplus_user_backup';

export async function storeUser(user) {
  try {
    const userData = JSON.stringify(user);
    
    // Primary storage
    localStorage.setItem(USER_KEY, userData);
    
    // Backup storage for PWA reliability
    localStorage.setItem(BACKUP_KEY, userData);
    
    // Also store in sessionStorage as additional backup
    sessionStorage.setItem(USER_KEY, userData);
    
   } catch (e) {
    console.error('Error storing user:', e);
  }
}

export async function getUser() {
  try {
    // Try primary storage first
    let userData = localStorage.getItem(USER_KEY);
    
    // If not found, try backup storage
    if (!userData) {
      userData = localStorage.getItem(BACKUP_KEY);
      
      // If found in backup, restore to primary
      if (userData) {
        localStorage.setItem(USER_KEY, userData);
      }
    }
    
    // If still not found, try sessionStorage
    if (!userData) {
      userData = sessionStorage.getItem(USER_KEY);
      
      // If found in session, restore to localStorage
      if (userData) {
        localStorage.setItem(USER_KEY, userData);
        localStorage.setItem(BACKUP_KEY, userData);
      }
    }
    
    if (userData) {
       return JSON.parse(userData);
    }
    
    // console.log('No user data found in any storage');
    return null;
  } catch (e) {
    console.error('Error getting user:', e);
    return null;
  }
}

export async function removeUser() {
  try {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(BACKUP_KEY);
    sessionStorage.removeItem(USER_KEY);
    // console.log('User data cleared from all storage');
  } catch (e) {
    console.error('Error removing user:', e);
  }
}
