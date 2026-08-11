(() => {
  const USERS = {
    eliseo: { name: 'Eliseo', pin: '9352', edvc: true, simpleText: true, signature: 'assets/signature.png', signatureAlt: 'Firma y sello del Dr. Eliseo Rodríguez Claus' },
    sebastian: { name: 'Sebastián', pin: '1993', edvc: false, simpleText: false, signature: 'assets/signature-sebastian.png', signatureAlt: 'Firma y sello del Dr. Sebastián González Horcada' }
  };
  const SESSION_KEY = 'ecoInformeActiveUser';
  const access = document.querySelector('#userAccess');
  const choices = document.querySelector('#userChoices');
  const pinForm = document.querySelector('#userPinForm');
  const pinInput = document.querySelector('#userPin');
  const selectedName = document.querySelector('#selectedUserName');
  const error = document.querySelector('#userAccessError');
  const activeBar = document.querySelector('#activeUserBar');
  const activeName = document.querySelector('#activeUserName');
  let selectedUser = '';

  function readSession() {
    try { return window.sessionStorage.getItem(SESSION_KEY); } catch (_) { return null; }
  }

  function writeSession(value) {
    try { window.sessionStorage.setItem(SESSION_KEY, value); } catch (_) { /* La sesión seguirá activa en memoria. */ }
  }

  function clearSession() {
    try { window.sessionStorage.removeItem(SESSION_KEY); } catch (_) { /* Sin almacenamiento disponible. */ }
  }

  function showUserChoice() {
    selectedUser = '';
    choices.hidden = false;
    pinForm.hidden = true;
    pinInput.value = '';
    error.textContent = '';
  }

  function lockAccess() {
    clearSession();
    document.body.classList.add('user-locked');
    access.hidden = false;
    activeBar.hidden = true;
    showUserChoice();
    window.scrollTo(0, 0);
  }

  function setSignature(user) {
    ['#ecoSignature', '#edvcSignature'].forEach(selector => {
      const signature = document.querySelector(selector);
      const image = signature?.querySelector('img');
      if (!signature || !image) return;
      signature.hidden = !user.signature;
      if (user.signature) {
        image.src = user.signature;
        image.alt = user.signatureAlt;
      }
    });
  }

  function applyUser(userId) {
    const user = USERS[userId];
    if (!user) return lockAccess();

    window.activeReportUser = userId;
    document.documentElement.dataset.reportUser = userId;
    activeName.textContent = user.name;
    activeBar.hidden = false;

    const edvcTab = document.querySelector('#edvcTab');
    const copyTextButton = document.querySelector('#copyTextButton');
    if (edvcTab) edvcTab.hidden = !user.edvc;
    if (copyTextButton) copyTextButton.hidden = !user.simpleText;
    setSignature(user);

    if (!user.edvc && document.body.dataset.activeStudy === 'edvc') {
      document.querySelector('#ecoTab')?.click();
    }

    writeSession(userId);
    access.hidden = true;
    document.body.classList.remove('user-locked');
  }

  choices.querySelectorAll('[data-report-user]').forEach(button => {
    button.addEventListener('click', () => {
      selectedUser = button.dataset.reportUser;
      selectedName.textContent = USERS[selectedUser].name;
      choices.hidden = true;
      pinForm.hidden = false;
      error.textContent = '';
      pinInput.value = '';
      pinInput.focus();
    });
  });

  pinInput.addEventListener('input', () => {
    pinInput.value = pinInput.value.replace(/\D/g, '').slice(0, 4);
    error.textContent = '';
  });

  pinForm.addEventListener('submit', event => {
    event.preventDefault();
    if (!selectedUser || pinInput.value !== USERS[selectedUser].pin) {
      error.textContent = 'PIN incorrecto.';
      pinInput.select();
      return;
    }
    applyUser(selectedUser);
  });

  document.querySelector('#backUserButton').addEventListener('click', showUserChoice);
  document.querySelector('#switchUserButton').addEventListener('click', lockAccess);

  const savedUser = readSession();
  if (savedUser && USERS[savedUser]) applyUser(savedUser);
  else lockAccess();
})();
