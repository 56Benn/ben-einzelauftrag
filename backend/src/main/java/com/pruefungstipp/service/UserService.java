package com.pruefungstipp.service;

import com.pruefungstipp.exception.DuplicateResourceException;
import com.pruefungstipp.exception.ResourceNotFoundException;
import com.pruefungstipp.exception.ValidationException;
import com.pruefungstipp.model.User;
import com.pruefungstipp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService extends BaseService {
    
    private final UserRepository userRepository;
    
    public List<User> getAllUsers() {
        try {
            return userRepository.findAll();
        } catch (Exception e) {
            throw new RuntimeException("Fehler beim Laden der Benutzer: " + e.getMessage(), e);
        }
    }
    
    public User getUserById(Long id) {
        try {
            return requireExists(
                userRepository.findById(id).orElse(null),
                "User",
                id
            );
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Fehler beim Laden des Benutzers mit ID " + id, e);
        }
    }
    
    public User getUserByEmail(String email) {
        try {
            if (email == null || email.trim().isEmpty()) {
                throw new ValidationException("E-Mail darf nicht leer sein");
            }
            return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User mit E-Mail " + email + " nicht gefunden"));
        } catch (ResourceNotFoundException | ValidationException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Fehler beim Laden des Benutzers mit E-Mail " + email, e);
        }
    }
    
    @Transactional
    public User createUser(User user) {
        try {
            // Validierung
            if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
                throw new ValidationException("E-Mail ist erforderlich");
            }
            if (user.getUsername() == null || user.getUsername().trim().isEmpty()) {
                throw new ValidationException("Username ist erforderlich");
            }
            if (user.getPassword() == null || user.getPassword().trim().isEmpty()) {
                throw new ValidationException("Passwort ist erforderlich");
            }
            
            // Prüfung auf Duplikate
            if (userRepository.existsByEmail(user.getEmail())) {
                throw new DuplicateResourceException("E-Mail bereits vergeben");
            }
            if (userRepository.existsByUsername(user.getUsername())) {
                throw new DuplicateResourceException("Username bereits vergeben");
            }
            
            return userRepository.save(user);
        } catch (ValidationException | DuplicateResourceException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Fehler beim Erstellen des Benutzers", e);
        } finally {
            // Cleanup oder Logging könnte hier erfolgen
        }
    }
    
    @Transactional
    public User updateUser(Long id, User userDetails) {
        try {
            User user = getUserById(id);
            
            // Validierung
            if (userDetails.getUsername() != null && userDetails.getUsername().trim().isEmpty()) {
                throw new ValidationException("Username darf nicht leer sein");
            }
            if (userDetails.getEmail() != null && userDetails.getEmail().trim().isEmpty()) {
                throw new ValidationException("E-Mail darf nicht leer sein");
            }
            
            // Prüfung auf Duplikate (nur wenn geändert)
            if (userDetails.getEmail() != null && !userDetails.getEmail().equals(user.getEmail())) {
                if (userRepository.existsByEmail(userDetails.getEmail())) {
                    throw new DuplicateResourceException("E-Mail bereits vergeben");
                }
            }
            if (userDetails.getUsername() != null && !userDetails.getUsername().equals(user.getUsername())) {
                if (userRepository.existsByUsername(userDetails.getUsername())) {
                    throw new DuplicateResourceException("Username bereits vergeben");
                }
            }
            
            user.setUsername(userDetails.getUsername());
            user.setEmail(userDetails.getEmail());
            if (userDetails.getPassword() != null && !userDetails.getPassword().isEmpty()) {
                user.setPassword(userDetails.getPassword());
            }
            return userRepository.save(user);
        } catch (ValidationException | DuplicateResourceException | ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Fehler beim Aktualisieren des Benutzers", e);
        } finally {
            // Cleanup oder Logging könnte hier erfolgen
        }
    }
    
    @Transactional
    public void deleteUser(Long id) {
        try {
            User user = getUserById(id);
            userRepository.delete(user);
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Fehler beim Löschen des Benutzers", e);
        } finally {
            // Cleanup oder Logging könnte hier erfolgen
        }
    }
}

