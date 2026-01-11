import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/apiAdapter';
import { Users, Trophy } from 'lucide-react';

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const exams = await api.getAllExams();
      const allUsers = await api.getAllUsers();
      const students = allUsers.filter((u) => u.role === 'student');
      
      // Load all predictions for all students
      const allPredictions: any[] = [];
      for (const student of students) {
        try {
          const preds = await api.getPredictionsByStudent(student.id);
          allPredictions.push(...preds);
        } catch (error) {
          console.error(`Error loading predictions for student ${student.id}:`, error);
        }
      }
      const predictions = allPredictions;

    // Calculate total points for each student across all exams
    const studentTotals = students.map((student) => {
      let totalPoints = 0;

      exams.forEach((exam) => {
        if (exam.isClosed && exam.grades) {
          const prediction = predictions.find(
            (p) => p.examId === exam.id && p.studentId === student.id
          );
          if (prediction) {
            totalPoints += prediction.points1 || 0;
            totalPoints += prediction.points2 || 0;
          }
        }
      });

      return {
        studentId: student.id,
        studentName: student.username,
        totalPoints,
      };
    });

    const sorted = studentTotals
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

      setLeaderboard(sorted);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };


  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-slate-900">Bestenliste</h1>
        <p className="text-slate-600 text-sm">Gesamtübersicht aller Punkte über alle Prüfungen</p>
      </div>

      <Card className="bg-white border border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-200 bg-slate-50 rounded-t-lg">
          <CardTitle className="text-lg font-semibold flex items-center gap-2.5 text-slate-900">
            <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center border border-yellow-200">
              <Trophy size={16} className="text-yellow-700" />
            </div>
            <span>Gesamt-Rangliste</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {leaderboard.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                <Users size={24} className="text-slate-400" />
              </div>
              <p className="text-slate-700 font-medium text-sm mb-1">Noch keine Punkte vergeben</p>
              <p className="text-slate-500 text-xs">Punkte werden vergeben, sobald Prüfungen benotet wurden</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.studentId}
                  className={`p-4 transition-colors ${
                    index === 0 ? 'bg-yellow-50 border-l-2 border-l-yellow-500' :
                    index === 1 ? 'bg-slate-50 border-l-2 border-l-slate-400' :
                    index === 2 ? 'bg-orange-50 border-l-2 border-l-orange-500' :
                    'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                        index === 1 ? 'bg-slate-200 text-slate-700' :
                        index === 2 ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {entry.rank}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                        <Users size={14} className="text-slate-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{entry.studentName}</p>
                        <p className="text-xs text-slate-500 font-medium">Platz {entry.rank}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-slate-900">{entry.totalPoints}</p>
                      <p className="text-xs text-slate-500 font-medium">Punkte</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


