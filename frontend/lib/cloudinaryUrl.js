// =============================================================================
// cloudinaryUrl.js — Geração de URLs responsivas para imagens do Cloudinary
//
// Insere transformações diretamente na URL do Cloudinary para que o browser
// receba a imagem já no tamanho e qualidade certos — sem processamento extra.
//
// Tamanhos utilizados:
//   mobile  → w_480,  q_auto, f_webp  ≈ até 100 KB
//   desktop → w_1200, q_auto, f_webp  ≈ até 300 KB
//
// Uso:
//   import { cloudinaryUrl, cloudinarySrcSet } from "@/lib/cloudinaryUrl";
//
//   <img src={cloudinaryUrl(url)} srcSet={cloudinarySrcSet(url)} sizes="..." />
// =============================================================================

/**
 * Retorna a URL do Cloudinary com transformações aplicadas.
 * Passa a URL original sem alteração se não for do Cloudinary.
 *
 * @param {string} url       URL original da imagem
 * @param {object} opts
 * @param {number} [opts.width]          Largura máxima (c_limit)
 * @param {string} [opts.quality="auto"] Qualidade (q_auto ou número 1-100)
 * @param {string} [opts.format="webp"]  Formato de saída
 */
export function cloudinaryUrl(url, { width, quality = "auto", format = "webp" } = {}) {
  if (!url || !url.includes("res.cloudinary.com")) return url;

  const parts = [`q_${quality}`, `f_${format}`];
  if (width) parts.push(`c_limit,w_${width}`);

  return url.replace("/upload/", `/upload/${parts.join(",")}/`);
}

/**
 * Gera o atributo srcSet com duas entradas:
 *   480w  → mobile  (≈100 KB)
 *   1200w → desktop (≈300 KB)
 */
export function cloudinarySrcSet(url) {
  if (!url || !url.includes("res.cloudinary.com")) return undefined;

  const mobile  = cloudinaryUrl(url, { width: 480 });
  const desktop = cloudinaryUrl(url, { width: 1200 });

  return `${mobile} 480w, ${desktop} 1200w`;
}
