const form = document.querySelector('#ecoForm');
const el = (id) => document.querySelector(id);
const manualMetricEdits = {};
const number = (data, key) => {
  const raw = String(data.get(key) ?? '').trim().replace(',', '.');
  const v = Number(raw);
  return Number.isFinite(v) && v > 0 ? v : null;
};
const fmt = (value, decimals = 1) => value == null || !Number.isFinite(value) ? '—' : value.toLocaleString('es-AR', { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
const value = (data, key) => data.get(key) || '—';

function calculate(data) {
  const weight = number(data, 'weight'), height = number(data, 'height');
  const asc = weight && height ? Math.sqrt((weight * height) / 3600) : null;
  const dd = number(data, 'lvDd'), ds = number(data, 'lvDs'), ivsd = number(data, 'ivsd'), pwd = number(data, 'pwd');
  const shortening = dd && ds ? ((dd - ds) / dd) * 100 : null;
  const mass = asc && dd && ivsd && pwd ? (0.8 * 1.04 * (((dd + ivsd + pwd) ** 3) - (dd ** 3)) + 0.6) / asc / 1000 : null;
  const rwt = dd && pwd ? (2 * pwd) / dd : null;
  const trGradient = number(data, 'trGradient'), rap = number(data, 'rap');
  const psap = trGradient && rap ? trGradient + rap : null;
  const lvotDiam = number(data, 'lvotDiam'), lvotVti = number(data, 'lvotVti'), avVti = number(data, 'avVti');
  const ava = lvotDiam && lvotVti && avVti ? (Math.PI * ((lvotDiam / 2) ** 2) * lvotVti) / avVti : null;
  const dimensionlessIndex = lvotVti && avVti ? lvotVti / avVti : null;
  const e = number(data, 'eWave'), a = number(data, 'aWave');
  const aorticPeakGradient = number(data, 'avVmax') ? 4 * (number(data, 'avVmax') ** 2) : null;
  const aorticMeanGradient = number(data, 'aorticMeanGradient');
  const aorticStenosis = number(data, 'avVmax') && number(data, 'avVmax') >= 1.8 && aorticMeanGradient != null
    ? aorticMeanGradient < 20 ? 'leve' : aorticMeanGradient < 40 ? 'moderada' : 'severa' : null;
  return { asc, shortening, mass, rwt, psap, ava, dimensionlessIndex, eOverA: e && a ? e / a : null, aorticPeakGradient, aorticStenosis };
}

function escapeHtml(text) { return String(text ?? '—').replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[char]); }
function editableMetric(field, automaticValue) { return `<span class="editable inline-edit" contenteditable="true" data-field="${field}">${escapeHtml(manualMetricEdits[field] ?? automaticValue)}</span>`; }
function reportValue(data, key, unit = '', decimals = 1) { const n = number(data, key); return n ? `${fmt(n, decimals)}${unit ? ` ${unit}` : ''}` : escapeHtml(data.get(key) || '—'); }
function measureRow(leftLabel, leftValue, leftRef, rightLabel, rightValue, rightRef) {
  return `<div class="measure-row"><div class="measure-label">${leftLabel}</div><div class="measure-value">${leftValue}</div><div class="measure-ref">${leftRef || ''}</div><div class="measure-label">${rightLabel}</div><div class="measure-value">${rightValue}</div><div class="measure-ref">${rightRef || ''}</div></div>`;
}
function measureHeading(text, asc = '') { return `<div class="measure-heading"><strong>${text}</strong><em>${asc}</em></div>`; }
function descriptionRow(label, text) { return `<div class="description-row"><div class="description-label">${label}</div><div class="description-text editable" contenteditable="true">${escapeHtml(text)}</div></div>`; }
function textNumber(n, decimals = 0) { return n == null ? null : fmt(n, decimals); }
function autoDescriptions(data, c) {
  const sex = data.get('sex');
  const age = number(data, 'age');
  const dd = number(data, 'lvDd'); const ef = number(data, 'lvef'); const mass = c.mass;
  const maleLimits = [116, 132, 148], femaleLimits = [96, 109, 122];
  const limits = sex === 'M' ? maleLimits : sex === 'F' ? femaleLimits : null;
  let left = 'Completar medidas del ventrículo izquierdo.';
  if (dd && ef && mass && limits) {
    const functionText = ef >= 55 ? 'función sistólica conservada' : 'función sistólica a valorar';
    const sizeText = dd <= 56 ? '' : 'con dilatación ventricular, ';
    const hypertrophy = mass < limits[0] ? 'Ventrículo de dimensiones y ' : mass <= limits[1] ? 'Leve hipertrofia concéntrica con ' : mass <= limits[2] ? 'Hipertrofia concéntrica moderada con ' : 'Hipertrofia concéntrica severa con ';
    left = `${sizeText}${hypertrophy}${functionText}. IMVI ${textNumber(mass)} g/m².`;
  }
  const motion = data.get('goodWindow').toLowerCase() === 'si' ? 'No se evidencian alteraciones de motilidad parietal en reposo.' : 'En reposo no impresiona presentar alteraciones de motilidad parietal (ventana acústica subóptima).';
  const relaxation = c.eOverA == null ? '' : c.eOverA >= 1 ? 'Patrón diastólico de relajación normal.' : 'Patrón diastólico de relajación prolongada.';
  const rv = number(data, 'rv'); const tapse = number(data, 'tapse'); const ivc = number(data, 'ivc');
  let right = 'Completar medidas del ventrículo derecho.';
  if (rv && tapse) {
    right = rv < 40 && tapse > 17 ? `Diámetros y función sistólica conservada. TAPSE: ${textNumber(tapse)} mm.` : `Diámetro basal ${textNumber(rv)} mm. TAPSE: ${textNumber(tapse)} mm.`;
    if (ivc) right += ivc < 22 ? ' Vena cava inferior no dilatada, con variación respiratoria >50%.' : ' Vena cava inferior dilatada.';
    if (String(data.get('pacemaker')).toLowerCase() === 'si') right += ' Se observó catéter de dispositivo.';
  }
  const laArea = number(data, 'laArea'); const raArea = number(data, 'raArea');
  const la = !laArea ? 'Completar área de aurícula izquierda.' : laArea <= 20 ? `Normal. Área: ${textNumber(laArea)} cm².` : laArea < 30 ? `Leve dilatación. Área: ${textNumber(laArea)} cm².` : laArea < 40 ? `Dilatación moderada. Área: ${textNumber(laArea)} cm².` : `Dilatación severa. Área: ${textNumber(laArea)} cm².`;
  const ra = !raArea ? 'Completar área de aurícula derecha.' : raArea <= 18 ? `Normal. Área: ${textNumber(raArea)} cm².` : `Dilatada. Área: ${textNumber(raArea)} cm².`;
  const mr = String(data.get('mr') || '').toLowerCase();
  const mitralBase = age && age > 80 ? 'Esclerocalcificación del anillo valvular, con apertura conservada.' : age && age > 60 ? 'De valvas finas, con ligera esclerosis del anillo valvular, apertura conservada.' : 'De valvas finas, con apertura conservada.';
  const mitral = !mr || mr === '-' || mr === 'no' ? `${mitralBase} Competente.` : `${mitralBase} Insuficiencia ${mr}.`;
  const tr = String(data.get('tr') || '').toLowerCase(); const gtt = number(data, 'trGradient');
  let tricuspid = !tr || tr === '-' || tr === 'no' ? 'Morfología conservada, sin insuficiencia.' : `Insuficiencia ${tr}.`;
  if (gtt && c.psap) tricuspid = `Insuficiencia ${tr || 'tricuspídea'}, con GTT de ${textNumber(gtt)} mmHg. Presión sistólica de la arteria pulmonar estimada en ${textNumber(c.psap)} mmHg.`;
  const vmax = number(data, 'avVmax'); const gm = number(data, 'aorticMeanGradient'); const ar = String(data.get('ar') || '').toLowerCase();
  let aortic;
  if (c.aorticStenosis) {
    const restriction = c.aorticStenosis === 'leve' ? 'apertura levemente restringida' : c.aorticStenosis === 'moderada' ? 'apertura restringida en grado moderado' : 'apertura severamente restringida';
    aortic = `Es tricúspide, con esclerocalcificación de sus valvas y ${restriction}. Vel max. ${textNumber(vmax, 2)} m/seg. GM ${textNumber(gm)} mmHg. GP ${textNumber(c.aorticPeakGradient)} mmHg.`;
    if (c.ava) aortic += ` Se estimó área por ecuación de continuidad en ${textNumber(c.ava, 2)} cm² (TSVI ${textNumber(number(data, 'lvotDiam'), 2)} cm).`;
    if (c.dimensionlessIndex) aortic += ` Cociente adimensional: ${textNumber(c.dimensionlessIndex, 2)}.`;
  } else {
    aortic = age && age > 60 ? 'Ligera esclerosis de sus valvas, con apertura conservada.' : 'Es trivalva, con apertura conservada.';
    if (vmax) aortic += ` Vel max. ${textNumber(vmax, 2)} m/seg.`;
  }
  aortic += !ar || ar === '-' || ar === 'no' ? ' Sin insuficiencia.' : ` Insuficiencia ${ar}.`;
  const root = number(data, 'aorticRoot'); const rootText = !root ? 'Completar diámetro de raíz aórtica.' : root < 37 ? 'Normal.' : `Dilatada. ${textNumber(root)} mm.`;
  return [
    ['VENTRÍCULO IZQUIERDO:', left], ['', motion], ['', relaxation], ['VENTRÍCULO DERECHO:', right],
    ['AURÍCULA IZQUIERDA:', la], ['AURÍCULA DERECHA:', ra], ['VÁLVULA MITRAL:', mitral],
    ['VÁLVULA TRICÚSPIDE:', tricuspid], ['VÁLVULA AÓRTICA:', aortic], ['RAÍZ AÓRTICA:', rootText]
  ];
}
function renderDescriptions(data, c, force = false) {
  const container = el('#description');
  if (!force && container.dataset.dirty === 'true') return;
  container.innerHTML = [measureHeading('D E S C R I P C I Ó N'), ...autoDescriptions(data, c).map(([label, text]) => descriptionRow(label, text))].join('');
  container.dataset.dirty = 'false';
}
function autoConclusions(data, c) {
  const sex = data.get('sex'); const dd = number(data, 'lvDd'); const ef = number(data, 'lvef'); const mass = c.mass;
  const limits = sex === 'M' ? [116, 132, 148] : sex === 'F' ? [96, 109, 122] : null;
  const conclusions = [];
  if (dd && ef && mass && limits && dd <= 56 && ef >= 55) {
    if (mass < limits[0]) conclusions.push('Ventrículo izquierdo de dimensiones y función sistólica conservada.');
    else if (mass <= limits[1]) conclusions.push('Ventrículo izquierdo con leve hipertrofia concéntrica y función sistólica conservada.');
    else if (mass <= limits[2]) conclusions.push('Ventrículo izquierdo con hipertrofia concéntrica moderada y función sistólica conservada.');
    else conclusions.push('Ventrículo izquierdo con hipertrofia concéntrica severa y función sistólica conservada.');
  } else if (dd || ef || mass) conclusions.push('Ventrículo izquierdo: completar valoración según medidas y función sistólica.');
  if (c.eOverA != null) {
    if (c.eOverA < 1) conclusions.push('Disfunción diastólica tipo 1.');
  }
  const degrees = ['trivial', 'leve', 'moderada', 'severa'];
  const valveGrades = [data.get('mr'), data.get('tr'), data.get('ar')].map(x => String(x || '').trim().toLowerCase());
  const significantValve = valveGrades.some(x => x === 'moderada' || x === 'severa');
  if (c.aorticStenosis) conclusions.push(`Estenosis aórtica ${c.aorticStenosis}, esclerodegenerativa.`);
  else if (significantValve) conclusions.push('Valvulopatía a valorar según los hallazgos consignados.');
  else if (valveGrades.some(x => degrees.includes(x))) conclusions.push(valveGrades.filter(x => x === 'leve').length === 3 ? 'Insuficiencias valvulares leves.' : 'Sin valvulopatías significativas.');
  const psap = c.psap;
  if (psap != null) {
    if (psap < 36) conclusions.push('No se constató hipertensión pulmonar.');
    else if (psap < 50) conclusions.push('Hipertensión pulmonar leve.');
    else if (psap < 60) conclusions.push('Hipertensión pulmonar moderada.');
    else conclusions.push('Hipertensión pulmonar severa.');
  } else if (['leve', 'trivial'].includes(String(data.get('tr') || '').toLowerCase())) conclusions.push('No se constató hipertensión pulmonar.');
  const shunts = String(data.get('shunts') || '').toLowerCase();
  if (shunts === 'no') conclusions.push('Sin evidencias de coartación aórtica o shunts intracardíacos.');
  conclusions.push('Pericardio libre de derrame.');
  return conclusions;
}
function renderConclusions(data, c, force = false) {
  const container = el('#conclusions');
  if (!force && container.dataset.dirty === 'true') return;
  container.innerHTML = `<div class="conclusion-heading">C O N C L U S I O N E S</div>${autoConclusions(data, c).map(text => `<div class="conclusion-text editable" contenteditable="true">${escapeHtml(text)}</div>`).join('')}`;
  container.dataset.dirty = 'false';
}
function render() {
  const data = new FormData(form); const c = calculate(data);
  const reportTitle = el('#reportTitle');
  if (reportTitle.dataset.dirty !== 'true') reportTitle.textContent = data.get('doppler') === 'Si' ? 'ECOCARDIOGRAMA DOPPLER 2D' : 'ECOCARDIOGRAMA BIDIMENSIONAL';
  el('#avaResult').textContent = c.ava ? `${fmt(c.ava, 2)} cm²` : '—';
  el('#dimensionlessResult').textContent = c.dimensionlessIndex ? fmt(c.dimensionlessIndex, 2) : '—';
  const name = data.get('patientName') || 'Apellido y nombre: —';
  el('#reportPatient').textContent = name.startsWith('Apellido y nombre:') ? name : `Apellido y nombre: ${name}`;
  el('#reportDate').textContent = data.get('studyDate') ? new Date(`${data.get('studyDate')}T12:00:00`).toLocaleDateString('es-AR') : '';
  const val = (key, unit = '', decimals = 1) => reportValue(data, key, unit, decimals);
  const calculated = (num, unit = '', decimals = 1) => num == null ? '—' : `${fmt(num, decimals)}${unit ? ` ${unit}` : ''}`;
  const relaxation = c.eOverA == null ? '—' : c.eOverA >= 1 ? 'Normal' : 'Prolongada';
  const pulmonaryHypertension = c.psap == null ? '—' : c.psap > 36 ? 'Sí' : 'No';
  el('#metrics').innerHTML = [
    measureHeading('M E D I D A S&nbsp;&nbsp; 2 D', c.asc ? `ASC: ${fmt(c.asc, 2)} m²` : ''),
    '<div class="measure-subhead">CAVIDADES IZQUIERDAS:</div>',
    measureRow('Diámetro interno de VI en diástole:', val('lvDd','mm',0), '[&lt;55 mm]', 'Diámetro interno en sístole:', val('lvDs','mm',0), ''),
    measureRow('Fracción de acortamiento:', calculated(c.shortening,'%',0), '[&gt;28%]', 'Fracción de eyección:', val('lvef','%',0), '[&gt;55%]'),
    measureRow('Septum interventricular en diástole:', val('ivsd','mm',0), '[&lt;12 mm]', 'Pared posterior en diástole:', val('pwd','mm',0), '[&lt;12 mm]'),
    measureRow('Índice de masa ventricular:', calculated(c.mass,'g/m²',0), '[♂&lt;115 / ♀&lt;95 g/m²]', 'Espesor parietal relativo:', calculated(c.rwt,'',2), '[&lt;0,45]'),
    measureRow('Diám. de aurícula izq.:', val('la','mm',0), '[&lt;40 mm]', 'Área de aurícula izquierda:', val('laArea','cm²',0), '[&lt;20 cm²]'),
    measureRow('Ap. Valv Aórtica:', val('apAo','mm',0), '', 'Diámetro de raíz de aorta:', val('aorticRoot','mm',0), '[&lt;36 mm]'),
    '<div class="measure-subhead">VENTRÍCULO DERECHO:</div>',
    measureRow('Diámetro diastólico basal:', val('rv','mm',0), '[&lt;40 mm]', 'TAPSE:', val('tapse','mm',0), '[&gt;17 mm]'),
    measureRow('Vena cava inferior:', val('ivc','mm',0), '[&lt;22 mm]', '', '', ''),
    `<div class="doppler-block ${data.get('doppler') === 'Si' ? '' : 'is-disabled'}">`,
    measureHeading('V A L O R A C I Ó N&nbsp;&nbsp; D O P P L E R'),
    measureRow('Velocidad E:', val('eWave','m/s',2), '', 'Velocidad A:', val('aWave','m/s',2), ''),
    measureRow("Relación E/E' septal:", val('ePrime','',1), '[&lt;15]', 'Patrón de relajación:', editableMetric('relaxation', relaxation), ''),
    measureRow('Insuficiencia mitral:', val('mr'), '', 'Insuficiencia tricuspídea:', val('tr'), ''),
    measureRow('Gradiente transtricuspídeo:', val('trGradient','mmHg',0), '', 'PAD estimada:', val('rap','mmHg',0), ''),
    measureRow('PSAP estimada:', calculated(c.psap,'mmHg',0), '[&lt;36 mmHg]', 'Hipertensión pulmonar:', editableMetric('pulmonaryHypertension', pulmonaryHypertension), ''),
    measureRow('Velocidad flujo aórtico:', val('avVmax','m/s',2), '[&lt;2 m/seg]', 'Gradiente pico aórtico:', calculated(c.aorticPeakGradient,'mmHg',0), '[&lt;13 mmHg]'),
    measureRow('Gradiente medio aórtico:', val('aorticMeanGradient','mmHg',0), '', 'Insuficiencia aórtica:', val('ar'), ''),
    '</div>'
  ].join('');
  el('#metrics').querySelectorAll('.inline-edit').forEach(node => node.addEventListener('input', () => { manualMetricEdits[node.dataset.field] = node.textContent.trim(); }));
  renderDescriptions(data, c);
  const lv = number(data,'lvef');
  renderConclusions(data, c);
}
form.addEventListener('input', render); form.addEventListener('change', render);
el('#reportTitle').addEventListener('input', () => { el('#reportTitle').dataset.dirty = 'true'; });
el('#description').addEventListener('input', () => { el('#description').dataset.dirty = 'true'; });
el('#regenerateButton').addEventListener('click', () => { renderDescriptions(new FormData(form), calculate(new FormData(form)), true); });
el('#conclusions').addEventListener('input', () => { el('#conclusions').dataset.dirty = 'true'; });
el('#regenerateConclusionsButton').addEventListener('click', () => { renderConclusions(new FormData(form), calculate(new FormData(form)), true); });
el('#clearButton').addEventListener('click', () => { form.reset(); Object.keys(manualMetricEdits).forEach(key => delete manualMetricEdits[key]); el('#description').textContent = ''; el('#conclusions').textContent = ''; render(); });
el('#printButton').addEventListener('click', () => window.print());

function plainReportText() {
  const data = new FormData(form);
  const c = calculate(data);
  const plainInput = (key, unit = '', decimals = 1) => {
    const n = number(data, key);
    if (n != null) return `${fmt(n, decimals)}${unit ? ` ${unit}` : ''}`;
    const raw = String(data.get(key) || '').trim();
    return raw && raw !== '—' ? raw : '-';
  };
  const plainCalculated = (n, unit = '', decimals = 1) => n == null ? '-' : `${fmt(n, decimals)}${unit ? ` ${unit}` : ''}`;
  const manual = (field, automatic) => String(manualMetricEdits[field] ?? automatic ?? '-').trim() || '-';
  const relaxation = manual('relaxation', c.eOverA == null ? '-' : c.eOverA >= 1 ? 'Normal' : 'Prolongada');
  const pulmonaryHypertension = manual('pulmonaryHypertension', c.psap == null ? '-' : c.psap > 36 ? 'Sí' : 'No');
  const paired = (leftLabel, leftValue, rightLabel = '', rightValue = '') => `${leftLabel}\t${leftValue}\t\t${rightLabel}${rightLabel ? '\t' + rightValue : ''}`;
  const descriptionNames = {
    'VENTRÍCULO IZQUIERDO:': 'Ventrículo izquierdo:', 'VENTRÍCULO DERECHO:': 'Ventrículo derecho:',
    'AURÍCULA IZQUIERDA:': 'Aurícula izquierda:', 'AURÍCULA DERECHA:': 'Aurícula derecha:',
    'VÁLVULA MITRAL:': 'Válvula mitral:', 'VÁLVULA TRICÚSPIDE:': 'Válvula tricúspide:',
    'VÁLVULA AÓRTICA:': 'Válvula aórtica:', 'RAÍZ AÓRTICA:': 'Raíz aórtica:'
  };
  const descriptionLines = [];
  let activeDescription = null;
  el('#description').querySelectorAll('.description-row').forEach(row => {
    const label = row.querySelector('.description-label')?.textContent.trim() || '';
    const text = row.querySelector('.description-text')?.textContent.trim() || '';
    if (label) {
      activeDescription = { label: descriptionNames[label] || label, text };
      descriptionLines.push(activeDescription);
    } else if (activeDescription && text) activeDescription.text += `${activeDescription.text ? ' ' : ''}${text}`;
  });
  const conclusionLines = Array.from(el('#conclusions').querySelectorAll('.conclusion-text'))
    .map(node => node.textContent.trim()).filter(Boolean);
  return [
    'MEDIDAS 2D:',
    paired('Diám. interno en diástole:', plainInput('lvDd', 'mm', 0), 'Diám. interno en sístole:', plainInput('lvDs', 'mm', 0)),
    paired('Fracción de acortamiento:', plainCalculated(c.shortening, '%', 0), 'Fracción de eyección:', plainInput('lvef', '%', 0)),
    paired('SIV en diástole:', plainInput('ivsd', 'mm', 1), 'PP en diástole:', plainInput('pwd', 'mm', 0)),
    paired('Índice de masa ventricular:', plainCalculated(c.mass, 'g/m²', 0), 'EPR:', plainCalculated(c.rwt, '', 2)),
    paired('Diám. de aurícula izq.:', plainInput('la', 'mm', 0), 'Área de aurícula izq.:', plainInput('laArea', 'cm²', 0)),
    paired('Ap. Valv Aórtica:', plainInput('apAo', 'mm', 0), 'Diám. de raíz de aorta:', plainInput('aorticRoot', 'mm', 0)),
    paired('Diámetro diastólico VD:', plainInput('rv', 'mm', 0), 'TAPSE:', plainInput('tapse', 'mm', 0)),
    paired('Vena cava inferior:', plainInput('ivc', 'mm', 0)),
    '', 'VALORACIÓN DOPPLER:',
    paired('Velocidad E:', plainInput('eWave', 'm/s', 2), 'Velocidad A:', plainInput('aWave', 'm/s', 2)),
    paired("Relacion E/e' septal:", plainInput('ePrime', '', 1), 'Patrón de relajación:', relaxation),
    paired('Insuficiencia mitral:', plainInput('mr'), 'Insuficiencia tricuspídea:', plainInput('tr')),
    paired('GTT:', plainInput('trGradient', 'mmHg', 0), 'PAD estimada:', plainInput('rap', 'mmHg', 0)),
    paired('PSAP estimada:', plainCalculated(c.psap, 'mmHg', 0), 'Hipertensión pulmonar:', pulmonaryHypertension),
    paired('Velocidad flujo aórtico:', plainInput('avVmax', 'm/s', 2), 'Gradiente pico aórtico:', plainCalculated(c.aorticPeakGradient, 'mmHg', 0)),
    paired('Gradiente medio aórtico:', plainInput('aorticMeanGradient', 'mmHg', 0), 'Insuficiencia aórtica:', plainInput('ar')),
    '', 'DESCRIPCIÓN:',
    ...descriptionLines.map(item => `${item.label}\t${item.text}`),
    '', 'CONCLUSIONES:',
    ...conclusionLines,
    '', '', '\t\tDr. RODRIGUEZ CLAUS, ELISEO', '\t\tEsp. en Cardiología - MP 118.231'
  ].join('\n');
}

async function copyPlainReport() {
  const text = plainReportText();
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const helper = document.createElement('textarea');
  helper.value = text;
  helper.setAttribute('readonly', '');
  helper.style.cssText = 'position:fixed;left:-9999px;top:0';
  document.body.appendChild(helper);
  helper.select();
  const copied = document.execCommand('copy');
  helper.remove();
  if (!copied) throw new Error('No se pudo copiar el texto');
}

el('#copyTextButton').addEventListener('click', async () => {
  const button = el('#copyTextButton');
  const originalLabel = button.textContent;
  try {
    await copyPlainReport();
    button.textContent = 'Texto copiado';
    setTimeout(() => { button.textContent = originalLabel; }, 1800);
  } catch (error) {
    console.error(error);
    window.prompt('Copiá este texto:', plainReportText());
  }
});
el('#wordButton').addEventListener('click', async () => {
  const button = el('#wordButton');
  const originalLabel = button.textContent;
  try {
    button.disabled = true;
    button.textContent = 'Generando Word…';
    if (!window.html2canvas) throw new Error('No se cargó el generador de imagen');
    const report = el('#report');
    await Promise.all(Array.from(report.images).map(image => image.complete ? Promise.resolve() : new Promise(resolve => {
      image.addEventListener('load', resolve, { once: true });
      image.addEventListener('error', resolve, { once: true });
    })));
    if (document.fonts?.ready) await document.fonts.ready;
    const canvas = await window.html2canvas(report, { backgroundColor: '#ffffff', scale: 2, useCORS: true, logging: false, imageTimeout: 15000 });
    const imageData = canvas.toDataURL('image/png').split(',')[1];
    const boundary = '----=_EcoInforme_' + Date.now();
    const wordDocument = [
      'MIME-Version: 1.0',
      `Content-Type: multipart/related; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset="utf-8"',
      'Content-Location: file:///C:/EcoInforme.html',
      '',
      '<!doctype html><html xmlns:o="urn:schemas-microsoft-com:office:office"><head><meta charset="utf-8"><style>@page Section1{size:595.3pt 841.9pt;margin:0}div.Section1{page:Section1;width:595.3pt;height:841.9pt;margin:0;padding:0;overflow:hidden}img{display:block;width:595.3pt;height:841.9pt;margin:0;padding:0;border:0}</style></head><body style="margin:0;padding:0"><div class="Section1"><img src="file:///C:/EcoInforme.png" width="794" height="1123" /></div></body></html>',
      '',
      `--${boundary}`,
      'Content-Type: image/png',
      'Content-Transfer-Encoding: base64',
      'Content-Location: file:///C:/EcoInforme.png',
      '',
      imageData,
      `--${boundary}--`
    ].join('\r\n');
    const blob = new Blob([wordDocument], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const patient = String(new FormData(form).get('patientName') || 'informe').replace(/[^a-z0-9áéíóúñ]+/gi, '_');
    link.download = `Ecocardiograma_${patient}.doc`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1500);
  } catch (error) {
    console.error(error);
    const reportCopy = el('#report').cloneNode(true);
    reportCopy.querySelectorAll('[contenteditable]').forEach(node => node.removeAttribute('contenteditable'));
    const styles = Array.from(document.styleSheets).map(sheet => {
      try { return Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n'); } catch { return ''; }
    }).join('\n');
    const fallbackDocument = `<!doctype html><html><head><meta charset="utf-8"><style>@page{size:A4;margin:0}html,body{width:210mm;height:297mm;margin:0;padding:0;overflow:hidden;background:#fff}${styles}.report{width:210mm!important;min-height:0!important;margin:0!important;padding:12mm 13mm!important;box-shadow:none!important;zoom:.78}.report *{max-width:100%}</style></head><body>${reportCopy.outerHTML}</body></html>`;
    const fallbackBlob = new Blob([fallbackDocument], { type: 'application/msword' });
    const fallbackLink = document.createElement('a');
    fallbackLink.href = URL.createObjectURL(fallbackBlob);
    const patient = String(new FormData(form).get('patientName') || 'informe').replace(/[^a-z0-9áéíóúñ]+/gi, '_');
    fallbackLink.download = `Ecocardiograma_${patient}.doc`;
    document.body.appendChild(fallbackLink);
    fallbackLink.click();
    fallbackLink.remove();
    setTimeout(() => URL.revokeObjectURL(fallbackLink.href), 1500);
  } finally {
    button.disabled = false;
    button.textContent = originalLabel;
  }
});
form.elements.studyDate.value = new Date().toISOString().slice(0,10);
render();
