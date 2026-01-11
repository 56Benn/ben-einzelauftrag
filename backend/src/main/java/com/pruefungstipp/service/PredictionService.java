package com.pruefungstipp.service;

import com.pruefungstipp.exception.ResourceNotFoundException;
import com.pruefungstipp.exception.ValidationException;
import com.pruefungstipp.model.Exam;
import com.pruefungstipp.model.Prediction;
import com.pruefungstipp.model.User;
import com.pruefungstipp.repository.ExamRepository;
import com.pruefungstipp.repository.PredictionRepository;
import com.pruefungstipp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PredictionService extends BaseService {
    
    private final PredictionRepository predictionRepository;
    private final ExamRepository examRepository;
    private final UserRepository userRepository;
    private final PointsCalculationService pointsCalculationService;
    
    public List<Prediction> getAllPredictions() {
        try {
            return predictionRepository.findAll();
        } catch (Exception e) {
            throw new RuntimeException("Fehler beim Laden der Vorhersagen", e);
        }
    }
    
    public Prediction getPredictionById(Long id) {
        try {
            return requireExists(
                predictionRepository.findById(id).orElse(null),
                "Prediction",
                id
            );
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Fehler beim Laden der Vorhersage mit ID " + id, e);
        }
    }
    
    public Prediction getPredictionByExamAndStudent(Long examId, Long studentId) {
        try {
            Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Exam mit ID " + examId + " nicht gefunden"));
            User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("User mit ID " + studentId + " nicht gefunden"));
            
            return predictionRepository.findByExamAndStudent(exam, student)
                .orElse(null);
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Fehler beim Laden der Vorhersage", e);
        }
    }
    
    public List<Prediction> getPredictionsByExam(Long examId) {
        try {
            Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Exam mit ID " + examId + " nicht gefunden"));
            return predictionRepository.findByExam(exam);
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Fehler beim Laden der Vorhersagen für Prüfung " + examId, e);
        }
    }
    
    public List<Prediction> getPredictionsByStudent(Long studentId) {
        try {
            User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("User mit ID " + studentId + " nicht gefunden"));
            return predictionRepository.findByStudent(student);
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Fehler beim Laden der Vorhersagen für Student " + studentId, e);
        }
    }
    
    @Transactional
    public Prediction createOrUpdatePrediction(Long examId, Long studentId, Prediction predictionDetails) {
        try {
            Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Exam mit ID " + examId + " nicht gefunden"));
            User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("User mit ID " + studentId + " nicht gefunden"));
            
            // Validierung: Prüfung muss offen sein
            if (exam.getIsClosed()) {
                throw new IllegalStateException("Prüfung ist bereits abgeschlossen");
            }
            
            // Validierung: Student muss Student-Rolle haben
            if (student.getRole() != User.UserRole.STUDENT) {
                throw new ValidationException("Nur Studenten können Vorhersagen abgeben");
            }
            
            // Validierung: Noten müssen im gültigen Bereich sein (1.0 - 6.0)
            if (predictionDetails.getPrediction1() != null) {
                double pred1 = predictionDetails.getPrediction1();
                if (pred1 < 1.0 || pred1 > 6.0) {
                    throw new ValidationException("Vorhersage muss zwischen 1.0 und 6.0 liegen");
                }
            }
            if (predictionDetails.getPrediction2() != null) {
                double pred2 = predictionDetails.getPrediction2();
                if (pred2 < 1.0 || pred2 > 6.0) {
                    throw new ValidationException("Vorhersage muss zwischen 1.0 und 6.0 liegen");
                }
            }
            
            Prediction prediction = predictionRepository.findByExamAndStudent(exam, student)
                .orElse(new Prediction());
            
            prediction.setExam(exam);
            prediction.setStudent(student);
            
            if (predictionDetails.getPrediction1() != null) {
                prediction.setPrediction1(predictionDetails.getPrediction1());
                // Punkte automatisch berechnen, wenn Note vorhanden
                if (exam.getGrades() != null && exam.getGrades().containsKey(studentId)) {
                    Double grade = exam.getGrades().get(studentId);
                    prediction.setPoints1(pointsCalculationService.calculatePoints(predictionDetails.getPrediction1(), grade));
                }
            }
            if (predictionDetails.getPrediction2() != null) {
                prediction.setPrediction2(predictionDetails.getPrediction2());
                // Punkte automatisch berechnen, wenn Note vorhanden
                if (exam.getGrades() != null && exam.getGrades().containsKey(studentId)) {
                    Double grade = exam.getGrades().get(studentId);
                    prediction.setPoints2(pointsCalculationService.calculatePoints(predictionDetails.getPrediction2(), grade));
                }
            }
            if (predictionDetails.getPoints1() != null) {
                prediction.setPoints1(predictionDetails.getPoints1());
            }
            if (predictionDetails.getPoints2() != null) {
                prediction.setPoints2(predictionDetails.getPoints2());
            }
            
            return predictionRepository.save(prediction);
        } catch (ResourceNotFoundException | ValidationException | IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Fehler beim Speichern der Vorhersage", e);
        } finally {
            // Cleanup oder Logging könnte hier erfolgen
        }
    }
    
    @Transactional
    public void deletePrediction(Long id) {
        try {
            Prediction prediction = getPredictionById(id);
            predictionRepository.delete(prediction);
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Fehler beim Löschen der Vorhersage", e);
        } finally {
            // Cleanup oder Logging könnte hier erfolgen
        }
    }
}

