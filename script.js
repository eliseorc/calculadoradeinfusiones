document.addEventListener("DOMContentLoaded", function () {
  const lang = document.documentElement.lang;

  if (lang === "es") {
    document.getElementById("lang-es")?.classList.add("active");
  }
  if (lang === "en") {
    document.getElementById("lang-en")?.classList.add("active");
  }

  document.querySelectorAll('label[for]').forEach(function (label) {
    const input = document.getElementById(label.htmlFor);
    if (!input || input.closest('.presentation-dialog')) return;

    const labelText = label.textContent
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    if (labelText.includes('ampolla')) input.placeholder = 'amp';
    else if (labelText.includes('solucion') || labelText.includes('volumen')) input.placeholder = 'ml';
    else if (labelText.includes('peso')) input.placeholder = 'kg';
    else if (labelText.includes('ml/h')) input.placeholder = 'ml/h';
    else if (labelText.includes('glucemia')) input.placeholder = 'mg/dl';
  });
});

// Helper para leer números con . o , (iOS friendly)
function getNumber(id) {
  const input = document.getElementById(id);
  if (!input) return NaN;

  let v = (input.value || "").trim();
  if (!v) return NaN;

  // Soporta 12,5 -> 12.5
  v = v.replace(',', '.');

  const num = Number(v);
  return isNaN(num) ? NaN : num;
}

function formatResultNumber(value, decimals) {
  return value.toFixed(decimals).replace('.', ',');
}

function validateCalculationValues(event) {
  const form = event.target;
  const section = form?.closest('.section');
  if (!form?.matches('.section > form') || !section) return;

  const inputs = Array.from(form.querySelectorAll(':scope > input'));
  let hasInvalidValue = false;

  inputs.forEach(function (input) {
    const label = form.querySelector('label[for="' + input.id + '"]');
    const labelText = String(label?.textContent || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    const value = Number(String(input.value || '').trim().replace(',', '.'));
    const allowsZero = labelText.includes('solucion') || labelText.includes('solution');
    const isValid = Number.isFinite(value) && (allowsZero ? value >= 0 : value > 0);
    if (isValid) input.removeAttribute('aria-invalid');
    else input.setAttribute('aria-invalid', 'true');
    hasInvalidValue = hasInvalidValue || !isValid;
  });

  if (!hasInvalidValue) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  const sectionIndex = Number(section.id.replace('section', ''));
  const result = document.getElementById('result' + sectionIndex) ||
    form.querySelector('[id^="resultadoTratamiento"]');
  if (result) {
    result.textContent = document.documentElement.lang === 'en' ? 'Check the values.' : 'Revisá los valores.';
    clearDoseRange(result.id);
  }
  const detail = section.querySelector('[data-calculation-detail]');
  if (detail) detail.hidden = true;
}

document.addEventListener('submit', validateCalculationValues, true);

document.addEventListener('input', function (event) {
  if (event.target.matches('.section > form > input')) {
    event.target.removeAttribute('aria-invalid');
  }
});

/* ======================
   PRESENTACIONES EDITABLES
   ====================== */

const DRUG_PRESENTATIONS = Object.freeze({
  1:  { amount: 4,   unit: 'mg',  name: 'Noradrenalina' },
  2:  { amount: 200, unit: 'mg',  name: 'Dopamina' },
  3:  { amount: 250, unit: 'mg',  name: 'Dobutamina' },
  4:  { amount: 10,  unit: 'mg',  name: 'Milrinona' },
  5:  { amount: 1,   unit: 'mg',  name: 'Adrenalina' },
  6:  { amount: 20,  unit: 'UI',  name: 'Vasopresina' },
  7:  { amount: 1,   unit: 'mg',  name: 'Isoproterenol' },
  8:  { amount: 20,  unit: 'mg',  volume: 2,  volumeUnit: 'ml', usesVolume: true, name: 'Furosemida' },
  9:  { amount: 250, unit: 'mcg', volume: 5,  volumeUnit: 'ml', usesVolume: true, name: 'Fentanilo' },
  10: { amount: 5,   unit: 'mg',  volume: 5,  volumeUnit: 'ml', usesVolume: true, name: 'Remifentanilo' },
  11: { amount: 15,  unit: 'mg',  volume: 3,  volumeUnit: 'ml', usesVolume: true, name: 'Midazolam' },
  12: { amount: 200, unit: 'mg',  volume: 20, volumeUnit: 'ml', usesVolume: true, name: 'Propofol' },
  13: { amount: 200, unit: 'mcg', volume: 2,  volumeUnit: 'ml', usesVolume: true, name: 'Dexmedetomidina' },
  16: { amount: 50,  unit: 'mg',  displayVolume: 5, volumeUnit: 'ml', name: 'Atracurio' },
  17: { amount: 20,  unit: 'mg',  name: 'Labetalol' },
  18: { amount: 50,  unit: 'mg',  name: 'Nitroprusiato de sodio' },
  19: { amount: 100, unit: 'mg',  volume: 5, volumeUnit: 'ml', usesVolume: true, showsPercent: true, name: 'Lidocaína' }
});

const PRESENTATION_STORAGE_KEY = 'infusion-drug-presentations-v1';
let activePresentationSection = null;
const ADJUSTMENTS_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
  '<path d="M4 7h7M15 7h5M4 17h3M11 17h9M11 4v6M7 14v6"/>' +
  '<circle cx="13" cy="7" r="2"/><circle cx="9" cy="17" r="2"/></svg>';

function readPresentationOverrides() {
  try {
    return JSON.parse(localStorage.getItem(PRESENTATION_STORAGE_KEY) || '{}');
  } catch (_error) {
    return {};
  }
}

function getDrugPresentation(sectionIndex) {
  const defaults = DRUG_PRESENTATIONS[sectionIndex];
  if (!defaults) return null;

  const saved = readPresentationOverrides()[sectionIndex] || {};
  const amount = Number(saved.amount);
  const volume = Number(saved.volume);

  return {
    ...defaults,
    amount: Number.isFinite(amount) && amount > 0 ? amount : defaults.amount,
    volume: defaults.usesVolume && Number.isFinite(volume) && volume > 0 ? volume : defaults.volume,
    isCustom: (Number.isFinite(amount) && amount > 0 && amount !== defaults.amount) ||
      (defaults.usesVolume && Number.isFinite(volume) && volume > 0 && volume !== defaults.volume)
  };
}

function formatPresentationNumber(value) {
  return String(value).replace('.', ',');
}

function updatePresentationLabel(sectionIndex) {
  const config = getDrugPresentation(sectionIndex);
  const section = document.getElementById('section' + sectionIndex);
  const text = section?.querySelector('.presentation-text');
  const badge = section?.querySelector('.presentation-custom-badge');
  if (!config || !text) return;

  const shownVolume = config.usesVolume ? config.volume : config.displayVolume;
  const percent = config.showsPercent && shownVolume
    ? ' (' + formatPresentationNumber(Number((config.amount / shownVolume / 10).toFixed(2))) + '%)'
    : '';
  text.textContent = '1 amp = ' + formatPresentationNumber(config.amount) + ' ' + config.unit +
    (shownVolume ? ' / ' + formatPresentationNumber(shownVolume) + ' ' + config.volumeUnit : '') + percent;
  if (badge) badge.hidden = !config.isCustom;
  text.closest('.presentation-heading')?.classList.toggle('has-custom-presentation', config.isCustom);
}

function initializePresentationEditors() {
  Object.keys(DRUG_PRESENTATIONS).forEach(function (key) {
    const sectionIndex = Number(key);
    const section = document.getElementById('section' + sectionIndex);
    const heading = section?.querySelector('h3');
    if (!heading) return;

    heading.textContent = '';
    heading.classList.add('presentation-heading');

    const text = document.createElement('span');
    text.className = 'presentation-text';

    const button = document.createElement('button');
    button.className = 'presentation-edit';
    button.type = 'button';
    button.innerHTML = ADJUSTMENTS_ICON;
    button.setAttribute('aria-label', 'Editar presentación de ' + DRUG_PRESENTATIONS[sectionIndex].name);
    button.addEventListener('click', function () {
      openPresentationDialog(sectionIndex);
    });

    const badge = document.createElement('small');
    badge.className = 'presentation-custom-badge';
    badge.textContent = 'Presentación personalizada';
    badge.hidden = true;

    heading.append(text, button, badge);
    updatePresentationLabel(sectionIndex);
  });
}

function openPresentationDialog(sectionIndex) {
  const config = getDrugPresentation(sectionIndex);
  const dialog = document.getElementById('presentation-dialog');
  if (!config || !dialog) return;

  activePresentationSection = sectionIndex;
  document.getElementById('presentation-dialog-title').textContent = 'Presentación de ' + config.name;
  document.getElementById('presentation-amount').value = config.amount;
  document.getElementById('presentation-amount-unit').textContent = config.unit;

  const volumeField = document.getElementById('presentation-volume-field');
  volumeField.hidden = !config.usesVolume;
  if (config.usesVolume) {
    document.getElementById('presentation-volume').value = config.volume;
    document.getElementById('presentation-volume-unit').textContent = config.volumeUnit;
  }

  document.getElementById('presentation-dialog-error').textContent = '';
  dialog.hidden = false;
  document.body.style.overflow = 'hidden';
  document.getElementById('presentation-amount').focus();
}

function closePresentationDialog() {
  const dialog = document.getElementById('presentation-dialog');
  if (!dialog) return;
  dialog.hidden = true;
  document.body.style.overflow = '';
  activePresentationSection = null;
}

function savePresentation(event) {
  event.preventDefault();
  const defaults = DRUG_PRESENTATIONS[activePresentationSection];
  if (!defaults) return;

  const amount = getNumber('presentation-amount');
  const volume = defaults.usesVolume ? getNumber('presentation-volume') : undefined;
  const error = document.getElementById('presentation-dialog-error');

  if (!Number.isFinite(amount) || amount <= 0 || (defaults.usesVolume && (!Number.isFinite(volume) || volume <= 0))) {
    error.textContent = 'Ingresá valores mayores que cero.';
    return;
  }

  const overrides = readPresentationOverrides();
  const isDefault = amount === defaults.amount && (!defaults.usesVolume || volume === defaults.volume);
  if (isDefault) delete overrides[activePresentationSection];
  else overrides[activePresentationSection] = { amount, ...(defaults.usesVolume ? { volume } : {}) };

  localStorage.setItem(PRESENTATION_STORAGE_KEY, JSON.stringify(overrides));
  const sectionIndex = activePresentationSection;
  closePresentationDialog();
  updatePresentationLabel(sectionIndex);
}

function resetPresentation() {
  if (!DRUG_PRESENTATIONS[activePresentationSection]) return;
  const overrides = readPresentationOverrides();
  delete overrides[activePresentationSection];
  localStorage.setItem(PRESENTATION_STORAGE_KEY, JSON.stringify(overrides));
  const sectionIndex = activePresentationSection;
  closePresentationDialog();
  updatePresentationLabel(sectionIndex);
}

document.addEventListener('DOMContentLoaded', function () {
  initializePresentationEditors();

  const dialog = document.getElementById('presentation-dialog');
  dialog?.addEventListener('click', function (event) {
    if (event.target === dialog) closePresentationDialog();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && dialog && !dialog.hidden) closePresentationDialog();
  });
});

const DOSE_RANGES = Object.freeze({
  4:  { min: 0.3,  max: 0.75 },
  6:  { min: 0.03, max: 0.07 },
  7:  { min: 0.5,  max: 10 },
  9:  { min: 0.7,  max: 10 },
  10: { min: 3,    max: 18 },
  11: { min: 0.02, max: 0.2 },
  12: { min: 0.3,  max: 3 },
  13: { min: 0.2,  max: 1.4 },
  16: { min: 5,    max: 20 },
  17: { min: 0.5,  max: 2 },
  18: { min: 0.5,  max: 8 },
  19: { min: 1,    max: 4 }
});

function clearDoseRange(resultId) {
  const element = document.getElementById(resultId);
  if (!element) return;
  element.classList.remove('dose-low', 'dose-in-range', 'dose-high');
  element.querySelector('.dose-status')?.remove();
  element.removeAttribute('data-dose-status');
}

function applyDoseRange(sectionIndex, value) {
  const result = document.getElementById('result' + sectionIndex);
  const range = DOSE_RANGES[sectionIndex];
  if (!result || !range || !Number.isFinite(value)) return;

  // Compara el mismo valor redondeado que ve el usuario en pantalla.
  value = Number(value.toFixed(sectionIndex === 6 ? 3 : 2));

  clearDoseRange('result' + sectionIndex);

  let className;
  let statusText;
  if (value < range.min) {
    className = 'dose-low';
    statusText = 'Dosis inferior al rango';
  } else if (value > range.max) {
    className = 'dose-high';
    statusText = 'Dosis superior al rango';
  } else {
    className = 'dose-in-range';
    statusText = 'Dosis dentro del rango';
  }

  result.classList.add(className);
  result.dataset.doseStatus = statusText;
  const status = document.createElement('small');
  status.className = 'dose-status';
  status.textContent = statusText;
  result.append(status);
}

function initializeResultAnimations() {
  const results = document.querySelectorAll(
    'p[id^="result"], #resultadoTratamiento1, #resultadoTratamiento2'
  );

  results.forEach(function (result) {
    let animationFrame;
    const observer = new MutationObserver(function () {
      if (!result.textContent.trim()) return;

      if (/\b(?:NaN|Infinity)\b/i.test(result.textContent)) {
        result.textContent = document.documentElement.lang === 'en' ? 'Check the values.' : 'Revisá los valores.';
        clearDoseRange(result.id);
        return;
      }

      result.classList.remove('result-reveal');
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(function () {
        result.classList.add('result-reveal');
      });
    });

    observer.observe(result, { childList: true, subtree: true, characterData: true });
  });
}

document.addEventListener('DOMContentLoaded', initializeResultAnimations);

const RESET_FORM_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
  '<path d="M20 11a8 8 0 1 1-2.34-5.66L20 7.68"/>' +
  '<path d="M20 3v4.68h-4.68"/></svg>';

function initializeCalculationResetButtons() {
  document.querySelectorAll('.section').forEach(function (section) {
    const match = section.id.match(/^section(\d+)$/);
    const sectionIndex = match ? Number(match[1]) : NaN;
    if (!Number.isInteger(sectionIndex) || sectionIndex === 14 || sectionIndex === 15) return;

    const form = section.querySelector(':scope > form');
    const submitButton = form?.querySelector(':scope > button[type="submit"]');
    const result = document.getElementById('result' + sectionIndex);
    if (!form || !submitButton || !result) return;

    const actions = document.createElement('div');
    actions.className = 'calculation-actions';
    submitButton.before(actions);
    actions.appendChild(submitButton);

    const resetButton = document.createElement('button');
    resetButton.className = 'calculation-reset';
    resetButton.type = 'button';
    resetButton.innerHTML = RESET_FORM_ICON;
    resetButton.hidden = true;
    resetButton.setAttribute('aria-label', 'Limpiar datos de ' +
      (section.querySelector(':scope > h2, :scope > .section-title-row h2')?.textContent || 'la calculadora'));

    const dataFields = Array.from(form.querySelectorAll('input, textarea, select'));
    const updateResetVisibility = function () {
      resetButton.hidden = !dataFields.some(function (field) {
        return String(field.value || '').trim() !== '';
      });
    };

    dataFields.forEach(function (field) {
      field.addEventListener('input', updateResetVisibility);
      field.addEventListener('change', updateResetVisibility);
    });

    resetButton.addEventListener('click', function () {
      form.reset();
      result.textContent = '';
      result.classList.remove('result-reveal');
      clearDoseRange(result.id);
      resetButton.hidden = true;

      const detail = document.querySelector('[data-calculation-detail="' + sectionIndex + '"]');
      if (detail) {
        detail.open = false;
        detail.hidden = true;
      }
    });
    actions.appendChild(resetButton);
    updateResetVisibility();
  });
}

document.addEventListener('DOMContentLoaded', initializeCalculationResetButtons);

const RECENT_INPUT_VALUES_KEY = 'infusion-recent-input-values-v1';
const RECENT_INPUT_VALUES_LIMIT = 3;
let recentInputValuesState = {};

function readRecentInputValues() {
  try {
    const stored = JSON.parse(localStorage.getItem(RECENT_INPUT_VALUES_KEY) || '{}');
    return stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
  } catch (_error) {
    return {};
  }
}

function isRecentValueField(input) {
  const form = input.closest('.section > form');
  if (!form || !input.id) return false;
  const label = form.querySelector('label[for="' + input.id + '"]');
  if (!label) return false;
  const labelText = normalizeDrugSearchText(label.textContent);
  return /ampoll|vial|solucion|solution|volumen final|final volume|peso|weight/.test(labelText);
}

function isRateStepperField(input) {
  const form = input.closest('.section > form');
  if (!form || !input.id) return false;
  const label = form.querySelector('label[for="' + input.id + '"]');
  return Boolean(label && normalizeDrugSearchText(label.textContent).includes('ml/h'));
}

function dispatchInputValueChange(input) {
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function runAutomaticCalculation(form) {
  if (!form || !form.checkValidity()) return;
  const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
  submitEvent.isAutomaticCalculation = true;
  form.dispatchEvent(submitEvent);
}

function renderRecentInputValues(input, container, recentValues) {
  const values = Array.isArray(recentValues[input.id])
    ? recentValues[input.id].slice(0, RECENT_INPUT_VALUES_LIMIT)
    : [];
  container.replaceChildren();
  container.hidden = values.length === 0;

  const label = input.form?.querySelector('label[for="' + input.id + '"]')?.textContent.trim() || 'este campo';
  values.forEach(function (value) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'recent-value-chip';
    chip.textContent = value;
    chip.title = value;
    chip.setAttribute('aria-label', 'Usar ' + value + ' en ' + label);
    chip.addEventListener('click', function () {
      input.value = value;
      dispatchInputValueChange(input);
    });
    container.appendChild(chip);
  });
}

function initializeRecentInputValues() {
  recentInputValuesState = readRecentInputValues();
  const recentValues = recentInputValuesState;

  document.querySelectorAll('.section > form').forEach(function (form) {
    const formInputs = Array.from(form.querySelectorAll(':scope > input'));
    const fields = formInputs.filter(isRecentValueField);
    const rateFields = formInputs.filter(isRateStepperField);
    if (!fields.length && !rateFields.length) return;

    const containers = new Map();
    fields.forEach(function (input) {
      const container = document.createElement('div');
      container.className = 'recent-values';
      container.dataset.recentInputId = input.id;
      container.setAttribute('aria-label', 'Valores recientes');
      input.after(container);
      containers.set(input, container);
      renderRecentInputValues(input, container, recentValues);
    });

    rateFields.forEach(function (input) {
      const stepper = document.createElement('div');
      stepper.className = 'rate-stepper';
      stepper.setAttribute('aria-label', 'Ajustar ml/h');

      [
        { text: '+', label: 'Aumentar 1 ml/h', recalculates: true, action: function () {
          const current = Number(String(input.value || '0').replace(',', '.'));
          const next = Math.round(((Number.isFinite(current) ? current : 0) + 1) * 1000) / 1000;
          input.value = String(next).replace('.', ',');
        } },
        { text: '−', label: 'Disminuir 1 ml/h', recalculates: true, action: function () {
          const current = Number(String(input.value || '0').replace(',', '.'));
          const next = Math.max(1, Math.round(((Number.isFinite(current) ? current : 0) - 1) * 1000) / 1000);
          input.value = String(next).replace('.', ',');
        } },
        { text: '×', label: 'Borrar ml/h', action: function () { input.value = ''; } }
      ].forEach(function (control) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'rate-stepper-button';
        button.classList.add(control.recalculates ? 'is-adjustment' : 'is-clear');
        button.textContent = control.text;
        button.setAttribute('aria-label', control.label);
        button.addEventListener('click', function () {
          control.action();
          dispatchInputValueChange(input);
          if (control.recalculates) runAutomaticCalculation(form);
        });
        stepper.appendChild(button);
      });

      input.after(stepper);
    });

    form.addEventListener('submit', function (event) {
      if (event.isAutomaticCalculation) return;
      let changed = false;
      fields.forEach(function (input) {
        const value = String(input.value || '').trim();
        if (!value) return;

        const previous = Array.isArray(recentValues[input.id]) ? recentValues[input.id] : [];
        const normalizedValue = value.replace(',', '.');
        recentValues[input.id] = [value].concat(previous.filter(function (savedValue) {
          return String(savedValue).replace(',', '.') !== normalizedValue;
        })).slice(0, RECENT_INPUT_VALUES_LIMIT);
        renderRecentInputValues(input, containers.get(input), recentValues);
        changed = true;
      });

      if (changed) {
        try {
          localStorage.setItem(RECENT_INPUT_VALUES_KEY, JSON.stringify(recentValues));
        } catch (_error) {
          // La calculadora sigue funcionando aunque el navegador impida guardar datos locales.
        }
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', initializeRecentInputValues);

function clearRecentInputValuesForSection(sectionIndex) {
  const section = document.getElementById('section' + sectionIndex);
  const fields = Array.from(section?.querySelectorAll(':scope > form > input') || []).filter(isRecentValueField);
  if (!fields.length) return;

  fields.forEach(function (input) {
    delete recentInputValuesState[input.id];
    const container = section.querySelector('[data-recent-input-id="' + input.id + '"]');
    if (container) renderRecentInputValues(input, container, recentInputValuesState);
  });

  try {
    localStorage.setItem(RECENT_INPUT_VALUES_KEY, JSON.stringify(recentInputValuesState));
  } catch (_error) {
    // La limpieza visual se mantiene aunque el navegador impida modificar datos locales.
  }
}

// Mostrar secciones
function showSection(sectionIndex) {
  var sections = document.getElementsByClassName('section');
  for (var i = 0; i < sections.length; i++) {
    sections[i].classList.remove('show');
  }
  var sectionId = 'section' + sectionIndex;
  var section = document.getElementById(sectionId);
  if (section) section.classList.add('show');
}

/* ======================
   MEDICAMENTOS FAVORITOS
   ====================== */

const FAVORITES_STORAGE_KEY = 'infusion-favorites-v1:local';
let favoriteSections = [];

function readFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]');
    if (!Array.isArray(saved)) return [];
    return saved.map(Number).filter(function (sectionIndex, position, list) {
      return Number.isInteger(sectionIndex) && sectionIndex !== 14 && list.indexOf(sectionIndex) === position;
    });
  } catch (_error) {
    return [];
  }
}

function saveFavorites() {
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteSections));
}

function sortMedicationMenu() {
  const list = document.querySelector('.sidebar ul');
  if (!list) return;

  const items = Array.from(list.querySelectorAll(':scope > li'));
  const infoItem = items.find(function (item) {
    return Number(item.dataset.sectionIndex) === 14;
  });

  const medicationItems = items
    .filter(function (item) { return item !== infoItem; })
    .sort(function (first, second) {
      const firstSection = Number(first.dataset.sectionIndex);
      const secondSection = Number(second.dataset.sectionIndex);
      const firstFavorite = favoriteSections.indexOf(firstSection);
      const secondFavorite = favoriteSections.indexOf(secondSection);

      if (firstFavorite !== -1 || secondFavorite !== -1) {
        if (firstFavorite === -1) return 1;
        if (secondFavorite === -1) return -1;
        return firstFavorite - secondFavorite;
      }

      return Number(first.dataset.originalOrder) - Number(second.dataset.originalOrder);
    });

  medicationItems.forEach(function (item) { list.appendChild(item); });
  if (infoItem) list.appendChild(infoItem);
}

function updateFavoriteButtons() {
  document.querySelectorAll('.section-favorite-toggle').forEach(function (button) {
    const sectionIndex = Number(button.dataset.sectionIndex);
    const isFavorite = favoriteSections.includes(sectionIndex);
    const drugName = button.dataset.drugName;

    button.classList.toggle('is-favorite', isFavorite);
    button.innerHTML = '<span aria-hidden="true">' + (isFavorite ? '★' : '☆') + '</span>';
    button.setAttribute('aria-pressed', String(isFavorite));
    button.setAttribute('aria-label', (isFavorite ? 'Quitar ' : 'Agregar ') + drugName +
      (isFavorite ? ' de favoritos' : ' a favoritos'));
  });

  document.querySelectorAll('.menu-favorite-indicator').forEach(function (indicator) {
    const isFavorite = favoriteSections.includes(Number(indicator.dataset.sectionIndex));
    indicator.hidden = !isFavorite;
    indicator.setAttribute('aria-label', 'Quitar ' + indicator.dataset.drugName + ' de favoritos');
  });
}

function applyLocalFavorites() {
  favoriteSections = readFavorites();
  updateFavoriteButtons();
  sortMedicationMenu();
}

function toggleFavorite(sectionIndex) {
  const position = favoriteSections.indexOf(sectionIndex);
  if (position === -1) favoriteSections.unshift(sectionIndex);
  else favoriteSections.splice(position, 1);

  saveFavorites();
  updateFavoriteButtons();
  sortMedicationMenu();
}

function initializeFavorites() {
  const items = document.querySelectorAll('.sidebar ul > li');

  items.forEach(function (item, originalOrder) {
    const link = item.querySelector(':scope > a[onclick^="showSection("]');
    if (!link) return;

    const match = link.getAttribute('onclick').match(/showSection\((\d+)\)/);
    const sectionIndex = match ? Number(match[1]) : NaN;
    item.dataset.sectionIndex = String(sectionIndex);
    item.dataset.originalOrder = String(originalOrder);

    if (!Number.isInteger(sectionIndex) || sectionIndex === 14) return;

    item.classList.add('drug-menu-item');
    const indicator = document.createElement('button');
    indicator.className = 'menu-favorite-indicator';
    indicator.type = 'button';
    indicator.dataset.sectionIndex = String(sectionIndex);
    indicator.dataset.drugName = link.textContent.trim();
    indicator.textContent = '★';
    indicator.hidden = true;
    indicator.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      toggleFavorite(sectionIndex);
    });
    item.appendChild(indicator);

    const section = document.getElementById('section' + sectionIndex);
    const heading = section?.querySelector(':scope > h2');
    if (!heading) return;

    const titleRow = document.createElement('div');
    titleRow.className = 'section-title-row';
    heading.before(titleRow);
    titleRow.appendChild(heading);

    const button = document.createElement('button');
    button.className = 'section-favorite-toggle';
    button.type = 'button';
    button.dataset.sectionIndex = String(sectionIndex);
    button.dataset.drugName = link.textContent.trim();
    button.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      toggleFavorite(sectionIndex);
    });
    titleRow.appendChild(button);
  });

  applyLocalFavorites();
}

document.addEventListener('DOMContentLoaded', initializeFavorites);

/* ======================
   HISTORIAL DE CÁLCULOS
   ====================== */

const CALCULATION_HISTORY_PREFIX = 'infusion-calculation-history-v1:';
const HISTORY_LIMIT = 6;
let calculationHistoryUserId = 'guest';

const CALCULATION_DETAIL_CONFIG = Object.freeze({
  1:  { amps: 'a35', solution: 'b35', weight: 'c35', speed: 'd35', scale: 1000, doseUnit: 'mcg', divideBy60: true },
  2:  { amps: 'a43', solution: 'b43', weight: 'c43', speed: 'd43', scale: 1000, doseUnit: 'mcg', divideBy60: true },
  3:  { amps: 'a39', solution: 'b39', weight: 'c39', speed: 'd39', scale: 1000, doseUnit: 'mcg', divideBy60: true },
  4:  { amps: 'a47', solution: 'b47', weight: 'c47', speed: 'd47', scale: 1000, doseUnit: 'mcg', divideBy60: true },
  5:  { amps: 'a72', solution: 'b72', weight: 'c72', speed: 'd72', scale: 1000, doseUnit: 'mcg', divideBy60: true },
  6:  { amps: 'a51', solution: 'b51', speed: 'c51', scale: 1, doseUnit: 'UI', divideBy60: true },
  7:  { amps: 'a56', solution: 'b56', speed: 'c56', scale: 1000, doseUnit: 'mcg', divideBy60: true },
  8:  { amps: 'a29', solution: 'b29', weight: 'c29', speed: 'd29', scale: 1, doseUnit: 'mg', volumeMode: 'add' },
  9:  { amps: 'a3', solution: 'b3', weight: 'c3', speed: 'd3', scale: 1, doseUnit: 'mcg', volumeMode: 'add' },
  10: { amps: 'a11', solution: 'b11', weight: 'c11', speed: 'd11', scale: 1000, doseUnit: 'mcg', volumeMode: 'add' },
  11: { amps: 'a7', solution: 'b7', weight: 'c7', speed: 'd7', scale: 1, doseUnit: 'mg', volumeMode: 'add' },
  12: { amps: 'a15', weight: 'c15', speed: 'd15', scale: 1, doseUnit: 'mg', volumeMode: 'presentation' },
  13: { amps: 'a23', solution: 'b23', weight: 'c23', speed: 'd23', scale: 1, doseUnit: 'mcg', volumeMode: 'add' },
  16: { amps: 'a16', solution: 'b16', weight: 'c16', speed: 'd16', scale: 1000, doseUnit: 'mcg', divideBy60: true },
  17: { amps: 'a17', solution: 'b17', speed: 'd17', scale: 1, doseUnit: 'mg', divideBy60: true },
  18: { amps: 'a18', solution: 'b18', weight: 'c18', speed: 'd18', scale: 1000, doseUnit: 'mcg', divideBy60: true },
  19: { amps: 'a19', solution: 'b19', speed: 'd19', scale: 1, doseUnit: 'mg', divideBy60: true, solutionLabel: 'ml volumen final' }
});

function calculationHistoryKey(sectionIndex) {
  return CALCULATION_HISTORY_PREFIX + calculationHistoryUserId + ':' + sectionIndex;
}

function readCalculationHistory(sectionIndex) {
  try {
    const saved = JSON.parse(localStorage.getItem(calculationHistoryKey(sectionIndex)) || '[]');
    return Array.isArray(saved) ? saved.slice(0, HISTORY_LIMIT) : [];
  } catch (_error) {
    return [];
  }
}

function formatHistoryDate(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).format(date);
}

function localizeStoredResult(resultText) {
  return String(resultText || '').replace(/(\d)\.(\d)/g, '$1,$2');
}

function renderCalculationHistory(sectionIndex) {
  const container = document.querySelector('[data-history-section="' + sectionIndex + '"]');
  if (!container) return;

  const entries = readCalculationHistory(sectionIndex);
  container.hidden = entries.length === 0;
  const list = container.querySelector('.calculation-history-list');
  list.replaceChildren();

  entries.forEach(function (entry) {
    const item = document.createElement('li');
    const time = document.createElement('time');
    time.dateTime = entry.timestamp;
    time.textContent = formatHistoryDate(entry.timestamp);
    const result = document.createElement('span');
    result.textContent = localizeStoredResult(entry.result);
    item.append(time, result);
    list.appendChild(item);
  });
}

function extractCalculationResult(resultElement) {
  const copy = resultElement.cloneNode(true);
  copy.querySelector('.dose-status')?.remove();
  copy.querySelectorAll('br').forEach(function (breakElement) {
    breakElement.replaceWith(' ');
  });
  return copy.textContent.replace(/\s+/g, ' ').trim();
}

function formatCalculationNumber(value) {
  if (!Number.isFinite(value)) return '';
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 4 }).format(value);
}

function renderCalculationDetail(sectionIndex, resultText) {
  const detail = document.querySelector('[data-calculation-detail="' + sectionIndex + '"]');
  const config = CALCULATION_DETAIL_CONFIG[sectionIndex];
  const presentation = getDrugPresentation(sectionIndex);
  if (!detail || !config || !presentation || !resultText || resultText === 'Revisá los valores.') {
    if (detail) detail.hidden = true;
    return;
  }

  const amps = getNumber(config.amps);
  const solution = config.solution ? getNumber(config.solution) : 0;
  const weight = config.weight ? getNumber(config.weight) : null;
  const speed = getNumber(config.speed);
  const presentationVolume = presentation.volume || presentation.displayVolume || 0;
  const amount = amps * presentation.amount * config.scale;

  let totalVolume = solution;
  if (config.volumeMode === 'add') totalVolume += amps * presentationVolume;
  if (config.volumeMode === 'presentation') totalVolume = amps * presentationVolume;

  const concentration = amount / totalVolume;
  if (![amps, totalVolume, speed, concentration].every(Number.isFinite) ||
      amps <= 0 || totalVolume <= 0 || speed < 0 || (config.weight && (!Number.isFinite(weight) || weight <= 0))) {
    detail.hidden = true;
    return;
  }

  const inputParts = [formatCalculationNumber(amps) + (amps === 1 ? ' amp' : ' amps')];
  if (config.solution) {
    inputParts.push(formatCalculationNumber(solution) + ' ' + (config.solutionLabel || 'ml solución'));
  }
  if (config.weight) inputParts.push(formatCalculationNumber(weight) + ' kg');
  inputParts.push(formatCalculationNumber(speed) + ' ml/h');

  let operation = '(' + formatCalculationNumber(concentration) + ' × ' +
    formatCalculationNumber(speed) + ')';
  if (config.weight) operation += ' ÷ ' + formatCalculationNumber(weight);
  if (config.divideBy60) operation += ' ÷ 60';

  detail.querySelector('.calculation-detail-data').textContent = inputParts.join(' · ');
  detail.querySelector('.calculation-detail-concentration').textContent =
    formatCalculationNumber(amount) + ' ' + config.doseUnit + ' ÷ ' +
    formatCalculationNumber(totalVolume) + ' ml = ' +
    formatCalculationNumber(concentration) + ' ' + config.doseUnit + '/ml';
  detail.querySelector('.calculation-detail-operation').textContent = operation;
  detail.querySelector('.calculation-detail-result').textContent = resultText;
  detail.open = false;
  detail.hidden = false;
}

function addCalculationHistory(sectionIndex, resultText) {
  if (!resultText || resultText === 'Revisá los valores.') return;

  const entries = readCalculationHistory(sectionIndex);
  entries.unshift({
    timestamp: new Date().toISOString(),
    result: resultText
  });
  localStorage.setItem(calculationHistoryKey(sectionIndex), JSON.stringify(entries.slice(0, HISTORY_LIMIT)));
  renderCalculationHistory(sectionIndex);
}

function renderAllCalculationHistories() {
  document.querySelectorAll('[data-history-section]').forEach(function (container) {
    renderCalculationHistory(Number(container.dataset.historySection));
  });
}

function initializeCalculationHistories() {
  document.querySelectorAll('.section').forEach(function (section) {
    const match = section.id.match(/^section(\d+)$/);
    const sectionIndex = match ? Number(match[1]) : NaN;
    if (!Number.isInteger(sectionIndex) || sectionIndex === 14 || sectionIndex === 15) return;

    const form = section.querySelector(':scope > form');
    const result = document.getElementById('result' + sectionIndex);
    if (!form || !result) return;

    const detail = document.createElement('details');
    detail.className = 'calculation-detail';
    detail.dataset.calculationDetail = String(sectionIndex);
    detail.hidden = true;
    detail.innerHTML = '<summary>Ver cálculo</summary>' +
      '<div class="calculation-detail-panel">' +
      '<p><span>Datos</span><b class="calculation-detail-data"></b></p>' +
      '<p><span>Concentración</span><b class="calculation-detail-concentration"></b></p>' +
      '<p><span>Operación</span><b class="calculation-detail-operation"></b></p>' +
      '<p><span>Resultado</span><b class="calculation-detail-result"></b></p>' +
      '</div>';
    result.after(detail);

    const history = document.createElement('section');
    history.className = 'calculation-history';
    history.dataset.historySection = String(sectionIndex);
    history.hidden = true;
    history.innerHTML = '<div class="calculation-history-header">' +
      '<h3>Historial</h3>' +
      '<button class="calculation-history-clear" type="button" ' +
      'aria-label="Borrar historial y valores recientes">×</button>' +
      '</div><ol class="calculation-history-list"></ol>';
    form.after(history);

    history.querySelector('.calculation-history-clear').addEventListener('click', function () {
      localStorage.removeItem(calculationHistoryKey(sectionIndex));
      clearRecentInputValuesForSection(sectionIndex);
      renderCalculationHistory(sectionIndex);
    });

    form.addEventListener('submit', function (event) {
      const isAutomaticCalculation = Boolean(event.isAutomaticCalculation);
      setTimeout(function () {
        const resultText = extractCalculationResult(result);
        renderCalculationDetail(sectionIndex, resultText);
        if (!isAutomaticCalculation) addCalculationHistory(sectionIndex, resultText);
      }, 0);
    });
  });

  renderAllCalculationHistories();
}

document.addEventListener('DOMContentLoaded', initializeCalculationHistories);

/* ======================
   CÁLCULOS INFUSIONES
   ====================== */

function calculateNoradrenalina(event) {
  event.preventDefault();
  var a35 = getNumber('a35');
  var b35 = getNumber('b35');
  var c35 = getNumber('c35');
  var d35 = getNumber('d35');

  if ([a35, b35, c35, d35].some(isNaN)) {
    document.getElementById('result1').textContent = 'Revisá los valores.';
    return;
  }

  var result = (((a35 * getDrugPresentation(1).amount * 1000) / b35) * d35) / c35 / 60;
  document.getElementById('result1').textContent = formatResultNumber(result, 2) + ' mcg/kg/min';
// Evento GA4 – cálculo exitoso
  gtag('event', 'calculo_realizado', {
    farmaco: 'noradrenalina'
  });
}

function calculateDopamina(event) {
  event.preventDefault();
  var a43 = getNumber('a43');
  var b43 = getNumber('b43');
  var c43 = getNumber('c43');
  var d43 = getNumber('d43');

  if ([a43, b43, c43, d43].some(isNaN)) {
    document.getElementById('result2').textContent = 'Revisá los valores.';
    return;
  }

  var result = (((a43 * getDrugPresentation(2).amount * 1000) / b43) * d43) / c43 / 60;
  document.getElementById('result2').textContent = formatResultNumber(result, 2) + ' mcg/kg/min';
// Evento GA4 – cálculo exitoso
  gtag('event', 'calculo_realizado', {
    farmaco: 'dopamina'
  });
}

function calculateDobutamina(event) {
  event.preventDefault();
  var a39 = getNumber('a39');
  var b39 = getNumber('b39');
  var c39 = getNumber('c39');
  var d39 = getNumber('d39');

  if ([a39, b39, c39, d39].some(isNaN)) {
    document.getElementById('result3').textContent = 'Revisá los valores.';
    return;
  }

  var result = (((a39 * getDrugPresentation(3).amount * 1000) / b39) * d39) / c39 / 60;
  document.getElementById('result3').textContent = formatResultNumber(result, 2) + ' mcg/kg/min';
// Evento GA4 – cálculo exitoso
  gtag('event', 'calculo_realizado', {
    farmaco: 'dobutamina'
  });
}

function calculateMilrinona(event) {
  event.preventDefault();
  var a47 = getNumber('a47');
  var b47 = getNumber('b47');
  var c47 = getNumber('c47');
  var d47 = getNumber('d47');

  if ([a47, b47, c47, d47].some(isNaN)) {
    document.getElementById('result4').textContent = 'Revisá los valores.';
    clearDoseRange('result4');
    return;
  }

  var result = (((a47 * getDrugPresentation(4).amount * 1000) / b47) * d47) / c47 / 60;
  document.getElementById('result4').textContent = formatResultNumber(result, 2) + ' mcg/kg/min';
  applyDoseRange(4, result);
// Evento GA4 – cálculo exitoso
  gtag('event', 'calculo_realizado', {
    farmaco: 'milrinona'
  });
}

function calculateAdrenalina(event) {
  event.preventDefault();
  var a72 = getNumber('a72');
  var b72 = getNumber('b72');
  var c72 = getNumber('c72');
  var d72 = getNumber('d72');

  if ([a72, b72, c72, d72].some(isNaN)) {
    document.getElementById('result5').textContent = 'Revisá los valores.';
    return;
  }

  var result = (((a72 * getDrugPresentation(5).amount * 1000) / b72) * d72) / c72 / 60;
  document.getElementById('result5').textContent = formatResultNumber(result, 2) + ' mcg/kg/min';
// Evento GA4 – cálculo exitoso
  gtag('event', 'calculo_realizado', {
    farmaco: 'adrenalina'
  });
}

function calculateVasopresina(event) {
  event.preventDefault();
  var a51 = getNumber('a51');
  var b51 = getNumber('b51');
  var c51 = getNumber('c51');

  if ([a51, b51, c51].some(isNaN)) {
    document.getElementById('result6').textContent = 'Revisá los valores.';
    clearDoseRange('result6');
    return;
  }

  var result = (((a51 * getDrugPresentation(6).amount) / b51) * c51) / 60;
  document.getElementById('result6').textContent = formatResultNumber(result, 3) + ' UI/min';
  applyDoseRange(6, result);
// Evento GA4 – cálculo exitoso
  gtag('event', 'calculo_realizado', {
    farmaco: 'vasopresina'
  });
}

function calculateIsoproterenol(event) {
  event.preventDefault();
  var a56 = getNumber('a56');
  var b56 = getNumber('b56');
  var c56 = getNumber('c56');

  if ([a56, b56, c56].some(isNaN)) {
    document.getElementById('result7').textContent = 'Revisá los valores.';
    clearDoseRange('result7');
    return;
  }

  var result = (((a56 * getDrugPresentation(7).amount * 1000) / b56) * c56) / 60;
  document.getElementById('result7').textContent = formatResultNumber(result, 2) + ' mcg/min';
  applyDoseRange(7, result);
// Evento GA4 – cálculo exitoso
  gtag('event', 'calculo_realizado', {
    farmaco: 'isoproterenol'
  });
}

function calculateFurosemida(event) {
  event.preventDefault();

  function parseNumber(id) {
    // Convierte coma a punto antes de parsear
    const value = document.getElementById(id).value.replace(',', '.');
    return parseFloat(value);
  }

  var a29 = parseNumber('a29');
  var b29 = parseNumber('b29');
  var c29 = parseNumber('c29');
  var d29 = parseNumber('d29');

  if ([a29, b29, c29, d29].some(isNaN)) {
    document.getElementById('result8').textContent = 'Revisá los valores.';
    return;
  }

  // Concentración (mg/ml)
  var furosemidaPresentation = getDrugPresentation(8);
  var concentracion = (a29 * furosemidaPresentation.amount) / (a29 * furosemidaPresentation.volume + b29);

  // Dosis instantánea mg/kg/h
  var dosis = (concentracion * d29) / c29;

  // Cantidad total en 24h (mg)
  var total24h_mg = concentracion * d29 * 24;

  // Convertir a gramos
  var total24h_g = total24h_mg / 1000;

  // Mostrar ambos resultados
  document.getElementById('result8').innerHTML = 
    formatResultNumber(dosis, 2) + ' mg/kg/h' + 
    '<br><small style="color: var(--text-secondary);">Equivale a ' + formatResultNumber(total24h_g, 2) + ' g en 24 hs.</small>';
// Evento GA4 – cálculo exitoso
  gtag('event', 'calculo_realizado', {
    farmaco: 'furosemida'
  });
  }


function calculateFentanilo(event) {
  event.preventDefault();
  var a3 = getNumber('a3');
  var b3 = getNumber('b3');
  var c3 = getNumber('c3');
  var d3 = getNumber('d3');

  if ([a3, b3, c3, d3].some(isNaN)) {
    document.getElementById('result9').textContent = 'Revisá los valores.';
    clearDoseRange('result9');
    return;
  }

  var fentaniloPresentation = getDrugPresentation(9);
  var result = ((a3 * fentaniloPresentation.amount) / (a3 * fentaniloPresentation.volume + b3) * d3) / c3;
  document.getElementById('result9').textContent = formatResultNumber(result, 2) + ' mcg/kg/h';
  applyDoseRange(9, result);
// Evento GA4 – cálculo exitoso
  gtag('event', 'calculo_realizado', {
    farmaco: 'fentanilo'
  });
}

function calculateRemifentanilo(event) {
  event.preventDefault();
  var a11 = getNumber('a11');
  var b11 = getNumber('b11');
  var c11 = getNumber('c11');
  var d11 = getNumber('d11');

  if ([a11, b11, c11, d11].some(isNaN)) {
    document.getElementById('result10').textContent = 'Revisá los valores.';
    clearDoseRange('result10');
    return;
  }

  var remifentaniloPresentation = getDrugPresentation(10);
  var result = ((a11 * remifentaniloPresentation.amount * 1000) / (a11 * remifentaniloPresentation.volume + b11) * d11) / c11;
  document.getElementById('result10').textContent = formatResultNumber(result, 2) + ' mcg/kg/h';
  applyDoseRange(10, result);
// Evento GA4 – cálculo exitoso
  gtag('event', 'calculo_realizado', {
    farmaco: 'remifentanilo'
  });
}

function calculateMidazolam(event) {
  event.preventDefault();
  var a7 = getNumber('a7');
  var b7 = getNumber('b7');
  var c7 = getNumber('c7');
  var d7 = getNumber('d7');

  if ([a7, b7, c7, d7].some(isNaN)) {
    document.getElementById('result11').textContent = 'Revisá los valores.';
    clearDoseRange('result11');
    return;
  }

  var midazolamPresentation = getDrugPresentation(11);
  var result = ((a7 * midazolamPresentation.amount) / (a7 * midazolamPresentation.volume + b7) * d7) / c7;
  document.getElementById('result11').textContent = formatResultNumber(result, 2) + ' mg/kg/h';
  applyDoseRange(11, result);
// Evento GA4 – cálculo exitoso
  gtag('event', 'calculo_realizado', {
    farmaco: 'midazolam'
  });
}

function calculatePropofol(event) {
  event.preventDefault();
  var a15 = getNumber('a15');
  var c15 = getNumber('c15');
  var d15 = getNumber('d15');

  if ([a15, c15, d15].some(isNaN)) {
    document.getElementById('result12').textContent = 'Revisá los valores.';
    clearDoseRange('result12');
    return;
  }

  var propofolPresentation = getDrugPresentation(12);
  var result = ((a15 * propofolPresentation.amount) / (a15 * propofolPresentation.volume) * d15) / c15;
  document.getElementById('result12').textContent = formatResultNumber(result, 2) + ' mg/kg/h';
  applyDoseRange(12, result);
// Evento GA4 – cálculo exitoso
  gtag('event', 'calculo_realizado', {
    farmaco: 'propofol'
  });
}

function calculateDexmedetomidina(event) {
  event.preventDefault();
  var a23 = getNumber('a23');
  var b23 = getNumber('b23');
  var c23 = getNumber('c23');
  var d23 = getNumber('d23');

  if ([a23, b23, c23, d23].some(isNaN)) {
    document.getElementById('result13').textContent = 'Revisá los valores.';
    clearDoseRange('result13');
    return;
  }

  var dexmedetomidinaPresentation = getDrugPresentation(13);
  var result = ((a23 * dexmedetomidinaPresentation.amount) / (a23 * dexmedetomidinaPresentation.volume + b23) * d23) / c23;
  document.getElementById('result13').textContent = formatResultNumber(result, 2) + ' mcg/kg/h';
  applyDoseRange(13, result);
// Evento GA4 – cálculo exitoso
  gtag('event', 'calculo_realizado', {
    farmaco: 'dexmedetomidina'
  });
}

/* ======================
   INSULINA
   ====================== */

function calcularTratamiento() {
  const glucemiaInicial = parseInt(document.getElementById("glucemiaInicial").value, 10);
  let tratamiento = "";

  if (isNaN(glucemiaInicial)) {
    tratamiento = "Ingresá una glucemia válida.";
  } else if (glucemiaInicial < 151) {
    tratamiento = "No corresponde tratamiento.";
  } else if (glucemiaInicial <= 180) {
    tratamiento = "Bomba a 1 ml/h, sin bolo.";
  } else if (glucemiaInicial <= 220) {
    tratamiento = "Bolo de 2 unidades, bomba a 2 ml/h.";
  } else if (glucemiaInicial <= 260) {
    tratamiento = "Bolo de 3 unidades, bomba a 2,5 ml/h.";
  } else if (glucemiaInicial <= 300) {
    tratamiento = "Bolo de 4 unidades, bomba a 3 ml/h.";
  } else {
    tratamiento = "Bolo de 6 unidades, bomba a 3,5 ml/h.";
  }
  // Evento GA4 – cálculo exitoso
  gtag('event', 'calculo_realizado', {
    farmaco: 'insulina'
  });

  document.getElementById("resultadoTratamiento1").textContent = tratamiento;
}

function evaluarTratamiento() {
  const glucemiaActual = parseInt(document.getElementById("glucemiaActual").value, 10);
  const glucemiaPrevia = parseInt(document.getElementById("glucemiaPrevia").value, 10);

  let tratamiento = "Ningún tratamiento aplicable.";

  if (isNaN(glucemiaActual) || isNaN(glucemiaPrevia)) {
    tratamiento = "Ingresá ambas glucemias.";
  } else if (glucemiaPrevia >= 0 && glucemiaActual > 360) {
    tratamiento = "Bolo de 6 unidades, aumentar infusion +4 ml/h.";
  } else if (glucemiaPrevia >= 0 && glucemiaActual >= 321 && glucemiaActual <= 360) {
    tratamiento = "Bolo de 5 unidades y aumentar infusion +3 ml/h.";
  } else if (glucemiaPrevia >= 0 && glucemiaActual >= 301 && glucemiaActual <= 320 && glucemiaPrevia <= 340) {
    tratamiento = "Bolo de 5 unidades y aumentar infusion +2,5 ml/h.";
  } else if (glucemiaPrevia >= 0 && glucemiaPrevia > 340 && glucemiaActual >= 301 && glucemiaActual <= 310) {
    tratamiento = "Sin cambios.";
  } else if (glucemiaPrevia < 320 && glucemiaActual >= 281 && glucemiaActual <= 300) {
    tratamiento = "Aumentar infusion +2,5 ml/h.";
  } else if (glucemiaPrevia >= 321 && glucemiaPrevia <= 360 && glucemiaActual >= 281 && glucemiaActual <= 300) {
    tratamiento = "Sin cambios.";
  } else if (glucemiaPrevia > 360 && glucemiaActual >= 281 && glucemiaActual <= 300) {
    tratamiento = "Bajar infusion -1 ml/h.";
  } else if (glucemiaPrevia < 160 && glucemiaActual >= 201 && glucemiaActual <= 280) {
    tratamiento = "Aumentar infusion +2 ml/h.";
  } else if (glucemiaPrevia >= 161 && glucemiaPrevia <= 300 && glucemiaActual >= 261 && glucemiaActual <= 280) {
    tratamiento = "Aumentar infusión +1 ml/h.";
  } else if (glucemiaPrevia >= 301 && glucemiaPrevia <= 360 && glucemiaActual >= 261 && glucemiaActual <= 280) {
    tratamiento = "Sin cambios.";
  } else if (glucemiaPrevia > 360 && glucemiaActual >= 261 && glucemiaActual <= 280) {
    tratamiento = "Bajar infusion -1 ml/h.";
  } else if (glucemiaPrevia >= 161 && glucemiaPrevia <= 280 && glucemiaActual >= 241 && glucemiaActual <= 260) {
    tratamiento = "Aumentar infusion +1 ml/h.";
  } else if (glucemiaPrevia >= 281 && glucemiaPrevia <= 340 && glucemiaActual >= 241 && glucemiaActual <= 260) {
    tratamiento = "Sin cambios.";
  } else if (glucemiaPrevia > 340 && glucemiaActual >= 241 && glucemiaActual <= 260) {
    tratamiento = "Bajar infusion -1 ml/h.";
  } else if (glucemiaPrevia >= 161 && glucemiaPrevia <= 260 && glucemiaActual >= 221 && glucemiaActual <= 240) {
    tratamiento = "Aumentar infusion +1 ml/h.";
  } else if (glucemiaPrevia >= 261 && glucemiaPrevia <= 320 && glucemiaActual >= 221 && glucemiaActual <= 240) {
    tratamiento = "Sin cambios.";
  } else if (glucemiaPrevia > 320 && glucemiaActual >= 221 && glucemiaActual <= 240) {
    tratamiento = "Bajar infusion -1 ml/h.";
  } else if (glucemiaPrevia >= 161 && glucemiaPrevia <= 240 && glucemiaActual >= 201 && glucemiaActual <= 220) {
    tratamiento = "Aumentar infusion +1 ml/h.";
  } else if (glucemiaPrevia >= 241 && glucemiaPrevia <= 300 && glucemiaActual >= 201 && glucemiaActual <= 220) {
    tratamiento = "Sin cambios.";
  } else if (glucemiaPrevia > 300 && glucemiaActual >= 201 && glucemiaActual <= 220) {
    tratamiento = "Bajar infusion -1 ml/h.";
  } else if (glucemiaPrevia >= 0 && glucemiaPrevia <= 200 && glucemiaActual >= 181 && glucemiaActual <= 200) {
    tratamiento = "Aumentar infusion +1 ml/h.";
  } else if (glucemiaPrevia >= 201 && glucemiaPrevia <= 260 && glucemiaActual >= 181 && glucemiaActual <= 200) {
    tratamiento = "Sin cambios.";
  } else if (glucemiaPrevia > 260 && glucemiaActual >= 181 && glucemiaActual <= 200) {
    tratamiento = "Bajar infusion -1 ml/h.";
  } else if (glucemiaPrevia >= 0 && glucemiaPrevia <= 180 && glucemiaActual >= 161 && glucemiaActual <= 180) {
    tratamiento = "Aumentar infusion +0,5 ml/h.";
  } else if (glucemiaPrevia >= 181 && glucemiaPrevia <= 240 && glucemiaActual >= 161 && glucemiaActual <= 180) {
    tratamiento = "Sin cambios.";
  } else if (glucemiaPrevia > 240 && glucemiaActual >= 161 && glucemiaActual <= 180) {
    tratamiento = "Bajar infusion -1 ml/h.";
  } else if (glucemiaPrevia < 161 && glucemiaActual >= 151 && glucemiaActual <= 160) {
    tratamiento = "Aumentar infusion +0,5 ml/h.";
  } else if (glucemiaPrevia >= 161 && glucemiaPrevia <= 240 && glucemiaActual >= 151 && glucemiaActual <= 160) {
    tratamiento = "Sin cambios.";
  } else if (glucemiaPrevia > 240 && glucemiaActual >= 151 && glucemiaActual <= 160) {
    tratamiento = "Disminuir dosis a la mitad.";
  } else if (glucemiaPrevia < 80 && glucemiaActual >= 80 && glucemiaActual <= 150) {
    tratamiento = "Suspender infusion.";
  } else if (glucemiaPrevia >= 80 && glucemiaPrevia <= 160 && glucemiaActual >= 121 && glucemiaActual <= 150) {
    tratamiento = "Sin cambios.";
  } else if (glucemiaPrevia >= 161 && glucemiaPrevia <= 180 && glucemiaActual >= 121 && glucemiaActual <= 150) {
    tratamiento = "Bajar infusion 0,3 ml/h.";
  } else if (glucemiaPrevia >= 181 && glucemiaPrevia <= 200 && glucemiaActual >= 121 && glucemiaActual <= 150) {
    tratamiento = "Bajar infusión 0,5 ml/h.";
  } else if (glucemiaPrevia > 200 && glucemiaActual >= 121 && glucemiaActual <= 150) {
    tratamiento = "Disminuir dosis a la mitad.";
  } else if (glucemiaPrevia >= 80 && glucemiaPrevia <= 150 && glucemiaActual >= 100 && glucemiaActual <= 120) {
    tratamiento = "Sin cambios.";
  } else if (glucemiaPrevia >= 151 && glucemiaPrevia <= 160 && glucemiaActual >= 100 && glucemiaActual <= 120) {
    tratamiento = "Bajar infusion 0,3 ml/h.";
  } else if (glucemiaPrevia >= 161 && glucemiaPrevia <= 180 && glucemiaActual >= 100 && glucemiaActual <= 120) {
    tratamiento = "Bajar infusion 0,5 ml/h.";
  } else if (glucemiaPrevia > 180 && glucemiaActual >= 100 && glucemiaActual <= 120) {
    tratamiento = "Disminuir dosis a la mitad.";
  } else if (glucemiaPrevia > 79 && glucemiaPrevia <= 99 && glucemiaActual >= 80 && glucemiaActual <= 99) {
    tratamiento = "Disminuir dosis a la mitad.";
  } else if (glucemiaActual >= 61 && glucemiaActual <= 79) {
    tratamiento = "Suspender infusión. Control en 30 min.";
  } else if (glucemiaActual < 61) {
    tratamiento = "Suspender infusion. Tratamiento de hipoglucemia.";
  }

  document.getElementById("resultadoTratamiento2").textContent = tratamiento;
}

/* ======================
   MENÚ HAMBURGUESA
   ====================== */

var themeToggle = null;

function updateThemeToggle() {
  if (!themeToggle) return;
  var isDark = document.documentElement.dataset.theme === 'dark';
  var isEnglish = document.documentElement.lang.toLowerCase().indexOf('en') === 0;
  var label = isEnglish
    ? (isDark ? 'Switch to light mode' : 'Switch to dark mode')
    : (isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
  themeToggle.setAttribute('aria-label', label);
  themeToggle.setAttribute('title', label);
  themeToggle.setAttribute('aria-pressed', String(isDark));
}

function initializeThemeToggle() {
  themeToggle = document.createElement('button');
  themeToggle.type = 'button';
  themeToggle.className = 'theme-toggle';
  themeToggle.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
  document.body.appendChild(themeToggle);
  updateThemeToggle();

  themeToggle.addEventListener('click', function () {
    var nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = nextTheme;
    try {
      localStorage.setItem('infusion-theme', nextTheme);
    } catch (error) {
      // El cambio sigue funcionando aunque el navegador bloquee el almacenamiento.
    }
    updateThemeToggle();
    if (typeof gtag === 'function') {
      gtag('event', 'theme_changed', { theme: nextTheme });
    }
  });
}

document.addEventListener('DOMContentLoaded', initializeThemeToggle);

var drugSearchPanel = null;
var drugSearchInput = null;
var drugSearchResults = null;
var searchableDrugs = [];

function normalizeDrugSearchText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function closeDrugSearch() {
  if (!drugSearchPanel) return;
  drugSearchPanel.hidden = true;
  document.body.classList.remove('drug-search-open');
}

function renderDrugSearchResults() {
  if (!drugSearchInput || !drugSearchResults) return;

  var query = normalizeDrugSearchText(drugSearchInput.value);
  var isEnglish = document.documentElement.lang.toLowerCase().indexOf('en') === 0;
  drugSearchResults.replaceChildren();

  if (!query) {
    drugSearchResults.hidden = true;
    return;
  }

  drugSearchResults.hidden = false;

  var matches = searchableDrugs.filter(function (drug) {
    return drug.searchText.indexOf(query) !== -1;
  });

  if (!matches.length) {
    var empty = document.createElement('p');
    empty.className = 'drug-search-empty';
    empty.textContent = isEnglish ? 'No matching drugs.' : 'No se encontraron coincidencias.';
    drugSearchResults.appendChild(empty);
    return;
  }

  matches.forEach(function (drug) {
    var result = document.createElement('button');
    result.type = 'button';
    result.className = 'drug-search-result';
    result.textContent = drug.label;
    result.addEventListener('click', function () {
      showSection(drug.sectionIndex);
      var btn = document.querySelector('.hamburger');
      var sidebar = document.querySelector('.sidebar');
      if (btn) btn.classList.remove('is-active');
      if (sidebar) sidebar.classList.remove('is_active');
      closeDrugSearch();
    });
    drugSearchResults.appendChild(result);
  });
}

function openDrugSearch() {
  if (!drugSearchPanel || !drugSearchInput) return;
  drugSearchPanel.hidden = false;
  document.body.classList.add('drug-search-open');
  drugSearchInput.value = '';
  renderDrugSearchResults();
  window.setTimeout(function () { drugSearchInput.focus(); }, 30);
}

function initializeDrugSearch() {
  var links = Array.from(document.querySelectorAll('.sidebar ul li > a'));
  searchableDrugs = links.map(function (link) {
    var match = (link.getAttribute('onclick') || '').match(/showSection\((\d+)\)/);
    if (!match || match[1] === '14') return null;
    var sectionIndex = Number(match[1]);
    var fullTitle = document.querySelector('#section' + sectionIndex + ' h2');
    var label = link.textContent.trim();
    return {
      label: label,
      sectionIndex: sectionIndex,
      searchText: normalizeDrugSearchText(label + ' ' + (fullTitle ? fullTitle.textContent : ''))
    };
  }).filter(Boolean);

  var isEnglish = document.documentElement.lang.toLowerCase().indexOf('en') === 0;
  var toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'drug-search-toggle';
  toggle.setAttribute('aria-label', isEnglish ? 'Search drugs' : 'Buscar drogas');
  toggle.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.5"></circle><path d="m16 16 4.2 4.2"></path></svg>';

  drugSearchPanel = document.createElement('div');
  drugSearchPanel.className = 'drug-search-panel';
  drugSearchPanel.hidden = true;
  drugSearchPanel.innerHTML =
    '<div class="drug-search-card" role="search">' +
      '<div class="drug-search-input-row">' +
        '<input class="drug-search-input" type="text" inputmode="search" autocomplete="off" enterkeyhint="search" aria-label="' +
          (isEnglish ? 'Drug name' : 'Nombre de la droga') + '" placeholder="' +
          (isEnglish ? 'SEARCH' : 'BUSCAR') + '">' +
        '<button class="drug-search-close" type="button" aria-label="' +
          (isEnglish ? 'Close search' : 'Cerrar búsqueda') + '">×</button>' +
      '</div>' +
      '<div class="drug-search-results" aria-live="polite"></div>' +
    '</div>';

  document.body.appendChild(toggle);
  document.body.appendChild(drugSearchPanel);
  drugSearchInput = drugSearchPanel.querySelector('.drug-search-input');
  drugSearchResults = drugSearchPanel.querySelector('.drug-search-results');

  toggle.addEventListener('click', function () {
    if (drugSearchPanel.hidden) openDrugSearch();
    else closeDrugSearch();
  });
  drugSearchInput.addEventListener('input', renderDrugSearchResults);
  drugSearchPanel.querySelector('.drug-search-close').addEventListener('click', closeDrugSearch);
  document.addEventListener('click', function (event) {
    if (!drugSearchPanel.hidden &&
        !drugSearchPanel.contains(event.target) &&
        !toggle.contains(event.target)) {
      closeDrugSearch();
    }
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeDrugSearch();
  });
}

document.addEventListener('DOMContentLoaded', initializeDrugSearch);

var menu = document.querySelector('.hamburger');

function toggleMenu(event) {
  // event puede venir o no (click vs DOMContentLoaded)
  if (event) event.preventDefault();
  var btn = document.querySelector('.hamburger');
  var sidebar = document.querySelector('.sidebar');
  if (!btn || !sidebar) return;
  closeDrugSearch();
  btn.classList.toggle('is-active');
  sidebar.classList.toggle('is_active');

  if (!sidebar.classList.contains('is_active') && pendingInstallMode) {
    window.setTimeout(function () {
      showInstallBanner(pendingInstallMode);
    }, 360);
  }
}

if (menu) {
  menu.addEventListener('click', toggleMenu, false);
}

// Cerrar menú al elegir una opción (la estrella de favoritos no lo cierra)
var menuLinks = document.querySelectorAll('.sidebar ul li > a');
menuLinks.forEach(function (link) {
  link.addEventListener('click', toggleMenu, false);
});

// Abrir/cerrar inicial si querés (podés quitarlo si no lo usás)
window.addEventListener('DOMContentLoaded', function () {
  // toggleMenu(); // descomentá si querés que arranque cerrado/abierto distinto
});

window.addEventListener('DOMContentLoaded', function () {
  const btn = document.querySelector('.hamburger');
  const sidebar = document.querySelector('.sidebar');

  if (btn && sidebar) {
    // Abrir el menú al inicio
    btn.classList.add('is-active');
    sidebar.classList.add('is_active');
  }
});

/* ======================
   AGREGAR A INICIO
   ====================== */

const INSTALL_DISMISS_KEY = 'infusion-install-dismissed-until';
const INSTALL_DISMISS_DAYS = 14;
let deferredInstallPrompt = null;
let pendingInstallMode = null;

function isNativeContainer() {
  return window.Capacitor?.isNativePlatform?.() === true ||
    /^(capacitor|ionic):$/.test(window.location.protocol);
}

if (isNativeContainer() || window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true) {
  document.documentElement.classList.add('app-mode');
}

function isAppInstalled() {
  return isNativeContainer() ||
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
}

function isIOSDevice() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent) ||
    (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
}

function installBannerWasDismissed() {
  return Number(localStorage.getItem(INSTALL_DISMISS_KEY) || 0) > Date.now();
}

function trackInstallEvent(eventName, parameters) {
  if (typeof gtag === 'function') {
    gtag('event', eventName, parameters || {});
  }
}

function createInstallExperience() {
  if (document.getElementById('pwa-install-banner')) return;

  const isEnglish = document.documentElement.lang === 'en';
  const banner = document.createElement('aside');
  banner.className = 'pwa-install-banner';
  banner.id = 'pwa-install-banner';
  banner.setAttribute('aria-label', isEnglish ? 'Install application' : 'Instalar aplicación');
  banner.hidden = true;
  banner.innerHTML =
    '<img src="' + (isEnglish ? '../' : '') + 'infusion128x128.png" alt="">' +
    '<div class="pwa-install-copy"><strong>' + (isEnglish ? 'Install the app' : 'Instalar la app') + '</strong>' +
    '<span id="pwa-install-message"></span></div>' +
    '<button class="pwa-install-action" id="pwa-install-action" type="button"></button>' +
    '<button class="pwa-install-dismiss" id="pwa-install-dismiss" type="button" aria-label="' +
    (isEnglish ? 'Close' : 'Cerrar') + '">×</button>';

  const dialog = document.createElement('div');
  dialog.className = 'install-dialog';
  dialog.id = 'install-dialog';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'install-dialog-title');
  dialog.hidden = true;
  dialog.innerHTML =
    '<div class="install-dialog-card">' +
    '<button class="access-dialog-close" id="install-dialog-close" type="button" aria-label="' +
    (isEnglish ? 'Close' : 'Cerrar') + '">×</button>' +
    '<img src="' + (isEnglish ? '../' : '') + 'infusion128x128.png" alt="">' +
    '<h2 id="install-dialog-title">' + (isEnglish ? 'Install the app' : 'Instalar la app') + '</h2>' +
    '<div id="install-dialog-instructions"></div>' +
    '<button class="install-dialog-done" id="install-dialog-done" type="button">' +
    (isEnglish ? 'Got it' : 'Entendido') + '</button></div>';

  document.body.append(banner, dialog);

  document.getElementById('pwa-install-action').addEventListener('click', handleInstallAction);
  document.getElementById('pwa-install-dismiss').addEventListener('click', dismissInstallBanner);
  document.getElementById('install-dialog-close').addEventListener('click', closeInstallDialog);
  document.getElementById('install-dialog-done').addEventListener('click', closeInstallDialog);
  dialog.addEventListener('click', function (event) {
    if (event.target === dialog) closeInstallDialog();
  });
}

function showInstallBanner(mode, force) {
  if (isAppInstalled()) return;
  if (!force && installBannerWasDismissed()) return;
  createInstallExperience();

  const sidebar = document.querySelector('.sidebar');
  if (!force && sidebar?.classList.contains('is_active')) {
    pendingInstallMode = mode;
    return;
  }

  const isEnglish = document.documentElement.lang === 'en';
  const banner = document.getElementById('pwa-install-banner');
  const message = document.getElementById('pwa-install-message');
  const action = document.getElementById('pwa-install-action');
  pendingInstallMode = null;
  banner.dataset.installMode = mode;
  message.textContent = mode === 'ios'
    ? (isEnglish ? 'Add it to your Home Screen' : 'Agregala a tu pantalla de inicio')
    : (isEnglish ? 'Use it like an application' : 'Usala como una aplicación');
  action.textContent = mode === 'native'
    ? (isEnglish ? 'Install' : 'Instalar')
    : (isEnglish ? 'How' : 'Cómo');
  banner.hidden = false;
  document.body.classList.add('install-banner-visible');
  trackInstallEvent('install_banner_shown', { platform: mode });
}

function hideInstallBanner() {
  const banner = document.getElementById('pwa-install-banner');
  if (banner) banner.hidden = true;
  document.body.classList.remove('install-banner-visible');
  pendingInstallMode = null;
}

function dismissInstallBanner() {
  const dismissedUntil = Date.now() + INSTALL_DISMISS_DAYS * 24 * 60 * 60 * 1000;
  localStorage.setItem(INSTALL_DISMISS_KEY, String(dismissedUntil));
  hideInstallBanner();
  trackInstallEvent('install_banner_dismissed');
}

function openInstallDialog(mode) {
  createInstallExperience();
  const isEnglish = document.documentElement.lang === 'en';
  const instructions = document.getElementById('install-dialog-instructions');

  if (mode === 'ios') {
    instructions.innerHTML = '<ol>' +
      '<li>' + (isEnglish ? 'Tap the <b>Share</b> button.' : 'Tocá el botón <b>Compartir</b> <span aria-hidden="true">⇧</span>.') + '</li>' +
      '<li>' + (isEnglish ? 'Choose <b>Add to Home Screen</b>.' : 'Elegí <b>Agregar a pantalla de inicio</b>.') + '</li>' +
      '<li>' + (isEnglish ? 'Confirm with <b>Add</b>.' : 'Confirmá con <b>Agregar</b>.') + '</li></ol>';
  } else {
    instructions.innerHTML = '<p>' + (isEnglish
      ? 'Open your browser menu and choose <b>Install app</b> or <b>Add to Home Screen</b>.'
      : 'Abrí el menú del navegador y elegí <b>Instalar aplicación</b> o <b>Agregar a pantalla de inicio</b>.') + '</p>';
  }

  document.getElementById('install-dialog').hidden = false;
  document.body.style.overflow = 'hidden';
  document.getElementById('install-dialog-close').focus();
}

function closeInstallDialog() {
  const dialog = document.getElementById('install-dialog');
  if (!dialog) return;
  dialog.hidden = true;
  document.body.style.overflow = '';
}

async function handleInstallAction() {
  const banner = document.getElementById('pwa-install-banner');
  const mode = banner?.dataset.installMode || (isIOSDevice() ? 'ios' : 'manual');
  trackInstallEvent('install_action_clicked', { platform: mode });

  if (mode === 'native' && deferredInstallPrompt) {
    await deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    trackInstallEvent('install_prompt_result', { outcome: choice.outcome });
    deferredInstallPrompt = null;
    hideInstallBanner();
    return;
  }

  openInstallDialog(mode);
}

function agregarAInicio() {
  if (isAppInstalled()) return;
  if (deferredInstallPrompt) {
    showInstallBanner('native', true);
    handleInstallAction();
  } else {
    const mode = isIOSDevice() ? 'ios' : 'manual';
    showInstallBanner(mode, true);
    openInstallDialog(mode);
  }
}

window.addEventListener('beforeinstallprompt', function (event) {
  event.preventDefault();
  deferredInstallPrompt = event;
  showInstallBanner('native');
});

window.addEventListener('appinstalled', function () {
  hideInstallBanner();
  trackInstallEvent('app_installed');
});

document.addEventListener('DOMContentLoaded', function () {
  createInstallExperience();

  if (isIOSDevice() && !isAppInstalled()) {
    window.setTimeout(function () {
      showInstallBanner('ios');
    }, 900);
  }

  if ('serviceWorker' in navigator && /^https?:$/.test(window.location.protocol)) {
    const manifestLink = document.querySelector('link[rel="manifest"]');
    const workerUrl = new URL('service-worker.js', manifestLink?.href || window.location.href);
    navigator.serviceWorker.register(workerUrl.href).catch(function () {
      // La instalación seguirá disponible cuando el navegador no requiera service worker.
    });
  }
});

function calculateAtracurio(event) {
  event.preventDefault();
  var a16 = getNumber('a16');
  var b16 = getNumber('b16');
  var c16 = getNumber('c16');
  var d16 = getNumber('d16');

  if ([a16, b16, c16, d16].some(isNaN)) {
    document.getElementById('result16').textContent = 'Revisá los valores.';
    clearDoseRange('result16');
    return;
  }

  // 1 amp = 50 mg/5 ml
  var result = (((a16 * getDrugPresentation(16).amount * 1000) / b16) * d16) / c16 / 60;
  document.getElementById('result16').textContent = formatResultNumber(result, 2) + ' mcg/kg/min';
  applyDoseRange(16, result);
// Evento GA4 – cálculo exitoso
  gtag('event', 'calculo_realizado', {
    farmaco: 'atracurio'
  });
}

function calculateLabetalol(event) {
  event.preventDefault();
  var a17 = getNumber('a17');
  var b17 = getNumber('b17');
  var d17 = getNumber('d17');

  if ([a17, b17, d17].some(isNaN)) {
    document.getElementById('result17').textContent = 'Revisá los valores.';
    clearDoseRange('result17');
    return;
  }
  // 1 amp = 20 mg → resultado en mg/min
  var result = (((a17 * getDrugPresentation(17).amount) / b17) * d17) / 60;
  document.getElementById('result17').textContent = formatResultNumber(result, 2) + ' mg/min';
  applyDoseRange(17, result);

// Evento GA4 – cálculo exitoso
  gtag('event', 'calculo_realizado', {
    farmaco: 'labetalol'
  });
}

function calculateNitroprusiato(event) {
  event.preventDefault();
  var a18 = getNumber('a18');
  var b18 = getNumber('b18');
  var c18 = getNumber('c18');
  var d18 = getNumber('d18');

  if ([a18, b18, c18, d18].some(isNaN)) {
    document.getElementById('result18').textContent = 'Revisá los valores.';
    clearDoseRange('result18');
    return;
  }

  // 1 amp = 50 mg
  var result = (((a18 * getDrugPresentation(18).amount * 1000) / b18) * d18) / c18 / 60;
  document.getElementById('result18').textContent = formatResultNumber(result, 2) + ' mcg/kg/min';
  applyDoseRange(18, result);

// Evento GA4 – cálculo exitoso
  gtag('event', 'calculo_realizado', {
    farmaco: 'nitroprusiato'
  });
}

function calculateLidocaina(event) {
  event.preventDefault();
  var a19 = getNumber('a19');
  var b19 = getNumber('b19');
  var d19 = getNumber('d19');

  if ([a19, b19, d19].some(isNaN) || a19 <= 0 || b19 <= 0 || d19 < 0) {
    document.getElementById('result19').textContent = 'Revisá los valores.';
    clearDoseRange('result19');
    return;
  }

  var result = (((a19 * getDrugPresentation(19).amount) / b19) * d19) / 60;
  document.getElementById('result19').textContent = formatResultNumber(result, 2) + ' mg/min';
  applyDoseRange(19, result);

  gtag('event', 'calculo_realizado', {
    farmaco: 'lidocaina'
  });
}

document.addEventListener('DOMContentLoaded', function () {
  if (typeof gtag === 'function') {
    const theme = document.documentElement.dataset.theme ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    gtag('event', 'theme_used', {
      theme: theme
    });
  }
});
