# Prüfungs-Tipp App

Eine moderne Web-Anwendung für Schüler und Lehrer, um Prüfungsergebnisse zu tippen und zu verwalten.

## Features

### Für Schüler:
- **Login** mit E-Mail und Passwort
- **Schnell-Anmeldung** für zuvor angemeldete Accounts
- **Prüfungen tippen**: Zwei Tipps pro Prüfung (vor und nach der Prüfung)
- **Punkte-System**: Punkte basierend auf der Genauigkeit der Tipps
- **Rangliste**: Pro Prüfung und Gesamt-Rangliste
- **Profil**: Übersicht über vergangene Prüfungen mit Noten und Punkten

### Für Lehrer:
- **Prüfungen erstellen**: Titel, Fach, Beschreibung, Datum
- **Prüfungen bearbeiten**: Noten eintragen
- **Prüfungen abschliessen**: Keine weiteren Tipps möglich
- **Übersicht**: Alle Prüfungen mit Tipps und Noten der Schüler

## Technologie-Stack

- **React 19** mit TypeScript
- **Vite** als Build-Tool
- **Tailwind CSS** für Styling
- **ShadCN UI** Komponenten
- **React Router** für Navigation
- **LocalStorage** für Datenpersistenz (Frontend-only)

## Installation

```bash
cd frontend
npm install
```

## Entwicklung

```bash
npm run dev
```

Die App läuft dann auf `http://localhost:5173`

## Build

```bash
npm run build
```

## Vordefinierte Accounts

### Schüler:
- **Schüler1**: 
  - E-Mail: `schueler1@test.ch`
  - Passwort: `schueler1`

- **Schüler2**: 
  - E-Mail: `schueler2@test.ch`
  - Passwort: `schueler2`

### Lehrer:
- **Lehrer**: 
  - E-Mail: `lehrer@test.ch`
  - Passwort: `lehrer`

## Punkte-System

Punkte werden basierend auf der Genauigkeit der Tipps vergeben:
- **Exakt richtig**: 5 Punkte
- **Abweichung ≤ 0.25**: 4 Punkte
- **Abweichung ≤ 0.5**: 3 Punkte
- **Abweichung ≤ 0.75**: 2 Punkte
- **Abweichung ≤ 1.0**: 1 Punkt
- **Abweichung > 1.0**: 0 Punkte

## Projektstruktur

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/          # ShadCN UI Komponenten
│   │   └── Layout.tsx    # Haupt-Layout mit Navigation
│   ├── context/
│   │   └── AuthContext.tsx  # Authentifizierung
│   ├── lib/
│   │   ├── storage.ts   # LocalStorage Utilities
│   │   ├── points.ts    # Punkte-Berechnung
│   │   └── utils.ts     # Utility-Funktionen
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── StudentDashboard.tsx
│   │   ├── Profile.tsx
│   │   ├── Leaderboard.tsx
│   │   └── TeacherDashboard.tsx
│   ├── types/
│   │   └── index.ts     # TypeScript Typen
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
└── package.json
```

## Hinweise

- Die App verwendet aktuell LocalStorage für die Datenpersistenz
- Backend-Integration kann später hinzugefügt werden
- Alle Funktionen sind vollständig implementiert und funktionsfähig


