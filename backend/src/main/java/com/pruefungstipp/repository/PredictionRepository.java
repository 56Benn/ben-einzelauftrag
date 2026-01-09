package com.pruefungstipp.repository;

import com.pruefungstipp.model.Exam;
import com.pruefungstipp.model.Prediction;
import com.pruefungstipp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PredictionRepository extends JpaRepository<Prediction, Long> {
    Optional<Prediction> findByExamAndStudent(Exam exam, User student);
    List<Prediction> findByExam(Exam exam);
    List<Prediction> findByStudent(User student);
}

