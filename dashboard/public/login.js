'use strict';
const form = document.querySelector('#login-form');
const error = document.querySelector('#login-error');
form.addEventListener('submit', async event => {
  event.preventDefault(); error.hidden = true;
  const button = document.querySelector('#sign-in'); button.disabled = true; button.textContent = 'Signing in…';
  try {
    const fields = new FormData(form);
    const response = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: fields.get('username'), password: fields.get('password') }) });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || 'Unable to sign in.');
    document.querySelector('#password').value = ''; location.replace('/');
  } catch (failure) { error.textContent = failure.message || 'Unable to connect. Try again shortly.'; error.hidden = false; }
  finally { button.disabled = false; button.textContent = 'Sign in to workspace'; }
});
