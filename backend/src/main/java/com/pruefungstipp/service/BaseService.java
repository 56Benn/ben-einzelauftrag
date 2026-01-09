package com.pruefungstipp.service;

import com.pruefungstipp.exception.ResourceNotFoundException;

public abstract class BaseService {
    
    protected <T> T requireExists(T entity, String resourceName, Long id) {
        if (entity == null) {
            throw new ResourceNotFoundException(resourceName + " mit ID " + id + " nicht gefunden");
        }
        return entity;
    }
}

