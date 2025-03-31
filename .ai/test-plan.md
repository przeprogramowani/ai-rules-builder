# Plan Testów dla Projektu 10xRules.ai

## 1. Wprowadzenie i Cele Testowania

Celem testowania jest zapewnienie, że aplikacja działa zgodnie z wymaganiami biznesowymi i technicznymi oraz spełnia oczekiwania użytkowników. Plan testów obejmuje weryfikację kluczowych funkcjonalności, integracji między komponentami oraz poprawności działania całego systemu od frontendu po backend, ze szczególnym uwzględnieniem kompatybilności technologicznej i bezpieczeństwa.

## 2. Zakres Testów

- **Frontend i UI**: Testy renderowania stron Astro i interaktywnych komponentów React, weryfikacja poprawności implementacji stylów (Tailwind CSS) oraz działania trybu ciemnego.
- **Backend i API**: Testy endpointów API, logiki autentykacji (Supabase), walidacji danych i przetwarzania żądań.
- **Integracja**: Testy integracyjne między warstwą frontendu, backendu, systemem zarządzania stanem (Zustand) oraz bazą danych.
- **Funkcjonalności Biznesowe**: Testy kreatora reguł, generowania reguł na podstawie plików dependency oraz zarządzania kolekcjami reguł.
- **Wydajność i Bezpieczeństwo**: Testy wydajnościowe, testy obciążeniowe, a także testy zabezpieczeń (autentykacja, ochrona przed atakami typu XSS/CSRF).

## 3. Typy Testów

- **Testy jednostkowe (Unit Tests)**: Walidacja logiki pojedynczych funkcji, komponentów React oraz modułów przetwarzania danych.
- **Testy integracyjne**: Weryfikacja poprawnej współpracy między komponentami frontendu, komunikacji z API oraz integracji z Supabase.
- **Testy end-to-end (E2E)**: Symulacja pełnych ścieżek użytkownika, m.in. proces rejestracji, logowania, generowania reguł, upload plików oraz zarządzania kolekcjami.
- **Testy wydajnościowe**: Mierzenie czasu odpowiedzi endpointów API, ocena szybkości renderowania oraz testy obciążeniowe.
- **Testy bezpieczeństwa**: Sprawdzenie mechanizmów autoryzacji, weryfikacja zabezpieczeń przed atakami oraz kontrola dostępu do funkcji chronionych.
- **Testy typów TypeScript**: Sprawdzanie poprawności typów, szczególnie dla współdzielonych interfejsów.
- **Testy wizualne**: Wykrywanie niezamierzonych zmian w wyglądzie komponentów UI.
- **Testy dostępności**: Weryfikacja zgodności z wytycznymi dostępności WCAG.

## 4. Scenariusze Testowe dla Kluczowych Funkcjonalności

- **Kreator Reguł**
  - Wybór elementów z predefiniowanego katalogu reguł.
  - Generowanie zestawu reguł w formacie Markdown.
  - Kopiowanie wygenerowanych reguł do schowka.
- **Generowanie Reguł na Podstawie Plików Dependency**
  - Upload pliku dependency (np. package.json, requirements.txt).
  - Analiza przesłanego pliku i automatyczne dopasowanie odpowiednich reguł.
- **Zarządzanie Kolekcjami Reguł**
  - Zapisywanie, edytowanie i usuwanie kolekcji reguł.
  - Weryfikacja mechanizmu przywracania poprzednich wersji kolekcji.
  - Dostępność funkcji kolekcji wyłącznie dla zalogowanych użytkowników.
- **Autentykacja i Rejestracja**
  - Proces rejestracji: walidacja formularza (email, hasło, potwierdzenie hasła).
  - Logowanie i wylogowywanie użytkowników.
  - Kontrola dostępu do funkcjonalności w oparciu o stan autentykacji.

## 5. Środowisko Testowe

- **Środowisko Lokalowe**: Uruchomienie aplikacji w trybie developerskim (Astro z React) na maszynach deweloperskich.
- **Środowisko Testowe**: Dedykowany serwer testowy z konfiguracją Supabase, oddzielną bazą danych oraz kontenerem Docker zapewniającym powtarzalność środowiska.
- **Integracja CI/CD**: Automatyczne uruchamianie testów w pipeline (Github Actions) w celu weryfikacji każdej zmiany w kodzie.

## 6. Narzędzia do Testowania

- **Vitest**: Do realizacji testów jednostkowych i integracyjnych, zoptymalizowane dla aplikacji opartych na Vite/Astro z lepszą obsługą ESM.
- **React Testing Library**: Testowanie interakcji użytkownika z komponentami React.
- **@testing-library/dom**: Do testowania statycznych komponentów Astro.
- **Playwright**: Do testów end-to-end symulujących pełne ścieżki użytkownika, z lepszą wieloprzeglądarkowością i szybkością niż Cypress.
- **REST Client + MSW (Mock Service Worker)**: Do testowania i mockowania API bezpośrednio w środowisku VS Code oraz w testach.
- **Storybook**: Do izolowanego rozwoju i testowania komponentów UI.
- **Percy/Chromatic**: Do testów regresji wizualnej wykrywających niezamierzone zmiany w interfejsie.
- **Web Vitals + Lighthouse CI**: Testy wydajnościowe frontendu z integracją CI dla automatycznych pomiarów.
- **OWASP ZAP + Snyk**: Do automatycznych skanów bezpieczeństwa aplikacji i zależności.
- **tsd/dtslint**: Do testowania poprawności typów TypeScript.
- **Axe/pa11y**: Do testów dostępności.
- **Codecov**: Do śledzenia pokrycia kodu testami.
- **Linear**: System zarządzania zadaniami i błędami z lepszą integracją z GitHubem i UX przyjaznym dla deweloperów.

## 7. Harmonogram Testów

- **Faza I (1-2 tygodnie)**: Implementacja i uruchomienie testów jednostkowych oraz integracyjnych.
- **Faza II (2-3 tygodnie)**: Przeprowadzenie testów end-to-end, weryfikacja integracji pomiędzy modułami oraz testów bezpieczeństwa.
- **Faza III (1 tydzień)**: Testy wydajnościowe i obciążeniowe, a następnie testy regresyjne przed wdrożeniem na produkcję.
- **Faza IV**: Cykl testów regresyjnych w ramach CI/CD przy każdej iteracji wdrożeniowej.

## 8. Kryteria Akceptacji Testów

- Wszystkie kluczowe ścieżki użytkownika (rejestracja, logowanie, generowanie i zarządzanie regułami) działają bezbłędnie.
- Pokrycie testami wynosi minimum 80% krytycznego kodu.
- Brak błędów krytycznych, które blokowałyby działanie aplikacji.
- Ustalony czas odpowiedzi systemu oraz minimalne opóźnienia przy operacjach krytycznych.
- Pozytywne wyniki testów bezpieczeństwa bez wykrycia istotnych luk.
- Brak regresji w interfejsie użytkownika potwierdzony testami wizualnymi.
- Zgodność z podstawowymi standardami dostępności (WCAG 2.1 AA).

## 9. Role i Odpowiedzialności w Procesie Testowania

- **Inżynier QA**: Odpowiedzialny za przygotowanie, implementację oraz utrzymanie zestawu testów (jednostkowych, integracyjnych, E2E i wydajnościowych). Raportowanie oraz dokumentowanie wyników testów.
- **Developerzy**: Współpraca przy analizie i naprawie zgłoszonych błędów. Wdrożenie poprawek oraz uzupełnienie testów jednostkowych w ramach nowych funkcjonalności.
- **Product Owner**: Weryfikacja spełnienia wymagań biznesowych i akceptacja kryteriów jakościowych.
- **Testerzy Manualni**: Przeprowadzanie testów użytkowych oraz eksploracyjnych w celu wychwycenia problemów niedostrzegniętych przez automatyczne testy.

## 10. Procedury Raportowania Błędów

- **System Zarządzania Błędami**: Wykorzystanie Linear do rejestrowania i śledzenia wszystkich błędów z integracją z GitHub.
- **Szczegółowy Opis Błędu**: Każdy raport musi zawierać kroki reprodukcji, oczekiwany rezultat, faktyczny rezultat, priorytet błędu oraz środowisko testowe.
- **Kategoryzacja Błędów**: Klasyfikacja według krytyczności (krytyczny, wysoki, średni, niski) i ustalenie planu naprawczego.
- **Feedback Loop**: Regularne spotkania między zespołem QA a deweloperami w celu omówienia statusu błędów oraz potwierdzenia ich naprawy.
- **Dokumentacja Testów**: Utrzymywanie aktualnej dokumentacji testowej wraz z raportami z wykonanych testów oraz rejestracją wyników testów regresyjnych.
