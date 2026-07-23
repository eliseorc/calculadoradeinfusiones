const form = document.querySelector('#ecoForm');
const el = (id) => document.querySelector(id);
const manualMetricEdits = {};
const number = (data, key) => {
  const raw = String(data.get(key) ?? '').trim().replace(',', '.');
  const v = Number(raw);
  return Number.isFinite(v) && v > 0 ? v : null;
};
const fmt = (value, decimals = 0) => value == null || !Number.isFinite(value) ? '—' : value.toLocaleString('es-AR', { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
const fmtUpTo = (value, decimals = 2) => value == null || !Number.isFinite(value) ? '—' : value.toLocaleString('es-AR', { maximumFractionDigits: decimals, minimumFractionDigits: 0 });
const value = (data, key) => data.get(key) || '—';
const patientFileName = (data) => {
  const cleanName = String(data.get('patientName') || '')
    .normalize('NFC')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleanName || 'Informe';
};

function calculate(data) {
  const weight = number(data, 'weight'), height = number(data, 'height');
  const asc = weight && height ? Math.sqrt((weight * height) / 3600) : null;
  const dd = number(data, 'lvDd'), ds = number(data, 'lvDs'), ivsd = number(data, 'ivsd'), pwd = number(data, 'pwd');
  const shortening = dd && ds ? ((dd - ds) / dd) * 100 : null;
  const mass = asc && dd && ivsd && pwd ? ((0.8 * 1.04 * (((dd + ivsd + pwd) ** 3) - (dd ** 3))) / 1000 + 0.6) / asc : null;
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
  const laVolume = number(data, 'laVolume');
  const laVolumeIndex = laVolume && asc ? laVolume / asc : null;
  const wedgePressure = number(data, 'ePrime') ? (1.24 * number(data, 'ePrime')) + 1.9 : null;
  return { asc, shortening, mass, rwt, psap, ava, dimensionlessIndex, eOverA: e && a ? e / a : null, aorticPeakGradient, aorticStenosis, laVolumeIndex, wedgePressure };
}

function escapeHtml(text) { return String(text ?? '—').replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[char]); }
function editableMetric(field, automaticValue) { return `<span class="editable inline-edit" contenteditable="true" data-field="${field}">${escapeHtml(manualMetricEdits[field] ?? automaticValue)}</span>`; }
function reportValue(data, key, unit = '', decimals = 1) { const n = number(data, key); return n ? `${fmt(n, decimals)}${unit ? ` ${unit}` : ''}` : escapeHtml(data.get(key) || '—'); }
function measureRow(leftLabel, leftValue, leftRef, rightLabel, rightValue, rightRef) {
  return `<div class="measure-row"><div class="measure-label">${leftLabel}</div><div class="measure-value">${leftValue}</div><div class="measure-ref">${leftRef || ''}</div><div class="measure-label">${rightLabel}</div><div class="measure-value">${rightValue}</div><div class="measure-ref">${rightRef || ''}</div></div>`;
}
function measureHeading(text, asc = '') { return `<div class="measure-heading"><strong>${text}</strong><em>${asc}</em></div>`; }
function highlightedDescription(text) {
  return escapeHtml(text).replace(/(Completar[^.]*\.)/g, '<span class="missing-description">$1</span>');
}
function descriptionRow(label, text) {
  const editableLabel = label === 'RAÍZ AÓRTICA:';
  return `<div class="description-row"><div class="description-label${editableLabel ? ' editable' : ''}"${editableLabel ? ' contenteditable="true"' : ''}>${label}</div><div class="description-text editable" contenteditable="true">${highlightedDescription(text)}</div></div>`;
}
function textNumber(n, decimals = 0) { return n == null ? null : fmt(n, decimals); }
function leftVentricleGeometry(sex, mass, rwt) {
  const thresholds = sex === 'M'
    ? { normal: 115, mild: 131, moderate: 148 }
    : sex === 'F'
      ? { normal: 95, mild: 108, moderate: 121 }
      : null;
  if (mass == null || !thresholds) return null;

  const severity = mass <= thresholds.normal ? null
    : mass <= thresholds.mild ? 'leve'
      : mass <= thresholds.moderate ? 'moderada'
        : 'severa';
  const pattern = rwt == null ? null : rwt > 0.42 ? 'concéntrica' : 'excéntrica';
  // Umbral operativo más estricto para emitir "remodelado concéntrico" automático.
  const remodeling = !severity && rwt != null && rwt > 0.45;
  return { severity, pattern, remodeling };
}
function autoDescriptions(data, c) {
  const sex = data.get('sex');
  const age = number(data, 'age');
  const isDoppler = data.get('doppler') === 'Si';
  const dd = number(data, 'lvDd'); const ef = number(data, 'lvef'); const mass = c.mass;
  const geometry = leftVentricleGeometry(sex, mass, c.rwt);
  let left = 'Completar medidas del ventrículo izquierdo.';
  if (dd && ef && mass && geometry) {
    const functionText = ef >= 55 ? 'función sistólica conservada' : 'función sistólica a valorar';
    const sizeText = dd <= 56 ? '' : 'con dilatación ventricular, ';
    if (geometry.remodeling) {
      left = `${sizeText}Ventrículo con remodelado concéntrico y ${functionText}. IMVI ${textNumber(mass)} g/m². EPR ${textNumber(c.rwt, 2)}.`;
    } else if (geometry.severity) {
      const hypertrophy = geometry.severity === 'leve'
        ? `Leve hipertrofia ${geometry.pattern || 'de geometría a valorar'} con `
        : `Hipertrofia ${geometry.pattern || 'de geometría a valorar'} ${geometry.severity} con `;
      left = `${sizeText}${hypertrophy}${functionText}. IMVI ${textNumber(mass)} g/m².${c.rwt != null ? ` EPR ${textNumber(c.rwt, 2)}.` : ''}`;
    } else {
      left = `${sizeText}Ventrículo de dimensiones y ${functionText}. IMVI ${textNumber(mass)} g/m².`;
    }
  }
  const motion = data.get('goodWindow').toLowerCase() === 'si' ? 'No se evidenciaron alteraciones de motilidad parietal en reposo.' : 'En reposo no impresiona presentar alteraciones de motilidad parietal (ventana acústica subóptima).';
  const relaxation = !isDoppler || c.eOverA == null ? '' : c.eOverA >= 1 ? 'Patrón diastólico de relajación normal.' : 'Patrón diastólico de relajación prolongada.';
  const rv = number(data, 'rv'); const tapse = number(data, 'tapse'); const ivc = number(data, 'ivc');
  let right = 'Completar medidas del ventrículo derecho.';
  if (rv && tapse) {
    const rvSize = rv < 41 ? 'de dimensiones conservadas' : rv <= 44 ? 'con leve dilatación' : rv <= 49 ? 'con dilatación moderada' : 'con dilatación severa';
    const rvFunction = tapse > 17 ? 'función sistólica conservada' : tapse >= 13 ? 'disfunción sistólica leve' : tapse > 10 ? 'disfunción sistólica moderada' : 'disfunción sistólica severa';
    right = rv < 41 && tapse > 17
      ? `Diámetros y función sistólica conservada. TAPSE: ${textNumber(tapse)} mm.`
      : `Ventrículo derecho ${rvSize} y ${rvFunction}. Diámetro basal: ${textNumber(rv)} mm. TAPSE: ${textNumber(tapse)} mm.`;
    if (ivc) right += ivc < 22 ? ' Vena cava inferior no dilatada, con variación respiratoria >50%.' : ' Vena cava inferior dilatada.';
    if (String(data.get('pacemaker')).toLowerCase() === 'si') right += ' Se observó catéter de dispositivo.';
    if (String(data.get('pulmonaryArtery')).toLowerCase() === 'ok') right += ' Arteria pulmonar de diámetro conservado.';
  }
  const laArea = number(data, 'laArea'); const raArea = number(data, 'raArea');
  const normalLaVolumeDespiteArea = laArea > 20 && c.laVolumeIndex != null && c.laVolumeIndex <= 34;
  const la = !laArea ? 'Completar área de aurícula izquierda.'
    : normalLaVolumeDespiteArea ? `Normal. Si bien área: ${textNumber(laArea)} cm², volumen: ${textNumber(c.laVolumeIndex)} ml/m².`
      : laArea <= 20 ? `Normal. Área: ${textNumber(laArea)} cm².`
        : laArea < 30 ? `Leve dilatación. Área: ${textNumber(laArea)} cm².`
          : laArea < 40 ? `Dilatación moderada. Área: ${textNumber(laArea)} cm².`
            : `Dilatación severa. Área: ${textNumber(laArea)} cm².`;
  const ra = !raArea ? 'Completar área de aurícula derecha.' : raArea <= 18 ? `Normal. Área: ${textNumber(raArea)} cm².` : `Dilatada. Área: ${textNumber(raArea)} cm².`;
  const mr = String(data.get('mr') || '').toLowerCase();
  const mitralBase = age && age > 80 ? 'Esclerocalcificación del anillo valvular, con apertura conservada.' : age && age > 60 ? 'De valvas finas, con ligera esclerosis del anillo valvular, apertura conservada.' : 'De valvas finas, con apertura conservada.';
  const mitralBidimensional = age && age > 80 ? 'Esclerocalcificación del anillo valvular, con apertura conservada.' : age && age > 60 ? 'De valvas finas, con ligera esclerosis del anillo valvular, apertura conservada y cierre a nivel del plano.' : 'De valvas finas, con apertura conservada y cierre valvular a nivel del plano.';
  const mitral = !isDoppler ? mitralBidimensional : !mr || mr === '-' || mr === 'no' ? `${mitralBase} Competente.` : mr === 'trivial' ? `${mitralBase} Insuficiencia trivial, protosistólica.` : `${mitralBase} Insuficiencia ${mr}.`;
  const tr = String(data.get('tr') || '').toLowerCase(); const gtt = number(data, 'trGradient');
  let tricuspid = data.get('doppler') === 'No' ? 'De valvas finas, con apertura conservada.' : !tr || tr === '-' || tr === 'no' ? 'Morfología conservada, sin insuficiencia.' : `Insuficiencia ${tr}.`;
  if (data.get('doppler') !== 'No' && gtt && c.psap) tricuspid = `Insuficiencia ${tr || 'tricuspídea'}, con GTT de ${textNumber(gtt)} mmHg. Presión sistólica de la arteria pulmonar estimada en ${textNumber(c.psap)} mmHg.`;
  else if (data.get('doppler') !== 'No' && ['leve', 'trivial'].includes(tr)) tricuspid = `Insuficiencia ${tr}, no permitió estimar la presión sistólica de la arteria pulmonar de manera confiable.`;
  const vmax = number(data, 'avVmax'); const gm = number(data, 'aorticMeanGradient'); const ar = String(data.get('ar') || '').toLowerCase();
  const aorticProsthesis = String(data.get('aorticProsthesis') || '').toLowerCase() === 'si';
  let aortic;
  if (aorticProsthesis && isDoppler) {
    aortic = `Prótesis valvular normoinserta, con velocidad y gradientes esperables para tipo de prótesis: Vel. máx: ${textNumber(vmax, 1) || '—'} m/seg, GM: ${textNumber(gm) || '—'} mmHg. Insuficiencia leve, habitual.`;
  } else if (aorticProsthesis) {
    aortic = 'Prótesis valvular aórtica normoinserta.';
  } else if (isDoppler && c.aorticStenosis) {
    const restriction = c.aorticStenosis === 'leve' ? 'apertura levemente restringida' : c.aorticStenosis === 'moderada' ? 'apertura restringida en grado moderado' : 'apertura severamente restringida';
    aortic = `Es tricúspide, con esclerocalcificación de sus valvas y ${restriction}. Vel max. ${textNumber(vmax, 1)} m/seg. GM ${textNumber(gm)} mmHg. GP ${textNumber(c.aorticPeakGradient)} mmHg.`;
    if (c.ava) aortic += ` Se estimó área por ecuación de continuidad en ${fmtUpTo(c.ava, 2)} cm² (TSVI ${textNumber(number(data, 'lvotDiam'))} cm).`;
    if (c.dimensionlessIndex) aortic += ` Cociente adimensional: ${fmtUpTo(c.dimensionlessIndex, 2)}.`;
  } else {
    aortic = !isDoppler && age && age > 80 ? 'Esclerosis de sus valvas, con apertura conservada.' : age && age > 60 ? 'Ligera esclerosis de sus valvas, con apertura conservada.' : 'Es trivalva, con apertura conservada.';
    if (isDoppler && vmax) aortic += ` Vel max. ${textNumber(vmax, 1)} m/seg.`;
  }
  if (isDoppler && !aorticProsthesis) aortic += !ar || ar === '-' || ar === 'no' ? ' Sin insuficiencia.' : ` Insuficiencia ${ar}.`;
  const root = number(data, 'aorticRoot'); const rootText = !root ? 'Completar diámetro de raíz aórtica.' : root < 37 ? 'Normal.' : `Dilatada. ${textNumber(root)} mm.`;
  return [
    ['VENTRÍCULO IZQUIERDO:', [left, motion, relaxation].filter(Boolean).join('\n')], ['VENTRÍCULO DERECHO:', right],
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
  const isDoppler = data.get('doppler') === 'Si';
  const geometry = leftVentricleGeometry(sex, mass, c.rwt);
  const conclusions = [];
  if (dd && ef && mass && geometry && dd <= 56 && ef >= 55) {
    if (geometry.remodeling) conclusions.push('Ventrículo izquierdo con remodelado concéntrico y función sistólica conservada.');
    else if (geometry.severity) {
      const hypertrophy = geometry.severity === 'leve'
        ? `leve hipertrofia ${geometry.pattern || 'de geometría a valorar'}`
        : `hipertrofia ${geometry.pattern || 'de geometría a valorar'} ${geometry.severity}`;
      conclusions.push(`Ventrículo izquierdo con ${hypertrophy} y función sistólica conservada.`);
    } else conclusions.push('Ventrículo izquierdo de dimensiones y función sistólica conservada.');
  } else if (dd || ef || mass) conclusions.push('Ventrículo izquierdo: completar valoración según medidas y función sistólica.');
  if (!isDoppler) {
    const laArea = number(data, 'laArea');
    const normalLaVolumeDespiteArea = laArea > 20 && c.laVolumeIndex != null && c.laVolumeIndex <= 34;
    if (laArea > 20 && !normalLaVolumeDespiteArea) {
      if (laArea < 30) conclusions.push('Aurícula izquierda levemente dilatada.');
      else if (laArea < 40) conclusions.push('Aurícula izquierda moderadamente dilatada.');
      else conclusions.push('Aurícula izquierda severamente dilatada.');
    }
  } else {
    if (c.eOverA != null && c.eOverA < 1) conclusions.push('Disfunción diastólica tipo 1.');
    const degrees = ['trivial', 'leve', 'moderada', 'severa'];
    const valveGrades = [data.get('mr'), data.get('tr'), data.get('ar')].map(x => String(x || '').trim().toLowerCase());
    const significantValve = valveGrades.some(x => x === 'moderada' || x === 'severa');
    const aorticProsthesis = String(data.get('aorticProsthesis') || '').toLowerCase() === 'si';
    if (aorticProsthesis) conclusions.push('Prótesis valvular aórtica normoinserta, normofuncionante.');
    else if (c.aorticStenosis) {
      conclusions.push(`Estenosis aórtica ${c.aorticStenosis}, esclerodegenerativa.`);
      if (valveGrades.filter(x => x === 'leve').length === 3) conclusions.push('Insuficiencias valvulares leves.');
    }
    else if (significantValve) conclusions.push('Valvulopatía a valorar según los hallazgos consignados.');
    else if (valveGrades.some(x => degrees.includes(x))) conclusions.push(valveGrades.filter(x => x === 'leve').length === 3 ? 'Insuficiencias valvulares leves.' : 'Sin valvulopatías significativas.');
    const psap = c.psap;
    if (psap != null) {
      if (psap < 36) conclusions.push('No se constató hipertensión pulmonar.');
      else if (psap < 50) conclusions.push('Hipertensión pulmonar leve.');
      else if (psap < 60) conclusions.push('Hipertensión pulmonar moderada.');
      else conclusions.push('Hipertensión pulmonar severa.');
    } else if (number(data, 'trGradient') == null && ['leve', 'trivial'].includes(String(data.get('tr') || '').toLowerCase())) conclusions.push('No se constató hipertensión pulmonar.');
  }
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
  const missingPatientData = [
    ['sex', 'sexo'], ['age', 'edad'], ['weight', 'peso'], ['height', 'altura']
  ].filter(([key]) => !String(data.get(key) || '').trim()).map(([, label]) => label);
  const dataCheck = el('#dataCheck');
  dataCheck.textContent = missingPatientData.length ? `Datos para revisar: ${missingPatientData.join(', ')}.` : '';
  dataCheck.hidden = !missingPatientData.length;
  const reportTitle = el('#reportTitle');
  if (reportTitle.dataset.dirty !== 'true') reportTitle.textContent = data.get('doppler') === 'Si' ? 'ECOCARDIOGRAMA DOPPLER 2D' : 'ECOCARDIOGRAMA BIDIMENSIONAL';
  el('#avaResult').textContent = c.ava ? `${fmtUpTo(c.ava, 2)} cm²` : '—';
  el('#dimensionlessResult').textContent = c.dimensionlessIndex ? fmtUpTo(c.dimensionlessIndex, 2) : '—';
  el('#laVolumeIndexResult').textContent = c.laVolumeIndex == null ? '—' : `${fmt(c.laVolumeIndex, 0)} ml/m²`;
  el('#wedgePressureResult').textContent = c.wedgePressure == null ? '—' : `${fmt(c.wedgePressure, 0)} mmHg`;
  const name = data.get('patientName') || 'Apellido y nombre: —';
  el('#reportPatient').textContent = name.startsWith('Apellido y nombre:') ? name : `Apellido y nombre: ${name}`;
  el('#reportDate').textContent = data.get('studyDate') ? new Date(`${data.get('studyDate')}T12:00:00`).toLocaleDateString('es-AR') : '';
  const val = (key, unit = '', decimals = 1) => reportValue(data, key, unit, decimals);
  const calculated = (num, unit = '', decimals = 1) => num == null ? '—' : `${fmt(num, decimals)}${unit ? ` ${unit}` : ''}`;
  const isDoppler = data.get('doppler') === 'Si';
  const dopplerValue = (key, unit = '', decimals = 1) => isDoppler ? val(key, unit, decimals) : '';
  const dopplerCalculated = (num, unit = '', decimals = 1) => isDoppler ? calculated(num, unit, decimals) : '';
  const relaxation = !isDoppler || c.eOverA == null ? '' : c.eOverA >= 1 ? 'Normal' : 'Prolongada';
  const pulmonaryHypertension = !isDoppler ? '' : c.psap == null || c.psap < 36 ? 'No' : 'Sí';
  el('#metrics').innerHTML = [
    measureHeading('M E D I D A S&nbsp;&nbsp; 2 D', c.asc ? `ASC: ${fmt(c.asc, 0)} m²` : ''),
    '<div class="measure-subhead">CAVIDADES IZQUIERDAS:</div>',
    measureRow('Diámetro interno de VI en diástole:', val('lvDd','mm',0), '[&lt;55 mm]', 'Diámetro interno en sístole:', val('lvDs','mm',0), ''),
    measureRow('Fracción de acortamiento:', calculated(c.shortening,'%',0), '[&gt;28%]', 'Fracción de eyección:', val('lvef','%',0), '[&gt;55%]'),
    measureRow('Septum interventricular en diástole:', val('ivsd','mm',0), '[&lt;12 mm]', 'Pared posterior en diástole:', val('pwd','mm',0), '[&lt;12 mm]'),
    measureRow('Índice de masa ventricular:', calculated(c.mass,'g/m²',0), '[♂≤115 / ♀≤95 g/m²]', 'Espesor parietal relativo:', calculated(c.rwt,'',2), '[≤0,42]'),
    measureRow('Diám. de aurícula izq.:', val('la','mm',0), '[&lt;40 mm]', 'Área de aurícula izquierda:', val('laArea','cm²',0), '[&lt;20 cm²]'),
    measureRow('Ap. Valv Aórtica:', val('apAo','mm',0), '', 'Diámetro de raíz de aorta:', val('aorticRoot','mm',0), '[&lt;36 mm]'),
    '<div class="measure-subhead">VENTRÍCULO DERECHO:</div>',
    measureRow('Diámetro diastólico basal:', val('rv','mm',0), '[&lt;40 mm]', 'TAPSE:', val('tapse','mm',0), '[&gt;17 mm]'),
    measureRow('Vena cava inferior:', val('ivc','mm',0), '[&lt;22 mm]', '', '', ''),
    `<div class="doppler-block ${isDoppler ? '' : 'is-disabled'}">`,
    measureHeading('V A L O R A C I Ó N&nbsp;&nbsp; D O P P L E R'),
    measureRow('Velocidad E:', dopplerValue('eWave','m/s',1), '', 'Velocidad A:', dopplerValue('aWave','m/s',1), ''),
    measureRow("Relación E/E' septal:", dopplerValue('ePrime','',0), '[&lt;15]', 'Patrón de relajación:', isDoppler ? editableMetric('relaxation', relaxation) : '', ''),
    measureRow('Insuficiencia mitral:', dopplerValue('mr'), '', 'Insuficiencia tricuspídea:', dopplerValue('tr'), ''),
    measureRow('Gradiente transtricuspídeo:', dopplerValue('trGradient','mmHg',0), '', 'PAD estimada:', dopplerValue('rap','mmHg',0), ''),
    measureRow('PSAP estimada:', dopplerCalculated(c.psap,'mmHg',0), '[&lt;36 mmHg]', 'Hipertensión pulmonar:', isDoppler ? editableMetric('pulmonaryHypertension', pulmonaryHypertension) : '', ''),
    measureRow('Velocidad flujo aórtico:', dopplerValue('avVmax','m/s',1), '[&lt;2 m/seg]', 'Gradiente pico aórtico:', dopplerCalculated(c.aorticPeakGradient,'mmHg',0), '[&lt;13 mmHg]'),
    measureRow('Gradiente medio aórtico:', dopplerValue('aorticMeanGradient','mmHg',0), '', 'Insuficiencia aórtica:', dopplerValue('ar'), ''),
    '</div>'
  ].join('');
  el('#metrics').querySelectorAll('.inline-edit').forEach(node => node.addEventListener('input', () => { manualMetricEdits[node.dataset.field] = node.textContent.trim(); }));
  renderDescriptions(data, c);
  const lv = number(data,'lvef');
  renderConclusions(data, c);
}
form.addEventListener('input', render); form.addEventListener('change', render);
form.addEventListener('keydown', event => {
  if (event.key !== 'Enter' || event.target.matches('textarea, button')) return;
  const fields = Array.from(form.querySelectorAll('input:not([type="hidden"]), select, textarea'))
    .filter(field => !field.disabled && field.offsetParent !== null);
  const currentIndex = fields.indexOf(event.target);
  if (currentIndex < 0 || currentIndex === fields.length - 1) return;
  event.preventDefault();
  fields[currentIndex + 1].focus();
});
el('#reportTitle').addEventListener('input', () => { el('#reportTitle').dataset.dirty = 'true'; });
el('#description').addEventListener('input', () => { el('#description').dataset.dirty = 'true'; });
el('#regenerateButton').addEventListener('click', () => { renderDescriptions(new FormData(form), calculate(new FormData(form)), true); });
el('#conclusions').addEventListener('input', () => { el('#conclusions').dataset.dirty = 'true'; });
el('#regenerateConclusionsButton').addEventListener('click', () => { renderConclusions(new FormData(form), calculate(new FormData(form)), true); });
el('#clearButton').addEventListener('click', () => {
  const studyDate = form.elements.studyDate.value;
  form.reset();
  form.elements.studyDate.value = studyDate;
  Object.keys(manualMetricEdits).forEach(key => delete manualMetricEdits[key]);
  el('#reportTitle').dataset.dirty = 'false';
  el('#reportTitle').textContent = form.elements.doppler.value === 'Si' ? 'ECOCARDIOGRAMA DOPPLER 2D' : 'ECOCARDIOGRAMA BIDIMENSIONAL';
  el('#description').dataset.dirty = 'false';
  el('#conclusions').dataset.dirty = 'false';
  el('#description').textContent = '';
  el('#conclusions').textContent = '';
  render();
});
el('#printButton').addEventListener('click', () => window.print());

function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(offset, offset + chunkSize));
  }
  return window.btoa(binary);
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result), { once: true });
    reader.addEventListener('error', () => reject(reader.error || new Error('No se pudo leer la imagen')), { once: true });
    reader.readAsDataURL(blob);
  });
}

function base64ToRtfHex(base64) {
  const binary = window.atob(base64);
  const lines = [];
  let line = '';
  for (let index = 0; index < binary.length; index += 1) {
    line += binary.charCodeAt(index).toString(16).padStart(2, '0');
    if (line.length >= 128) {
      lines.push(line);
      line = '';
    }
  }
  if (line) lines.push(line);
  return lines.join('\n');
}

async function imageElementDataUrl(image) {
  try {
    const response = await fetch(image.currentSrc || image.src);
    if (!response.ok) throw new Error('No se pudo cargar la imagen');
    return await blobToDataUrl(await response.blob());
  } catch (error) {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    canvas.getContext('2d').drawImage(image, 0, 0);
    return canvas.toDataURL('image/png');
  }
}

async function configurePdfFonts(pdf) {
  try {
    const [regularResponse, boldResponse] = await Promise.all([
      fetch('assets/fonts/Carlito-Regular.ttf'),
      fetch('assets/fonts/Carlito-Bold.ttf')
    ]);
    if (!regularResponse.ok || !boldResponse.ok) throw new Error('No se pudieron cargar las fuentes');
    pdf.addFileToVFS('Carlito-Regular.ttf', bufferToBase64(await regularResponse.arrayBuffer()));
    pdf.addFileToVFS('Carlito-Bold.ttf', bufferToBase64(await boldResponse.arrayBuffer()));
    pdf.addFont('Carlito-Regular.ttf', 'Carlito', 'normal');
    pdf.addFont('Carlito-Bold.ttf', 'Carlito', 'bold');
    return 'Carlito';
  } catch (error) {
    console.warn('Se usará una fuente PDF compatible.', error);
    return 'helvetica';
  }
}

async function generateSelectablePdf() {
  if (!window.jspdf?.jsPDF) throw new Error('No se cargó el generador de PDF');
  const pdf = new window.jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const fontFamily = await configurePdfFonts(pdf);
  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 12;
  const topMargin = 9;
  const bottomMargin = 10;
  const contentWidth = pageWidth - (marginX * 2);
  const dark = [24, 48, 66];
  const muted = [103, 113, 120];
  const faded = [192, 201, 205];
  const accent = [22, 133, 143];
  const paleAccent = [231, 242, 243];
  let y = topMargin;

  const useFont = (style = 'normal', size = 9, color = dark) => {
    pdf.setFont(fontFamily, style);
    pdf.setFontSize(size);
    pdf.setTextColor(...color);
  };
  const newPage = () => {
    pdf.addPage();
    y = topMargin;
  };
  const pageBreakIfNeeded = (height) => {
    if (y + height <= pageHeight - bottomMargin) return false;
    newPage();
    return true;
  };
  const wrapText = (text, width, size = 9, style = 'normal') => {
    useFont(style, size);
    const sourceLines = String(text || '').split('\n');
    const lines = [];
    sourceLines.forEach(line => {
      const wrapped = pdf.splitTextToSize(line || ' ', width);
      lines.push(...wrapped);
    });
    return lines.length ? lines : [''];
  };
  const pdfBandTitle = (title) => {
    const compactTitle = String(title || '').replace(/\s+/g, '').toUpperCase();
    if (compactTitle === 'MEDIDAS2D') return 'M E D I D A S     2 D';
    if (compactTitle === 'VALORACIÓNDOPPLER') return 'V A L O R A C I Ó N     D O P P L E R';
    return String(title || '').replace(/\s+/g, ' ').trim();
  };
  const addBand = (title, rightText = '') => {
    pageBreakIfNeeded(7);
    pdf.setFillColor(...paleAccent);
    pdf.rect(marginX, y, contentWidth, 5.5, 'F');
    pdf.setDrawColor(...accent);
    pdf.setLineWidth(0.8);
    pdf.line(marginX, y, marginX, y + 5.5);
    useFont('bold', 9, dark);
    pdf.text(pdfBandTitle(title), pageWidth / 2, y + 3.9, { align: 'center' });
    if (rightText) {
      useFont('normal', 6.5, muted);
      pdf.text(String(rightText).replace(/\s+/g, ' ').trim(), pageWidth - marginX - 2, y + 3.8, { align: 'right' });
    }
    y += 7;
  };

  const banner = document.querySelector('.institutional-banner');
  if (banner) {
    const bannerData = await imageElementDataUrl(banner);
    const bannerHeight = Math.min(20, contentWidth * (banner.naturalHeight / banner.naturalWidth));
    pdf.addImage(bannerData, 'PNG', marginX, y, contentWidth, bannerHeight, undefined, 'FAST');
    y += bannerHeight + 4;
  }

  useFont('bold', 8, accent);
  pdf.text('INFORME', marginX, y);
  y += 5;
  useFont('bold', 16.5, dark);
  pdf.text(el('#reportTitle').textContent.trim(), marginX, y);
  y += 2.5;
  pdf.setDrawColor(...accent);
  pdf.setLineWidth(0.5);
  pdf.line(marginX, y, pageWidth - marginX, y);
  y += 5;
  useFont('bold', 11.2, dark);
  pdf.text(el('#reportPatient').textContent.trim(), marginX, y);
  y += 4.8;
  useFont('normal', 11.2, dark);
  pdf.text(el('#reportDate').textContent.trim(), marginX, y);
  y += 6;

  const metricNodes = Array.from(el('#metrics').querySelectorAll('.measure-heading, .measure-subhead, .measure-row'));
  metricNodes.forEach(node => {
    const disabledDoppler = Boolean(node.closest('.doppler-block.is-disabled'));
    if (node.classList.contains('measure-heading')) {
      addBand(node.querySelector('strong')?.textContent || node.textContent, node.querySelector('em')?.textContent || '');
      return;
    }
    if (node.classList.contains('measure-subhead')) {
      pageBreakIfNeeded(5);
      useFont('bold', 8.5, disabledDoppler ? faded : dark);
      pdf.text(node.textContent.trim(), marginX, y + 2.8);
      y += 5;
      return;
    }
    pageBreakIfNeeded(4.5);
    const cells = Array.from(node.children).map(cell => cell.textContent.trim());
    const rowColor = disabledDoppler ? faded : dark;
    const refColor = disabledDoppler ? faded : muted;
    useFont('normal', 8.7, rowColor);
    pdf.text(cells[0] || '', 62, y + 2.8, { align: 'right' });
    useFont('bold', 8.7, rowColor);
    pdf.text(cells[1] || '', 65, y + 2.8);
    useFont('normal', 6.2, refColor);
    pdf.text(cells[2] || '', 82, y + 2.7);
    useFont('normal', 8.7, rowColor);
    pdf.text(cells[3] || '', 151, y + 2.8, { align: 'right' });
    useFont('bold', 8.7, rowColor);
    pdf.text(cells[4] || '', 154, y + 2.8);
    useFont('normal', 6.2, refColor);
    pdf.text(cells[5] || '', 174, y + 2.7);
    y += 4.3;
  });

  y += 2;
  addBand('D E S C R I P C I Ó N');
  const descriptionRows = Array.from(el('#description').querySelectorAll('.description-row'));
  descriptionRows.forEach(row => {
    const label = row.querySelector('.description-label')?.textContent.trim() || '';
    const text = row.querySelector('.description-text')?.textContent.trim() || '';
    const labelLines = wrapText(label, 43, 9, 'bold');
    const textLines = wrapText(text, 133, 9, 'normal');
    const rowHeight = Math.max(labelLines.length, textLines.length) * 4.15 + 0.7;
    if (pageBreakIfNeeded(rowHeight)) addBand('D E S C R I P C I Ó N');
    useFont('bold', 9, dark);
    pdf.text(labelLines, 57, y + 3.1, { align: 'right', lineHeightFactor: 1.3 });
    useFont('normal', 9, dark);
    pdf.text(textLines, 61, y + 3.1, { lineHeightFactor: 1.3 });
    y += rowHeight;
  });

  y += 2;
  addBand('C O N C L U S I O N E S');
  const conclusionRows = Array.from(el('#conclusions').querySelectorAll('.conclusion-text'));
  conclusionRows.forEach(row => {
    const lines = wrapText(row.textContent.trim(), contentWidth - 8, 9, 'normal');
    const rowHeight = lines.length * 4.3 + 0.5;
    if (pageBreakIfNeeded(rowHeight)) addBand('C O N C L U S I O N E S');
    useFont('normal', 9, dark);
    pdf.text(lines, marginX + 4, y + 3.1, { lineHeightFactor: 1.35 });
    y += rowHeight;
  });

  const signature = document.querySelector('.signature img');
  if (signature) {
    pageBreakIfNeeded(29);
    const signatureData = await imageElementDataUrl(signature);
    const signatureHeight = 25;
    const signatureWidth = signatureHeight * (signature.naturalWidth / signature.naturalHeight);
    pdf.addImage(signatureData, 'PNG', 153, y + 2, signatureWidth, signatureHeight, undefined, 'FAST');
  }
  return pdf;
}

el('#pdfButton').addEventListener('click', async () => {
  const button = el('#pdfButton');
  const originalLabel = button.textContent;
  try {
    button.disabled = true;
    button.textContent = 'Generando PDF…';
    const pdf = await generateSelectablePdf();
    pdf.save(`${patientFileName(new FormData(form))}.pdf`);
  } catch (error) {
    console.error(error);
    window.alert('No se pudo generar el PDF. Probá recargar la página e intentarlo nuevamente.');
  } finally {
    button.disabled = false;
    button.textContent = originalLabel;
  }
});

function plainReportText() {
  const data = new FormData(form);
  const c = calculate(data);
  const isDoppler = data.get('doppler') === 'Si';
  const plainInput = (key, unit = '', decimals = 1) => {
    const n = number(data, key);
    if (n != null) return `${fmt(n, decimals)}${unit ? ` ${unit}` : ''}`;
    const raw = String(data.get(key) || '').trim();
    return raw && raw !== '—' ? raw : '-';
  };
  const plainCalculated = (n, unit = '', decimals = 1) => n == null ? '-' : `${fmt(n, decimals)}${unit ? ` ${unit}` : ''}`;
  const plainDopplerInput = (key, unit = '', decimals = 1) => isDoppler ? plainInput(key, unit, decimals) : '-';
  const plainDopplerCalculated = (n, unit = '', decimals = 1) => isDoppler ? plainCalculated(n, unit, decimals) : '-';
  const manual = (field, automatic) => String(manualMetricEdits[field] ?? automatic ?? '-').trim() || '-';
  const relaxation = isDoppler ? manual('relaxation', c.eOverA == null ? '-' : c.eOverA >= 1 ? 'Normal' : 'Prolongada') : '-';
  const pulmonaryHypertension = isDoppler ? manual('pulmonaryHypertension', c.psap == null || c.psap < 36 ? 'No' : 'Sí') : '-';
  const paired = (leftLabel, leftValue, rightLabel = '', rightValue = '') => `${leftLabel}\t${leftValue}\t\t${rightLabel}${rightLabel ? '\t' + rightValue : ''}`;
  const tripled = (leftLabel, leftValue, middleLabel, middleValue, rightLabel, rightValue) => `${leftLabel}\t${leftValue}\t\t${middleLabel}\t${middleValue}\t\t${rightLabel}\t${rightValue}`;
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
  const compactConclusions = [
    conclusionLines[0],
    conclusionLines.slice(1, 3).join(' '),
    conclusionLines.slice(3).join(' ')
  ].filter(Boolean);
  return `\n\n${[
    'MEDIDAS 2D:',
    paired('Diám. interno en diástole:', plainInput('lvDd', 'mm', 0), 'Diám. interno en sístole:', plainInput('lvDs', 'mm', 0)),
    paired('Fracción de acortamiento:', plainCalculated(c.shortening, '%', 0), 'Fracción de eyección:', plainInput('lvef', '%', 0)),
    paired('SIV en diástole:', plainInput('ivsd', 'mm', 1), 'PP en diástole:', plainInput('pwd', 'mm', 0)),
    paired('Índice de masa ventricular:', plainCalculated(c.mass, 'g/m²', 0), 'EPR:', plainCalculated(c.rwt, '', 2)),
    paired('Diám. de aurícula izq.:', plainInput('la', 'mm', 0), 'Área de aurícula izq.:', plainInput('laArea', 'cm²', 0)),
    paired('Ap. Valv Aórtica:', plainInput('apAo', 'mm', 0), 'Diám. de raíz de aorta:', plainInput('aorticRoot', 'mm', 0)),
    tripled('Diámetro diastólico VD:', plainInput('rv', 'mm', 0), 'TAPSE:', plainInput('tapse', 'mm', 0), 'Vena cava inferior:', plainInput('ivc', 'mm', 0)),
    '', 'VALORACIÓN DOPPLER:',
    paired('Velocidad E:', plainDopplerInput('eWave', 'm/s', 1), 'Velocidad A:', plainDopplerInput('aWave', 'm/s', 1)),
    paired("Relacion E/e' septal:", plainDopplerInput('ePrime', '', 0), 'Patrón de relajación:', relaxation),
    paired('Insuficiencia mitral:', plainDopplerInput('mr'), 'Insuficiencia tricuspídea:', plainDopplerInput('tr')),
    paired('GTT:', plainDopplerInput('trGradient', 'mmHg', 0), 'PAD estimada:', plainDopplerInput('rap', 'mmHg', 0)),
    paired('PSAP estimada:', plainDopplerCalculated(c.psap, 'mmHg', 0), 'Hipertensión pulmonar:', pulmonaryHypertension),
    paired('Velocidad flujo aórtico:', plainDopplerInput('avVmax', 'm/s', 1), 'Gradiente pico aórtico:', plainDopplerCalculated(c.aorticPeakGradient, 'mmHg', 0)),
    paired('Gradiente medio aórtico:', plainDopplerInput('aorticMeanGradient', 'mmHg', 0), 'Insuficiencia aórtica:', plainDopplerInput('ar')),
    '', 'DESCRIPCIÓN:',
    ...descriptionLines.map(item => `${item.label}\t${item.text}`),
    '', 'CONCLUSIONES:',
    ...compactConclusions,
    '', '', '\t\tDr. RODRIGUEZ CLAUS, ELISEO', '\t\tEsp. en Cardiología - MP 118.231'
  ].join('\n')}`;
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
function wordTableFromReport() {
  const metrics = Array.from(el('#metrics').querySelectorAll('.measure-heading, .measure-subhead, .measure-row')).map(node => {
    if (node.classList.contains('measure-heading')) return `<tr class="word-band"><td colspan="6">${node.textContent.trim().replace(/\s+/g, ' ')}</td></tr>`;
    if (node.classList.contains('measure-subhead')) return `<tr class="word-subhead"><td colspan="6">${escapeHtml(node.textContent.trim())}</td></tr>`;
    return `<tr>${Array.from(node.children).map((cell, index) => `<td class="${index % 3 === 0 ? 'word-label' : index % 3 === 1 ? 'word-value' : 'word-ref'}">${escapeHtml(cell.textContent.trim())}</td>`).join('')}</tr>`;
  }).join('');
  const descriptions = Array.from(el('#description').querySelectorAll('.description-row')).map(row => {
    const label = row.querySelector('.description-label')?.textContent.trim() || '';
    const text = row.querySelector('.description-text')?.textContent.trim() || '';
    return `<tr><td class="word-description-label">${escapeHtml(label)}</td><td>${escapeHtml(text)}</td></tr>`;
  }).join('');
  const conclusions = Array.from(el('#conclusions').querySelectorAll('.conclusion-text')).map(row => `<tr><td>${escapeHtml(row.textContent.trim())}</td></tr>`).join('');
  const title = escapeHtml(el('#reportTitle').textContent.trim());
  const patient = escapeHtml(el('#reportPatient').textContent.trim());
  const date = escapeHtml(el('#reportDate').textContent.trim());
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page Section1{size:595.3pt 841.9pt;margin:18pt 20pt 16pt}div.Section1{page:Section1}
    body{margin:0;color:#183042;font-family:Arial,sans-serif;font-size:7.4pt;line-height:1.08}.banner{width:100%;height:37pt;object-fit:contain;object-position:left center;margin:0 0 7pt}.eyebrow{font-size:6.5pt;font-weight:bold;letter-spacing:1pt;color:#087a83;margin:0}.title{font-size:15pt;font-weight:bold;margin:1pt 0 4pt}.patient{font-size:8.5pt;font-weight:bold;margin:0}.date{font-size:8pt;margin:1pt 0 5pt}.rule{border-top:1.4pt solid #087a83;margin:0 0 5pt}.section{width:100%;border-collapse:collapse;margin:0 0 5pt;table-layout:fixed}.section td{padding:1.25pt 1.5pt;vertical-align:top}.word-band td{background:#e7f2f3;text-align:center;font-size:8.5pt;font-weight:bold;letter-spacing:1.5pt;padding:3pt}.word-subhead td{font-size:8pt;font-weight:bold;padding-top:4pt}.word-label{text-align:right;width:28%;white-space:nowrap}.word-value{width:10%;font-weight:bold;white-space:nowrap}.word-ref{width:12%;font-size:5.8pt;color:#697178;white-space:nowrap}.word-description-label{width:25%;text-align:right;font-weight:bold;white-space:nowrap}.description td{padding:1.4pt 2pt}.conclusions td{padding:1.4pt 2pt}.signature{display:block;margin:5pt 20pt 0 auto;width:105pt;max-height:65pt;object-fit:contain}
  </style></head><body><div class="Section1"><img class="banner" src="https://calculadoradeinfusiones.com.ar/informe/assets/institutional-banner.png"><p class="eyebrow">INFORME</p><p class="title">${title}</p><p class="patient">${patient}</p><p class="date">${date}</p><div class="rule"></div><table class="section">${metrics}</table><table class="section description"><tr class="word-band"><td colspan="2">DESCRIPCIÓN</td></tr>${descriptions}</table><table class="section conclusions"><tr class="word-band"><td>CONCLUSIONES</td></tr>${conclusions}</table><img class="signature" src="https://calculadoradeinfusiones.com.ar/informe/assets/signature.png"></div></body></html>`;
}

el('#wordButton').addEventListener('click', async () => {
  const button = el('#wordButton');
  const originalLabel = button.textContent;
  let hiddenNotice;
  let hiddenNoPrint = [];
  try {
    button.disabled = true;
    button.textContent = 'Generando Word…';
    if (!window.html2canvas) throw new Error('No se cargó el generador de imagen');
    const report = el('#report');
    await Promise.all(Array.from(report.querySelectorAll('img')).map(image => image.complete ? Promise.resolve() : new Promise(resolve => {
      image.addEventListener('load', resolve, { once: true });
      image.addEventListener('error', resolve, { once: true });
    })));
    if (document.fonts?.ready) await document.fonts.ready;
    hiddenNotice = report.querySelector('.notice');
    if (hiddenNotice) hiddenNotice.style.display = 'none';
    hiddenNoPrint = Array.from(report.querySelectorAll('.no-print')).map(node => ({ node, display: node.style.display }));
    hiddenNoPrint.forEach(({ node }) => { node.style.display = 'none'; });
    const canvas = await window.html2canvas(report, { backgroundColor: '#ffffff', scale: 2, useCORS: true, logging: false, imageTimeout: 15000 });
    const imageBase64 = canvas.toDataURL('image/png').split(',')[1];
    const imageHex = base64ToRtfHex(imageBase64);
    const pageWidthTwips = 11907;
    const pageHeightTwips = 16840;
    const imageScale = Math.min(pageWidthTwips / canvas.width, pageHeightTwips / canvas.height);
    const imageWidthTwips = Math.round(canvas.width * imageScale);
    const imageHeightTwips = Math.round(canvas.height * imageScale);
    const wordDocument = [
      '{\\rtf1\\ansi\\deff0\\viewkind4\\uc1',
      `\\paperw${pageWidthTwips}\\paperh${pageHeightTwips}\\margl0\\margr0\\margt0\\margb0`,
      '\\pard\\qc\\sb0\\sa0',
      `{\\pict\\pngblip\\picw${canvas.width}\\pich${canvas.height}\\picwgoal${imageWidthTwips}\\pichgoal${imageHeightTwips}`,
      imageHex,
      '}\\par',
      '}'
    ].join('\n');
    const blob = new Blob([wordDocument], { type: 'application/rtf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${patientFileName(new FormData(form))}.doc`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1500);
  } catch (error) {
    console.error(error);
    const localFile = window.location.protocol === 'file:';
    const detail = String(error?.message || error?.name || 'motivo no informado').replace(/\s+/g, ' ').slice(0, 220);
    window.alert(localFile
      ? `El Word visual debe generarse desde la versión publicada. Abrí https://calculadoradeinfusiones.com.ar/informe/ y probá nuevamente. Detalle: ${detail}`
      : `No se pudo generar la imagen visual del informe. No se descargó el Word alternativo para evitar un documento descompaginado. Detalle: ${detail}`);
  } finally {
    if (hiddenNotice) hiddenNotice.style.display = '';
    hiddenNoPrint.forEach(({ node, display }) => { node.style.display = display; });
    button.disabled = false;
    button.textContent = originalLabel;
  }
});
form.elements.studyDate.value = new Date().toISOString().slice(0,10);
render();
