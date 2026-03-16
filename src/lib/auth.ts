import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";
import type { User } from "@/types";

const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  const { uid, email, displayName, photoURL } = result.user;

  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid,
      email,
      displayName,
      photoURL,
      createdAt: serverTimestamp(),
    });
  }

  return {
    uid,
    email: email!,
    displayName: displayName || "User",
    photoURL,
    createdAt: new Date(),
  };
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}
