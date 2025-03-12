document.addEventListener("DOMContentLoaded", function () {
    iniciarSesion();
    manejarEventosImagenes();
});

// ---------------------- [ LOGIN ] ----------------------
const usuariosValidos = [
    { usuario: "admin", hash: "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4" },
    { usuario: "usuario1", hash: "f8638b979b2f4f793ddb6dbd197e0ee25a7a6ea32b0ae22f5e3c5d119d839e75" }
];

async function calcularHash(texto) {
    const encoder = new TextEncoder();
    const data = encoder.encode(texto);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
}

function iniciarSesion() {
    if (!localStorage.getItem("usuario")) {
        document.body.innerHTML = `
            <div class='container text-center login'>
                <h2 class='my-4'>Iniciar Sesión</h2>
                <div class='mb-3'>
                    <input type='text' id='usuario' class='form-control' placeholder='Usuario'>
                </div>
                <div class='mb-3'>
                    <input type='password' id='password' class='form-control' placeholder='Contraseña'>
                </div>
                <button class='btn btn-primary' onclick='validarUsuario()'>Ingresar</button>
            </div>
        `;
    } else {
        document.body.insertAdjacentHTML("afterbegin", `
            <div class='container text-end mt-3'>
                <span class='me-3'>Usuario: <strong>${localStorage.getItem("usuario")}</strong></span>
                <button class='btn btn-danger btn-sm' onclick='cerrarSesion()'>Cerrar Sesión</button>
            </div>
        `);
    }
}

window.validarUsuario = async function () {
    const usuario = document.getElementById("usuario").value;
    const password = document.getElementById("password").value;
    const passwordHash = await calcularHash(password);

    const usuarioValido = usuariosValidos.find(user => user.usuario === usuario && user.hash === passwordHash);

    if (usuarioValido) {
        localStorage.setItem("usuario", usuario);
        location.reload();
    } else {
        alert("Usuario o contraseña incorrectos");
    }
}

window.cerrarSesion = function () {
    localStorage.removeItem("usuario");
    location.reload();
}

// ---------------------- [ CARGAR IMÁGENES ] ----------------------
function agregarImagenes() {
    const inputImagen = document.getElementById("imagenInput");
    const contenido = document.getElementById("contenido");

    if (inputImagen.files.length > 0) {
        Array.from(inputImagen.files).forEach(file => {
            const reader = new FileReader();

            reader.onload = function (e) {
                const div = document.createElement("div");
                div.classList.add("imagen-contenedor");

                const img = document.createElement("img");
                img.src = e.target.result;
                img.classList.add("img-fluid");
                img.setAttribute("data-rotation", "0");

                const rotateBtn = document.createElement("button");
                rotateBtn.textContent = "↻ Rotar";
                rotateBtn.classList.add("btn-rotate");
                rotateBtn.onclick = function () {
                    rotarImagen(img);
                };

                div.appendChild(img);
                div.appendChild(rotateBtn);
                contenido.appendChild(div);
            };

            reader.readAsDataURL(file);
        });
    }
}

// ---------------------- [ ROTACIÓN DE IMÁGENES ] ----------------------
function manejarEventosImagenes() {
    document.getElementById("contenido").addEventListener("click", function (event) {
        if (event.target.classList.contains("btn-rotate")) {
            const img = event.target.previousElementSibling;
            rotarImagen(img);
        }
    });
}

function rotarImagen(img) {
    let rotation = parseInt(img.getAttribute("data-rotation")) || 0;
    rotation = (rotation + 45) % 360;

    img.style.transform = `rotate(${rotation}deg)`;
    img.setAttribute("data-rotation", rotation);
}

// ---------------------- [ GENERAR PDF ] ----------------------
function generarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "mm", "a4");

    // Mostrar la barra de progreso
    document.getElementById("progressContainer").style.display = "block";
    const progressBar = document.getElementById("progressBar");

    const anchoPagina = doc.internal.pageSize.getWidth();
    const margenIzquierdo = 15;
    const maxWidth = 65, maxHeight = 50; // Tamaño optimizado para 4 filas
    const espacio = 5;
    const imagenesPorFila = 3;
    const filasPorPagina = 4; // Ahora se muestran 4 filas por página

    const titulo = "Trabajos en Material Rodante";
    const taller = document.getElementById("tallerSelect").value;
    const trabajo = document.getElementById("trabajoRealizado").value;
    const leyenda = document.getElementById("leyendaInput").value;

    const imgHeader = new Image();
    imgHeader.src = './img/Trenes_arg_operac_logo.png';

    imgHeader.onload = function () {
        // Fondo del encabezado
        doc.setFillColor(30, 144, 255); // Azul vibrante
        doc.rect(0, 0, 210, 25, "F");

        // Agregar logo
        doc.addImage(imgHeader, "PNG", 10, 5, 30, 15);

        // Título principal
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255); // Blanco
        doc.setFontSize(14);
        doc.text("Trenes Argentinos - Áreas Complementarias", 50, 15);

        // Línea divisoria
        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.line(10, 27, 200, 27);

        // Título de la sección
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(16);
        doc.text(titulo, margenIzquierdo, 35);

        // Detalles del taller y trabajo
        doc.setFontSize(12);
        doc.setTextColor(0, 102, 204);
        doc.text(`Taller:`, margenIzquierdo, 45);
        doc.setTextColor(0, 0, 0);
        doc.text(taller, margenIzquierdo + 20, 45);

        doc.setTextColor(0, 102, 204);
        doc.text(`Trabajo Realizado:`, margenIzquierdo, 51);
        doc.setTextColor(0, 0, 0);
        doc.text(trabajo, margenIzquierdo + 40, 51);

        doc.setTextColor(0, 102, 204);
        doc.text(`Leyenda:`, margenIzquierdo, 57);
        doc.setTextColor(0, 0, 0);
        doc.text(leyenda, margenIzquierdo + 20, 57);

        const imagenes = document.querySelectorAll(".imagen-contenedor img");

        if (imagenes.length === 0) {
            alert("No hay imágenes para generar el PDF.");
            document.getElementById("progressContainer").style.display = "none";
            return;
        }

        const anchoTotalImagenes = imagenesPorFila * maxWidth + (imagenesPorFila - 1) * espacio;
        const xInicial = (anchoPagina - anchoTotalImagenes) / 2;
        let x = xInicial, y = 65;
        let count = 0;
        let totalImagenes = imagenes.length;
        let procesadas = 0;
        let filasEnPagina = 0;

        const procesarImagenes = async () => {
            for (let img of imagenes) {
                const rotation = parseInt(img.getAttribute("data-rotation")) || 0;
                const imgData = await convertirImagenConRotacion(img, rotation, maxWidth * 4, maxHeight * 4, 1);

                // Fondo de imagen
                doc.setFillColor(230, 230, 230);
                doc.rect(x - 3, y - 3, maxWidth + 6, maxHeight + 6, "F");

                // Marco de imagen
                doc.setDrawColor(30, 144, 255);
                doc.setLineWidth(1);
                doc.rect(x - 2, y - 2, maxWidth + 4, maxHeight + 4);

                // Agregar imagen
                doc.addImage(imgData, "WEBP", x, y, maxWidth, maxHeight);

                x += maxWidth + espacio;
                count++;
                procesadas++;

                // Actualizar barra de progreso
                progressBar.value = (procesadas / totalImagenes) * 100;

                if (count === imagenesPorFila) {
                    x = xInicial;
                    y += maxHeight + espacio + 2; // Ajuste fino para evitar espacios innecesarios
                    count = 0;
                    filasEnPagina++;
                }

                if (filasEnPagina === filasPorPagina) {
                    doc.addPage();
                    filasEnPagina = 0;
                    y = 20;
                    x = xInicial;
                }
            }

            // Pie de página
            doc.setFillColor(30, 144, 255);
            doc.rect(0, 285, 210, 15, "F");
            doc.setFontSize(10);
            doc.setTextColor(255, 255, 255);
            doc.text("Documento generado automáticamente por el sistema", 60, 294);

            // Ocultar barra y descargar PDF
            document.getElementById("progressContainer").style.display = "none";
            doc.save("trabajos_material_rodante.pdf");
        };

        procesarImagenes();
    };
}


// Función para convertir imágenes sin deformaciones y con rotación
async function convertirImagenConRotacion(img, rotation, canvasWidth, canvasHeight) {
    return new Promise((resolve) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        const imgObj = new Image();
        imgObj.crossOrigin = "anonymous";
        imgObj.src = img.src;

        imgObj.onload = function () {
            const naturalWidth = imgObj.naturalWidth;
            const naturalHeight = imgObj.naturalHeight;

            // Usar la resolución original de la imagen para mayor claridad
            const scaleFactor = Math.min(canvasWidth / naturalWidth, canvasHeight / naturalHeight);
            const dpiFactor = Math.max(2, window.devicePixelRatio || 2);

            const finalWidth = naturalWidth * scaleFactor * dpiFactor;
            const finalHeight = naturalHeight * scaleFactor * dpiFactor;

            if (rotation === 90 || rotation === 270) {
                canvas.width = finalHeight;
                canvas.height = finalWidth;
            } else {
                canvas.width = finalWidth;
                canvas.height = finalHeight;
            }

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((rotation * Math.PI) / 180);

            // Dibujar la imagen con interpolación de calidad
            ctx.drawImage(imgObj, -finalWidth / 2, -finalHeight / 2, finalWidth, finalHeight);

            // Convertir a imagen WebP o PNG con calidad alta
            resolve(canvas.toDataURL("image/webp", 1.0));
        };

        imgObj.onerror = function () {
            console.error("Error cargando la imagen.");
            resolve(null);
        };
    });
}




// ---------------------- [ RECARGAR PÁGINA ] ----------------------
function recargar() {
    setTimeout(() => location.reload(), 1000);
}
