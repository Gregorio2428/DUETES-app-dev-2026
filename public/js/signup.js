const form = document.getElementById('signup-form');
const button = form.querySelector('button[type="submit"]');
const meter = document.getElementById('meter');
const meterLabel = document.getElementById('meter-label');

Latch.wire(form);

// ---------- Password strength (advice only; it never blocks signup) ----------
const HINT = 'Longer is stronger. Mix letters, numbers and symbols.';
const LABELS = ['', 'Weak. Keep going.', 'Okay. Add more variety.', 'Good.', 'Strong.'];

function strength(password) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (password.length < 8) score = Math.min(score, 1);
  return Math.max(1, Math.min(score, 4));
}

form.elements.password.addEventListener('input', (e) => {
  const level = strength(e.target.value);
  meter.dataset.level = level;
  meterLabel.textContent = level ? LABELS[level] : HINT;
});

// ---------- Submit ----------
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  Latch.clearErrors(form);
  Latch.setLoading(button, true, 'Creating account…');

  // Sent in the request BODY as JSON.
  const { status, data } = await Latch.post('/api/signup', {
    email: form.elements.email.value,
    username: form.elements.username.value,
    password: form.elements.password.value,
  });

  if (status === 201) {
    Latch.saveSession(data.user, true);
    Latch.showAlert(form, `${data.message} Taking you home…`, 'success');
    setTimeout(() => { window.location.href = '/home'; }, 700);
    return;
  }

  Latch.setLoading(button, false);
  Latch.showErrors(form, data); // 400 empty fields, 409 already exists, etc.
});
