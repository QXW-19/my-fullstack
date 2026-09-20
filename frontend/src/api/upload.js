export function uploadFile(type, file) {
  const formData = new FormData();
  formData.append('file', file);

  const token = localStorage.getItem('token');

  return fetch(`/api/upload/${type}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  }).then(res => res.json()).then(res => {
    if (res.code === 0) return res.data;
    throw new Error(res.msg);
  });
}
