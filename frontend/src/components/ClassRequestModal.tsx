import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClassRequest, getClassRequestsByStudent } from '@/lib/storage';
import { useAuth } from '@/context/AuthContext';
import { Mail, Send } from 'lucide-react';
import { Modal, Form, Alert } from 'react-bootstrap';

interface ClassRequestModalProps {
  onClose: () => void;
}

export default function ClassRequestModal({ onClose }: ClassRequestModalProps) {
  const { user } = useAuth();
  const [teacherEmail, setTeacherEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = () => {
    if (!user || !teacherEmail.trim()) {
      setError('Bitte geben Sie eine E-Mail-Adresse ein');
      return;
    }

    if (!teacherEmail.includes('@')) {
      setError('Bitte geben Sie eine gültige E-Mail-Adresse ein');
      return;
    }

    // Check if request already exists
    const existingRequests = getClassRequestsByStudent(user.id);
    const pendingRequest = existingRequests.find(
      r => r.teacherEmail.toLowerCase() === teacherEmail.toLowerCase() && r.status === 'pending'
    );

    if (pendingRequest) {
      setError('Sie haben bereits eine Anfrage an diesen Lehrer gesendet');
      return;
    }

    // Create request
    try {
      createClassRequest(
        user.id,
        user.email,
        user.username,
        teacherEmail.trim().toLowerCase()
      );
      setSuccess(true);
      setError('');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError('Fehler beim Senden der Anfrage');
    }
  };

  return (
    <Modal show={true} onHide={onClose} centered backdrop="static">
      <Modal.Header closeButton className="pb-3 border-b border-slate-200 bg-slate-50">
        <Modal.Title className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <Mail size={18} />
          Klassenanfrage senden
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-6 space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 font-medium">
            Warte bis du zu einer Klasse hinzugefügt wurdest. Du kannst eine Anfrage an deinen Lehrer senden.
          </p>
        </div>

        {success ? (
          <Alert variant="success" className="bg-green-50 border border-green-200 rounded-lg p-4 mb-0">
            <p className="text-sm text-green-800 font-medium">
              Anfrage erfolgreich gesendet! Der Lehrer wird benachrichtigt.
            </p>
          </Alert>
        ) : (
          <>
            <Form.Group className="space-y-2">
              <Label htmlFor="teacherEmail" className="font-medium text-slate-800 text-sm">
                E-Mail-Adresse des Lehrers:
              </Label>
              <Input
                id="teacherEmail"
                type="email"
                placeholder="lehrer@example.ch"
                value={teacherEmail}
                onChange={(e) => {
                  setTeacherEmail(e.target.value);
                  setError('');
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                className="border-slate-300 rounded-lg h-10 text-sm focus:ring-2 focus:ring-blue-500"
              />
              {error && (
                <p className="text-xs text-red-600 mt-1">{error}</p>
              )}
            </Form.Group>

            <div className="flex gap-3">
              <Button
                onClick={handleSubmit}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-10 text-sm"
              >
                <Send size={14} className="mr-2" />
                Anfrage senden
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-slate-50 h-10 text-sm"
              >
                Abbrechen
              </Button>
            </div>
          </>
        )}
      </Modal.Body>
    </Modal>
  );
}
