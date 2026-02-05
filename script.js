document.addEventListener("DOMContentLoaded", function () {
  const lang = document.documentElement.lang;

  if (lang === "es") {
    document.getElementById("lang-es")?.classList.add("active");
  }
  if (lang === "en") {
    document.getElementById("lang-en")?.classList.add("active");
  }
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

  var result = (((a35 * 4000) / b35) * d35) / c35 / 60;
  document.getElementById('result1').textContent = result.toFixed(2) + ' mcg/kg/min';
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

  var result = (((a43 * 200000) / b43) * d43) / c43 / 60;
  document.getElementById('result2').textContent = result.toFixed(2) + ' mcg/kg/min';
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

  var result = (((a39 * 250000) / b39) * d39) / c39 / 60;
  document.getElementById('result3').textContent = result.toFixed(2) + ' mcg/kg/min';
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
    return;
  }

  var result = (((a47 * 10000) / b47) * d47) / c47 / 60;
  document.getElementById('result4').textContent = result.toFixed(2) + ' mcg/kg/min';
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

  var result = (((a72 * 1000) / b72) * d72) / c72 / 60;
  document.getElementById('result5').textContent = result.toFixed(2) + ' mcg/kg/min';
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
    return;
  }

  var result = (((a51 * 20) / b51) * c51) / 60;
  document.getElementById('result6').textContent = result.toFixed(2) + ' UI/min';
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
    return;
  }

  var result = (((a56 * 1000) / b56) * c56) / 60;
  document.getElementById('result7').textContent = result.toFixed(2) + ' mcg/min';
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
  var concentracion = (a29 * 20) / (a29 * 2 + b29);

  // Dosis instantánea mg/kg/h
  var dosis = (concentracion * d29) / c29;

  // Cantidad total en 24h (mg)
  var total24h_mg = concentracion * d29 * 24;

  // Convertir a gramos
  var total24h_g = total24h_mg / 1000;

  // Mostrar ambos resultados
  document.getElementById('result8').innerHTML = 
    dosis.toFixed(2) + ' mg/kg/h' + 
    '<br><small style="color: var(--text-secondary);">Equivale a ' + total24h_g.toFixed(2) + ' g en 24 hs.</small>';
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
    return;
  }

  var result = ((a3 * 250) / (a3 * 5 + b3) * d3) / c3;
  document.getElementById('result9').textContent = result.toFixed(2) + ' mcg/kg/h';
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
    return;
  }

  var result = ((a11 * 5000) / (a11 * 5 + b11) * d11) / c11;
  document.getElementById('result10').textContent = result.toFixed(2) + ' mcg/kg/h';
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
    return;
  }

  var result = ((a7 * 15) / (a7 * 3 + b7) * d7) / c7;
  document.getElementById('result11').textContent = result.toFixed(2) + ' mcg/kg/h';
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
    return;
  }

  var result = ((a15 * 200) / (a15 * 20) * d15) / c15;
  document.getElementById('result12').textContent = result.toFixed(2) + ' mcg/kg/h';
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
    return;
  }

  var result = ((a23 * 200) / (a23 * 2 + b23) * d23) / c23;
  document.getElementById('result13').textContent = result.toFixed(2) + ' mcg/kg/h';
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
    tratamiento = "Bolo de 3 unidades, bomba a 2.5 ml/h.";
  } else if (glucemiaInicial <= 300) {
    tratamiento = "Bolo de 4 unidades, bomba a 3 ml/h.";
  } else {
    tratamiento = "Bolo de 6 unidades, bomba a 3.5 ml/h.";
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
    tratamiento = "Bolo de 5 unidades y aumentar infusion +2.5 ml/h.";
  } else if (glucemiaPrevia >= 0 && glucemiaPrevia > 340 && glucemiaActual >= 301 && glucemiaActual <= 310) {
    tratamiento = "Sin cambios.";
  } else if (glucemiaPrevia < 320 && glucemiaActual >= 281 && glucemiaActual <= 300) {
    tratamiento = "Aumentar infusion +2.5 ml/h.";
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
    tratamiento = "Aumentar infusion +0.5 ml/h.";
  } else if (glucemiaPrevia >= 181 && glucemiaPrevia <= 240 && glucemiaActual >= 161 && glucemiaActual <= 180) {
    tratamiento = "Sin cambios.";
  } else if (glucemiaPrevia > 240 && glucemiaActual >= 161 && glucemiaActual <= 180) {
    tratamiento = "Bajar infusion -1 ml/h.";
  } else if (glucemiaPrevia < 161 && glucemiaActual >= 151 && glucemiaActual <= 160) {
    tratamiento = "Aumentar infusion +0.5 ml/h.";
  } else if (glucemiaPrevia >= 161 && glucemiaPrevia <= 240 && glucemiaActual >= 151 && glucemiaActual <= 160) {
    tratamiento = "Sin cambios.";
  } else if (glucemiaPrevia > 240 && glucemiaActual >= 151 && glucemiaActual <= 160) {
    tratamiento = "Disminuir dosis a la mitad.";
  } else if (glucemiaPrevia < 80 && glucemiaActual >= 80 && glucemiaActual <= 150) {
    tratamiento = "Suspender infusion.";
  } else if (glucemiaPrevia >= 80 && glucemiaPrevia <= 160 && glucemiaActual >= 121 && glucemiaActual <= 150) {
    tratamiento = "Sin cambios.";
  } else if (glucemiaPrevia >= 161 && glucemiaPrevia <= 180 && glucemiaActual >= 121 && glucemiaActual <= 150) {
    tratamiento = "Bajar infusion 0.3 ml/h.";
  } else if (glucemiaPrevia >= 181 && glucemiaPrevia <= 200 && glucemiaActual >= 121 && glucemiaActual <= 150) {
    tratamiento = "Bajar infusión 0.5 ml/h.";
  } else if (glucemiaPrevia > 200 && glucemiaActual >= 121 && glucemiaActual <= 150) {
    tratamiento = "Disminuir dosis a la mitad.";
  } else if (glucemiaPrevia >= 80 && glucemiaPrevia <= 150 && glucemiaActual >= 100 && glucemiaActual <= 120) {
    tratamiento = "Sin cambios.";
  } else if (glucemiaPrevia >= 151 && glucemiaPrevia <= 160 && glucemiaActual >= 100 && glucemiaActual <= 120) {
    tratamiento = "Bajar infusion 0.3 ml/h.";
  } else if (glucemiaPrevia >= 161 && glucemiaPrevia <= 180 && glucemiaActual >= 100 && glucemiaActual <= 120) {
    tratamiento = "Bajar infusion 0.5 ml/h.";
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

var menu = document.querySelector('.hamburger');

function toggleMenu(event) {
  // event puede venir o no (click vs DOMContentLoaded)
  if (event) event.preventDefault();
  var btn = document.querySelector('.hamburger');
  var sidebar = document.querySelector('.sidebar');
  if (!btn || !sidebar) return;
  btn.classList.toggle('is-active');
  sidebar.classList.toggle('is_active');
}

if (menu) {
  menu.addEventListener('click', toggleMenu, false);
}

// Cerrar menú al hacer click en opción
var menuItems = document.querySelectorAll('.sidebar ul li');
menuItems.forEach(function (item) {
  item.addEventListener('click', toggleMenu, false);
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

function agregarAInicio() {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      const promptEvent = e;
      // Aquí podrías mostrar un botón propio y luego llamar a promptEvent.prompt();
    });
  } else {
    alert('La función "Agregar a inicio" no es compatible con este navegador.');
  }
}

function calculateAtracurio(event) {
  event.preventDefault();
  var a16 = getNumber('a16');
  var b16 = getNumber('b16');
  var c16 = getNumber('c16');
  var d16 = getNumber('d16');

  if ([a16, b16, c16, d16].some(isNaN)) {
    document.getElementById('result16').textContent = 'Revisá los valores.';
    return;
  }

  // 1 amp = 50 mg/5 ml
  var result = (((a16 * 50000) / b16) * d16) / c16 / 60;
  document.getElementById('result16').textContent = result.toFixed(2) + ' mcg/kg/min';
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
    return;
  }
  // 1 amp = 20 mg → resultado en mg/min
  var result = (((a17 * 20) / b17) * d17) / 60;
  document.getElementById('result17').textContent = result.toFixed(2) + ' mg/min';

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
    return;
  }

  // 1 amp = 50 mg
  var result = (((a18 * 50000) / b18) * d18) / c18 / 60;
  document.getElementById('result18').textContent = result.toFixed(2) + ' mcg/kg/min';

// Evento GA4 – cálculo exitoso
  gtag('event', 'calculo_realizado', {
    farmaco: 'nitroprusiato'
  });
}

document.addEventListener('DOMContentLoaded', function () {
  if (typeof gtag === 'function') {
    const theme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';

    gtag('event', 'theme_used', {
      theme: theme
    });
  }

  gtag('event', 'donation_click', {
  method: 'buy_me_a_coffee'
});
});
