import axiosInstance from '../axiosInstance.js';

// Downloads a file from a login-protected API route (a plain link cannot send the token).
export async function downloadAuthedFile(url, filename) {
  const res = await axiosInstance.get(url, { responseType: 'blob' });
  const href = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}
