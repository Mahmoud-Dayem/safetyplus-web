const USER_KEY = 'user';

export async function storeUser(user) {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (e) {
    console.error('Error storing user:', e);
  }
}

export async function getUser() {
  try {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (e) {
    console.error('Error getting user:', e);
    return null;
  }
}

export async function removeUser() {
  try {
    localStorage.removeItem(USER_KEY);
  } catch (e) {
    console.error('Error removing user:', e);
  }
}
