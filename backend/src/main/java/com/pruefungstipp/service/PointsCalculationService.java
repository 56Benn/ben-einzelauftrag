package com.pruefungstipp.service;

import org.springframework.stereotype.Service;

@Service
public class PointsCalculationService {
    
    /**
     * Berechnet Punkte basierend auf der Genauigkeit der Vorhersage
     * Exakt: 5 Punkte
     * ≤0.25 Abweichung: 4 Punkte
     * ≤0.5 Abweichung: 3 Punkte
     * ≤0.75 Abweichung: 2 Punkte
     * ≤1.0 Abweichung: 1 Punkt
     * >1.0 Abweichung: 0 Punkte
     */
    public Integer calculatePoints(Double prediction, Double actualGrade) {
        if (prediction == null || actualGrade == null) {
            return null;
        }
        
        double difference = Math.abs(prediction - actualGrade);
        
        if (difference == 0) return 5;
        if (difference <= 0.25) return 4;
        if (difference <= 0.5) return 3;
        if (difference <= 0.75) return 2;
        if (difference <= 1.0) return 1;
        return 0;
    }
}

