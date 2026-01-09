import { Exam, ExamStatus, Prediction } from '@/types';

/**
 * Berechnet den Status einer Prüfung basierend auf Datum und Abschluss-Zeitpunkt
 */
export function getExamStatus(exam: Exam): ExamStatus {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const examDate = new Date(exam.date);
  examDate.setHours(0, 0, 0, 0);
  
  // Wenn manuell geschlossen, ist es immer "closed"
  if (exam.isClosed) {
    return 'closed';
  }

  // Berechne Tage seit Prüfungsdatum
  const daysSinceExam = Math.floor((now.getTime() - examDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // 1 Tag nach Prüfung -> "In Auswertung" (Schüler haben noch 4 Tage Zeit)
  if (daysSinceExam >= 1 && daysSinceExam < 5) {
    return 'evaluation';
  }
  
  // 5 Tage nach Prüfung -> automatisch "Abgeschlossen"
  if (daysSinceExam >= 5) {
    return 'closed';
  }
  
  // Vor oder am Tag der Prüfung -> "Offen"
  return 'open';
}

/**
 * Prüft ob eine Prüfung noch Tipps erlaubt
 */
export function canSubmitTips(exam: Exam): boolean {
  const status = getExamStatus(exam);
  return status === 'open' || status === 'evaluation';
}

/**
 * Prüft ob ein Schüler noch keinen Tipp abgegeben hat
 */
export function hasNoTips(examId: string, studentId: string, predictions: Prediction[]): boolean {
  const prediction = predictions.find(p => p.examId === examId && p.studentId === studentId);
  return !prediction || (prediction.prediction1 === undefined && prediction.prediction2 === undefined);
}

/**
 * Prüft ob beide Tipps abgegeben wurden
 */
export function hasBothTips(examId: string, studentId: string, predictions: Prediction[]): boolean {
  const prediction = predictions.find(p => p.examId === examId && p.studentId === studentId);
  return prediction !== undefined && 
         prediction.prediction1 !== undefined && 
         prediction.prediction2 !== undefined;
}

/**
 * Sortiert Prüfungen nach Datum (nächste zuerst für offene, neueste zuerst für abgeschlossene)
 */
export function sortExamsByStatus(exams: Exam[], status: ExamStatus): Exam[] {
  const sorted = [...exams];
  if (status === 'open' || status === 'evaluation') {
    // Nächste Prüfung zuerst (aufsteigend nach Datum)
    return sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } else {
    // Neueste Prüfung zuerst (absteigend nach Datum)
    return sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}

