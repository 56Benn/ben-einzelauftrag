package com.pruefungstipp.controller;

import com.pruefungstipp.model.Prediction;
import com.pruefungstipp.service.PredictionService;
import com.pruefungstipp.service.PointsCalculationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/predictions")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class PredictionController {
    
    private final PredictionService predictionService;
    private final PointsCalculationService pointsCalculationService;
    
    @GetMapping
    public ResponseEntity<List<Prediction>> getAllPredictions() {
        return ResponseEntity.ok(predictionService.getAllPredictions());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Prediction> getPredictionById(@PathVariable Long id) {
        return ResponseEntity.ok(predictionService.getPredictionById(id));
    }
    
    @GetMapping("/exam/{examId}/student/{studentId}")
    public ResponseEntity<Prediction> getPredictionByExamAndStudent(
            @PathVariable Long examId,
            @PathVariable Long studentId) {
        Prediction prediction = predictionService.getPredictionByExamAndStudent(examId, studentId);
        if (prediction == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(prediction);
    }
    
    @GetMapping("/exam/{examId}")
    public ResponseEntity<List<Prediction>> getPredictionsByExam(@PathVariable Long examId) {
        return ResponseEntity.ok(predictionService.getPredictionsByExam(examId));
    }
    
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Prediction>> getPredictionsByStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(predictionService.getPredictionsByStudent(studentId));
    }
    
    @PostMapping("/exam/{examId}/student/{studentId}")
    public ResponseEntity<Prediction> createOrUpdatePrediction(
            @PathVariable Long examId,
            @PathVariable Long studentId,
            @RequestBody Prediction prediction) {
        
        // Calculate points if grade exists
        // This would need exam data, simplified here
        Prediction saved = predictionService.createOrUpdatePrediction(examId, studentId, prediction);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePrediction(@PathVariable Long id) {
        predictionService.deletePrediction(id);
        return ResponseEntity.noContent().build();
    }
}

