import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  getClassMembershipsByTeacher, 
  getUsers, 
  addStudentToClass, 
  removeStudentFromClass,
  getClassRequestsByTeacher,
  updateClassRequest,
  getUserByEmail,
  getExams,
  getPredictions
} from '@/lib/storage';
import { User } from '@/types';
import { Users, Plus, Search, X, Check, XCircle, Mail, UserPlus, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type TabType = 'students' | 'requests';

export default function ClassManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('students');
  const [classMembers, setClassMembers] = useState<User[]>([]);
  const [allStudents, setAllStudents] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = () => {
    if (!user) return;
    
    // Load class members
    const memberships = getClassMembershipsByTeacher(user.id);
    const allUsers = getUsers();
    const studentIds = memberships.map(m => m.studentId);
    const members = allUsers.filter(u => studentIds.includes(u.id));
    setClassMembers(members);

    // Load all students
    const students = allUsers.filter(u => u.role === 'student');
    setAllStudents(students);

    // Load requests
    const teacherRequests = getClassRequestsByTeacher(user.email || '');
    setRequests(teacherRequests);
  };

  const handleAddStudent = (studentId: string) => {
    if (!user) return;
    addStudentToClass(studentId, user.id);
    loadData();
    setShowAddModal(false);
    setSearchQuery('');
  };

  const handleRemoveStudent = (studentId: string) => {
    if (!user || !confirm('Möchten Sie diesen Schüler wirklich aus der Klasse entfernen?')) return;
    removeStudentFromClass(studentId, user.id);
    loadData();
  };

  const handleApproveRequest = (requestId: string) => {
    if (!user) return;
    updateClassRequest(requestId, 'approved', user.id);
    loadData();
  };

  const handleRejectRequest = (requestId: string) => {
    if (!user) return;
    updateClassRequest(requestId, 'rejected', user.id);
    loadData();
  };

  const handleSearchStudent = () => {
    if (!searchQuery.trim()) return;
    const student = getUserByEmail(searchQuery.trim());
    if (student && student.role === 'student') {
      if (!user) return;
      if (!classMembers.some(m => m.id === student.id)) {
        handleAddStudent(student.id);
      } else {
        alert('Dieser Schüler ist bereits in der Klasse');
      }
    } else {
      alert('Kein Schüler mit dieser E-Mail gefunden');
    }
    setSearchQuery('');
  };

  const calculateTotalPoints = (studentId: string): number => {
    const exams = getExams();
    const predictions = getPredictions();
    let total = 0;

    exams.forEach(exam => {
      if (exam.isClosed && exam.grades) {
        const prediction = predictions.find(p => p.examId === exam.id && p.studentId === studentId);
        if (prediction) {
          total += (prediction.points1 || 0) + (prediction.points2 || 0);
        }
      }
    });

    return total;
  };

  const filteredStudents = allStudents.filter(s => {
    if (classMembers.some(m => m.id === s.id)) return false;
    const query = searchQuery.toLowerCase();
    return s.username.toLowerCase().includes(query) || 
           s.email.toLowerCase().includes(query);
  });

  const pendingRequests = requests.filter(r => r.status === 'pending');

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-slate-900">Klasse</h1>
        <p className="text-slate-600 text-sm">Verwalten Sie Ihre Klasse und Schüleranfragen</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2 font-medium text-sm transition-colors relative ${
            activeTab === 'students'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Schüler ({classMembers.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 font-medium text-sm transition-colors relative ${
            activeTab === 'requests'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Anfragen ({pendingRequests.length})
          {pendingRequests.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
              {pendingRequests.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'students' ? (
        <div className="space-y-4">
          {/* Add Student Button */}
          <div className="flex justify-between items-center">
            <Button
              onClick={() => setShowAddModal(!showAddModal)}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all"
            >
              <UserPlus size={16} className="mr-2" />
              Schüler hinzufügen
            </Button>
          </div>

          {/* Add Student Modal */}
          {showAddModal && (
            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-slate-900">
                    Schüler zur Klasse hinzufügen
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowAddModal(false);
                      setSearchQuery('');
                    }}
                    className="h-7 w-7"
                  >
                    <X size={16} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-700">Nach E-Mail suchen:</label>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="schueler@example.ch"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearchStudent()}
                      className="flex-1 border-slate-300 rounded-lg h-9 text-sm"
                    />
                    <Button
                      onClick={handleSearchStudent}
                      className="bg-blue-600 hover:bg-blue-700 text-white h-9"
                    >
                      <Search size={16} />
                    </Button>
                  </div>
                </div>

                {/* Available Students List */}
                {filteredStudents.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                    <label className="text-xs font-medium text-slate-700">Verfügbare Schüler:</label>
                    {filteredStudents.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-2 border border-slate-200 rounded-lg hover:bg-slate-50"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900">{student.username}</p>
                          <p className="text-xs text-slate-600">{student.email}</p>
                        </div>
                        <Button
                          onClick={() => handleAddStudent(student.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs"
                        >
                          <Plus size={14} className="mr-1" />
                          Hinzufügen
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Class Members List */}
          <Card className="bg-white border border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-200 bg-slate-50">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Users size={16} />
                Klassenmitglieder
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {classMembers.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                    <Users size={32} className="text-slate-400" />
                  </div>
                  <p className="text-slate-700 font-medium mb-1">Noch keine Schüler in der Klasse</p>
                  <p className="text-slate-500 text-sm">Fügen Sie Schüler hinzu, um zu beginnen</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-100">
                      <TableHead className="font-semibold text-slate-900 text-xs">Name</TableHead>
                      <TableHead className="font-semibold text-slate-900 text-xs">E-Mail</TableHead>
                      <TableHead className="font-semibold text-slate-900 text-xs">Punkte</TableHead>
                      <TableHead className="font-semibold text-slate-900 text-xs">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classMembers
                      .map(student => ({
                        ...student,
                        totalPoints: calculateTotalPoints(student.id)
                      }))
                      .sort((a, b) => b.totalPoints - a.totalPoints)
                      .map((student) => (
                        <TableRow key={student.id} className="hover:bg-slate-50">
                          <TableCell className="py-3">
                            <button
                              onClick={() => navigate(`/class/student/${student.id}`)}
                              className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                            >
                              {student.username}
                            </button>
                          </TableCell>
                          <TableCell className="py-3 text-sm text-slate-600">{student.email}</TableCell>
                          <TableCell className="py-3">
                            <span className="text-sm font-semibold text-slate-900">{student.totalPoints}</span>
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate(`/class/student/${student.id}`)}
                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                title="Details anzeigen"
                              >
                                <FileText size={14} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveStudent(student.id)}
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Entfernen"
                              >
                                <X size={14} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Requests Tab */
        <div className="space-y-4">
          <Card className="bg-white border border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-200 bg-slate-50">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Mail size={16} />
                Anfragen
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {pendingRequests.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                    <Mail size={32} className="text-slate-400" />
                  </div>
                  <p className="text-slate-700 font-medium mb-1">Keine offenen Anfragen</p>
                  <p className="text-slate-500 text-sm">Schüleranfragen erscheinen hier</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900">{request.studentName}</p>
                          <p className="text-xs text-slate-600 mt-1">{request.studentEmail}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(request.createdAt).toLocaleDateString('de-CH')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleApproveRequest(request.id)}
                            className="bg-green-600 hover:bg-green-700 text-white h-9 text-sm"
                          >
                            <Check size={14} className="mr-2" />
                            Annehmen
                          </Button>
                          <Button
                            onClick={() => handleRejectRequest(request.id)}
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50 h-9 text-sm"
                          >
                            <XCircle size={14} className="mr-2" />
                            Ablehnen
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

