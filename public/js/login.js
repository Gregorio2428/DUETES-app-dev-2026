const form = document.getElementById('login-form');
const button = form.querySelector('button[type="submit"]');

Latch.wire(form);

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  Latch.clearErrors(form);
  Latch.setLoading(button, true, 'Logging in…');

  // Sent in the request BODY as JSON, never in the URL.
  const { status, data } = await Latch.post('/api/login', {
    username: form.elements.username.value,
    password: form.elements.password.value,
  });

  if (status === 200) {
    Latch.saveSession(data.user, false);
    Latch.showAlert(form, `${data.message} Taking you home…`, 'success');
    setTimeout(() => { window.location.href = '/home'; }, 500);
    return;
  }

  Latch.setLoading(button, false);
  Latch.showErrors(form, data); // 400 empty fields, 401 wrong credentials
});
