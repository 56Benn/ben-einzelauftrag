import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select } from '@/components/ui/select';
import { api } from '@/lib/apiAdapter';
import { getUsers, getPredictions, getSubjects, addSubject, cleanupSubjects } from '@/lib/storage';
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
  const [examPredictionsMap, setExamPredictionsMap] = useState<Record<string, Prediction[]>>({});

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

  const loadExams = async () => {
    try {
      const allExams = await api.getAllExams();
      setExams(allExams);
      // Separate by status instead of isClosed flag
      const pending = allExams.filter((e) => {
        const status = getExamStatus(e);
        return status === 'open' || status === 'evaluation';
      });
      const graded = allExams.filter((e) => getExamStatus(e) === 'closed');
      setPendingExams(pending);
      setGradedExams(graded);
      
      // Load predictions for all graded exams
      const predictionsMap: Record<string, Prediction[]> = {};
      for (const exam of graded) {
        try {
          const preds = await api.getPredictionsByExam(exam.id);
          predictionsMap[exam.id] = preds;
        } catch (error) {
          console.error(`Error loading predictions for exam ${exam.id}:`, error);
          predictionsMap[exam.id] = [];
        }
      }
      setExamPredictionsMap(predictionsMap);
      
      cleanupSubjects();
    } catch (error) {
      console.error('Error loading exams:', error);
    }
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

  const handleSaveExam = async () => {
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

    try {
      const exam: Exam = editingExam
        ? { ...editingExam, ...formData, subject: finalSubject, grades: { ...grades } }
        : {
            id: '',
            title: formData.title,
            subject: finalSubject,
            description: formData.description,
            date: formData.date,
            isClosed: false,
            grades: {},
          };

      // Convert grades to backend format (Long keys)
      const backendGrades: Record<string, number> = {};
      Object.keys(grades).forEach((key) => {
        backendGrades[key] = grades[key];
      });
      exam.grades = backendGrades;

      let savedExam: Exam;
      if (editingExam) {
        savedExam = await api.updateExam(exam.id, exam);
      } else {
        savedExam = await api.createExam(exam);
      }

      // If grades are entered, the backend will automatically calculate points
      // No need to manually update predictions here

      await loadExams();
      setShowForm(false);
      setEditingExam(null);
      setFormData({ title: '', subject: '', description: '', date: '' });
      setGrades({});
      setSubjectInputMode('select');
      setNewSubject('');
      cleanupSubjects();
    } catch (error) {
      console.error('Error saving exam:', error);
      alert('Fehler beim Speichern der Prüfung: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    }
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

  const handleCloseExam = async (examId: string) => {
    try {
      await api.closeExam(examId);
      await loadExams();
    } catch (error) {
      console.error('Error closing exam:', error);
      alert('Fehler beim Abschließen der Prüfung: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    }
  };

  const handleDeleteExam = async (examId: string) => {
    if (confirm('Möchten Sie diese Prüfung wirklich löschen?')) {
      try {
        await api.deleteExam(examId);
        await loadExams();
        cleanupSubjects();
      } catch (error) {
        console.error('Error deleting exam:', error);
        alert('Fehler beim Löschen der Prüfung: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
      }
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
          className="text-white font-semibold shadow-sm hover:shadow-md transition-all duration-200"
          style={{ backgroundColor: '#3B82F6', borderColor: '#3B82F6' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#2563EB'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#3B82F6'; }}
        >
          <Plus size={18} className="mr-2" style={{ color: 'white' }} />
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
                <div className="w-1 h-6 rounded-full" style={{ backgroundColor: '#3B82F6' }}></div>
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
                    <CardHeader className="text-white pb-3" style={{ backgroundColor: '#3B82F6' }}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-white text-lg font-semibold mb-1">{exam.title}</CardTitle>
                          <div className="flex items-center gap-3 text-xs" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
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
                            className="h-8 w-8"
                            style={{ color: 'white' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                            title="Bearbeiten"
                          >
                            <Edit size={16} style={{ color: 'white' }} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCloseExam(exam.id)}
                            className="h-8 w-8"
                            style={{ color: 'white' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                            title="Abschließen"
                          >
                            <Lock size={16} style={{ color: 'white' }} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteExam(exam.id)}
                            className="h-8 w-8"
                            style={{ color: 'white' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.8)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                            title="Löschen"
                          >
                            <X size={16} style={{ color: 'white' }} />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 border-b" style={{ backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' }}>
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
                  const predictions = examPredictionsMap[exam.id] || [];
                  return (
                    <Card key={exam.id} className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                      <CardHeader className="text-white pb-3" style={{ backgroundColor: '#1F2937' }}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-white text-lg font-semibold flex items-center gap-2 mb-1">
                              {exam.title}
                              <Info size={14} style={{ color: 'white' }} />
                            </CardTitle>
                            <div className="flex items-center gap-3 text-xs" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                              <span>{exam.subject}</span>
                              <span>•</span>
                              <span>{new Date(exam.date).toLocaleDateString('de-CH')}</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditExam(exam)}
                            className="h-8 w-8"
                            style={{ color: 'white' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                            title="Bearbeiten"
                          >
                            <Edit size={16} style={{ color: 'white' }} />
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
            <Card className="bg-white border border-slate-200 shadow-lg" style={{ position: 'sticky', top: '88px', zIndex: 100 }}>
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
                    className="border-slate-300 rounded-lg h-10 text-sm"
                    style={{ '--bs-focus-ring-color': 'rgba(59, 130, 246, 0.25)' } as React.CSSProperties}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#3B82F6';
                      e.currentTarget.style.boxShadow = '0 0 0 0.2rem rgba(59, 130, 246, 0.25)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#CBD5E1';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
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
                        className={`flex-1 text-sm h-9 text-white ${subjectInputMode === 'select' ? '' : 'border-slate-300'}`}
                        style={subjectInputMode === 'select' ? { backgroundColor: '#3B82F6', borderColor: '#3B82F6' } : {}}
                        onMouseEnter={(e) => {
                          if (subjectInputMode === 'select') {
                            e.currentTarget.style.backgroundColor = '#2563EB';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (subjectInputMode === 'select') {
                            e.currentTarget.style.backgroundColor = '#3B82F6';
                          }
                        }}
                      >
                        Auswählen
                      </Button>
                      <Button
                        type="button"
                        variant={subjectInputMode === 'input' ? 'default' : 'outline'}
                        onClick={() => setSubjectInputMode('input')}
                        className={`flex-1 text-sm h-9 text-white ${subjectInputMode === 'input' ? '' : 'border-slate-300'}`}
                        style={subjectInputMode === 'input' ? { backgroundColor: '#3B82F6', borderColor: '#3B82F6' } : {}}
                        onMouseEnter={(e) => {
                          if (subjectInputMode === 'input') {
                            e.currentTarget.style.backgroundColor = '#2563EB';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (subjectInputMode === 'input') {
                            e.currentTarget.style.backgroundColor = '#3B82F6';
                          }
                        }}
                      >
                        Neu hinzufügen
                      </Button>
                    </div>
                    {subjectInputMode === 'select' ? (
                      <Select
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full border-slate-300 rounded-lg h-10 text-sm"
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#3B82F6';
                          e.currentTarget.style.boxShadow = '0 0 0 0.2rem rgba(59, 130, 246, 0.25)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#CBD5E1';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
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
                          className="border-slate-300 rounded-lg h-10 text-sm"
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#3B82F6';
                            e.currentTarget.style.boxShadow = '0 0 0 0.2rem rgba(59, 130, 246, 0.25)';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#CBD5E1';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
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
                          className="w-full text-white text-sm h-9"
                          style={{ backgroundColor: '#3B82F6', borderColor: '#3B82F6' }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#2563EB'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#3B82F6'; }}
                          disabled={!newSubject.trim()}
                        >
                          <Plus size={14} className="mr-2" style={{ color: 'white' }} />
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
                    className="border-slate-300 rounded-lg h-10 text-sm"
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#3B82F6';
                      e.currentTarget.style.boxShadow = '0 0 0 0.2rem rgba(59, 130, 246, 0.25)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#CBD5E1';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="font-medium text-slate-800 text-sm">Beschreibung (optional):</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Beschreibung der Prüfung"
                    className="border-slate-300 rounded-lg h-10 text-sm"
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#3B82F6';
                      e.currentTarget.style.boxShadow = '0 0 0 0.2rem rgba(59, 130, 246, 0.25)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#CBD5E1';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {editingExam && (
                  <div className="space-y-3 pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1 h-4 rounded-full" style={{ backgroundColor: '#3B82F6' }}></div>
                      <Label className="font-semibold text-slate-900 text-sm">Noten eintragen:</Label>
                    </div>
                    <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                      {students.map((student) => (
                        <div key={student.id} className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 transition-all" style={{ transition: 'all 0.2s' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#93C5FD';
                            e.currentTarget.style.backgroundColor = 'rgba(239, 246, 255, 0.5)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#E2E8F0';
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}>
                          <Label className="w-24 text-xs font-medium text-slate-800">{student.username}:</Label>
                          <Select
                            value={grades[student.id] !== undefined ? grades[student.id].toString() : ''}
                            onChange={(e) => handleGradeChange(student.id, e.target.value)}
                            className="flex-1 border-slate-300 rounded-lg h-9 text-sm"
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = '#3B82F6';
                              e.currentTarget.style.boxShadow = '0 0 0 0.2rem rgba(59, 130, 246, 0.25)';
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.borderColor = '#CBD5E1';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
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
                  className="w-full text-white font-semibold shadow-sm hover:shadow-md transition-all"
                  style={{ backgroundColor: '#3B82F6', borderColor: '#3B82F6' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#2563EB'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#3B82F6'; }}
                >
                  <Check size={16} className="mr-2" style={{ color: 'white' }} />
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
