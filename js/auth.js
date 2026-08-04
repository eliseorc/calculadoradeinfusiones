(function () {
  const client = window.infusionSupabase;
  if (!client) return;

  function readableAuthError(error) {
    const message = (error?.message || '').toLowerCase();
    if (message.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.';
    if (message.includes('email not confirmed')) return 'Primero confirmá tu correo electrónico.';
    if (message.includes('user already registered')) return 'Ya existe una cuenta con ese correo.';
    if (message.includes('password')) return 'La contraseña debe tener al menos 8 caracteres.';
    if (message.includes('rate limit')) return 'Demasiados intentos. Esperá unos minutos y probá nuevamente.';
    return 'No pudimos completar la operación. Intentá nuevamente.';
  }

  function setStatus(message, isError) {
    const status = document.getElementById('auth-status');
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('is-error', Boolean(isError));
  }

  function setFormsBusy(isBusy) {
    document.querySelectorAll('[data-auth-form] button[type="submit"]').forEach(function (button) {
      button.disabled = isBusy;
    });
  }

  function updateAccountUI(user) {
    window.infusionUser = user || null;

    const guestControls = document.getElementById('guest-account-controls');
    const userControls = document.getElementById('user-account-controls');
    const userEmail = document.getElementById('account-email');

    if (guestControls) guestControls.hidden = Boolean(user);
    if (userControls) userControls.hidden = !user;
    if (userEmail) {
      userEmail.textContent = 'Mi cuenta';
      if (user?.email) userEmail.setAttribute('aria-label', 'Abrir mi cuenta: ' + user.email);
      else userEmail.removeAttribute('aria-label');
    }

    document.querySelectorAll('.sidebar li.is-locked').forEach(function (item) {
      item.classList.toggle('is-unlocked', Boolean(user));
      const link = item.querySelector('a');
      if (link) {
        const drugName = link.textContent.trim();
        if (user) link.removeAttribute('aria-label');
        else link.setAttribute('aria-label', drugName + ', requiere iniciar sesión');
      }
    });

    window.dispatchEvent(new CustomEvent('infusion-auth-changed', {
      detail: { user: window.infusionUser }
    }));
  }

  async function loadSession() {
    const result = await client.auth.getSession();
    updateAccountUI(result.data.session?.user || null);
  }

  async function handleLogin(form) {
    const email = form.elements.email.value.trim();
    const password = form.elements.password.value;
    const result = await client.auth.signInWithPassword({ email, password });
    if (result.error) throw result.error;
    const requestedReturn = new URLSearchParams(window.location.search).get('return');
    window.location.href = requestedReturn === 'cuenta.html' ? 'cuenta.html' : 'index.html';
  }

  async function handleRegister(form) {
    const email = form.elements.email.value.trim();
    const password = form.elements.password.value;
    const options = {};

    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
      options.emailRedirectTo = new URL('acceso.html?modo=ingresar&confirmado=1', window.location.href).href;
    }

    const result = await client.auth.signUp({ email, password, options });
    if (result.error) throw result.error;
    form.reset();
    setStatus('Revisá tu correo y confirmá la cuenta para poder ingresar.', false);
  }

  async function handleReset(form) {
    const email = form.elements.email.value.trim();
    const options = {};

    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
      options.redirectTo = new URL('acceso.html?modo=ingresar', window.location.href).href;
    }

    const result = await client.auth.resetPasswordForEmail(email, options);
    if (result.error) throw result.error;
    form.reset();
    setStatus('Si el correo está registrado, recibirás un enlace para recuperar el acceso.', false);
  }

  document.addEventListener('DOMContentLoaded', function () {
    loadSession().catch(function () {
      updateAccountUI(null);
    });

    document.querySelectorAll('[data-auth-form]').forEach(function (form) {
      form.addEventListener('submit', async function (event) {
        event.preventDefault();
        setFormsBusy(true);
        setStatus('', false);

        try {
          if (form.dataset.authForm === 'login') await handleLogin(form);
          if (form.dataset.authForm === 'register') await handleRegister(form);
          if (form.dataset.authForm === 'reset') await handleReset(form);
        } catch (error) {
          setStatus(readableAuthError(error), true);
        } finally {
          setFormsBusy(false);
        }
      });
    });

    document.getElementById('sign-out-button')?.addEventListener('click', async function () {
      await client.auth.signOut();
      updateAccountUI(null);
      window.location.href = 'index.html';
    });

    client.auth.onAuthStateChange(function (_event, session) {
      updateAccountUI(session?.user || null);
    });
  });
})();
