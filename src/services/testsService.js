// src/services/testsService.js
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  limit as limitFn,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase"; // <-- adjust if your firebase export path differs

export async function saveTest({
  uid,
  inputs,
  prediction,
  confidence,
  prob_potable,
  prob_not_potable,
  issues,
}) {
  if (!uid) throw new Error("Missing uid");
  const payload = {
    uid,
    createdAt: serverTimestamp(),
    inputs,
    prediction,
    confidence,
    prob_potable,
    prob_not_potable,
    issues: issues || [],
  };
  await addDoc(collection(db, "tests"), payload);
}

/**
 * Realtime subscription to user's tests.
 * Returns unsubscribe().
 */
export function subscribeToRecentTests(uid, limitN, onData, onError) {
  if (!uid) {
    onData([]);
    return () => {};
  }

  const q = query(
    collection(db, "tests"),
    where("uid", "==", uid),
    orderBy("createdAt", "desc"),
    limitFn(limitN || 200)
  );

  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      onData(rows);
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}
