// =============================================================================
// compressImage.js — Compressão de imagem client-side via Canvas
//
// Redimensiona a imagem para no máximo 1280px de largura/altura e comprime
// para JPEG com 85% de qualidade. Isso mantém boa qualidade visual e garante
// que o arquivo fique bem abaixo do limite de 4.5MB do Vercel.
// =============================================================================

const MAX_DIMENSION = 1280;
const QUALITY = 0.85;

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

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Falha ao comprimir imagem."));
            return;
          }
          const compressed = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
            type: "image/jpeg",
          });
          resolve(compressed);
        },
        "image/jpeg",
        QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Não foi possível carregar a imagem."));
    };

    img.src = objectUrl;
  });
}
