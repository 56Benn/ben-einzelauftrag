import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/apiAdapter';
import { formatGrade } from '@/lib/points';
import { User } from '@/types';
import { ArrowLeft, Calendar, BookOpen, Target } from 'lucide-react';

export default function StudentDetail() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<User | null>(null);
  const [examResults, setExamResults] = useState<any[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    if (studentId) {
      loadStudentData();
    }
  }, [studentId]);

  const loadStudentData = async () => {
    if (!studentId) return;

    try {
      const allUsers = await api.getAllUsers();
      const foundStudent = allUsers.find(u => u.id === studentId);
      if (!foundStudent) {
        navigate('/class');
        return;
      }
      setStudent(foundStudent);

      const exams = await api.getAllExams();
      const allPredictions = await api.getPredictionsByStudent(studentId);

    let total = 0;
    const results = exams
      .filter(exam => exam.isClosed && exam.grades && exam.grades[studentId])
      .map(exam => {
        const prediction = allPredictions.find(p => p.examId === exam.id);
        const grade = exam.grades![studentId];
        
        if (prediction) {
          total += (prediction.points1 || 0) + (prediction.points2 || 0);
        }

        return {
          examId: exam.id,
          examTitle: exam.title,
          examSubject: exam.subject,
          examDate: exam.date,
          grade,
          prediction1: prediction?.prediction1,
          prediction2: prediction?.prediction2,
          points1: prediction?.points1,
          points2: prediction?.points2,
        };
      })
      .sort((a, b) => new Date(b.examDate).getTime() - new Date(a.examDate).getTime());

      setExamResults(results);
      setTotalPoints(total);
    } catch (error) {
      console.error('Error loading student data:', error);
    }
  };

  if (!student) {
    return (
      <div className="space-y-6">
        <p className="text-slate-600">Schüler wird geladen...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/class')}
          className="text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={18} className="mr-2" />
          Zurück
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-900">{student.username}</h1>
          <p className="text-slate-600 text-sm mt-1">{student.email}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Gesamtpunkte</p>
          <p className="text-2xl font-bold text-slate-900">{totalPoints}</p>
        </div>
      </div>

      {examResults.length === 0 ? (
        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
              <BookOpen size={32} className="text-slate-400" />
            </div>
            <p className="text-slate-700 font-medium mb-1">Noch keine abgeschlossenen Prüfungen</p>
            <p className="text-slate-500 text-sm">Prüfungsergebnisse erscheinen hier, sobald Prüfungen benotet wurden</p>
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
                        <span className="font-medium text-slate-800 text-sm">Note:</span>
                        <span className="text-xl font-bold text-blue-700">{formatGrade(result.grade)}</span>
                      </div>
                    </div>

                    {result.prediction1 !== undefined && (
                      <div className="pt-3 border-t border-slate-200 space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Target size={14} className="text-slate-600" />
                          <span className="font-medium text-slate-700 text-xs">1. Schätzung:</span>
                          <span className="font-semibold text-slate-900 text-xs">{formatGrade(result.prediction1)}</span>
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
                        <div className="flex items-center gap-2 mb-2">
                          <Target size={14} className="text-slate-600" />
                          <span className="font-medium text-slate-700 text-xs">2. Schätzung:</span>
                          <span className="font-semibold text-slate-900 text-xs">{formatGrade(result.prediction2)}</span>
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

