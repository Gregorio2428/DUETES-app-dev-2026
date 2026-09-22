// Helpers used by every page. Exposes one global: `Latch`.
const Latch = (() => {
  const SESSION_KEY = 'latch.user';

  // ---------- API ----------

  // Sends a POST request with a JSON body (the API's only HTTP method).
  // Always resolves to { status, data }, even when the server is unreachable.
  async function post(url, body) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      let data = {};
      try { data = await res.json(); } catch { /* non-JSON response */ }
      return { status: res.status, data };
    } catch {
      return {
        status: 0,
        data: { message: "Can't reach the server. Check that it is running, then try again." },
      };
    }
  }

  // ---------- Session (demo only) ----------
  // The API has no GET endpoint, so the logged-in user is kept in sessionStorage.
  // Real apps would use a signed cookie or token issued by the server.

  const saveSession = (user, isNew) =>
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ ...user, isNew: Boolean(isNew), at: Date.now() })
    );

  function getSession() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch { return null; }
  }

  const clearSession = () => sessionStorage.removeItem(SESSION_KEY);

  // ---------- Form UI ----------

  function showAlert(form, message, type) {
    const box = form.querySelector('.alert');
    box.textContent = message;
    box.className = `alert ${type}`;
    box.hidden = false;
  }

  function clearErrors(form) {
    form.querySelectorAll('.field').forEach((field) => {
      field.classList.remove('has-error');
      field.querySelector('.field-error').textContent = '';
      field.querySelector('input').removeAttribute('aria-invalid');
    });
    const box = form.querySelector('.alert');
    box.hidden = true;
    box.textContent = '';
  }

  // Shows the server's response: an alert on top plus a message under each bad field.
  function showErrors(form, data) {
    showAlert(form, data.message || 'Something went wrong. Try again.', 'error');
    let firstBad = null;
    Object.entries(data.errors || {}).forEach(([name, message]) => {
      const input = form.elements[name];
      if (!input) return;
      const field = input.closest('.field');
      field.classList.add('has-error');
      field.querySelector('.field-error').textContent = message;
      input.setAttribute('aria-invalid', 'true');
      firstBad = firstBad || input;
    });
    if (firstBad) firstBad.focus();
  }

  function setLoading(button, isLoading, loadingLabel) {
    if (isLoading) {
      button.dataset.label = button.textContent;
      button.textContent = loadingLabel;
    } else if (button.dataset.label) {
      button.textContent = button.dataset.label;
    }
    button.disabled = isLoading;
  }

  // Show/hide password toggle + clears a field's error as soon as you edit it.
  function wire(form) {
    const toggle = form.querySelector('.toggle-visibility');
    if (toggle) {
      toggle.addEventListener('click', () => {
        const input = form.elements.password;
        const reveal = input.type === 'password';
        input.type = reveal ? 'text' : 'password';
        toggle.textContent = reveal ? 'Hide' : 'Show';
        toggle.setAttribute('aria-pressed', String(reveal));
      });
    }
    form.querySelectorAll('.field input').forEach((input) => {
      input.addEventListener('input', () => {
        const field = input.closest('.field');
        field.classList.remove('has-error');
        field.querySelector('.field-error').textContent = '';
        input.removeAttribute('aria-invalid');
      });
    });
  }

  return { post, saveSession, getSession, clearSession, showAlert, clearErrors, showErrors, setLoading, wire };
})();
