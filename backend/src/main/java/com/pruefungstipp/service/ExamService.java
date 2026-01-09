package com.pruefungstipp.service;

import com.pruefungstipp.exception.ResourceNotFoundException;
import com.pruefungstipp.model.Exam;
import com.pruefungstipp.repository.ExamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ExamService extends BaseService {
    
    private final ExamRepository examRepository;
    
    public List<Exam> getAllExams() {
        return examRepository.findAllByOrderByDateDesc();
    }
    
    public List<Exam> getPendingExams() {
        return examRepository.findByIsClosedOrderByDateDesc(false);
    }
    
    public List<Exam> getGradedExams() {
        return examRepository.findByIsClosedOrderByDateDesc(true);
    }
    
    public Exam getExamById(Long id) {
        return requireExists(
            examRepository.findById(id).orElse(null),
            "Exam",
            id
        );
    }
    
    @Transactional
    public Exam createExam(Exam exam) {
        return examRepository.save(exam);
    }
    
    @Transactional
    public Exam updateExam(Long id, Exam examDetails) {
        Exam exam = getExamById(id);
        exam.setTitle(examDetails.getTitle());
        exam.setSubject(examDetails.getSubject());
        exam.setDescription(examDetails.getDescription());
        exam.setDate(examDetails.getDate());
        exam.setIsClosed(examDetails.getIsClosed());
        if (examDetails.getGrades() != null) {
            exam.setGrades(examDetails.getGrades());
        }
        return examRepository.save(exam);
    }
    
    @Transactional
    public Exam closeExam(Long id) {
        Exam exam = getExamById(id);
        exam.setIsClosed(true);
        return examRepository.save(exam);
    }
    
    @Transactional
    public void deleteExam(Long id) {
        Exam exam = getExamById(id);
        examRepository.delete(exam);
    }
}

