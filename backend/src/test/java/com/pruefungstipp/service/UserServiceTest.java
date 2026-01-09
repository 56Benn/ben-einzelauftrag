package com.pruefungstipp.service;

import com.pruefungstipp.exception.ResourceNotFoundException;
import com.pruefungstipp.model.User;
import com.pruefungstipp.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {
    
    @Mock
    private UserRepository userRepository;
    
    @InjectMocks
    private UserService userService;
    
    private User testUser;
    
    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("TestUser");
        testUser.setEmail("test@test.ch");
        testUser.setPassword("password");
        testUser.setRole(User.UserRole.STUDENT);
    }
    
    @Test
    void testGetUserById_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        
        User result = userService.getUserById(1L);
        
        assertNotNull(result);
        assertEquals("TestUser", result.getUsername());
        verify(userRepository, times(1)).findById(1L);
    }
    
    @Test
    void testGetUserById_NotFound() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());
        
        assertThrows(ResourceNotFoundException.class, () -> {
            userService.getUserById(1L);
        });
    }
    
    @Test
    void testCreateUser_Success() {
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        
        User result = userService.createUser(testUser);
        
        assertNotNull(result);
        verify(userRepository, times(1)).save(testUser);
    }
    
    @Test
    void testCreateUser_EmailExists() {
        when(userRepository.existsByEmail(anyString())).thenReturn(true);
        
        assertThrows(IllegalArgumentException.class, () -> {
            userService.createUser(testUser);
        });
    }
}

