package com.pruefungstipp.service;

import com.pruefungstipp.exception.ResourceNotFoundException;
import com.pruefungstipp.exception.ValidationException;
import com.pruefungstipp.model.Exam;
import com.pruefungstipp.repository.ExamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExamService extends BaseService {
    
    private final ExamRepository examRepository;
    
    public List<Exam> getAllExams() {
        try {
            return examRepository.findAllByOrderByDateDesc();
        } catch (Exception e) {
            throw new RuntimeException("Fehler beim Laden der Prüfungen: " + e.getMessage(), e);
        }
    }
    
    public List<Exam> getPendingExams() {
        try {
            return examRepository.findByIsClosedOrderByDateDesc(false);
        } catch (Exception e) {
            throw new RuntimeException("Fehler beim Laden der ausstehenden Prüfungen", e);
        }
    }
    
    public List<Exam> getGradedExams() {
        try {
            return examRepository.findByIsClosedOrderByDateDesc(true);
        } catch (Exception e) {
            throw new RuntimeException("Fehler beim Laden der benoteten Prüfungen", e);
        }
    }
    
    public Exam getExamById(Long id) {
        try {
            return requireExists(
                examRepository.findById(id).orElse(null),
                "Exam",
                id
            );
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Fehler beim Laden der Prüfung mit ID " + id, e);
        }
    }
    
    @Transactional
    public Exam createExam(Exam exam) {
        try {
            // Validierung
            if (exam.getTitle() == null || exam.getTitle().trim().isEmpty()) {
                throw new ValidationException("Titel ist erforderlich");
            }
            if (exam.getSubject() == null || exam.getSubject().trim().isEmpty()) {
                throw new ValidationException("Fach ist erforderlich");
            }
            if (exam.getDate() == null) {
                throw new ValidationException("Datum ist erforderlich");
            }
            if (exam.getDate().isBefore(LocalDate.now())) {
                throw new ValidationException("Prüfungsdatum darf nicht in der Vergangenheit liegen");
            }
            
            return examRepository.save(exam);
        } catch (ValidationException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Fehler beim Erstellen der Prüfung", e);
        } finally {
            // Cleanup oder Logging könnte hier erfolgen
        }
    }
    
    @Transactional
    public Exam updateExam(Long id, Exam examDetails) {
        try {
            Exam exam = getExamById(id);
            
            // Validierung
            if (examDetails.getTitle() != null && examDetails.getTitle().trim().isEmpty()) {
                throw new ValidationException("Titel darf nicht leer sein");
            }
            if (examDetails.getSubject() != null && examDetails.getSubject().trim().isEmpty()) {
                throw new ValidationException("Fach darf nicht leer sein");
            }
            if (examDetails.getDate() != null && examDetails.getDate().isBefore(LocalDate.now())) {
                throw new ValidationException("Prüfungsdatum darf nicht in der Vergangenheit liegen");
            }
            
            exam.setTitle(examDetails.getTitle());
            exam.setSubject(examDetails.getSubject());
            exam.setDescription(examDetails.getDescription());
            exam.setDate(examDetails.getDate());
            exam.setIsClosed(examDetails.getIsClosed());
            if (examDetails.getGrades() != null) {
                exam.setGrades(examDetails.getGrades());
            }
            return examRepository.save(exam);
        } catch (ValidationException | ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Fehler beim Aktualisieren der Prüfung", e);
        } finally {
            // Cleanup oder Logging könnte hier erfolgen
        }
    }
    
    @Transactional
    public Exam closeExam(Long id) {
        try {
            Exam exam = getExamById(id);
            if (exam.getIsClosed()) {
                throw new IllegalStateException("Prüfung ist bereits abgeschlossen");
            }
            exam.setIsClosed(true);
            return examRepository.save(exam);
        } catch (ResourceNotFoundException | IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Fehler beim Abschließen der Prüfung", e);
        } finally {
            // Cleanup oder Logging könnte hier erfolgen
        }
    }
    
    @Transactional
    public void deleteExam(Long id) {
        try {
            Exam exam = getExamById(id);
            examRepository.delete(exam);
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Fehler beim Löschen der Prüfung", e);
        } finally {
            // Cleanup oder Logging könnte hier erfolgen
        }
    }
}

