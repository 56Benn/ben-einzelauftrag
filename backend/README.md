# Prüfungs-Tipp Backend

Spring Boot Backend für die Prüfungs-Tipp Applikation.

## Technologie-Stack

- **Spring Boot 3.2.0**
- **Spring Data JPA**
- **H2 Database** (In-Memory)
- **Lombok**
- **Maven**

## Features

- RESTful API für User, Exams und Predictions
- Exception Handling
- Clean Code Prinzipien
- Vererbung (BaseService)
- Unit Tests
- CORS Konfiguration

## API Endpoints

### Users
- `GET /api/users` - Alle User
- `GET /api/users/{id}` - User nach ID
- `GET /api/users/email/{email}` - User nach E-Mail
- `POST /api/users` - User erstellen
- `PUT /api/users/{id}` - User aktualisieren
- `DELETE /api/users/{id}` - User löschen

### Exams
- `GET /api/exams` - Alle Prüfungen
- `GET /api/exams/pending` - Ausstehende Prüfungen
- `GET /api/exams/graded` - Benotete Prüfungen
- `GET /api/exams/{id}` - Prüfung nach ID
- `POST /api/exams` - Prüfung erstellen
- `PUT /api/exams/{id}` - Prüfung aktualisieren
- `PUT /api/exams/{id}/close` - Prüfung abschließen
- `DELETE /api/exams/{id}` - Prüfung löschen

### Predictions
- `GET /api/predictions` - Alle Vorhersagen
- `GET /api/predictions/{id}` - Vorhersage nach ID
- `GET /api/predictions/exam/{examId}/student/{studentId}` - Vorhersage für Prüfung und Schüler
- `GET /api/predictions/exam/{examId}` - Alle Vorhersagen für eine Prüfung
- `GET /api/predictions/student/{studentId}` - Alle Vorhersagen eines Schülers
- `POST /api/predictions/exam/{examId}/student/{studentId}` - Vorhersage erstellen/aktualisieren
- `DELETE /api/predictions/{id}` - Vorhersage löschen

## Installation

```bash
cd backend
mvn clean install
```

## Starten

```bash
mvn spring-boot:run
```

Das Backend läuft dann auf `http://localhost:8080`

## H2 Console

Die H2 Console ist verfügbar unter: `http://localhost:8080/h2-console`
- JDBC URL: `jdbc:h2:mem:testdb`
- Username: `sa`
- Password: (leer)

## Tests

```bash
mvn test
```

## Clean Code Prinzipien

- **BaseService**: Abstrakte Basisklasse für Service-Layer mit gemeinsamer Funktionalität
- **Exception Handling**: GlobalExceptionHandler für zentrale Fehlerbehandlung
- **Service Layer**: Geschäftslogik getrennt von Controllern
- **Repository Pattern**: Datenzugriff über Repositories

## Vererbung/Interfaces

- `BaseService`: Basisklasse für alle Services
- `JpaRepository`: Interface für Datenzugriff

