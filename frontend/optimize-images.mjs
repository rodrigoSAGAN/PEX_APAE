import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Instala sharp se não estiver disponível
try {
  await import('sharp');
} catch {
  console.log('📦 Instalando sharp...');
  execSync('npm install sharp --save-dev', { stdio: 'inherit', cwd: __dirname });
}

const sharp = (await import('sharp')).default;
import { readdir, stat, unlink, rename } from 'fs/promises';

const IMAGES_DIR = path.join(__dirname, 'public', 'images');
const MAX_SIZE_KB = 300;
const MAX_SIZE_BYTES = MAX_SIZE_KB * 1024;

// Extensões suportadas para conversão
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.JPG', '.JPEG', '.PNG'];

async function getAllImages(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const subFiles = await getAllImages(fullPath);
      files.push(...subFiles);
    } else {
      const ext = path.extname(entry.name);
      if (SUPPORTED_EXTENSIONS.includes(ext)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

async function getFileSizeKB(filePath) {
  const stats = await stat(filePath);
  return (stats.size / 1024).toFixed(1);
}

async function convertToWebP(inputPath) {
  const dir = path.dirname(inputPath);
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const outputPath = path.join(dir, `${baseName}.webp`);

  const originalSizeKB = await getFileSizeKB(inputPath);

  // Tenta converter com qualidade 80 primeiro
  let quality = 80;
  let converted = false;

  while (quality >= 20) {
    await sharp(inputPath)
      .webp({ quality, effort: 6 })
      .toFile(outputPath);

    const newSizeKB = await getFileSizeKB(outputPath);

    if (parseFloat(newSizeKB) <= MAX_SIZE_KB) {
      converted = true;
      console.log(`  ✅ ${path.relative(IMAGES_DIR, inputPath)}`);
      console.log(`     ${originalSizeKB}KB → ${newSizeKB}KB (qualidade: ${quality})`);
      break;
    }

    // Se ainda grande, reduz qualidade
    quality -= 10;
  }

  if (!converted) {
    // Se mesmo com qualidade baixa ainda está grande, redimensiona
    const metadata = await sharp(inputPath).metadata();
    const scaleFactor = Math.sqrt(MAX_SIZE_BYTES / (parseFloat(originalSizeKB) * 1024));
    const newWidth = Math.round(metadata.width * scaleFactor);

    await sharp(inputPath)
      .resize(newWidth)
      .webp({ quality: 75, effort: 6 })
      .toFile(outputPath);

    const newSizeKB = await getFileSizeKB(outputPath);
    console.log(`  ✅ ${path.relative(IMAGES_DIR, inputPath)}`);
    console.log(`     ${originalSizeKB}KB → ${newSizeKB}KB (redimensionado para ${newWidth}px)`);
  }

  // Remove o arquivo original
  await unlink(inputPath);

  return outputPath;
}

async function main() {
  console.log('🖼️  Otimizador de Imagens - Conversão para WebP');
  console.log(`📁 Pasta: ${IMAGES_DIR}`);
  console.log(`📏 Tamanho máximo: ${MAX_SIZE_KB}KB`);
  console.log('─'.repeat(50));

  if (!existsSync(IMAGES_DIR)) {
    console.error('❌ Pasta de imagens não encontrada:', IMAGES_DIR);
    process.exit(1);
  }

  const images = await getAllImages(IMAGES_DIR);

  if (images.length === 0) {
    console.log('ℹ️  Nenhuma imagem para converter encontrada.');
    process.exit(0);
  }

  console.log(`\n📸 ${images.length} imagem(ns) encontrada(s):\n`);

  let totalOriginalKB = 0;
  let totalNewKB = 0;

  for (const imagePath of images) {
    // Pula se já for WebP
    if (imagePath.endsWith('.webp')) continue;

    totalOriginalKB += parseFloat(await getFileSizeKB(imagePath));
    const outputPath = await convertToWebP(imagePath);
    totalNewKB += parseFloat(await getFileSizeKB(outputPath));
  }

  console.log('\n' + '─'.repeat(50));
  console.log(`\n🎉 Concluído!`);
  console.log(`   Tamanho original total: ${totalOriginalKB.toFixed(0)}KB`);
  console.log(`   Tamanho final total:    ${totalNewKB.toFixed(0)}KB`);
  console.log(`   Economia:               ${(totalOriginalKB - totalNewKB).toFixed(0)}KB (${((1 - totalNewKB/totalOriginalKB) * 100).toFixed(0)}% menor)`);
  console.log('\n⚠️  Lembre-se de atualizar as referências nas imagens no código (extensões .jpg/.png → .webp)');
}

main().catch(console.error);
