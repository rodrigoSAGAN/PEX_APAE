import admin from "firebase-admin";
import { readFileSync } from "fs";

const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || "./backend/serviceAccountKey.json";
const creds = JSON.parse(readFileSync(keyPath, "utf-8"));

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(creds) });
}

const uid = process.argv[2];
const rolesArg = process.argv[3] || "admin"; // ex.: "admin,editor"
const roles = rolesArg.split(",").map(s => s.trim()).filter(Boolean);

if (!uid) {
  console.error("Uso: node scripts/set-claims.js <UID> [rolesSeparadasPorVirgula]");
  process.exit(1);
}

try {
  await admin.auth().setCustomUserClaims(uid, { roles });
  console.log(`OK: claims definidas para UID=${uid}:`, roles);
  process.exit(0);
} catch (e) {
  console.error("Falha ao definir claims:", e.message);
  process.exit(1);
}