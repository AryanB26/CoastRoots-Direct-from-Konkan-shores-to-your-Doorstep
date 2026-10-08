export async function api(path, { method = 'GET', body } = {}) {
  const token = localStorage.getItem('cr_token');
  const res = await fetch(`/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}
export const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export const inSeason = (p) => {
  if (!p.seasonFrom || !p.seasonTo) return null;
  const m = new Date().getMonth() + 1;
  return p.seasonFrom <= p.seasonTo ? m >= p.seasonFrom && m <= p.seasonTo : m >= p.seasonFrom || m <= p.seasonTo;
};
