import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho do serviceAccountKey
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  ? path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS)
  : path.join(__dirname, "../../serviceAccountKey.json");

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"));

// Inicializa o admin 
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

const db = admin.firestore();

export { admin, db };
export default admin;
