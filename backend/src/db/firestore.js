// Importamos o SDK Admin do Firebase — ele dá poderes de "dono" ao backend,
// como criar tokens customizados, acessar o Firestore sem restrições de regras, etc.
import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";

// Em módulos ES (ESM), as variáveis __filename e __dirname não existem nativamente
// como existem no CommonJS. Precisamos reconstruí-las manualmente a partir da URL
// do módulo atual — é um passo chato mas necessário.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Aqui decidimos onde está a chave de serviço do Firebase.
// Em produção (ex: Cloud Run, Render), a variável de ambiente GOOGLE_APPLICATION_CREDENTIALS
// aponta para o arquivo de credenciais — não precisamos expor o arquivo no repositório.
// Em desenvolvimento local, caímos no fallback e lemos o arquivo diretamente da pasta do projeto.
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  ? path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS)
  : path.join(__dirname, "../../serviceAccountKey.json");

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"));

// Essa verificação evita que o Firebase seja inicializado mais de uma vez.
// Em ambientes com hot-reload (como o Next.js em modo dev), esse módulo pode ser
// recarregado várias vezes — sem essa guarda, causaria um erro de "app já existe".
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

// A instância do Firestore — é o que usamos em todo o backend
// para ler e escrever dados. Exportamos tanto o 'admin' (para operações de auth)
// quanto o 'db' (para operações no banco de dados).
const db = admin.firestore();

export { admin, db };
export default admin;
