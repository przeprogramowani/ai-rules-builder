# Specyfikacja modułu autoryzacji i rejestracji użytkowników

## 1. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### A. Struktura interfejsu i relacje komponentów

- **Strona główna (@index.astro):**
  - **Layout:** Utrzymuje spójny wygląd aplikacji, w tym tło, nagłówek i stopkę.
  - **Topbar (@Topbar.tsx):**
    - Wyświetla logo, tytuł ("10xRules.ai") oraz dodatkowe akcje.
    - Rozszerzony o przyciski autoryzacyjne ("Logowanie", "Rejestracja") – przy niezalogowanym użytkowniku.
    - Po zalogowaniu przycisk "Wyloguj" pojawia się w miejsce opcji logowania.
    - Otrzymuje zalogowanego użytkownika jako props, który jest przekazywany do aplikacji React w celu inicjalizacji globalnego store (np. `authStore` z Zustand).
  - **TwoPane (@TwoPane.tsx):**
    - Dzieli główną zawartość na dwa panele: **RuleBuilder** (po lewej) oraz **RulePreview** (po prawej).
  - **CollectionsSidebar (@CollectionsSidebar.tsx):**
    - Prezentuje listę kolekcji reguł (funkcjonalność US-003).
    - Dostęp do pełnych funkcjonalności kolekcji wymaga autoryzacji. W przypadku braku logowania:
      - Sidebar może wyświetlić komunikat typu "Zaloguj się, aby zobaczyć swoje kolekcje" lub zaoferować ograniczony widok.

### B. Elementy autoryzacyjne i interakcje

- **Nowe strony autoryzacyjne:**

  - Utworzenie dedykowanych stron Astro (np. `/pages/auth/login.astro`, `/pages/auth/signup.astro`, `/pages/auth/reset-password.astro`) obsługiwanych przez komponenty React, gdzie:
    - Formularz **rejestracyjny** wymaga:
      - Adresu email (sprawdzany pod kątem poprawnego formatu).
      - Hasła (minimum 8 znaków).
      - Potwierdzenia hasła (musi być zgodne z hasłem).
    - Formularz **logowania** wymaga:
      - Adresu email.
      - Hasła.
  - Po poprawnym zalogowaniu lub rejestracji, mechanizm globalny (np. `authStore` z Zustand) aktualizuje stan aplikacji, powodując dynamiczne zmiany w:
    - Topbar – wyświetlenie opcji wylogowania.
    - CollectionsSidebar – odblokowanie pełnej funkcjonalności kolekcji.

- **Walidacja i komunikaty błędów:**
  - **Po stronie klienta:**
    - Przed wysłaniem formularza weryfikowane są:
      - Niepusty i poprawny format adresu email.
      - Minimalna długość hasła.
      - Zgodność hasła z potwierdzeniem.
    - W przypadku błędnych danych wyświetlane są komunikaty, np.:
      - "Nieprawidłowy adres email"
      - "Hasło musi zawierać co najmniej 8 znaków"
      - "Hasła nie są zgodne"
  - **Po stronie serwera:**
    - Weryfikacja unikalności adresu email – komunikat błędu np. "Konto z tym adresem email już istnieje".
    - W przypadku nieprawidłowej próby logowania – komunikat "Nieprawidłowy email lub hasło".
  - Komunikaty błędów prezentowane są w zgodzie z design systemem (Tailwind CSS, dark mode, Fluent 2.0).

## 2. LOGIKA BACKENDOWA

### A. Struktura endpointów API

- Endpointy związane z autoryzacją umieszczone w katalogu `/src/pages/api/auth/`:
  - **POST `/api/auth/signup`:** Rejestracja nowego użytkownika.
  - **POST `/api/auth/login`:** Logowanie użytkownika.
  - **POST `/api/auth/logout`:** Wylogowanie użytkownika.
  - **POST `/api/auth/reset-password`:** Inicjacja procesu odzyskiwania hasła.

### B. Modele danych

- **Supabase Auth:**
  - Główne dane użytkownika (email, hasło, id) są obsługiwane przez Supabase Auth.

### C. Mechanizm walidacji danych wejściowych

- Wykorzystanie biblioteki walidacyjnej (np. Zod) do:
  - Weryfikacji formatu email.
  - Sprawdzenia minimalnej długości hasła.
  - Weryfikacji zgodności pola "hasło" z "potwierdzeniem hasła" podczas rejestracji.
- Walidacja na poziomie API zwraca odpowiednie statusy HTTP (np. 400 dla błędnych danych) wraz z jasnym komunikatem w strukturze JSON.

### D. Obsługa wyjątków

- Logika endpointów zabezpieczona jest za pomocą bloków try-catch.
- Wszelkie nieprzewidziane błędy są logowane na serwerze.
- Klient otrzymuje spójną strukturę błędu (np. kod statusu, wiadomość błędu), co umożliwia poprawne wyświetlenie informacji w interfejsie użytkownika.

## 3. SYSTEM AUTENTYKACJI

### A. Wykorzystanie Supabase Auth

- **Rejestracja:**
  - Metoda: `supabase.auth.signUp`
  - Proces: Użytkownik podaje email i hasło. Po rejestracji opcjonalnie wysyłany jest mail weryfikacyjny.
- **Logowanie:**
  - Metoda: `supabase.auth.signInWithPassword`
  - Proces: Przekazanie emaila oraz hasła. W przypadku niepowodzenia zwracany jest błąd autentykacji.
- **Wylogowanie:**
  - Metoda: `supabase.auth.signOut`
  - Proces: Użytkownik kończy sesję, a globalny stan (np. `authStore`) jest aktualizowany.
- **Odzyskiwanie hasła:**
  - Metoda: `supabase.auth.resetPasswordForEmail`
  - Proces: Użytkownik inicjuje proces resetowania hasła poprzez wpisanie adresu email, co skutkuje wysłaniem instrukcji resetowania hasła.

### B. Integracja z Astro i zarządzanie stanem

- **Przekazywanie użytkownika jako props:**
  - Strona główna (@index.astro) pobiera zalogowanego użytkownika (np. z sesji Supabase) przed renderowaniem.
  - Dane użytkownika przekazywane są jako props do głównych komponentów React oraz do inicjalizacji `authStore` w Zustand.
- **Middleware:**
  - Aktualizacja middleware w `/src/middleware/index.ts` w celu zabezpieczenia endpointów i stron wymagających autoryzacji, np. poprzez sprawdzenie obecności ważnego tokenu JWT.
- **Zarządzanie stanem:**
  - Użycie Zustand (np. `authStore`) do przechowywania i aktualizacji stanu użytkownika (dane sesji, token, informacja o zalogowaniu).
  - Dynamiczna modyfikacja interfejsu (Topbar, CollectionsSidebar) w zależności od stanu autoryzacji.

### C. Bezpieczeństwo

- Wszystkie operacje autoryzacyjne odbywają się po stronie backendu w bezpiecznym środowisku (HTTPS).
- Używanie ciasteczek do przechowywania tokenów JWT w sposób bezpieczny (np. HttpOnly, Secure).
- Stosowanie ochrony przed atakami CSRF i XSS.
- Brak wykorzystania zewnętrznych serwisów logowania, zgodnie z wymaganiami US-004.

---

**Podsumowanie:**
Przedstawiona specyfikacja zapewnia kompleksową integrację modułu rejestracji i logowania użytkowników, spójną z istniejącą architekturą aplikacji opartej na Astro, React, Supabase Auth, Tailwind CSS oraz Zustand. System gwarantuje przejrzystą walidację danych, obsługę wyjątków oraz bezpieczne zarządzanie sesjami użytkowników, z aktualizacją stanu przez przekazywanie danych sesji jako props do klienta, umożliwiając dostęp do chronionych funkcjonalności (np. kolekcje reguł).
