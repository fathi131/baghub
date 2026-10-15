export const hasValidAuthToken = () => {
  const token = localStorage.getItem('token');
  if (!token || token === 'undefined' || token === 'null') return false;

  const segments = token.split('.');
  if (segments.length !== 3) return false;

  try {
    const normalizedPayload = segments[1].replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = normalizedPayload.padEnd(normalizedPayload.length + ((4 - normalizedPayload.length % 4) % 4), '=');
    const payload = JSON.parse(atob(paddedPayload));
    return Number(payload.exp) > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
};
