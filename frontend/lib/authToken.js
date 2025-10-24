import { getAuth } from "firebase/auth";

export async function getIdTokenOrNull() {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return null;
  return await user.getIdToken();
}