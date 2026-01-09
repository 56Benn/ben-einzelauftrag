package com.pruefungstipp.repository;

import com.pruefungstipp.model.Exam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamRepository extends JpaRepository<Exam, Long> {
    List<Exam> findByIsClosedOrderByDateDesc(Boolean isClosed);
    List<Exam> findAllByOrderByDateDesc();
}

