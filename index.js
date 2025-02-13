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
    const doc = new jsPDF('p', 'mm', 'a4');

    const titulo = "Trabajos en Material Rodante";
    const taller = document.getElementById("tallerSelect").value;
    const trabajo = document.getElementById("trabajoRealizado").value;
    const leyenda = document.getElementById("leyendaInput").value;

    const imgHeader = new Image();
    imgHeader.src = './img/Trenes_arg_operac_logo.png';
    doc.addImage(imgHeader, "PNG", 10, 5, 30, 15);
    doc.setFontSize(14);
    doc.text("Trenes Argentinos - Áreas Complementarias", 50, 15);

    doc.setFontSize(16);
    doc.text(titulo, 10, 30);
    doc.setFontSize(12);
    doc.text(`Taller: ${taller}`, 10, 40);
    doc.text(`Trabajo Realizado: ${trabajo}`, 10, 50);
    doc.text(`Leyenda: ${leyenda}`, 10, 60);

    let x = 10, y = 80;
    const maxWidth = 60, maxHeight = 50, espacio = 10;
    let count = 0;

    const imagenes = document.querySelectorAll(".imagen-contenedor img");

    const procesarImagenes = async () => {
        for (let img of imagenes) {
            const contenedor = img.parentElement;
            const bgColor = window.getComputedStyle(contenedor).backgroundColor;
            const borderColor = window.getComputedStyle(contenedor).borderColor;
            const borderWidth = parseInt(window.getComputedStyle(contenedor).borderWidth) || 2;

            const rgb = bgColor.match(/\d+/g);
            const borderRgb = borderColor.match(/\d+/g);
            const rotation = parseInt(img.getAttribute("data-rotation")) || 0;

            // Dibujar fondo de color del contenedor
            if (rgb) {
                doc.setFillColor(parseInt(rgb[0]), parseInt(rgb[1]), parseInt(rgb[2]));
                doc.rect(x, y, maxWidth, maxHeight, "F");
            }

            // Dibujar borde del contenedor
            if (borderRgb) {
                doc.setDrawColor(parseInt(borderRgb[0]), parseInt(borderRgb[1]), parseInt(borderRgb[2]));
                doc.setLineWidth(borderWidth / 2);
                doc.rect(x, y, maxWidth, maxHeight, "S");
            }

            // Convertir imagen con calidad y rotación
            const imgData = await convertirImagenConRotacion(img, rotation, maxWidth * 4, maxHeight * 4, 0.95);
            doc.addImage(imgData, "WEBP", x, y, maxWidth, maxHeight);

            x += maxWidth + espacio;
            count++;

            if (count === 3) {
                x = 10;
                y += maxHeight + espacio;
                count = 0;
            }

            if (y + maxHeight > 280) {
                doc.addPage();
                y = 20;
            }
        }

        doc.setFontSize(10);
        doc.text("© Derechos del desarrollador", 10, 290);
        doc.save("trabajos_material_rodante.pdf");
    };

    procesarImagenes();
}


async function convertirImagenConRotacion(img, rotation, canvasWidth, canvasHeight, quality) {
    return new Promise((resolve) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        const imgObj = new Image();
        imgObj.src = img.src;
        imgObj.onload = function () {
            const naturalWidth = imgObj.naturalWidth;
            const naturalHeight = imgObj.naturalHeight;

            const scaleFactor = Math.min(canvasWidth / naturalWidth, canvasHeight / naturalHeight);
            const finalWidth = naturalWidth * scaleFactor;
            const finalHeight = naturalHeight * scaleFactor;

            if (rotation === 90 || rotation === 270) {
                canvas.width = finalHeight;
                canvas.height = finalWidth;
            } else {
                canvas.width = finalWidth;
                canvas.height = finalHeight;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.drawImage(imgObj, -finalWidth / 2, -finalHeight / 2, finalWidth, finalHeight);

            resolve(canvas.toDataURL("image/webp", quality));
        };
    });
}



// ---------------------- [ RECARGAR PÁGINA ] ----------------------
function recargar() {
    setTimeout(() => location.reload(), 1000);
}
