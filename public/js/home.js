const user = Latch.getSession();

if (!user) {
  window.location.replace('/login');
} else {
  const set = (id, text) => { document.getElementById(id).textContent = text; };

  set('greeting', `Welcome back, ${user.username}.`);
  set('subline', "You're logged in.");
  set('avatar', user.username.charAt(0).toUpperCase());
  document.getElementById('home').hidden = false;

  document.getElementById('logout').addEventListener('click', () => {
    Latch.clearSession();
    window.location.href = '/login';
  });
}