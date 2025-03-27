# PRD: 10xRules.ai

## 1. Zwięzły opis projektu i jego celów

Projekt 10xRules.ai to nowoczesna aplikacja webowa umożliwiająca programistom tworzenie, generowanie i wersjonowanie reguł dla narzędzi AI, takich jak GitHub Copilot, Cursor czy Windsurf. Aplikacja zapewnia intuicyjny, wizualny kreator reguł, pozwalający na budowanie hierarchicznych zestawów reguł przy użyciu interfejsu drag & drop. Głównym celem jest poprawa jakości współpracy programisty z AI poprzez automatyzację i standaryzację procesu definiowania reguł.

## 2. Jasno zdefiniowany problem użytkownika

- Programiści borykają się z niespójnymi metodami definiowania reguł dla AI, co obniża efektywność pracy z narzędziami wspomaganymi sztuczną inteligencją.
- Brak intuicyjnych narzędzi do tworzenia uporządkowanych, hierarchicznych reguł powoduje, że dokładne definiowanie reguł wymaga specjalistycznej wiedzy i doświadczenia.
- Użytkownicy potrzebują rozwiązania, które umożliwia szybkie generowanie zestawów reguł odpowiadających specyficznym technologiom i projektom.

## 3. Wymagania funkcjonalne

- Wizualny kreator reguł umożliwiający budowanie hierarchicznych zestawów reguł.
- Generowanie reguł w formacie Markdown oraz możliwość kopiowania wygenerowanych reguł do schowka.
- Możliwość pobierania gotowych zestawów reguł z predefiniowanego katalogu podzielonego na warstwy (np. Frontend, React, Zustand).
- Generowanie reguł na podstawie plików dependency (np. package.json, requirements.txt) poprzez analizę zawartości tych plików.
- Inteligentne sugestie dodatkowych reguł proponowanych przez AI na podstawie wyborów użytkownika.
- Wersjonowanie tworzonego zestawu reguł z możliwością przeglądania historii oraz przywracania wcześniejszych wersji.

## 4. Granice projektu

- Zaawansowane funkcje udostępniania reguł między użytkownikami nie są uwzględnione w MVP.
- Edycja już wygenerowanych reguł w trybie "inline editing" nie jest przewidziana.
- Eksport do formatów innych niż Markdown nie wchodzi w zakres MVP.
- Rozbudowane funkcje społeczne wykraczają poza obecny zakres funkcjonalności.

## 5. Precyzyjne user stories

US-001: Podstawowa generacja reguł

- Tytuł: Generowanie zestawu reguł
- Opis: Jako użytkownik chcę wybrać elementy z predefiniowanego katalogu reguł, aby wygenerować zestaw reguł dopasowany do konkretnej technologii, co usprawni współpracę z narzędziami AI.
- Kryteria akceptacji:
  - Użytkownik widzi pełny katalog reguł podzielony na kategorie (np. Frontend, Backend, biblioteki).
  - Użytkownik może wybrać poszczególne reguły i otrzymać podgląd wygenerowanego zestawu w formacie Markdown.
  - Użytkownik może skopiować wygenerowane reguły do schowka.

US-002: Generowanie reguł na podstawie pliku dependency

- Tytuł: Generowanie reguł z pliku dependency
- Opis: Jako użytkownik chcę przesłać plik (np. package.json lub requirements.txt), aby system automatycznie wygenerował zestaw reguł na podstawie wykrytych zależności projektu.
- Kryteria akceptacji:
  - Użytkownik może przesłać plik dependency.
  - System analizuje zawartość pliku i dopasowuje odpowiednie reguły.
  - Wygenerowany zestaw reguł odpowiada konfiguracji projektu.

US-003: Sugestie dodatkowych reguł przez AI

- Tytuł: Sugestie AI
- Opis: Jako użytkownik chcę otrzymać inteligentne sugestie dodatkowych reguł na podstawie moich wyborów z katalogu, aby upewnić się, że nie pominąłem istotnych aspektów.
- Kryteria akceptacji:
  - Po wybraniu reguł system prezentuje propozycje dodatkowych reguł generowane przez AI.
  - Użytkownik może zaakceptować lub odrzucić sugerowane reguły.

US-004: Wersjonowanie reguł

- Tytuł: Zarządzanie wersjami reguł
- Opis: Jako użytkownik chcę mieć możliwość zapisywania różnych wersji wygenerowanych zestawów reguł, aby móc wrócić do poprzednich konfiguracji w razie potrzeby.
- Kryteria akceptacji:
  - System zapisuje historię wersji wygenerowanych reguł.
  - Użytkownik może przeglądać historię wersji i przywracać wybrane wersje.

US-005: Bezpieczny dostęp i uwierzytelnianie

- Tytuł: Bezpieczny dostęp
- Opis: Jako użytkownik chcę mieć możliwość logowania się do systemu w sposób zapewniający bezpieczeństwo moich danych oraz wygenerowanych reguł.
- Kryteria akceptacji:
  - Użytkownik musi przejść proces rejestracji i logowania przed korzystaniem z głównych funkcji aplikacji.
  - System implementuje bezpieczne mechanizmy uwierzytelniania.
  - Użytkownik może odzyskać hasło w przypadku problemów z logowaniem.

US-006: Udostępnianie i import reguł

- Tytuł: Udostępnianie reguł
- Opis: Jako użytkownik chcę móc zapisywać, udostępniać oraz importować zestawy reguł, aby szybko wykorzystywać sprawdzone rozwiązania w różnych projektach.
- Kryteria akceptacji:
  - Użytkownik może zapisać aktualny zestaw reguł jako szablon.
  - Użytkownik może udostępnić szablon innym użytkownikom.
  - Użytkownik może importować szablony i zastosować je w nowych projektach.

## 6. Metryki sukcesu

- Liczba wygenerowanych zestawów reguł i wzrost aktywności użytkowników korzystających z kreatora.
- Średni czas potrzebny na wygenerowanie zestawu reguł przez użytkownika.
- Wskaźnik adopcji funkcji generowania reguł na podstawie plików dependency.
- Pozytywne opinie użytkowników dotyczące intuicyjności i użyteczności aplikacji.
- Liczba zapisanych wersji reguł oraz częstotliwość korzystania z funkcji przywracania wersji.
- Wskaźnik konwersji dla funkcji inteligentnych sugestii reguł przez AI.
