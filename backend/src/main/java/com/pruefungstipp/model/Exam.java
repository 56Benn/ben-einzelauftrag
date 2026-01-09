package com.pruefungstipp.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "exams")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Exam {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String title;
    
    @Column(nullable = false)
    private String subject;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(nullable = false)
    private LocalDate date;
    
    @Column(nullable = false)
    private Boolean isClosed = false;
    
    @ElementCollection
    @CollectionTable(name = "exam_grades", joinColumns = @JoinColumn(name = "exam_id"))
    @MapKeyColumn(name = "student_id")
    @Column(name = "grade")
    private Map<Long, Double> grades = new HashMap<>();
}

