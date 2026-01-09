import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select } from '@/components/ui/select';
import { getExams, saveExam, deleteExam, getUsers, getPredictions, savePrediction, getSubjects, addSubject, cleanupSubjects } from '@/lib/storage';
import { calculatePoints, formatGrade, getGradeOptions } from '@/lib/points';
import { getExamStatus } from '@/lib/examUtils';
import { Exam, Prediction } from '@/types';
import { Plus, X, Edit, Check, Info, Lock, ClipboardList } from 'lucide-react';

export default function TeacherDashboard() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [pendingExams, setPendingExams] = useState<Exam[]>([]);
  const [gradedExams, setGradedExams] = useState<Exam[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subjectInputMode, setSubjectInputMode] = useState<'select' | 'input'>('select');
  const [newSubject, setNewSubject] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    description: '',
    date: '',
  });
  const [grades, setGrades] = useState<Record<string, number>>({});

  useEffect(() => {
    loadExams();
    loadSubjects();
    // Cleanup subjects on mount and when window unloads
    cleanupSubjects();
    
    const handleBeforeUnload = () => {
      cleanupSubjects();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      cleanupSubjects();
    };
  }, []);

  useEffect(() => {
    if (editingExam) {
      setFormData({
        title: editingExam.title,
        subject: editingExam.subject,
        description: editingExam.description || '',
        date: editingExam.date.split('T')[0],
      });
      setGrades(editingExam.grades || {});
      setSubjectInputMode('select');
      setNewSubject('');
    }
  }, [editingExam]);

  const loadExams = () => {
    // getExams() prüft automatisch auf Abschluss und aktualisiert die Prüfungen
    const allExams = getExams();
    setExams(allExams);
    // Separate by status instead of isClosed flag
    setPendingExams(allExams.filter((e) => {
      const status = getExamStatus(e);
      return status === 'open' || status === 'evaluation';
    }));
    setGradedExams(allExams.filter((e) => getExamStatus(e) === 'closed'));
    cleanupSubjects();
  };

  const loadSubjects = () => {
    const allSubjects = getSubjects();
    setSubjects(allSubjects);
  };

  const handleCreateExam = () => {
    setEditingExam(null);
    setFormData({ title: '', subject: '', description: '', date: '' });
    setGrades({});
    setSubjectInputMode('select');
    setNewSubject('');
    setShowForm(true);
  };

  const handleEditExam = (exam: Exam) => {
    setEditingExam(exam);
    setShowForm(true);
  };

  const handleAddNewSubject = () => {
    if (newSubject.trim()) {
      addSubject(newSubject.trim());
      setSubjects([...subjects, newSubject.trim()]);
      setFormData({ ...formData, subject: newSubject.trim() });
      setNewSubject('');
      setSubjectInputMode('select');
    }
  };

  const handleSaveExam = () => {
    const finalSubject = subjectInputMode === 'input' && newSubject.trim() 
      ? newSubject.trim() 
      : formData.subject;

    if (!formData.title || !finalSubject || !formData.date) {
      alert('Bitte füllen Sie alle Felder aus');
      return;
    }

    // If new subject was added, save it
    if (subjectInputMode === 'input' && newSubject.trim()) {
      addSubject(newSubject.trim());
      loadSubjects();
    }

    const exam: Exam = editingExam
      ? { ...editingExam, ...formData, subject: finalSubject, grades: { ...grades } }
      : {
          id: Date.now().toString(),
          title: formData.title,
          subject: finalSubject,
          description: formData.description,
          date: formData.date,
          isClosed: false,
          grades: {},
        };

    // If grades are entered, calculate points for predictions
    if (Object.keys(grades).length > 0) {
      const predictions = getPredictions();
      const examPredictions = predictions.filter((p) => p.examId === exam.id);

      examPredictions.forEach((pred) => {
        const studentGrade = grades[pred.studentId];
        if (studentGrade !== undefined) {
          if (pred.prediction1 !== undefined) {
            pred.points1 = calculatePoints(pred.prediction1, studentGrade);
          }
          if (pred.prediction2 !== undefined) {
            pred.points2 = calculatePoints(pred.prediction2, studentGrade);
          }
          savePrediction(pred);
        }
      });

      // Also update predictions for students who don't have predictions yet but have grades
      Object.keys(grades).forEach((studentId) => {
        const existingPred = examPredictions.find((p) => p.studentId === studentId);
        if (!existingPred) {
          const newPred: Prediction = {
            examId: exam.id,
            studentId: studentId,
          };
          savePrediction(newPred);
        }
      });
    }

    saveExam(exam);
    loadExams();
    setShowForm(false);
    setEditingExam(null);
    setFormData({ title: '', subject: '', description: '', date: '' });
    setGrades({});
    setSubjectInputMode('select');
    setNewSubject('');
    cleanupSubjects();
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingExam(null);
    setFormData({ title: '', subject: '', description: '', date: '' });
    setGrades({});
    setSubjectInputMode('select');
    setNewSubject('');
    cleanupSubjects();
  };

  const handleCloseExam = (examId: string) => {
    const exam = exams.find((e) => e.id === examId);
    if (exam) {
      exam.isClosed = true;
      exam.closedAt = new Date().toISOString();
      saveExam(exam);
      loadExams();
    }
  };

  const handleDeleteExam = (examId: string) => {
    if (confirm('Möchten Sie diese Prüfung wirklich löschen?')) {
      deleteExam(examId);
      loadExams();
      cleanupSubjects();
    }
  };

  const handleGradeChange = (studentId: string, grade: string) => {
    const numGrade = grade ? Number(grade) : undefined;
    if (numGrade !== undefined) {
      setGrades({ ...grades, [studentId]: numGrade });
    } else {
      const newGrades = { ...grades };
      delete newGrades[studentId];
      setGrades(newGrades);
    }
  };

  const students = getUsers().filter((u) => u.role === 'student');
  const gradeOptions = getGradeOptions();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 text-sm">Verwalten Sie Prüfungen und Noten</p>
        </div>
        <Button
          onClick={handleCreateExam}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm hover:shadow-md transition-all duration-200"
        >
          <Plus size={18} className="mr-2" />
          hinzufügen
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Prüfungen</h2>

            {/* Pending Exams */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                <h3 className="text-xl font-bold text-slate-900">Ausstehend:</h3>
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium">({pendingExams.length})</span>
              </div>
              {pendingExams.length === 0 ? (
                <Card className="bg-white border border-slate-200 shadow-sm">
                  <CardContent className="py-12 text-center">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                      <ClipboardList size={28} className="text-slate-400" />
                    </div>
                    <p className="text-slate-700 font-medium text-sm">Keine ausstehenden Prüfungen</p>
                  </CardContent>
                </Card>
              ) : (
                pendingExams.map((exam) => (
                  <Card key={exam.id} className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="bg-blue-600 text-white pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-white text-lg font-semibold mb-1">{exam.title}</CardTitle>
                          <div className="flex items-center gap-3 text-xs text-white/90">
                            <span>{exam.subject}</span>
                            <span>•</span>
                            <span>{new Date(exam.date).toLocaleDateString('de-CH')}</span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditExam(exam)}
                            className="text-white hover:bg-blue-700 h-8 w-8"
                            title="Bearbeiten"
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCloseExam(exam.id)}
                            className="text-white hover:bg-blue-700 h-8 w-8"
                            title="Abschließen"
                          >
                            <Lock size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteExam(exam.id)}
                            className="text-white hover:bg-red-500 h-8 w-8"
                            title="Löschen"
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 bg-blue-50 border-b border-blue-100">
                      <p className="text-sm text-slate-700">{exam.description || 'Keine Beschreibung vorhanden'}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Graded Exams */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-slate-600 rounded-full"></div>
                <h3 className="text-xl font-bold text-slate-900">Benotet:</h3>
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium">({gradedExams.length})</span>
              </div>
              {gradedExams.length === 0 ? (
                <Card className="bg-white border border-slate-200 shadow-sm">
                  <CardContent className="py-12 text-center">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                      <Check size={28} className="text-slate-400" />
                    </div>
                    <p className="text-slate-700 font-medium text-sm">Keine benoteten Prüfungen</p>
                  </CardContent>
                </Card>
              ) : (
                gradedExams.map((exam) => {
                  const predictions = getPredictions().filter((p) => p.examId === exam.id);
                  return (
                    <Card key={exam.id} className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                      <CardHeader className="bg-slate-700 text-white pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-white text-lg font-semibold flex items-center gap-2 mb-1">
                              {exam.title}
                              <Info size={14} className="text-white/80" />
                            </CardTitle>
                            <div className="flex items-center gap-3 text-xs text-white/90">
                              <span>{exam.subject}</span>
                              <span>•</span>
                              <span>{new Date(exam.date).toLocaleDateString('de-CH')}</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditExam(exam)}
                            className="text-white hover:bg-slate-600 h-8 w-8"
                            title="Bearbeiten"
                          >
                            <Edit size={16} />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="bg-slate-50 p-4">
                          <div className="bg-white rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-slate-100">
                                  <TableHead className="font-semibold text-slate-900 text-xs">Name</TableHead>
                                  <TableHead className="font-semibold text-slate-900 text-xs">1. Schätzung</TableHead>
                                  <TableHead className="font-semibold text-slate-900 text-xs">2. Schätzung</TableHead>
                                  <TableHead className="font-semibold text-slate-900 text-xs">Note</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {students.map((student) => {
                                  const prediction = predictions.find((p) => p.studentId === student.id);
                                  const grade = exam.grades?.[student.id];
                                  return (
                                    <TableRow key={student.id} className="hover:bg-slate-50">
                                      <TableCell className="font-medium py-2.5 text-sm">{student.username}</TableCell>
                                      <TableCell className="py-2.5 text-sm">
                                        {prediction?.prediction1 !== undefined ? (
                                          <div className="flex items-center gap-2">
                                            <span className="font-semibold">{formatGrade(prediction.prediction1)}</span>
                                            {prediction.points1 !== undefined && (
                                              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                                                prediction.points1 >= 4 ? 'bg-green-100 text-green-700' :
                                                prediction.points1 >= 2 ? 'bg-orange-100 text-orange-700' :
                                                'bg-red-100 text-red-700'
                                              }`}>
                                                {prediction.points1}p
                                              </span>
                                            )}
                                          </div>
                                        ) : (
                                          <span className="text-slate-400">-</span>
                                        )}
                                      </TableCell>
                                      <TableCell className="py-2.5 text-sm">
                                        {prediction?.prediction2 !== undefined ? (
                                          <div className="flex items-center gap-2">
                                            <span className="font-semibold">{formatGrade(prediction.prediction2)}</span>
                                            {prediction.points2 !== undefined && (
                                              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                                                prediction.points2 >= 4 ? 'bg-green-100 text-green-700' :
                                                prediction.points2 >= 2 ? 'bg-orange-100 text-orange-700' :
                                                'bg-red-100 text-red-700'
                                              }`}>
                                                {prediction.points2}p
                                              </span>
                                            )}
                                          </div>
                                        ) : (
                                          <span className="text-slate-400">-</span>
                                        )}
                                      </TableCell>
                                      <TableCell className="font-semibold py-2.5 text-sm">
                                        {grade !== undefined ? formatGrade(grade) : <span className="text-slate-400">-</span>}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Form Sidebar */}
        {showForm && (
          <div className="lg:col-span-1">
            <Card className="bg-white border border-slate-200 shadow-lg sticky top-20">
              <CardHeader className="pb-3 border-b border-slate-200 bg-slate-50 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-slate-900">
                    {editingExam ? 'Prüfung bearbeiten' : 'Neue Prüfung'}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCloseForm}
                    className="h-7 w-7 hover:bg-red-50 hover:text-red-600"
                  >
                    <X size={16} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="font-medium text-slate-800 text-sm">Titel:</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="z.B. Proportionalität"
                    className="border-slate-300 rounded-lg h-10 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject" className="font-medium text-slate-800 text-sm">Fach:</Label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={subjectInputMode === 'select' ? 'default' : 'outline'}
                        onClick={() => setSubjectInputMode('select')}
                        className={`flex-1 text-sm h-9 ${subjectInputMode === 'select' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'border-slate-300'}`}
                      >
                        Auswählen
                      </Button>
                      <Button
                        type="button"
                        variant={subjectInputMode === 'input' ? 'default' : 'outline'}
                        onClick={() => setSubjectInputMode('input')}
                        className={`flex-1 text-sm h-9 ${subjectInputMode === 'input' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'border-slate-300'}`}
                      >
                        Neu hinzufügen
                      </Button>
                    </div>
                    {subjectInputMode === 'select' ? (
                      <Select
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full border-slate-300 rounded-lg h-10 text-sm focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Fach auswählen</option>
                        {subjects.map((subject) => (
                          <option key={subject} value={subject}>
                            {subject}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <div className="space-y-2">
                        <Input
                          value={newSubject}
                          onChange={(e) => setNewSubject(e.target.value)}
                          placeholder="Neues Fach eingeben"
                          className="border-slate-300 rounded-lg h-10 text-sm focus:ring-2 focus:ring-blue-500"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddNewSubject();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          onClick={handleAddNewSubject}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm h-9"
                          disabled={!newSubject.trim()}
                        >
                          <Plus size={14} className="mr-2" />
                          Fach hinzufügen
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date" className="font-medium text-slate-800 text-sm">Datum:</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="border-slate-300 rounded-lg h-10 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="font-medium text-slate-800 text-sm">Beschreibung (optional):</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Beschreibung der Prüfung"
                    className="border-slate-300 rounded-lg h-10 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {editingExam && (
                  <div className="space-y-3 pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                      <Label className="font-semibold text-slate-900 text-sm">Noten eintragen:</Label>
                    </div>
                    <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                      {students.map((student) => (
                        <div key={student.id} className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all">
                          <Label className="w-24 text-xs font-medium text-slate-800">{student.username}:</Label>
                          <Select
                            value={grades[student.id] !== undefined ? grades[student.id].toString() : ''}
                            onChange={(e) => handleGradeChange(student.id, e.target.value)}
                            className="flex-1 border-slate-300 rounded-lg h-9 text-sm focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">-</option>
                            {gradeOptions.map((grade) => (
                              <option key={grade} value={grade}>
                                {formatGrade(grade)}
                              </option>
                            ))}
                          </Select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleSaveExam}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm hover:shadow-md transition-all"
                >
                  <Check size={16} className="mr-2" />
                  senden
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
