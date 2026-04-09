// =============================================================================
// compressImage.js — Compressão e conversão de imagem client-side via Canvas
//
// Converte qualquer imagem para WebP e reduz a qualidade progressivamente
// até o arquivo ficar abaixo de MAX_SIZE_BYTES (300 KB).
// Mantém proporção original e limita as dimensões a MAX_DIMENSION px.
// =============================================================================

const MAX_DIMENSION = 1600;
const MAX_SIZE_BYTES = 300 * 1024; // 300 KB
const QUALITY_START = 0.85;
const QUALITY_MIN = 0.25;
const QUALITY_STEP = 0.05;

export function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);

      // Tenta WebP com qualidade decrescente até caber em MAX_SIZE_BYTES
      const tryCompress = (quality) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Falha ao comprimir imagem."));
              return;
            }

            if (blob.size <= MAX_SIZE_BYTES || quality <= QUALITY_MIN) {
              resolve(
                new File(
                  [blob],
                  file.name.replace(/\.[^.]+$/, ".webp"),
                  { type: "image/webp" }
                )
              );
            } else {
              tryCompress(Math.max(quality - QUALITY_STEP, QUALITY_MIN));
            }
          },
          "image/webp",
          quality
        );
      };

      tryCompress(QUALITY_START);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Não foi possível carregar a imagem."));
    };

    img.src = objectUrl;
  });
}
