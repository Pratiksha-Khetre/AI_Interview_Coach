// Frontend\lib\interviews-store.ts - Firestore read/write helpers for a user's saved interview reports

import {
  collection,
  doc,
  setDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface CommunicationAnalysis {
  average_answer_duration: number;
  average_wpm: number;
  total_filler_words: number;
  most_common_filler_word: string | null;
  answers_analyzed: number;
}

// Fields the caller provides when an interview finishes.
export interface SavedInterviewReport {
  interviewId: string;
  role: string;
  interviewType: string;
  difficulty: string;
  duration: number;
  correctness: number;
  clarity: number;
  completeness: number;
  relevance: number;
  overallScore: number;
  communicationAnalysis?: CommunicationAnalysis | null;
}

// What comes back out of Firestore (adds the server-assigned timestamp).
export interface StoredInterviewReport extends SavedInterviewReport {
  completedAt: Timestamp | null;
}

/**
 * Saves a completed interview report under users/{uid}/interviews/{interviewId}.
 * Using the interviewId as the doc ID makes this safe to call more than once
 * for the same interview without creating duplicates.
 */
export async function saveInterviewReport(
  uid: string,
  report: SavedInterviewReport,
): Promise<void> {
  const ref = doc(db, "users", uid, "interviews", report.interviewId);

  await setDoc(ref, {
    ...report,
    completedAt: serverTimestamp(),
  });
}

/**
 * Fetches all of a user's saved interview reports, newest first.
 */
export async function getUserInterviews(
  uid: string,
): Promise<StoredInterviewReport[]> {
  const interviewsRef = collection(db, "users", uid, "interviews");
  const interviewsQuery = query(interviewsRef, orderBy("completedAt", "desc"));

  const snapshot = await getDocs(interviewsQuery);

  return snapshot.docs.map(
    (docSnap) => docSnap.data() as StoredInterviewReport,
  );
}
