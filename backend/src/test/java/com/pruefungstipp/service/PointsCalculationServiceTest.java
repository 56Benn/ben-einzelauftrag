package com.pruefungstipp.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class PointsCalculationServiceTest {
    
    @InjectMocks
    private PointsCalculationService pointsCalculationService;
    
    @Test
    void testCalculatePoints_ExactMatch() {
        Integer points = pointsCalculationService.calculatePoints(5.0, 5.0);
        assertEquals(5, points);
    }
    
    @Test
    void testCalculatePoints_QuarterDifference() {
        Integer points = pointsCalculationService.calculatePoints(5.0, 5.25);
        assertEquals(4, points);
    }
    
    @Test
    void testCalculatePoints_HalfDifference() {
        Integer points = pointsCalculationService.calculatePoints(5.0, 5.5);
        assertEquals(3, points);
    }
    
    @Test
    void testCalculatePoints_ThreeQuarterDifference() {
        Integer points = pointsCalculationService.calculatePoints(5.0, 5.75);
        assertEquals(2, points);
    }
    
    @Test
    void testCalculatePoints_OneDifference() {
        Integer points = pointsCalculationService.calculatePoints(5.0, 6.0);
        assertEquals(1, points);
    }
    
    @Test
    void testCalculatePoints_MoreThanOneDifference() {
        Integer points = pointsCalculationService.calculatePoints(5.0, 6.5);
        assertEquals(0, points);
    }
    
    @Test
    void testCalculatePoints_NullValues() {
        assertNull(pointsCalculationService.calculatePoints(null, 5.0));
        assertNull(pointsCalculationService.calculatePoints(5.0, null));
    }
}

