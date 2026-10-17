
const foto = document.getElementById("foto");
const vistaPrevia = document.getElementById("vista-previa");
const texto = document.getElementById("texto");
const boton = document.getElementById("traducir");
const resultado = document.getElementById("resultado");
const estado = document.getElementById("estado");

let imagenSeleccionada = null;

async function leerTextoDeImagen(archivo) {

    if (!window.Tesseract) {
        throw new Error("Tesseract no se cargó correctamente.");
    }

    const worker = await window.Tesseract.createWorker("spa");

    try {
        const resultado = await worker.recognize(archivo);
        return resultado.data.text.trim();
    } finally {
        await worker.terminate();
    }
}


foto.addEventListener("change", () => {
    const archivo = foto.files[0];

    if (!archivo) return;

    if (!archivo.type.startsWith("image/")) {
        estado.textContent = "Selecciona una imagen válida.";
        foto.value = "";
        return;
    }

    imagenSeleccionada = archivo;
    vistaPrevia.src = URL.createObjectURL(archivo);
    vistaPrevia.style.display = "block";
    estado.textContent = "Foto cargada correctamente.";
});

boton.addEventListener("click", async () => {
    
    let contenido = texto.value.trim();

    if (imagenSeleccionada) {
        estado.textContent = "Leyendo el texto de tu foto...";
        try {
            const textoDeLaFoto = await leerTextoDeImagen(imagenSeleccionada)
            console.log("TEXTO DETECTADO EN LA FOTO:", textoDeLaFoto);;
            contenido = [contenido, textoDeLaFoto]
                .filter(Boolean)
                .join("\n\n");
        } catch (error) {
            console.error("Error al leer la imagen:", error);
            estado.textContent = "No se pudo leer la foto. Intenta con una imagen más clara.";
            return;
        }
    }


    if (!contenido && !imagenSeleccionada) {
        estado.textContent = "Escribe un texto o selecciona una foto.";
        return;
    }

    estado.textContent = "Gemma está procesando tu texto...";
    resultado.textContent = "";
    boton.disabled = true;

    try {
        const respuesta = await fetch(
    "/api/chat",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "google/gemma-4-e4b",
                    messages: [
                        {
                            role: "system",
                            content: "Eres traductor.ai, un asistente educativo. Detecta el idioma del texto, tradúcelo al español y, si contiene preguntas académicas, respóndelas con explicaciones claras. Si solo se proporciona una imagen sin texto legible, pide al usuario que escriba el contenido."
                        },
                        {
                            role: "user",
                            content: contenido || "He subido una imagen, pero todavía necesito leer su contenido."
                        }
                    ],
                    temperature: 0.3
                })
            }
        );

        if (!respuesta.ok) {
            throw new Error("Error HTTP " + respuesta.status);
        }

        const datos = await respuesta.json();
const respuestaGemma =
    datos.choices?.[0]?.message?.content ||
    "No se recibió una respuesta del modelo.";


resultado.textContent = respuestaGemma
    .replace(/\*\*/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .trim();


        estado.textContent = "¡Respuesta generada por Gemma!";

    } catch (error) {
        console.error(error);
        estado.textContent =
            "No se pudo conectar con Gemma. Comprueba que LM Studio siga abierto y que el servidor esté activo.";
    } finally {
        boton.disabled = false;
    }
});

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("./service-worker.js")
            .then(() => {
                console.log("PWA activada correctamente");
            })
            .catch((error) => {
                console.error("Error al activar la PWA:", error);
            });
    });
}
