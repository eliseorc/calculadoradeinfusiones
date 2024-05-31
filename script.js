
function showSection(sectionIndex) {
  // Ocultar todas las secciones
  var sections = document.getElementsByClassName('section');
  for (var i = 0; i < sections.length; i++) {
    sections[i].classList.remove('show');
  }
  
  // Mostrar la sección seleccionada
  var sectionId = 'section' + sectionIndex;
  var section = document.getElementById(sectionId);
  section.classList.add('show');
}

function calculateNoradrenalina(event) {
  event.preventDefault();
  var a35 = parseFloat(document.getElementById('a35').value);
  var b35 = parseFloat(document.getElementById('b35').value);
  var c35 = parseFloat(document.getElementById('c35').value);
  var d35 = parseFloat(document.getElementById('d35').value);
  var result = (((a35 * 4000) / b35) * d35) / c35 / 60;
  document.getElementById('result1').textContent = result.toFixed(2) + ' mcg/kg/min';
}

function calculateDopamina(event) {
  event.preventDefault();
  var a43 = parseFloat(document.getElementById('a43').value);
  var b43 = parseFloat(document.getElementById('b43').value);
  var c43 = parseFloat(document.getElementById('c43').value);
  var d43 = parseFloat(document.getElementById('d43').value);
  var result = (((a43 * 200000) / b43) * d43) / c43 / 60;
  document.getElementById('result2').textContent = result.toFixed(2) + ' mcg/kg/min';
}

function calculateDobutamina(event) {
  event.preventDefault();
  var a39 = parseFloat(document.getElementById('a39').value);
  var b39 = parseFloat(document.getElementById('b39').value);
  var c39 = parseFloat(document.getElementById('c39').value);
  var d39 = parseFloat(document.getElementById('d39').value);
  var result = (((a39 * 250000) / (b39)) * d39) / c39 /60;
  document.getElementById('result3').textContent = result.toFixed(2) + ' mcg/kg/min';
}

function calculateMilrinona(event) {
  event.preventDefault();
  var a47 = parseFloat(document.getElementById('a47').value);
  var b47 = parseFloat(document.getElementById('b47').value);
  var c47 = parseFloat(document.getElementById('c47').value);
  var d47 = parseFloat(document.getElementById('d47').value);
  var result = (((a47 * 10000) / (b47)) * d47) / c47 / 60;
  document.getElementById('result4').textContent = result.toFixed(2) + ' mcg/kg/min';
}

function calculateAdrenalina(event) {
  event.preventDefault();
  var a72 = parseFloat(document.getElementById('a72').value);
  var b72 = parseFloat(document.getElementById('b72').value);
  var c72 = parseFloat(document.getElementById('c72').value);
  var d72 = parseFloat(document.getElementById('d72').value);
  var result = (((a72 * 1000) / (b72)) * d72) / c72 / 60;
	  document.getElementById('result5').textContent = result.toFixed(2) + ' mcg/kg/min';
}

function calculateVasopresina(event) {
  event.preventDefault();
  var a51 = parseFloat(document.getElementById('a51').value);
  var b51 = parseFloat(document.getElementById('b51').value);
  var c51 = parseFloat(document.getElementById('c51').value);
  var result = (((a51 * 20) / (b51)) * c51) / 60;
  document.getElementById('result6').textContent = result.toFixed(2) + ' UI/min' ;
}

function calculateIsoproterenol(event) {
  event.preventDefault();
  var a56 = parseFloat(document.getElementById('a56').value);
  var b56 = parseFloat(document.getElementById('b56').value);
  var c56 = parseFloat(document.getElementById('c56').value);
  var result = (((a56 * 1000) / (b56)) * c56) / 60;
  document.getElementById('result7').textContent =  result.toFixed(2) + ' mcg/min';
}

function calculateFurosemida(event) {
  event.preventDefault();
  var a29 = parseFloat(document.getElementById('a29').value);
  var b29 = parseFloat(document.getElementById('b29').value);
  var c29 = parseFloat(document.getElementById('c29').value);
  var d29 = parseFloat(document.getElementById('d29').value);
  var result = ((a29 * 20) / (a29 * 2 + b29) * d29) / c29;
  document.getElementById('result8').textContent = result.toFixed(2) + ' mg/kg/h';
}

function calculateFentanilo(event) {
  event.preventDefault();
  var a3 = parseFloat(document.getElementById('a3').value);
  var b3 = parseFloat(document.getElementById('b3').value);
  var c3 = parseFloat(document.getElementById('c3').value);
  var d3 = parseFloat(document.getElementById('d3').value);
  var result = ((a3 * 250) / (a3 * 5 + b3) * d3) / c3;
  document.getElementById('result9').textContent = result.toFixed(2) + ' mcg/kg/h';
}

function calculateRemifentanilo(event) {
  event.preventDefault();
  var a11 = parseFloat(document.getElementById('a11').value);
  var b11 = parseFloat(document.getElementById('b11').value);
  var c11 = parseFloat(document.getElementById('c11').value);
  var d11 = parseFloat(document.getElementById('d11').value);
  var result = ((a11 * 5000) / (a11 * 5 + b11) * d11) / c11;
  document.getElementById('result10').textContent = result.toFixed(2) + ' mcg/kg/h';
}

function calculateMidazolam(event) {
  event.preventDefault();
  var a7 = parseFloat(document.getElementById('a7').value);
  var b7 = parseFloat(document.getElementById('b7').value);
  var c7 = parseFloat(document.getElementById('c7').value);
  var d7 = parseFloat(document.getElementById('d7').value);
  var result = ((a7 * 15) / (a7 * 3 + b7) * d7) / c7;
	  document.getElementById('result11').textContent = result.toFixed(2) + ' mcg/kg/h';
}

function calculatePropofol(event) {
  event.preventDefault();
  var a15 = parseFloat(document.getElementById('a15').value);
  var c15 = parseFloat(document.getElementById('c15').value);
  var d15 = parseFloat(document.getElementById('d15').value);
  var result = ((a15 * 200) / (a15 * 20) * d15)/c15;
	    document.getElementById('result12').textContent = result.toFixed(2) + ' mcg/kg/h';
}

function calculateDexmedetomidina(event) {
  event.preventDefault();
  var a23 = parseFloat(document.getElementById('a23').value);
  var b23 = parseFloat(document.getElementById('b23').value);
  var c23 = parseFloat(document.getElementById('c23').value);
  var d23 = parseFloat(document.getElementById('d23').value);
  var result = ((a23 * 200)/(a23 * 2 + b23) * d23) / c23;
  document.getElementById('result13').textContent = result.toFixed(2) + ' mcg/kg/h';
}

function calcularTratamiento() {
  const glucemiaInicial = parseInt(document.getElementById("glucemiaInicial").value);
  let tratamiento = "";

  if (glucemiaInicial < 151) {
      tratamiento = "No corresponde tratamiento.";
  } else if (glucemiaInicial >= 151 && glucemiaInicial <= 180) {
      tratamiento = "Bomba a 1 ml/h, sin bolo.";
  } else if (glucemiaInicial >= 181 && glucemiaInicial <= 220) {
      tratamiento = "Bolo de 2 unidades, bomba a 2 ml/h.";
  } else if (glucemiaInicial >= 221 && glucemiaInicial <= 260) {
      tratamiento = "Bolo de 3 unidades, bomba a 2.5 ml/h.";
  } else if (glucemiaInicial >= 261 && glucemiaInicial <= 300) {
      tratamiento = "Bolo de 4 unidades, bomba a 3 ml/h.";
  } else if (glucemiaInicial > 300) {
      tratamiento = "Bolo de 6 unidades, bomba a 3.5 ml/h.";
  }
      
  document.getElementById("resultadoTratamiento1").textContent = tratamiento;
}

// Insulina y condiciones

function evaluarTratamiento() {
  const glucemiaActual = parseInt(document.getElementById("glucemiaActual").value);
  const glucemiaPrevia = parseInt(document.getElementById("glucemiaPrevia").value);

  let tratamiento = "Ningún tratamiento aplicable.";

  if (glucemiaPrevia >= 0 && glucemiaActual > 360) {
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
  } else if (glucemiaPrevia >= 161 && glucemiaPrevia <= 200 && glucemiaActual >= 151 && glucemiaActual <= 160) {
      tratamiento = "Sin cambios.";
  } else if (glucemiaPrevia >= 201 && glucemiaPrevia <= 240 && glucemiaActual >= 151 && glucemiaActual <= 160) {
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
  } else if (glucemiaPrevia >= 0 && glucemiaActual >= 61 && glucemiaActual <= 79) {
      tratamiento = "Suspender infusión. Control en 30 min.";
  } else if (glucemiaPrevia >= 0 && glucemiaActual < 61) {
      tratamiento = "Suspender infusion. Tratamiento de hipoglucemia.";
  }

  document.getElementById("resultadoTratamiento2").textContent = tratamiento;
}


// selector
var menu = document.querySelector('.hamburger');

// method
function toggleMenu (event) {
  this.classList.toggle('is-active');
  document.querySelector( ".sidebar" ).classList.toggle("is_active");
  event.preventDefault();
}

// event
menu.addEventListener('click', toggleMenu, false);

// Obtén todos los elementos de la lista
var menuItems = document.querySelectorAll('.sidebar ul li');

// Agrega un event listener a cada elemento de la lista
menuItems.forEach(function(item) {
  item.addEventListener('click', toggleMenu, false);
});

window.addEventListener('DOMContentLoaded', function() {
  toggleMenu();
});

// method
function toggleMenu() {
  var menu = document.querySelector('.hamburger');
  if (menu) {
    menu.classList.toggle('is-active');
    document.querySelector(".sidebar").classList.toggle("is_active");
  }
}

function agregarAInicio() {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      const promptEvent = e;
      // Muestra un mensaje o un botón personalizado para agregar a inicio
      // Puedes usar una librería como SweetAlert o mostrar un mensaje informativo
      // Al hacer clic en el botón de agregar a inicio, puedes llamar a promptEvent.prompt();
      // para mostrar el diálogo de "Agregar a inicio" predeterminado del navegador.
    });
  } else {
    alert('La función "Agregar a inicio" no es compatible con este navegador.');
  }
}
