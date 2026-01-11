package com.pruefungstipp.config;

import com.pruefungstipp.model.Exam;
import com.pruefungstipp.model.User;
import com.pruefungstipp.repository.ExamRepository;
import com.pruefungstipp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class DataLoader implements CommandLineRunner {
    
    private final UserRepository userRepository;
    private final ExamRepository examRepository;
    
    @Override
    public void run(String... args) {
        // Create default users only if database is empty (first start)
        if (userRepository.count() == 0) {
            User student1 = new User();
            student1.setUsername("Schüler1");
            student1.setEmail("schueler1@test.ch");
            student1.setPassword("schueler1");
            student1.setRole(User.UserRole.STUDENT);
            userRepository.save(student1);
            
            User student2 = new User();
            student2.setUsername("Schüler2");
            student2.setEmail("schueler2@test.ch");
            student2.setPassword("schueler2");
            student2.setRole(User.UserRole.STUDENT);
            userRepository.save(student2);
            
            User teacher = new User();
            teacher.setUsername("Lehrer");
            teacher.setEmail("lehrer@test.ch");
            teacher.setPassword("lehrer");
            teacher.setRole(User.UserRole.TEACHER);
            userRepository.save(teacher);
        }
        
        // Create default exam only if no exams exist (first start)
        if (examRepository.count() == 0) {
            Exam exam = new Exam();
            exam.setTitle("Proportionalität");
            exam.setSubject("Mathematik");
            exam.setDescription("Prüfung über Proportionalität");
            exam.setDate(LocalDate.of(2025, 11, 6));
            exam.setIsClosed(false);
            examRepository.save(exam);
        }
    }
}

