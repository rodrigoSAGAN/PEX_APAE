// =============================================================================
// cloudinary.js — Configuração e helper de upload para o Cloudinary.
// Substitui o Firebase Storage para armazenamento de imagens.
// =============================================================================

import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Faz upload de um buffer de imagem para o Cloudinary e retorna a URL pública.
export function uploadToCloudinary(buffer, folder = "uploads") {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

export default cloudinary;
