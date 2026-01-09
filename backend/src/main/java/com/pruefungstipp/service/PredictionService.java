package com.pruefungstipp.service;

import com.pruefungstipp.exception.ResourceNotFoundException;
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
    
    public List<Prediction> getAllPredictions() {
        return predictionRepository.findAll();
    }
    
    public Prediction getPredictionById(Long id) {
        return requireExists(
            predictionRepository.findById(id).orElse(null),
            "Prediction",
            id
        );
    }
    
    public Prediction getPredictionByExamAndStudent(Long examId, Long studentId) {
        Exam exam = examRepository.findById(examId)
            .orElseThrow(() -> new ResourceNotFoundException("Exam mit ID " + examId + " nicht gefunden"));
        User student = userRepository.findById(studentId)
            .orElseThrow(() -> new ResourceNotFoundException("User mit ID " + studentId + " nicht gefunden"));
        
        return predictionRepository.findByExamAndStudent(exam, student)
            .orElse(null);
    }
    
    public List<Prediction> getPredictionsByExam(Long examId) {
        Exam exam = examRepository.findById(examId)
            .orElseThrow(() -> new ResourceNotFoundException("Exam mit ID " + examId + " nicht gefunden"));
        return predictionRepository.findByExam(exam);
    }
    
    public List<Prediction> getPredictionsByStudent(Long studentId) {
        User student = userRepository.findById(studentId)
            .orElseThrow(() -> new ResourceNotFoundException("User mit ID " + studentId + " nicht gefunden"));
        return predictionRepository.findByStudent(student);
    }
    
    @Transactional
    public Prediction createOrUpdatePrediction(Long examId, Long studentId, Prediction predictionDetails) {
        Exam exam = examRepository.findById(examId)
            .orElseThrow(() -> new ResourceNotFoundException("Exam mit ID " + examId + " nicht gefunden"));
        User student = userRepository.findById(studentId)
            .orElseThrow(() -> new ResourceNotFoundException("User mit ID " + studentId + " nicht gefunden"));
        
        if (exam.getIsClosed()) {
            throw new IllegalStateException("Prüfung ist bereits abgeschlossen");
        }
        
        Prediction prediction = predictionRepository.findByExamAndStudent(exam, student)
            .orElse(new Prediction());
        
        prediction.setExam(exam);
        prediction.setStudent(student);
        
        if (predictionDetails.getPrediction1() != null) {
            prediction.setPrediction1(predictionDetails.getPrediction1());
        }
        if (predictionDetails.getPrediction2() != null) {
            prediction.setPrediction2(predictionDetails.getPrediction2());
        }
        if (predictionDetails.getPoints1() != null) {
            prediction.setPoints1(predictionDetails.getPoints1());
        }
        if (predictionDetails.getPoints2() != null) {
            prediction.setPoints2(predictionDetails.getPoints2());
        }
        
        return predictionRepository.save(prediction);
    }
    
    @Transactional
    public void deletePrediction(Long id) {
        Prediction prediction = getPredictionById(id);
        predictionRepository.delete(prediction);
    }
}

