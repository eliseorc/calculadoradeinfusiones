const edvcForm = document.querySelector('#edvcForm');
const edvcDescriptionState = { dirty: false };
const edvcConclusionState = { dirty: false };
const edvcTechniqueState = { dirty: false };

function edvcNumber(data, key) {
  const raw = String(data.get(key) || '').trim().replace(',', '.');
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function edvcFormat(value, decimals = 0) {
  return value == null || !Number.isFinite(value)
    ? '—'
    : value.toLocaleString('es-AR', { maximumFractionDigits: decimals, minimumFractionDigits: 0 });
}

function edvcPatientFileName(data) {
  const cleanName = String(data.get('patientName') || '')
    .normalize('NFC')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleanName ? `${cleanName} VC` : 'Informe EDVC VC';
}

function setActiveStudy(study) {
  const isEco = study === 'eco';
  document.querySelectorAll('.eco-only').forEach(node => { node.hidden = !isEco; });
  document.querySelectorAll('.edvc-only').forEach(node => { node.hidden = isEco; });
  document.querySelectorAll('[data-study-tab]').forEach(button => {
    const active = button.dataset.studyTab === study;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-selected', String(active));
  });
  document.body.dataset.activeStudy = study;
}

document.querySelectorAll('[data-study-tab]').forEach(button => {
  button.addEventListener('click', () => setActiveStudy(button.dataset.studyTab));
});

function edvcRatio(data, side) {
  const cca = edvcNumber(data, `${side}CcaPsv`);
  const ica = edvcNumber(data, `${side}IcaPsv`);
  return cca && ica ? ica / cca : null;
}

function edvcIacSuggestion(data, side) {
  const finding = data.get(`${side}Finding`);
  if (finding === 'occlusion') return 'Oclusión: confirmar ausencia de flujo';
  if (finding === 'near-occlusion') return 'Casi oclusión: integrar imagen y flujo';
  const psv = edvcNumber(data, `${side}IcaPsv`);
  const edv = edvcNumber(data, `${side}IcaEdv`);
  const ratio = edvcRatio(data, side);
  if (!psv) return 'Completar velocidades';
  if (psv > 230 && ((edv != null && edv > 100) || (ratio != null && ratio > 4))) return 'Compatible con estenosis ≥70%';
  if (psv > 230) return 'VPS compatible con ≥70%; faltan parámetros concordantes';
  if (psv >= 180 && psv <= 230) return 'Compatible con estenosis 50–69%';
  if (psv >= 125 && ratio != null && ratio >= 2) return 'Compatible con 50–69% si existe placa significativa';
  if (psv < 180 && (ratio == null || ratio < 2) && (edv == null || edv < 40)) return 'Normal o <50% según imagen';
  return 'Parámetros discordantes: revisar manualmente';
}

function edvcPlaqueType(value) {
  return {
    fibrosa: 'fibrosa',
    fibrocalcica: 'fibrocálcica',
    calcificada: 'calcificada',
    heterogenea: 'heterogénea'
  }[value] || 'ateromatosa';
}

function edvcVertebralText(value) {
  return {
    anterograde: 'Flujo anterógrado, de características conservadas.',
    alternating: 'Flujo alternante.',
    retrograde: 'Flujo retrógrado.',
    'not-seen': 'No se logró identificar señal de flujo.'
  }[value] || 'Completar valoración del flujo vertebral.';
}

function edvcVelocitySentence(data, side) {
  const cca = edvcNumber(data, `${side}CcaPsv`);
  const ica = edvcNumber(data, `${side}IcaPsv`);
  const edv = edvcNumber(data, `${side}IcaEdv`);
  const ratio = edvcRatio(data, side);
  const parts = [];
  if (ica) parts.push(`VPS ACI: ${edvcFormat(ica)} cm/s`);
  if (edv) parts.push(`VPD ACI: ${edvcFormat(edv)} cm/s`);
  if (cca) parts.push(`VPS ACC: ${edvcFormat(cca)} cm/s`);
  if (ratio) parts.push(`cociente ACI/ACC: ${edvcFormat(ratio, 2)}`);
  return parts.length ? ` ${parts.join(', ')}.` : '';
}

function edvcRegionDescription(data, side) {
  const finding = data.get(`${side}Finding`) || 'normal';
  const imt = edvcNumber(data, `${side}Imt`);
  const location = data.get(`${side}PlaqueLocation`) || 'bulb-ica';
  const plaqueType = edvcPlaqueType(data.get(`${side}PlaqueType`));
  const vertebral = edvcVertebralText(data.get(`${side}Vertebral`));
  const normal = {
    common: imt
      ? `Sin engrosamientos parietales ni placas. Patrón de flujo conservado. EMI: ${edvcFormat(imt, 2)} mm.`
      : 'Sin engrosamientos parietales ni placas. Patrón de flujo conservado.',
    bulb: 'Sin placas ateromatosas ni estenosis. Patrón de flujo conservado.',
    external: 'Sin lesión. Patrón de flujo conservado.'
  };
  if (finding === 'normal') return { ...normal, vertebral };
  if (finding === 'imt') {
    return {
      common: `Engrosamiento mediointimal difuso${imt ? `, con EMI máximo de ${edvcFormat(imt, 2)} mm` : ''}. Patrón de flujo conservado.`,
      bulb: 'Sin placas focales ni estenosis. Patrón de flujo conservado.',
      external: normal.external,
      vertebral
    };
  }

  const plaqueText = `Placa ${plaqueType} que condiciona reducción luminal del 10–20%. Patrón de flujo conservado.`;
  if (finding === 'plaque-lt50') {
    return {
      common: ['cca', 'multiple'].includes(location) ? plaqueText : 'Ateromatosis parietal sin estenosis. Patrón de flujo conservado.',
      bulb: ['bulb-ica', 'multiple'].includes(location) ? plaqueText : normal.bulb,
      external: 'Ateromatosis parietal sin estenosis significativa. Patrón de flujo conservado.',
      vertebral
    };
  }

  const velocityText = edvcVelocitySentence(data, side);
  let bulb;
  if (finding === 'stenosis-50-69') bulb = `Placa ${plaqueType} en bulbo y origen de la ACI, con criterios compatibles con estenosis del 50–69%.${velocityText}`;
  else if (finding === 'stenosis-ge70') bulb = `Placa ${plaqueType} en bulbo y origen de la ACI, con criterios compatibles con estenosis ≥70%.${velocityText}`;
  else if (finding === 'near-occlusion') bulb = `Placa ${plaqueType} con marcada reducción luminal y patrón compatible con casi oclusión de la ACI.${velocityText}`;
  else bulb = 'Oclusión de la ACI, sin señal de flujo detectable.';
  return {
    common: 'Ateromatosis parietal. Patrón de flujo conservado.',
    bulb,
    external: 'Ateromatosis parietal sin estenosis significativa. Patrón de flujo conservado.',
    vertebral
  };
}

function edvcRegionHeading(text) {
  return `<div class="edvc-region-heading">${escapeHtml(text)}</div>`;
}

function edvcReportRow(label, text) {
  return `<div class="edvc-report-row"><div class="edvc-report-label">${escapeHtml(label)}</div><div class="edvc-report-text editable" contenteditable="true">${escapeHtml(text)}</div></div>`;
}

function edvcRenderDescriptions(data, force = false) {
  if (edvcDescriptionState.dirty && !force) return;
  const left = edvcRegionDescription(data, 'left');
  const right = edvcRegionDescription(data, 'right');
  document.querySelector('#edvcDescriptions').innerHTML = [
    '<div class="edvc-report-region">',
    edvcRegionHeading('R E G I Ó N\u00A0\u00A0\u00A0I Z Q U I E R D A'),
    edvcReportRow('CARÓTIDA COMÚN:', left.common),
    edvcReportRow('BULBO Y CARÓTIDA INTERNA:', left.bulb),
    edvcReportRow('CARÓTIDA EXTERNA:', left.external),
    edvcReportRow('VERTEBRAL:', left.vertebral),
    '</div>',
    '<div class="edvc-report-region">',
    edvcRegionHeading('R E G I Ó N\u00A0\u00A0\u00A0D E R E C H A'),
    edvcReportRow('CARÓTIDA COMÚN:', right.common),
    edvcReportRow('BULBO Y CARÓTIDA INTERNA:', right.bulb),
    edvcReportRow('CARÓTIDA EXTERNA:', right.external),
    edvcReportRow('VERTEBRAL:', right.vertebral),
    '</div>'
  ].join('');
  edvcDescriptionState.dirty = false;
}

function edvcAutomaticConclusions(data) {
  const findings = {
    left: data.get('leftFinding') || 'normal',
    right: data.get('rightFinding') || 'normal'
  };
  const lines = [];
  const vertebralNormal = data.get('leftVertebral') === 'anterograde' && data.get('rightVertebral') === 'anterograde';
  if (findings.left === 'normal' && findings.right === 'normal' && vertebralNormal) {
    lines.push('Estudio carotídeo dentro de límites normales.');
  } else {
    const imtSides = Object.keys(findings).filter(side => findings[side] === 'imt');
    const plaqueSides = Object.keys(findings).filter(side => findings[side] === 'plaque-lt50');
    if (imtSides.length) {
      const imtLocation = imtSides.length === 2 ? 'bilateral' : `del lado ${imtSides[0] === 'left' ? 'izquierdo' : 'derecho'}`;
      lines.push(`Engrosamiento mediointimal difuso ${imtLocation}.`);
    }
    if (plaqueSides.length === 2) lines.push('Leve ateromatosis bilateral.');
    else if (plaqueSides.length === 1) lines.push(`Leve ateromatosis carotídea ${plaqueSides[0] === 'left' ? 'izquierda' : 'derecha'}.`);
    Object.entries(findings).forEach(([side, finding]) => {
      const sideText = side === 'left' ? 'izquierda' : 'derecha';
      if (finding === 'stenosis-50-69') lines.push(`Estenosis de la arteria carótida interna ${sideText} del 50–69%.`);
      if (finding === 'stenosis-ge70') lines.push(`Estenosis de la arteria carótida interna ${sideText} ≥70%.`);
      if (finding === 'near-occlusion') lines.push(`Casi oclusión de la arteria carótida interna ${sideText}.`);
      if (finding === 'occlusion') lines.push(`Oclusión de la arteria carótida interna ${sideText}.`);
    });
    const hasSignificantStenosis = Object.values(findings).some(value => ['stenosis-50-69', 'stenosis-ge70', 'near-occlusion', 'occlusion'].includes(value));
    if (!hasSignificantStenosis && plaqueSides.length === 0) {
      lines.push('Sin estenosis carotídeas hemodinámicamente significativas.');
    }
  }
  const abnormalVertebral = ['left', 'right'].filter(side => data.get(`${side}Vertebral`) !== 'anterograde');
  abnormalVertebral.forEach(side => {
    const sideText = side === 'left' ? 'izquierdo' : 'derecho';
    const value = data.get(`${side}Vertebral`);
    if (value === 'alternating') lines.push(`Flujo vertebral ${sideText} alternante.`);
    if (value === 'retrograde') lines.push(`Flujo vertebral ${sideText} retrógrado.`);
    if (value === 'not-seen') lines.push(`No se identificó flujo en la arteria vertebral del lado ${sideText === 'izquierdo' ? 'izquierdo' : 'derecho'}.`);
  });
  return lines;
}

function edvcRenderConclusions(data, force = false) {
  if (edvcConclusionState.dirty && !force) return;
  document.querySelector('#edvcConclusions').innerHTML = [
    '<div class="conclusion-heading">C O N C L U S I O N E S</div>',
    ...edvcAutomaticConclusions(data).map(text => `<div class="conclusion-text editable" contenteditable="true">${escapeHtml(text)}</div>`)
  ].join('');
  edvcConclusionState.dirty = false;
}

function edvcUpdateConditionalFields(data, side) {
  const finding = data.get(`${side}Finding`);
  const region = edvcForm.querySelector(`[data-side="${side}"]`);
  const plaque = finding !== 'normal' && finding !== 'imt';
  region.querySelectorAll('.edvc-plaque-field').forEach(field => { field.hidden = !plaque; });
  const imtField = region.querySelector('.edvc-imt-field');
  if (imtField) imtField.hidden = finding !== 'imt';
  const imtAlert = region.querySelector(`#${side}ImtAlert`);
  const imtValue = edvcNumber(data, `${side}Imt`);
  if (imtAlert) {
    imtAlert.hidden = finding !== 'imt' || imtValue == null || imtValue < 1.5;
    imtAlert.textContent = imtAlert.hidden
      ? ''
      : 'Revisar EMI: un espesor de 1,5 mm o más debe considerarse placa y no solamente engrosamiento mediointimal.';
  }
  const locationField = region.querySelector('.edvc-location-field');
  if (locationField) locationField.hidden = finding !== 'plaque-lt50';
  if (['stenosis-50-69', 'stenosis-ge70', 'near-occlusion', 'occlusion'].includes(finding)) {
    region.querySelector('.edvc-stenosis-details').open = true;
  }
}

function edvcCurrentData() {
  const data = new FormData(edvcForm);
  const normalStudy = data.get('normalStudy') === 'on';
  document.querySelectorAll('.edvc-region-form').forEach(region => { region.hidden = normalStudy; });
  const normalImtFields = document.querySelector('.edvc-normal-imt-fields');
  if (normalImtFields) normalImtFields.hidden = !normalStudy;
  const normalImtAlert = document.querySelector('#edvcNormalImtAlert');
  const normalImtValues = [
    ['izquierdo', edvcNumber(data, 'normalLeftImt')],
    ['derecho', edvcNumber(data, 'normalRightImt')]
  ];
  const plaqueRangeImtSides = normalImtValues
    .filter(([, value]) => value != null && value >= 1.5)
    .map(([side]) => side);
  const elevatedImtSides = normalImtValues
    .filter(([, value]) => value != null && value > 1 && value < 1.5)
    .map(([side]) => side);
  if (normalImtAlert) {
    normalImtAlert.hidden = !normalStudy || (plaqueRangeImtSides.length === 0 && elevatedImtSides.length === 0);
    normalImtAlert.textContent = plaqueRangeImtSides.length
      ? `Revisar EMI ${plaqueRangeImtSides.join(' y ')}: un espesor de 1,5 mm o más debe considerarse placa.`
      : elevatedImtSides.length
        ? `Revisar EMI ${elevatedImtSides.join(' y ')}: un valor mayor a 1 mm no corresponde a un estudio normal.`
        : '';
  }
  if (normalStudy) {
    data.set('leftFinding', 'normal');
    data.set('rightFinding', 'normal');
    data.set('leftVertebral', 'anterograde');
    data.set('rightVertebral', 'anterograde');
    data.set('leftImt', data.get('normalLeftImt') || '');
    data.set('rightImt', data.get('normalRightImt') || '');
  }
  return data;
}

function edvcRender() {
  const data = edvcCurrentData();
  ['left', 'right'].forEach(side => {
    edvcUpdateConditionalFields(data, side);
    const ratio = edvcRatio(data, side);
    document.querySelector(`#${side}Ratio`).textContent = ratio ? edvcFormat(ratio, 2) : '—';
    document.querySelector(`#${side}Suggestion`).textContent = edvcIacSuggestion(data, side);
  });

  const patientName = String(data.get('patientName') || '').trim();
  document.querySelector('#edvcReportPatient').textContent = `Apellido y nombre: ${patientName || '—'}`;
  document.querySelector('#edvcReportDate').textContent = data.get('studyDate')
    ? new Date(`${data.get('studyDate')}T12:00:00`).toLocaleDateString('es-AR')
    : '';

  if (!edvcTechniqueState.dirty) {
    document.querySelector('#edvcTechnique').textContent = 'Fueron estudiadas las arterias del cuello utilizando modalidades de imagen bidimensional, Doppler color y pulsado.\nSe realizó una evaluación comparativa y bilateral de las arterias carótida común, interna, externa y vertebral.';
  }
  edvcRenderDescriptions(data);
  edvcRenderConclusions(data);
}

edvcForm.addEventListener('input', edvcRender);
edvcForm.addEventListener('change', edvcRender);
edvcForm.addEventListener('keydown', event => {
  if (event.key !== 'Enter' || event.target.matches('textarea, button, summary')) return;
  const fields = Array.from(edvcForm.querySelectorAll('input, select, textarea'))
    .filter(field => !field.disabled && field.offsetParent !== null);
  const index = fields.indexOf(event.target);
  if (index < 0 || index === fields.length - 1) return;
  event.preventDefault();
  fields[index + 1].focus();
});

document.querySelector('#edvcTechnique').addEventListener('input', () => { edvcTechniqueState.dirty = true; });
document.querySelector('#edvcDescriptions').addEventListener('input', () => { edvcDescriptionState.dirty = true; });
document.querySelector('#edvcConclusions').addEventListener('input', () => { edvcConclusionState.dirty = true; });
document.querySelector('#edvcRegenerateButton').addEventListener('click', () => edvcRenderDescriptions(edvcCurrentData(), true));
document.querySelector('#edvcRegenerateConclusionsButton').addEventListener('click', () => edvcRenderConclusions(edvcCurrentData(), true));

document.querySelector('#edvcClearButton').addEventListener('click', () => {
  const studyDate = edvcForm.elements.studyDate.value;
  edvcForm.reset();
  edvcForm.elements.studyDate.value = studyDate;
  edvcDescriptionState.dirty = false;
  edvcConclusionState.dirty = false;
  edvcTechniqueState.dirty = false;
  document.querySelector('#edvcDescriptions').textContent = '';
  document.querySelector('#edvcConclusions').textContent = '';
  document.querySelectorAll('.edvc-stenosis-details').forEach(details => { details.open = false; });
  edvcRender();
  window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
});

function edvcPlainText() {
  const regionNames = ['REGIÓN IZQUIERDA:', 'REGIÓN DERECHA:'];
  const vesselNames = ['Carótida común:', 'Bulbo y carótida interna:', 'Carótida externa:', 'Vertebral:'];
  const descriptions = Array.from(document.querySelectorAll('#edvcDescriptions .edvc-report-region')).flatMap((region, regionIndex) => {
    const lines = [regionNames[regionIndex], ''];
    region.querySelectorAll('.edvc-report-row').forEach((row, rowIndex) => {
      lines.push(`${vesselNames[rowIndex]} ${row.querySelector('.edvc-report-text').textContent.trim().replace(/\s+/g, ' ')}`);
    });
    return [...lines, ''];
  });
  const conclusions = Array.from(document.querySelectorAll('#edvcConclusions .conclusion-text')).map(node => node.textContent.trim());
  return `\n\n${[
    document.querySelector('#edvcTechnique').textContent.trim().replace(/\s+/g, ' '),
    '',
    ...descriptions,
    'CONCLUSIONES',
    '',
    ...conclusions,
    '',
    '',
    '\t\tRODRIGUEZ CLAUS, ELISEO',
    '\t\tMédico Esp. en Cardiología - MP 118.231'
  ].join('\n')}`;
}

async function edvcCopyText() {
  const text = edvcPlainText();
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

document.querySelector('#edvcCopyTextButton').addEventListener('click', async () => {
  const button = document.querySelector('#edvcCopyTextButton');
  const original = button.textContent;
  try {
    await edvcCopyText();
    button.textContent = 'Texto copiado';
    setTimeout(() => { button.textContent = original; }, 1800);
  } catch (error) {
    console.error(error);
    window.prompt('Copiá este texto:', edvcPlainText());
  }
});

async function edvcGeneratePdf() {
  if (!window.jspdf?.jsPDF) throw new Error('No se cargó el generador de PDF');
  const pdf = new window.jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const fontFamily = await configurePdfFonts(pdf);
  const report = document.querySelector('#edvcReport');
  const marginX = 12;
  const pageWidth = 210;
  const pageHeight = 297;
  const contentWidth = pageWidth - (marginX * 2);
  const dark = [24, 48, 66];
  const muted = [103, 113, 120];
  const accent = [22, 133, 143];
  const pale = [231, 242, 243];
  let y = 9;
  const useFont = (style = 'normal', size = 9, color = dark) => {
    pdf.setFont(fontFamily, style);
    pdf.setFontSize(size);
    pdf.setTextColor(...color);
  };
  const pageBreak = height => {
    if (y + height <= pageHeight - 10) return false;
    pdf.addPage();
    y = 9;
    return true;
  };
  const wrapped = (text, width, size = 9, style = 'normal') => {
    useFont(style, size);
    const lines = [];
    String(text || '').split('\n').forEach(line => {
      lines.push(...pdf.splitTextToSize(line || ' ', width));
    });
    return lines.length ? lines : [''];
  };
  const band = title => {
    pageBreak(7);
    pdf.setFillColor(...pale);
    pdf.rect(marginX, y, contentWidth, 5.5, 'F');
    pdf.setDrawColor(...accent);
    pdf.setLineWidth(0.8);
    pdf.line(marginX, y, marginX, y + 5.5);
    useFont('bold', 9, dark);
    pdf.text(title, pageWidth / 2, y + 3.9, { align: 'center' });
    y += 8;
  };

  const banner = report.querySelector('.institutional-banner');
  if (banner) {
    const bannerData = await imageElementDataUrl(banner);
    const bannerHeight = Math.min(20, contentWidth * (banner.naturalHeight / banner.naturalWidth));
    pdf.addImage(bannerData, 'PNG', marginX, y, contentWidth, bannerHeight, undefined, 'FAST');
    y += bannerHeight + 4;
  }
  useFont('bold', 8, accent);
  pdf.text('INFORME', marginX, y);
  y += 5;
  useFont('bold', 16, dark);
  pdf.text(document.querySelector('#edvcReportTitle').textContent.trim(), marginX, y);
  y += 2.5;
  pdf.setDrawColor(...accent);
  pdf.setLineWidth(0.5);
  pdf.line(marginX, y, pageWidth - marginX, y);
  y += 5;
  useFont('bold', 11.2, dark);
  pdf.text(document.querySelector('#edvcReportPatient').textContent.trim(), marginX, y);
  y += 4.8;
  useFont('normal', 11.2, dark);
  pdf.text(document.querySelector('#edvcReportDate').textContent.trim(), marginX, y);
  y += 6;

  const techniqueLines = wrapped(document.querySelector('#edvcTechnique').textContent.trim(), contentWidth, 9.75);
  useFont('normal', 9.75, dark);
  pdf.text(techniqueLines, marginX, y, { lineHeightFactor: 1.35 });
  y += techniqueLines.length * 4.45 + 3;

  report.querySelectorAll('.edvc-report-region').forEach(region => {
    band(region.querySelector('.edvc-region-heading').textContent.trim());
    region.querySelectorAll('.edvc-report-row').forEach(row => {
      const label = row.querySelector('.edvc-report-label').textContent.trim();
      const text = editablePlainText(row.querySelector('.edvc-report-text'));
      const labelLines = wrapped(label, 43, 9, 'bold');
      const textLines = wrapped(text, 133, 9);
      const height = Math.max(labelLines.length, textLines.length) * 4.95 + 0.8;
      if (pageBreak(height)) band(region.querySelector('.edvc-region-heading').textContent.trim());
      useFont('bold', 9, dark);
      pdf.text(labelLines, 57, y + 3, { align: 'right', lineHeightFactor: 1.55 });
      useFont('normal', 9, dark);
      pdf.text(textLines, 61, y + 3, { lineHeightFactor: 1.55 });
      y += height;
    });
    y += 1.5;
  });

  band('C O N C L U S I O N E S');
  report.querySelectorAll('#edvcConclusions .conclusion-text').forEach(row => {
    const lines = wrapped(editablePlainText(row), contentWidth - 8, 9);
    const height = lines.length * 4.2 + 0.6;
    if (pageBreak(height)) band('C O N C L U S I O N E S');
    useFont('normal', 9, dark);
    pdf.text(lines, marginX + 4, y + 3, { lineHeightFactor: 1.35 });
    y += height;
  });

  const signature = report.querySelector('#edvcSignature img');
  if (signature && !signature.closest('#edvcSignature')?.hidden) {
    pageBreak(28);
    const signatureData = await imageElementDataUrl(signature);
    const signatureHeight = 25;
    const signatureWidth = signatureHeight * (signature.naturalWidth / signature.naturalHeight);
    pdf.addImage(signatureData, 'PNG', 153, y + 2, signatureWidth, signatureHeight, undefined, 'FAST');
  }
  return pdf;
}

document.querySelector('#edvcPdfButton').addEventListener('click', async () => {
  const button = document.querySelector('#edvcPdfButton');
  const original = button.textContent;
  try {
    button.disabled = true;
    button.textContent = 'Generando PDF…';
    const pdf = await edvcGeneratePdf();
    pdf.save(`${edvcPatientFileName(new FormData(edvcForm))}.pdf`);
  } catch (error) {
    console.error(error);
    window.alert('No se pudo generar el PDF de EDVC. Probá recargar la página.');
  } finally {
    button.disabled = false;
    button.textContent = original;
  }
});

document.querySelector('#edvcWordButton').addEventListener('click', async () => {
  const button = document.querySelector('#edvcWordButton');
  const original = button.textContent;
  let notice;
  let hidden = [];
  try {
    button.disabled = true;
    button.textContent = 'Generando .doc…';
    if (!window.html2canvas) throw new Error('No se cargó el generador de imagen');
    const report = document.querySelector('#edvcReport');
    await Promise.all(Array.from(report.querySelectorAll('img')).map(image => image.complete ? Promise.resolve() : new Promise(resolve => {
      image.addEventListener('load', resolve, { once: true });
      image.addEventListener('error', resolve, { once: true });
    })));
    if (document.fonts?.ready) await document.fonts.ready;
    notice = report.querySelector('.notice');
    if (notice) notice.style.display = 'none';
    hidden = Array.from(report.querySelectorAll('.no-print')).map(node => ({ node, display: node.style.display }));
    hidden.forEach(({ node }) => { node.style.display = 'none'; });
    const canvas = await window.html2canvas(report, { backgroundColor: '#ffffff', scale: 2, useCORS: true, logging: false, imageTimeout: 15000 });
    const imageHex = base64ToRtfHex(canvas.toDataURL('image/png').split(',')[1]);
    const pageWidthTwips = 11907;
    const pageHeightTwips = 16840;
    const imageScale = Math.min(pageWidthTwips / canvas.width, pageHeightTwips / canvas.height);
    const imageWidthTwips = Math.round(canvas.width * imageScale);
    const imageHeightTwips = Math.round(canvas.height * imageScale);
    const documentText = [
      '{\\rtf1\\ansi\\deff0\\viewkind4\\uc1',
      `\\paperw${pageWidthTwips}\\paperh${pageHeightTwips}\\margl0\\margr0\\margt0\\margb0`,
      '\\pard\\qc\\sb0\\sa0',
      `{\\pict\\pngblip\\picw${canvas.width}\\pich${canvas.height}\\picwgoal${imageWidthTwips}\\pichgoal${imageHeightTwips}`,
      imageHex,
      '}\\par',
      '}'
    ].join('\n');
    const blob = new Blob([documentText], { type: 'application/rtf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${edvcPatientFileName(new FormData(edvcForm))}.doc`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1500);
  } catch (error) {
    console.error(error);
    const detail = String(error?.message || 'motivo no informado').replace(/\s+/g, ' ').slice(0, 220);
    window.alert(`No se pudo generar el .doc de EDVC. Detalle: ${detail}`);
  } finally {
    if (notice) notice.style.display = '';
    hidden.forEach(({ node, display }) => { node.style.display = display; });
    button.disabled = false;
    button.textContent = original;
  }
});

document.querySelector('#edvcPrintButton').addEventListener('click', () => window.print());

const edvcToday = new Date();
edvcForm.elements.studyDate.value = [
  edvcToday.getFullYear(),
  (`0${edvcToday.getMonth() + 1}`).slice(-2),
  (`0${edvcToday.getDate()}`).slice(-2)
].join('-');
edvcRender();
setActiveStudy('eco');
