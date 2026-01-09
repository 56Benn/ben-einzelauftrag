package com.pruefungstipp.controller;

import com.pruefungstipp.model.Exam;
import com.pruefungstipp.service.ExamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exams")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class ExamController {
    
    private final ExamService examService;
    
    @GetMapping
    public ResponseEntity<List<Exam>> getAllExams() {
        return ResponseEntity.ok(examService.getAllExams());
    }
    
    @GetMapping("/pending")
    public ResponseEntity<List<Exam>> getPendingExams() {
        return ResponseEntity.ok(examService.getPendingExams());
    }
    
    @GetMapping("/graded")
    public ResponseEntity<List<Exam>> getGradedExams() {
        return ResponseEntity.ok(examService.getGradedExams());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Exam> getExamById(@PathVariable Long id) {
        return ResponseEntity.ok(examService.getExamById(id));
    }
    
    @PostMapping
    public ResponseEntity<Exam> createExam(@RequestBody Exam exam) {
        return new ResponseEntity<>(examService.createExam(exam), HttpStatus.CREATED);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Exam> updateExam(@PathVariable Long id, @RequestBody Exam exam) {
        return ResponseEntity.ok(examService.updateExam(id, exam));
    }
    
    @PutMapping("/{id}/close")
    public ResponseEntity<Exam> closeExam(@PathVariable Long id) {
        return ResponseEntity.ok(examService.closeExam(id));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExam(@PathVariable Long id) {
        examService.deleteExam(id);
        return ResponseEntity.noContent().build();
    }
}

