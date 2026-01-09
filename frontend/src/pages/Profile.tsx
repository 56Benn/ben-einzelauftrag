import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { getExams, getPredictions, getUsers } from '@/lib/storage';
import { formatGrade } from '@/lib/points';
import { Target, Calendar } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const [examResults, setExamResults] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadExamResults();
    }
  }, [user]);

  const loadExamResults = () => {
    if (!user) return;

    const exams = getExams();
    const predictions = getPredictions();
    const students = getUsers().filter((u) => u.role === 'student');

    const results = exams
      .filter((exam) => exam.isClosed && exam.grades && exam.grades[user.id])
      .map((exam) => {
        const prediction = predictions.find(
          (p) => p.examId === exam.id && p.studentId === user.id
        );

        // Calculate rank for this exam
        const examPredictions = predictions.filter((p) => p.examId === exam.id);
        const examRankings = students
          .map((student) => {
            const pred = examPredictions.find((p) => p.studentId === student.id);
            const totalPoints = (pred?.points1 || 0) + (pred?.points2 || 0);
            return { studentId: student.id, totalPoints };
          })
          .sort((a, b) => b.totalPoints - a.totalPoints);

        const userRank = examRankings.findIndex((r) => r.studentId === user.id) + 1;
        const userTotalPoints = examRankings.find((r) => r.studentId === user.id)?.totalPoints || 0;

        return {
          examId: exam.id,
          examTitle: exam.title,
          examSubject: exam.subject,
          examDate: exam.date,
          grade: exam.grades![user.id],
          rank: userRank,
          totalPoints: userTotalPoints,
          prediction1: prediction?.prediction1,
          prediction2: prediction?.prediction2,
          points1: prediction?.points1,
          points2: prediction?.points2,
        };
      })
      .sort((a, b) => new Date(b.examDate).getTime() - new Date(a.examDate).getTime());

    setExamResults(results);
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-slate-900">Profil</h1>
        <p className="text-slate-600 text-sm">Ihre Prüfungsergebnisse und Vorhersagen im Überblick</p>
      </div>

      {examResults.length === 0 ? (
        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardContent className="py-16 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
              <Target size={28} className="text-slate-400" />
            </div>
            <p className="text-slate-700 font-medium text-sm mb-1">Noch keine abgeschlossenen Prüfungen</p>
            <p className="text-slate-500 text-xs">Sobald Prüfungen benotet wurden, erscheinen sie hier</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {examResults.map((result) => (
            <Card key={result.examId} className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left side - Exam info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
                        <Calendar size={18} className="text-slate-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{result.examTitle}</h3>
                        <p className="text-xs text-slate-600 mt-0.5 font-medium">
                          {result.examSubject}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 font-medium bg-slate-50 p-2 rounded-lg border border-slate-200">
                      {new Date(result.examDate).toLocaleDateString('de-CH', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>

                  {/* Right side - Results */}
                  <div className="space-y-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-800 text-sm">Ergebnis:</span>
                        <span className="text-xl font-bold text-blue-700">{formatGrade(result.grade)}</span>
                      </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-800 text-sm">Rang:</span>
                        <span className="text-sm font-semibold text-slate-700">
                          {result.rank}. Platz, {result.totalPoints}pkt
                        </span>
                      </div>
                    </div>
                    {result.prediction1 !== undefined && (
                      <div className="pt-3 border-t border-slate-200 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-slate-700 text-xs">1. Schätzung:</span>
                          <span className="font-semibold text-slate-900 text-sm">{formatGrade(result.prediction1)}</span>
                        </div>
                        {result.points1 !== undefined && (
                          <div className="flex justify-between items-center bg-green-50 rounded-lg px-2 py-1.5 border border-green-200">
                            <span className="text-xs text-slate-600 font-medium">Punkte:</span>
                            <span className="font-semibold text-green-700 text-xs">{result.points1}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {result.prediction2 !== undefined && (
                      <div className="pt-3 border-t border-slate-200 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-slate-700 text-xs">2. Schätzung:</span>
                          <span className="font-semibold text-slate-900 text-sm">{formatGrade(result.prediction2)}</span>
                        </div>
                        {result.points2 !== undefined && (
                          <div className="flex justify-between items-center bg-green-50 rounded-lg px-2 py-1.5 border border-green-200">
                            <span className="text-xs text-slate-600 font-medium">Punkte:</span>
                            <span className="font-semibold text-green-700 text-xs">{result.points2}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


