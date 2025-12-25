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
  limit,
  getDocs
} from "firebase/firestore";
import { db } from "../firebase";

export async function saveTest({
  uid,
  inputs,
  barangay,
  prediction,
  confidence,
  prob_potable,
  prob_not_potable,
  issues,
}) {
  if (!uid) throw new Error("Missing uid");
  
  console.log("saveTest called with:", {
    uid,
    inputs,
    barangay,
    prediction,
    confidence,
    prob_potable,
    prob_not_potable,
    issues,
  });

  const validatedInputs = {};
  const requiredFields = [
    'ph', 'hardness', 'solids', 'chloramines', 'sulfate',
    'conductivity', 'organic_carbon', 'trihalomethanes', 'turbidity'
  ];
  
  requiredFields.forEach(field => {
    const value = inputs?.[field];
    validatedInputs[field] = value !== undefined && value !== null ? 
      parseFloat(value) || 0 : 0;
  });

  const payload = {
    uid,
    createdAt: serverTimestamp(),
    inputs: validatedInputs,
    barangay: barangay || "",
    prediction: prediction || "Unknown",
    confidence: confidence !== undefined ? parseFloat(confidence) || 0 : 0,
    prob_potable: prob_potable !== undefined ? parseFloat(prob_potable) || 0 : 0,
    prob_not_potable: prob_not_potable !== undefined ? parseFloat(prob_not_potable) || 0 : 0,
    issues: Array.isArray(issues) ? issues : [],
  };

  console.log("Saving payload to Firestore:", payload);

  try {
    const docRef = await addDoc(collection(db, "tests"), payload);
    console.log("Document written with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding document:", error);
    throw error;
  }
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

  console.log("Setting up subscription for user:", uid);

  return onSnapshot(
    q,
    (snap) => {
      console.log("Snapshot received with", snap.size, "documents");
      const rows = snap.docs.map((d) => ({ 
        id: d.id, 
        ...d.data(),
        // Ensure createdAt is a Firestore timestamp
        createdAt: d.data().createdAt 
      }));
      console.log("Processed rows:", rows);
      onData(rows);
    },
    (err) => {
      console.error("Subscription error:", err);
      if (onError) onError(err);
    }
  );
}

export const getRecentPredictions = async (userId, limitCount = 5) => {
  try {
    console.log("Fetching recent predictions for user:", userId);
    const testsRef = collection(db, "tests");
    
    // Try with orderBy first, if it fails, try without
    let q;
    try {
      q = query(
        testsRef,
        where("uid", "==", userId),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );
    } catch (error) {
      console.log("Index error, trying without orderBy...");
      q = query(
        testsRef,
        where("uid", "==", userId),
        limit(limitCount)
      );
    }
    
    const querySnapshot = await getDocs(q);
    console.log("Query snapshot size:", querySnapshot.size);
    
    const predictions = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt
      };
    });
    
    // Sort manually if we didn't use orderBy
    if (!predictions.some(p => p.createdAt && p.createdAt.toDate)) {
      predictions.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA; // Descending
      });
    }
    
    console.log("Returning predictions:", predictions.length);
    return predictions;
  } catch (error) {
    console.error("Error getting recent predictions:", error);
    
    if (error.code === 'failed-precondition') {
      console.error("=== FIX REQUIRED ===");
      console.error("Please create a Firestore composite index:");
      console.error("1. Go to Firebase Console → Firestore → Indexes");
      console.error("2. Click 'Create Index'");
      console.error("3. Collection ID: tests");
      console.error("4. Fields:");
      console.error("   - Field: uid, Type: Ascending");
      console.error("   - Field: createdAt, Type: Descending");
      console.error("5. Click 'Create Index' (takes a few minutes)");
      console.error("=====================");
      
      // Return empty array for now
      return [];
    }
    
    console.error("Full error:", error);
    return [];
  }
};