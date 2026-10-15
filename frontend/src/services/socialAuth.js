import API from '../api/axios';

let facebookSdkPromise;

export const prepareFacebookSdk = () => {
  const appId = import.meta.env.VITE_FACEBOOK_APP_ID;
  if (!appId) return Promise.reject(new Error('Facebook login is not configured. Add VITE_FACEBOOK_APP_ID.'));
  if (window.FB) {
    window.FB.init({ appId, cookie: true, xfbml: false, version: 'v23.0' });
    return Promise.resolve(window.FB);
  }
  if (facebookSdkPromise) return facebookSdkPromise;

  facebookSdkPromise = new Promise((resolve, reject) => {
    window.fbAsyncInit = () => {
      window.FB.init({ appId, cookie: true, xfbml: false, version: 'v23.0' });
      resolve(window.FB);
    };
    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.onerror = () => reject(new Error('Could not load Facebook login'));
    document.head.appendChild(script);
  });
  return facebookSdkPromise;
};

export const authenticateWithGoogle = async (accessToken, referralCode = '') => {
  const response = await API.post('/user/google', { accessToken, referralCode });
  return response.data;
};

export const authenticateWithFacebook = async (referralCode = '') => {
  await prepareFacebookSdk();
  const accessToken = await new Promise((resolve, reject) => {
    window.FB.login((response) => {
      const token = response.authResponse?.accessToken;
      if (token) resolve(token);
      else reject(new Error('Facebook sign-in was cancelled'));
    }, { scope: 'public_profile,email' });
  });
  const response = await API.post('/user/facebook', { accessToken, referralCode });
  return response.data;
};

export const persistUserSession = ({ token, user }) => {
  if (!token || !user) throw new Error('Authentication did not return a valid session');
  localStorage.setItem('token', token);
  localStorage.setItem('role', user.role || 'user');
  localStorage.setItem('isLoggedIn', 'true');
  localStorage.setItem('user', JSON.stringify(user));
};
