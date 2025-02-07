document.addEventListener("DOMContentLoaded", function () {
    const usuariosValidos = [
        { usuario: "admin", hash: "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4" },
        { usuario: "usuario1", hash: "f8638b979b2f4f793ddb6dbd197e0ee25a7a6ea32b0ae22f5e3c5d119d839e75" }
    ];

    async function calcularHash(texto) {
        const encoder = new TextEncoder();
        const data = encoder.encode(texto);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        return Array.from(new Uint8Array(hashBuffer)).map(byte => byte.toString(16).padStart(2, '0')).join('');
    }

    function mostrarLogin() {
        document.body.innerHTML = `
            <div class='container text-center'>
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

    if (!localStorage.getItem("usuario")) {
        mostrarLogin();
    } else {
        document.body.insertAdjacentHTML("afterbegin", `
            <div class='container text-end mt-3'>
                <span class='me-3'>Usuario: <strong>${localStorage.getItem("usuario")}</strong></span>
                <button class='btn btn-danger btn-sm' onclick='cerrarSesion()'>Cerrar Sesión</button>
            </div>
        `);
    }
});


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

                div.appendChild(img);
                contenido.appendChild(div);
            };

            reader.readAsDataURL(file);
        });
    }
}


function generarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    const titulo = "Trabajos en Material Rodante";
    const taller = document.getElementById("tallerSelect").value;
    const trabajo = document.getElementById("trabajoRealizado").value;
    const leyenda = document.getElementById("leyendaInput").value;

    // Encabezado con imagen y texto
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

    const elemento = document.getElementById("contenido");
    html2canvas(elemento, { scale: 1.5 }).then(canvas => {
        const imgData = canvas.toDataURL("image/jpeg", 0.7);
        const imgWidth = 190;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        doc.addImage(imgData, "JPEG", 10, 70, imgWidth, imgHeight);

        // Pie de página con derechos del desarrollador
        doc.setFontSize(10);
        doc.text("© Derechos del desarrollador", 10, 290);

        doc.save("trabajos_material_rodante.pdf");
    });
    setTimeout(() => {

        location.reload(); // Recarga la página después de generar el PDF
    }, 2000);
}