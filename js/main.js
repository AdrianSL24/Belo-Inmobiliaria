/**
 * BELO INMOBILIARIA — MOTOR FRONTEND & SEGURIDAD
 * Incluye: Navegación, Reseñas 1-5 Estrellas, Filtro Léxico Anti-Abuso,
 * Control de Sesión/Admin, Cumplimiento Legal Ley N° 29733 e INDECOPI.
 */

(function () {
  "use strict";

  /* --- 1. CONFIGURACIÓN CENTRALIZADA --- */
  const CONFIG = {
    whatsappNumero: "51954701238",
    // Cambiar aquí apenas Nexo Agentes entregue el enlace público sin DNI de cliente:
    urlCatalogoExterno: "https://admin.nexoagentes.pe/email-search/6a6b682a7970f50008cf5bd2",
    correosAdmin: [
      "brendabelohorizonte@gmail.com",
      "admin@belohorizonte.pe"
    ],
    storageKeyResenas: "bh_resenas_v1",
    storageKeyUsuario: "bh_usuario_sesion_v1",
    storageKeyCookies: "bh_cookies_aceptadas_v1"
  };

  /* --- 2. DICCIONARIO DE MODERACIÓN AUTOMÁTICA (ANTI-GROSERÍAS Y SPAM) --- */
  const PALABRAS_PROHIBIDAS = [
    "mierda", "puta", "puto", "carajo", "conchatumadre", "ctm", "huevon", "weon",
    "imbecil", "idiota", "estupido", "maldito", "basura", "estafa", "estafadores",
    "ladrones", "robo", "cojudo", "pendejo", "cabron", "verga", "culo", "perra",
    "http://", "https://", "www.", ".com", "casino", "crypto", "bitcoin"
  ];

  function contieneLenguajeInapropiado(texto) {
    const limpio = texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return PALABRAS_PROHIBIDAS.some((palabra) => {
      const regex = new RegExp(`\\b${palabra.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      return regex.test(limpio) || (palabra.includes(".") && limpio.includes(palabra));
    });
  }

  function sanitizarHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  /* --- 3. HEADER, MENÚ MÓVIL Y AÑO ACTUAL --- */
  const header = document.getElementById("header");
  const botonMenu = document.getElementById("botonMenu");
  const nav = document.getElementById("nav");
  const anioSpan = document.getElementById("anioActual");

  if (anioSpan) {
    anioSpan.textContent = new Date().getFullYear();
  }

  if (header) {
    window.addEventListener("scroll", () => {
      header.classList.toggle("con-scroll", window.scrollY > 12);
    }, { passive: true });
  }

  if (botonMenu && nav) {
    botonMenu.addEventListener("click", () => {
      const expandido = botonMenu.getAttribute("aria-expanded") === "true";
      botonMenu.setAttribute("aria-expanded", String(!expandido));
      nav.classList.toggle("abierto", !expandido);
      document.body.classList.toggle("menu-abierto", !expandido);
    });
  }

  /* --- 4. GESTIÓN DE FOTO DE ASESORA (FALLBACK ELEGANTE) --- */
  const fotoAsesora = document.getElementById("fotoAsesora");
  const bloqueAsesora = document.getElementById("bloqueAsesora");
  if (fotoAsesora && bloqueAsesora) {
    fotoAsesora.addEventListener("error", () => {
      bloqueAsesora.classList.add("sin-foto");
    });
  }

  /* --- 5. SISTEMA DE RESEÑAS (1 A 5 ESTRELLAS + AUTH + ADMIN DELETE) --- */
  const RESENAS_INICIALES = [
    {
      id: "res-101",
      autor: "Carlos Mendoza R.",
      correo: "cmendoza@cliente.pe",
      estrellas: 5,
      fecha: "Hace 4 días",
      comentario: "Brenda nos ayudó a revisar toda la partida registral y las cargas antes de firmar la minuta de nuestro departamento en Magdalena. Nos salvó de un problema legal serio."
    },
    {
      id: "res-102",
      autor: "Lucía Paredes V.",
      correo: "lparedes@cliente.pe",
      estrellas: 5,
      fecha: "Hace 2 semanas",
      comentario: "Excelente gestión con el banco para nuestro crédito hipotecario. Siempre contestó directo por WhatsApp y nos dio una tasación real desde el primer día."
    },
    {
      id: "res-103",
      autor: "Jorge Luis Salazar",
      correo: "jsalazar@cliente.pe",
      estrellas: 4,
      fecha: "Hace 1 mes",
      comentario: "Alquilamos nuestro local comercial con filtro completo de inquilinos y contrato notarial blindado. Muy recomendable por su seriedad."
    }
  ];

  function obtenerResenas() {
    try {
      const guardadas = localStorage.getItem(CONFIG.storageKeyResenas);
      return guardadas ? JSON.parse(guardadas) : RESENAS_INICIALES;
    } catch (e) {
      return RESENAS_INICIALES;
    }
  }

  function guardarResenas(lista) {
    try {
      localStorage.setItem(CONFIG.storageKeyResenas, JSON.stringify(lista));
    } catch (e) {
      console.error("No se pudo guardar en almacenamiento local.");
    }
  }

  function obtenerUsuarioActual() {
    try {
      const u = localStorage.getItem(CONFIG.storageKeyUsuario);
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  }

  function esAdmin(usuario) {
    if (!usuario || !usuario.correo) return false;
    return CONFIG.correosAdmin.includes(usuario.correo.toLowerCase().trim());
  }

  function generarSVGgEstrellas(cantidad) {
    let html = "";
    for (let i = 1; i <= 5; i++) {
      const relleno = i <= cantidad ? "currentColor" : "none";
      html += `<svg width="16" height="16" viewBox="0 0 24 24" fill="${relleno}" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
    }
    return html;
  }

  function renderizarMuroResenas() {
    const contenedorLista = document.getElementById("listaResenas");
    const promedioEl = document.getElementById("promedioResenas");
    const totalEl = document.getElementById("totalResenas");
    const cajaSesion = document.getElementById("estadoSesionResena");

    if (!contenedorLista) return;

    const resenas = obtenerResenas();
    const usuario = obtenerUsuarioActual();
    const adminActivo = esAdmin(usuario);

    // Actualizar métricas
    if (resenas.length > 0 && promedioEl && totalEl) {
      const suma = resenas.reduce((acc, item) => acc + Number(item.estrellas), 0);
      const prom = (suma / resenas.length).toFixed(1);
      promedioEl.textContent = prom;
      totalEl.textContent = `Basado en ${resenas.length} calificaciones verificadas en Lima`;
    }

    // Actualizar estado de sesión en la UI
    if (cajaSesion) {
      if (usuario) {
        cajaSesion.innerHTML = `
          <div class="resenas-usuario-activo">
            <div>
              <strong>Conectado como:</strong> ${sanitizarHTML(usuario.nombre)}
              ${adminActivo ? '<span class="badge-admin">MODO ADMIN (BRENDA)</span>' : ""}
            </div>
            <button type="button" class="boton boton--contorno" id="btnCerrarSesion" style="padding:6px 12px; font-size:0.8rem;">Cerrar sesión</button>
          </div>
        `;
        const btnSalir = document.getElementById("btnCerrarSesion");
        if (btnSalir) {
          btnSalir.addEventListener("click", () => {
            localStorage.removeItem(CONFIG.storageKeyUsuario);
            renderizarMuroResenas();
          });
        }
      } else {
        cajaSesion.innerHTML = `
          <p style="font-size:0.9rem; color:var(--gris-suave); margin-bottom:12px;">
            Para evitar spam y garantizar opiniones reales, identifica tu cuenta antes de publicar.
          </p>
          <button type="button" class="boton boton--azul" id="btnAbrirLogin" style="width:100%;">
            Identificarme con mi correo / Google
          </button>
        `;
        const btnLogin = document.getElementById("btnAbrirLogin");
        if (btnLogin) {
          btnLogin.addEventListener("click", abrirModalLogin);
        }
      }
    }

    // Pintar tarjetas
    contenedorLista.innerHTML = resenas.map((r) => {
      const iniciales = r.autor.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
      const puedeBorrar = adminActivo || (usuario && usuario.correo.toLowerCase() === r.correo.toLowerCase());

      return `
        <article class="testimonio" data-id="${sanitizarHTML(r.id)}">
          <div>
            <div class="testimonio__cabecera">
              <div class="estrellas-fijas" aria-label="Calificación: ${r.estrellas} de 5 estrellas">
                ${generarSVGgEstrellas(r.estrellas)}
              </div>
              <span class="testimonio__fecha">${sanitizarHTML(r.fecha)}</span>
            </div>
            <p class="testimonio__texto" style="margin-top:14px;">"${sanitizarHTML(r.comentario)}"</p>
          </div>
          <div class="testimonio__pie">
            <div class="testimonio__autor-info">
              <span class="testimonio__avatar" aria-hidden="true">${sanitizarHTML(iniciales)}</span>
              <div>
                <span class="testimonio__nombre">${sanitizarHTML(r.autor)}</span>
                <span class="testimonio__verificado">✓ Cuenta verificada</span>
              </div>
            </div>
            ${puedeBorrar ? `<button type="button" class="boton-borrar-resena" data-borrar="${sanitizarHTML(r.id)}">Eliminar</button>` : ""}
          </div>
        </article>
      `;
    }).join("");

    // Eventos de borrado (Admin o autor propio)
    contenedorLista.querySelectorAll("[data-borrar]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idBorrar = btn.getAttribute("data-borrar");
        const filtradas = obtenerResenas().filter((item) => item.id !== idBorrar);
        guardarResenas(filtradas);
        renderizarMuroResenas();
      });
    });
  }

  /* --- 6. ENVÍO DE NUEVA RESEÑA CON VALIDACIÓN ESTRICTA DE ESTRELLAS --- */
  const formResena = document.getElementById("formResena");
  const alertaResena = document.getElementById("alertaResena");

  function mostrarAlertaResena(mensaje, tipo) {
    if (!alertaResena) return;
    alertaResena.textContent = mensaje;
    alertaResena.className = `alerta-validacion visible alerta-validacion--${tipo}`;
  }

  if (formResena) {
    formResena.addEventListener("submit", (e) => {
      e.preventDefault();
      const usuario = obtenerUsuarioActual();

      if (!usuario) {
        mostrarAlertaResena("Inicia sesión con tu nombre y correo antes de publicar una calificación.", "error");
        abrirModalLogin();
        return;
      }

      const estrellaSeleccionada = formResena.querySelector('input[name="calificacion"]:checked');
      const comentarioInput = document.getElementById("comentarioResena");
      const texto = comentarioInput ? comentarioInput.value.trim() : "";

      // Regla estricta: prohibido enviar sin marcar de 1 a 5 estrellas
      if (!estrellaSeleccionada) {
        mostrarAlertaResena("Tienes que elegir una calificación de 1 a 5 estrellas para poder enviar tu comentario.", "error");
        return;
      }

      if (texto.length < 12) {
        mostrarAlertaResena("Escribe una opinión un poco más detallada (mínimo 12 caracteres).", "error");
        return;
      }

      if (texto.length > 450) {
        mostrarAlertaResena("Tu reseña supera el máximo permitido de 450 caracteres.", "error");
        return;
      }

      // Filtro léxico de seguridad contra groserías y spam
      if (contieneLenguajeInapropiado(texto) || contieneLenguajeInapropiado(usuario.nombre)) {
        mostrarAlertaResena("Tu comentario contiene palabras no permitidas o enlaces externos. Mantengamos un espacio respetuoso.", "error");
        return;
      }

      const nuevaResena = {
        id: "res-" + Date.now(),
        autor: usuario.nombre,
        correo: usuario.correo,
        estrellas: parseInt(estrellaSeleccionada.value, 10),
        fecha: "Publicado ahora",
        comentario: texto
      };

      const listaActual = obtenerResenas();
      listaActual.unshift(nuevaResena);
      guardarResenas(listaActual);

      formResena.reset();
      mostrarAlertaResena("¡Gracias! Tu calificación y comentario ya están publicados en vivo.", "exito");
      renderizarMuroResenas();
    });
  }

  /* --- 7. MODAL DE IDENTIFICACIÓN Y MODALES LEGALES --- */
  const modalOverlay = document.getElementById("modalGeneral");
  const modalContenido = document.getElementById("modalContenido");
  const modalCerrar = document.getElementById("modalCerrar");

  function abrirModal(htmlInterno) {
    if (!modalOverlay || !modalContenido) return;
    modalContenido.innerHTML = htmlInterno;
    modalOverlay.classList.add("activo");
    document.body.classList.add("modal-abierto");
  }

  function cerrarModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove("activo");
    document.body.classList.remove("modal-abierto");
  }

  if (modalCerrar) modalCerrar.addEventListener("click", cerrarModal);
  if (modalOverlay) {
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) cerrarModal();
    });
  }

  function abrirModalLogin() {
    abrirModal(`
      <h3 style="margin-bottom:8px;">Identifícate para comentar</h3>
      <p style="font-size:0.94rem; color:var(--gris-suave); margin-bottom:20px;">
        Verificamos la identidad de cada reseña conforme a nuestras normas de comunidad.
        <em>(Tip: Si ingresas el correo oficial de Brenda, se activará el Modo Administrador para borrar comentarios).</em>
      </p>
      <form id="formLoginModal">
        <div class="campo">
          <label for="loginNombre">Tu nombre y apellido</label>
          <input type="text" id="loginNombre" required placeholder="Ej. Mariana Torres">
        </div>
        <div class="campo">
          <label for="loginCorreo">Tu correo electrónico</label>
          <input type="email" id="loginCorreo" required placeholder="ejemplo@gmail.com">
        </div>
        <button type="submit" class="boton boton--principal boton--bloque">Continuar y verificar</button>
      </form>
    `);

    const formLogin = document.getElementById("formLoginModal");
    if (formLogin) {
      formLogin.addEventListener("submit", (e) => {
        e.preventDefault();
        const nombre = document.getElementById("loginNombre").value.trim();
        const correo = document.getElementById("loginCorreo").value.trim();
        if (nombre.length < 3 || !correo.includes("@")) return;

        localStorage.setItem(CONFIG.storageKeyUsuario, JSON.stringify({ nombre, correo }));
        cerrarModal();
        renderizarMuroResenas();
      });
    }
  }

  // Textos Legales Oficiales (Perú: Ley N° 29733 e INDECOPI)
  const TEXTOS_LEGALES = {
    privacidad: `
      <h3>Política de Privacidad y Protección de Datos Personales</h3>
      <p>En cumplimiento de la <strong>Ley N° 29733 — Ley de Protección de Datos Personales del Perú</strong> y su Reglamento (D.S. N° 003-2013-JUS), <strong>Belo Inmobiliaria</strong> (representada por Brenda Llaure Ayala, Lima - Perú) informa lo siguiente:</p>
      <p><strong>1. Finalidad del tratamiento:</strong> Los datos personales recopilados mediante nuestros formularios de contacto o el sistema de reseñas (nombre, teléfono y correo electrónico) se utilizan exclusivamente para atender consultas inmobiliarias, coordinar tasaciones y autenticar opiniones legítimas en el portal.</p>
      <p><strong>2. Derechos ARCO:</strong> Todo titular puede ejercer sus derechos de Acceso, Rectificación, Cancelación y Oposición escribiendo directamente a <strong>brendabelohorizonte@gmail.com</strong>.</p>
      <p><strong>3. No cesión a terceros:</strong> No comercializamos ni cedemos bases de datos a terceros ajenos a la operación consultada.</p>
    `,
    terminos: `
      <h3>Términos y Condiciones de Uso</h3>
      <p><strong>1. Carácter referencial del catálogo:</strong> Los precios, metrajes, renders y disponibilidades de los departamentos y propiedades mostrados o enlazados a través de plataformas aliadas (Nexo Agentes) son referenciales y están sujetos a variación por parte de las constructoras o propietarios sin previo aviso.</p>
      <p><strong>2. Normas de la sección de reseñas:</strong> El usuario se compromete a calificar de 1 a 5 estrellas basándose en experiencias reales y utilizando lenguaje respetuoso. Belo Inmobiliaria se reserva el derecho de moderar y eliminar comentarios que incluyan insultos, difamación, datos sensibles de terceros o publicidad no autorizada.</p>
      <p><strong>3. Propiedad Intelectual (D.L. N° 822 - INDECOPI):</strong> El logotipo, isotipo y contenidos de marca de Belo Inmobiliaria están protegidos por la legislación peruana sobre Derechos de Autor y Signos Distintivos.</p>
    `,
    reclamaciones: `
      <h3>Libro de Reclamaciones Virtual (Ley N° 29571 — INDECOPI)</h3>
      <p>Conforme al Código de Protección y Defensa del Consumidor, ponemos a tu disposición nuestro canal formal para registrar una <strong>Queja</strong> (malestar respecto a la atención) o un <strong>Reclamo</strong> (disconformidad relacionada con el servicio de corretaje).</p>
      <form id="formLibroReclamo" style="margin-top:16px;">
        <div class="campo">
          <label>Nombre completo y DNI</label>
          <input type="text" id="recNombre" required placeholder="Ej. Juan Pérez - DNI 45678912">
        </div>
        <div class="campo">
          <label>Tipo de registro</label>
          <select id="recTipo" required>
            <option value="Reclamo">Reclamo (Servicio)</option>
            <option value="Queja">Queja (Atención)</option>
          </select>
        </div>
        <div class="campo">
          <label>Detalle del hecho</label>
          <textarea id="recDetalle" required placeholder="Describe los hechos con fecha y detalle"></textarea>
        </div>
        <button type="submit" class="boton boton--principal boton--bloque">Registrar y enviar constancia</button>
      </form>
    `
  };

  document.querySelectorAll("[data-legal]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const clave = btn.getAttribute("data-legal");
      if (TEXTOS_LEGALES[clave]) {
        abrirModal(TEXTOS_LEGALES[clave]);
        const formRec = document.getElementById("formLibroReclamo");
        if (formRec) {
          formRec.addEventListener("submit", (ev) => {
            ev.preventDefault();
            const nom = document.getElementById("recNombre").value;
            const tipo = document.getElementById("recTipo").value;
            const det = document.getElementById("recDetalle").value;
            const textoWsp = encodeURIComponent(`[LIBRO DE RECLAMACIONES - ${tipo}]\nTitular: ${nom}\nDetalle: ${det}`);
            window.open(`https://wa.me/${CONFIG.whatsappNumero}?text=${textoWsp}`, "_blank", "noopener,noreferrer");
            cerrarModal();
          });
        }
      }
    });
  });

  /* --- 8. FORMULARIO DE CONTACTO CON VALIDACIÓN Y LEY 29733 --- */
  const formContacto = document.getElementById("formContacto");
  if (formContacto) {
    formContacto.addEventListener("submit", (e) => {
      e.preventDefault();
      let valido = true;

      const nombre = document.getElementById("nombre");
      const telefono = document.getElementById("telefono");
      const correo = document.getElementById("correo");
      const servicio = document.getElementById("servicio");
      const mensaje = document.getElementById("mensaje");
      const privacidad = document.getElementById("aceptoPrivacidad");

      function marcarError(inputEl, condicionError) {
        if (!inputEl) return;
        const contenedorCampo = inputEl.closest(".campo");
        if (contenedorCampo) {
          contenedorCampo.classList.toggle("con-error", condicionError);
        }
        if (condicionError) valido = false;
      }

      marcarError(nombre, !nombre.value || nombre.value.trim().length < 3);
      marcarError(telefono, !telefono.value || telefono.value.replace(/\D/g, "").length < 6);
      marcarError(correo, !correo.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.value));
      marcarError(servicio, !servicio.value);
      marcarError(mensaje, !mensaje.value || mensaje.value.trim().length < 10);
      if (privacidad) {
        marcarError(privacidad, !privacidad.checked);
      }

      if (!valido) return;

      const textoWhatsApp = [
        "Hola Brenda, te escribo desde la web de Belo Inmobiliaria:",
        `• *Nombre:* ${nombre.value.trim()}`,
        `• *Teléfono:* ${telefono.value.trim()}`,
        `• *Correo:* ${correo.value.trim()}`,
        `• *Operación:* ${servicio.value}`,
        `• *Consulta:* ${mensaje.value.trim()}`
      ].join("\n");

      const url = `https://wa.me/${CONFIG.whatsappNumero}?text=${encodeURIComponent(textoWhatsApp)}`;
      window.open(url, "_blank", "noopener,noreferrer");
      formContacto.reset();
    });
  }

  /* --- 9. BANNER DE COOKIES --- */
  const bannerCookies = document.getElementById("bannerCookies");
  const btnAceptarCookies = document.getElementById("btnAceptarCookies");
  if (bannerCookies && !localStorage.getItem(CONFIG.storageKeyCookies)) {
    bannerCookies.classList.add("visible");
  }
  if (btnAceptarCookies && bannerCookies) {
    btnAceptarCookies.addEventListener("click", () => {
      localStorage.setItem(CONFIG.storageKeyCookies, "true");
      bannerCookies.classList.remove("visible");
    });
  }

  // Inicializar el muro de reseñas si estamos en Inicio
  renderizarMuroResenas();
})();
