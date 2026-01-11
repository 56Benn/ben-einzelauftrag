import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { api } from '@/lib/apiAdapter';
import { getUsers, getSubjects, getClassMembershipsByStudent } from '@/lib/storage';
import { getGradeOptions, formatGrade, calculatePoints } from '@/lib/points';
import { getExamStatus, canSubmitTips, hasNoTips, sortExamsByStatus } from '@/lib/examUtils';
import { Exam, Prediction } from '@/types';
import { Calendar, BookOpen, Users, Target, AlertCircle, CheckCircle2, Clock, X } from 'lucide-react';
import ClassRequestModal from '@/components/ClassRequestModal';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('Alle');
  const [subjectFilter, setSubjectFilter] = useState<string>('Alle');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [prediction1, setPrediction1] = useState<number | ''>('');
  const [prediction2, setPrediction2] = useState<number | ''>('');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [isInClass, setIsInClass] = useState(false);

  useEffect(() => {
    checkClassMembership();
    loadData();
  }, [user]);

  const checkClassMembership = () => {
    if (!user) return;
    const memberships = getClassMembershipsByStudent(user.id);
    const inClass = memberships.length > 0;
    setIsInClass(inClass);
    if (!inClass) {
      setShowRequestModal(true);
    }
  };

  useEffect(() => {
    if (selectedExam && user) {
      loadPrediction();
    }
  }, [selectedExam, user]);

  const loadData = async () => {
    try {
      const allExams = await api.getAllExams();
      setExams(allExams);
      
      if (user) {
        const allPredictions = await api.getPredictionsByStudent(user.id);
        setPredictions(allPredictions);
      }
      
      loadSubjects();
      if (allExams.length > 0 && !selectedExam) {
        const openExams = allExams.filter(e => {
          const status = getExamStatus(e);
          return status === 'open' || status === 'evaluation';
        });
        if (openExams.length > 0) {
          const sortedOpen = sortExamsByStatus(openExams, 'open');
          setSelectedExam(sortedOpen[0].id);
        } else {
          setSelectedExam(allExams[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadSubjects = () => {
    const allSubjects = getSubjects();
    setSubjects(['Alle', ...allSubjects]);
  };

  const loadPrediction = async () => {
    if (!user || !selectedExam) return;
    try {
      const prediction = await api.getPredictionByExamAndStudent(selectedExam, user.id);
      if (prediction) {
        setPrediction1(prediction.prediction1 || '');
        setPrediction2(prediction.prediction2 || '');
      } else {
        setPrediction1('');
        setPrediction2('');
      }
    } catch (error) {
      console.error('Error loading prediction:', error);
      setPrediction1('');
      setPrediction2('');
    }
  };

  const handleSubmitPrediction = async () => {
    if (!user || !selectedExam) return;
    
    // Check if student is in a class
    if (!isInClass) {
      setShowRequestModal(true);
      return;
    }
    
    const exam = exams.find((e) => e.id === selectedExam);
    if (!exam || !canSubmitTips(exam)) return;

    try {
      const existingPrediction = await api.getPredictionByExamAndStudent(selectedExam, user.id);

      const prediction: Prediction = existingPrediction || {
        examId: selectedExam,
        studentId: user.id,
      };

      if (prediction1 !== '' && prediction.prediction1 === undefined) {
        prediction.prediction1 = Number(prediction1);
      }
      if (prediction2 !== '' && prediction.prediction2 === undefined) {
        prediction.prediction2 = Number(prediction2);
      }

      await api.createOrUpdatePrediction(selectedExam, user.id, prediction);
      
      // Reload predictions
      const updatedPredictions = await api.getPredictionsByStudent(user.id);
      setPredictions(updatedPredictions);
      await loadPrediction();
    } catch (error) {
      console.error('Error saving prediction:', error);
      alert('Fehler beim Speichern der Vorhersage: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    }
  };

  // Filter exams
  const getFilteredAndSortedExams = () => {
    let filtered = exams;

    // Filter by status
    if (statusFilter !== 'Alle') {
      filtered = filtered.filter(e => {
        const status = getExamStatus(e);
        if (statusFilter === 'Abgeschlossen') return status === 'closed';
        if (statusFilter === 'Tipp offen') return status === 'open';
        if (statusFilter === 'In Auswertung') return status === 'evaluation';
        return true;
      });
    }

    // Filter by subject
    if (subjectFilter !== 'Alle') {
      filtered = filtered.filter(e => e.subject === subjectFilter);
    }

    // Separate into open and closed
    const openExams = filtered.filter(e => {
      const status = getExamStatus(e);
      return status === 'open' || status === 'evaluation';
    });
    const closedExams = filtered.filter(e => getExamStatus(e) === 'closed');

    return {
      open: sortExamsByStatus(openExams, 'open'),
      closed: sortExamsByStatus(closedExams, 'closed'),
    };
  };

  const currentExam = exams.find((e) => e.id === selectedExam);
  const gradeOptions = getGradeOptions();
  const { open: openExams, closed: closedExams } = getFilteredAndSortedExams();
  const [students, setStudents] = useState(getUsers().filter((u) => u.role === 'student'));
  
  useEffect(() => {
    const loadStudents = async () => {
      try {
        const allUsers = await api.getAllUsers();
        setStudents(allUsers.filter((u) => u.role === 'student'));
      } catch (error) {
        console.error('Error loading students:', error);
      }
    };
    loadStudents();
  }, []);
  
  // Calculate leaderboard for selected exam
  const [examPredictions, setExamPredictions] = useState<Prediction[]>([]);
  
  useEffect(() => {
    const loadExamPredictions = async () => {
      if (selectedExam) {
        try {
          const preds = await api.getPredictionsByExam(selectedExam);
          setExamPredictions(preds);
        } catch (error) {
          console.error('Error loading exam predictions:', error);
        }
      }
    };
    loadExamPredictions();
  }, [selectedExam]);
  
  const allPredictions = examPredictions;
  
  const examLeaderboard = students
    .map((student) => {
      const pred = allPredictions.find((p) => p.studentId === student.id);
      const totalPoints = (pred?.points1 || 0) + (pred?.points2 || 0);
      return {
        studentId: student.id,
        studentName: student.username,
        totalPoints,
      };
    })
    .filter((entry) => entry.totalPoints > 0 || allPredictions.some(p => p.studentId === entry.studentId))
    .sort((a, b) => b.totalPoints - a.totalPoints);

  const userPrediction = allPredictions.find((p) => p.studentId === user?.id);
  const examStatus = currentExam ? getExamStatus(currentExam) : null;

  return (
    <div className="space-y-6">
      {showRequestModal && !isInClass && (
        <ClassRequestModal 
          onClose={() => {
            setShowRequestModal(false);
            checkClassMembership();
          }} 
        />
      )}
      
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-slate-900">Prüfungen</h1>
        <p className="text-slate-600 text-sm">Verwalten Sie Ihre Prüfungsvorhersagen</p>
      </div>

      {!isInClass && (
        <Card className="bg-yellow-50 border border-yellow-200 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-yellow-800 font-medium mb-2">
              Sie sind noch nicht in einer Klasse. Sie können keine Tipps abgeben, bis Sie zu einer Klasse hinzugefügt wurden.
            </p>
            <Button
              onClick={() => setShowRequestModal(true)}
              className="bg-yellow-600 hover:bg-yellow-700 text-white text-sm h-9"
            >
              Anfrage senden
            </Button>
          </CardContent>
        </Card>
      )}

      {exams.length === 0 ? (
        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
              <BookOpen size={32} className="text-slate-400" />
            </div>
            <p className="text-slate-700 font-medium mb-1">Keine Prüfungen verfügbar</p>
            <p className="text-slate-500 text-sm">Warten Sie auf neue Prüfungen von Ihrem Lehrer</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - Exam List */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filters */}
            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 space-y-1">
                    <label className="text-xs font-medium text-slate-700">Status:</label>
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full border-slate-300 rounded-lg h-9 text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Alle">Alle</option>
                      <option value="Tipp offen">Tipp offen</option>
                      <option value="In Auswertung">In Auswertung</option>
                      <option value="Abgeschlossen">Abgeschlossen</option>
                    </Select>
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-xs font-medium text-slate-700">Fach:</label>
                    <Select
                      value={subjectFilter}
                      onChange={(e) => setSubjectFilter(e.target.value)}
                      className="w-full border-slate-300 rounded-lg h-9 text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      {subjects.map((subject) => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Exam List with Scroll */}
            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-200 bg-slate-50 rounded-t-lg">
                <CardTitle className="text-base font-semibold text-slate-900">Prüfungen:</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                  {/* Open Section */}
                  {openExams.length > 0 && (
                    <div className="p-4 border-b border-slate-200">
                      <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Clock size={16} className="text-blue-600" />
                        Offen
                      </h3>
                      <div className="space-y-2">
                        {openExams.map((exam) => {
                          const status = getExamStatus(exam);
                          const noTips = user ? hasNoTips(exam.id, user.id, predictions) : false;
                          const isSelected = selectedExam === exam.id;
                          return (
                            <div
                              key={exam.id}
                              onClick={() => setSelectedExam(exam.id)}
                              className={`p-3 rounded-lg cursor-pointer transition-all border ${
                                isSelected
                                  ? 'bg-blue-50 border-blue-300 shadow-sm'
                                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className={`font-semibold text-sm ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                                      {exam.title}
                                    </h4>
                                    {noTips && (
                                      <AlertCircle size={14} className="text-orange-600 flex-shrink-0" />
                                    )}
                                  </div>
                                  <div className={`flex items-center gap-3 text-xs ${isSelected ? 'text-blue-700' : 'text-slate-600'}`}>
                                    <span className="flex items-center gap-1">
                                      <Calendar size={12} />
                                      {new Date(exam.date).toLocaleDateString('de-CH')}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <BookOpen size={12} />
                                      {exam.subject}
                                    </span>
                                    {status === 'evaluation' && (
                                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                                        In Auswertung
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Closed Section */}
                  {closedExams.length > 0 && (
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-slate-600" />
                        Abgeschlossen
                      </h3>
                      <div className="space-y-2">
                        {closedExams.map((exam) => {
                          const isSelected = selectedExam === exam.id;
                          return (
                            <div
                              key={exam.id}
                              onClick={() => setSelectedExam(exam.id)}
                              className={`p-3 rounded-lg cursor-pointer transition-all border ${
                                isSelected
                                  ? 'bg-blue-50 border-blue-300 shadow-sm'
                                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className={`font-semibold text-sm mb-1 ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                                    {exam.title}
                                  </h4>
                                  <div className={`flex items-center gap-3 text-xs ${isSelected ? 'text-blue-700' : 'text-slate-600'}`}>
                                    <span className="flex items-center gap-1">
                                      <Calendar size={12} />
                                      {new Date(exam.date).toLocaleDateString('de-CH')}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <BookOpen size={12} />
                                      {exam.subject}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {openExams.length === 0 && closedExams.length === 0 && (
                    <div className="p-8 text-center">
                      <p className="text-slate-500 text-sm">Keine Prüfungen mit diesen Filtern</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Prediction Form and Leaderboard */}
          <div className="space-y-4">
            {/* Prediction Card */}
            {currentExam && (
              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-200 bg-slate-50 rounded-t-lg">
                  <CardTitle className="text-base font-semibold text-slate-900">
                    {currentExam.title}
                  </CardTitle>
                  <div className="flex items-center gap-3 text-xs text-slate-600 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(currentExam.date).toLocaleDateString('de-CH')}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen size={12} />
                      {currentExam.subject}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {!isInClass ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-xs text-red-700 font-medium flex items-center gap-2">
                        <X size={12} />
                        Sie müssen zu einer Klasse hinzugefügt werden, um Tipps abgeben zu können.
                      </p>
                      <Button
                        onClick={() => setShowRequestModal(true)}
                        className="mt-2 bg-red-600 hover:bg-red-700 text-white text-xs h-8"
                      >
                        Anfrage senden
                      </Button>
                    </div>
                  ) : canSubmitTips(currentExam) ? (
                    <>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs text-blue-800 font-medium flex items-center gap-2">
                          <Target size={12} />
                          {examStatus === 'evaluation' 
                            ? 'Prüfung in Auswertung. Sie können noch Tipps abgeben.' 
                            : 'Sie können zwei Vorhersagen abgeben: eine vor und eine nach der Prüfung'}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-slate-700 block">1. Schätzung:</label>
                          {userPrediction?.prediction1 !== undefined ? (
                            <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                              <span className="text-sm font-semibold text-blue-700">{formatGrade(userPrediction.prediction1)}</span>
                            </div>
                          ) : (
                            <Select
                              value={prediction1}
                              onChange={(e) => {
                                const value = e.target.value ? Number(e.target.value) : '';
                                setPrediction1(value);
                              }}
                              className="w-full border-slate-300 rounded-lg h-9 text-sm focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">-</option>
                              {gradeOptions.map((grade) => (
                                <option key={grade} value={grade}>
                                  {formatGrade(grade)}
                                </option>
                              ))}
                            </Select>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-slate-700 block">2. Schätzung:</label>
                          {userPrediction?.prediction2 !== undefined ? (
                            <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
                              <span className="text-sm font-semibold text-slate-700">{formatGrade(userPrediction.prediction2)}</span>
                            </div>
                          ) : userPrediction?.prediction1 !== undefined ? (
                            <Select
                              value={prediction2}
                              onChange={(e) => {
                                const value = e.target.value ? Number(e.target.value) : '';
                                setPrediction2(value);
                              }}
                              className="w-full border-slate-300 rounded-lg h-9 text-sm focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">-</option>
                              {gradeOptions.map((grade) => (
                                <option key={grade} value={grade}>
                                  {formatGrade(grade)}
                                </option>
                              ))}
                            </Select>
                          ) : (
                            <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
                              <span className="text-xs text-slate-400">-</span>
                            </div>
                          )}
                        </div>

                        <Button
                          onClick={handleSubmitPrediction}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium h-9 text-sm shadow-sm hover:shadow-md transition-all"
                          disabled={
                            (userPrediction?.prediction1 === undefined && prediction1 === '') ||
                            (userPrediction?.prediction1 !== undefined && userPrediction?.prediction2 === undefined && prediction2 === '')
                          }
                        >
                          <Target size={14} className="mr-2" />
                          Tipp abgeben
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-xs text-red-700 font-medium flex items-center gap-2">
                        <X size={12} />
                        Diese Prüfung ist abgeschlossen. Keine weiteren Tipps möglich.
                      </p>
                    </div>
                  )}

                  {/* User's predictions and points */}
                  {userPrediction && (userPrediction.prediction1 !== undefined || userPrediction.prediction2 !== undefined) && (
                    <div className="pt-3 border-t border-slate-200 space-y-2">
                      <h3 className="font-medium text-slate-900 text-xs">Ihre Vorhersagen:</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {userPrediction.prediction1 !== undefined && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-slate-700">1. Schätzung:</span>
                              <span className="text-xs font-semibold text-blue-700">{formatGrade(userPrediction.prediction1)}</span>
                            </div>
                            {userPrediction.points1 !== undefined && (
                              <div className="flex items-center justify-between pt-1 border-t border-blue-200">
                                <span className="text-xs text-slate-600">Punkte:</span>
                                <span className="font-semibold text-green-600 text-xs">{userPrediction.points1}</span>
                              </div>
                            )}
                          </div>
                        )}
                        {userPrediction.prediction2 !== undefined && (
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-slate-700">2. Schätzung:</span>
                              <span className="text-xs font-semibold text-slate-700">{formatGrade(userPrediction.prediction2)}</span>
                            </div>
                            {userPrediction.points2 !== undefined && (
                              <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                                <span className="text-xs text-slate-600">Punkte:</span>
                                <span className="font-semibold text-green-600 text-xs">{userPrediction.points2}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Leaderboard */}
            {currentExam && examLeaderboard.length > 0 && (
              <Card className="bg-white border border-slate-200 shadow-sm" style={{ position: 'sticky', top: '88px', zIndex: 100 }}>
                <CardHeader className="pb-3 border-b border-slate-200 bg-slate-50 rounded-t-lg">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900">
                    <div className="w-6 h-6 rounded-lg bg-slate-200 flex items-center justify-center">
                      <Users size={12} className="text-slate-600" />
                    </div>
                    <span>Rangliste</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-100">
                    {examLeaderboard.slice(0, 5).map((entry, index) => (
                      <div
                        key={entry.studentId}
                        className={`p-3 transition-colors ${
                          entry.studentId === user?.id 
                            ? 'bg-blue-50 border-l-2 border-l-blue-500' 
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold ${
                              index === 0 ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                              index === 1 ? 'bg-slate-200 text-slate-700' :
                              index === 2 ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {index + 1}
                            </div>
                            <span className={`text-xs font-medium ${entry.studentId === user?.id ? 'text-blue-900 font-semibold' : 'text-slate-900'}`}>
                              {entry.studentName}
                            </span>
                          </div>
                          <span className={`text-xs font-semibold ${entry.studentId === user?.id ? 'text-blue-700' : 'text-slate-700'}`}>
                            {entry.totalPoints}pkt
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
