# Specyfikacja techniczna - System Autentykacji

## 1. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

**Struktura graficzna:**

- **Strony autentykacji:**
  - `/auth/register` – formularz rejestracji
  - `/auth/login` – formularz logowania
  - `/auth/reset-password` – formularz odzyskiwania hasła
- **Aktualizacja interfejsu:**
  - Modyfikacja np. navbaru, aby wyświetlał przyciski logowania/wylogowywania zgodnie z aktualnym stanem sesji.

**Komponenty client-side:**

- **RegistrationForm (React):**
  - Formularz rejestracji z polami: email, hasło, potwierdzenie hasła.
  - Integracja z Tailwind CSS 4 (domyślny styl dark mode) oraz ikonami z lucide-react dla sygnalizacji błędów.
- **LoginForm (React):**
  - Formularz logowania z interaktywną walidacją pól.
- **PasswordResetForm (React):**
  - Formularz odzyskiwania hasła, umożliwiający wysłanie żądania resetu.
- **Zarządzanie stanem:**
  - Wykorzystanie Zustand do przechowywania i aktualizacji stanu sesji.

**Walidacja i komunikaty błędów:**

- **Walidacja po stronie klienta:**
  - **Email:** Sprawdzenie poprawności formatu (regex) oraz wymagalność pola.
  - **Hasło:** Weryfikacja wymagań, np. minimum 8 znaków, obecność przynajmniej jednej wielkiej litery.
  - **Potwierdzenie hasła:** Musi być identyczne z wprowadzonym hasłem.
- **Komunikaty błędów:**
  - „Niepoprawny format adresu email.”
  - „Hasło musi zawierać co najmniej 8 znaków.”
  - „Hasła nie są zgodne.”
  - Komunikaty serwerowe (np. email już istnieje) wyświetlane jako alerty w UI.

---

## 2. LOGIKA BACKENDOWA

**Struktura endpointów API (umieszczonych w `/src/pages/api/auth/`):**

- **POST `/register`:**
  - Rejestracja użytkownika. Odbiera dane: email, hasło, potwierdzenie hasła.
- **POST `/login`:**
  - Logowanie użytkownika. Przyjmuje email i hasło.
- **POST `/logout`:**
  - Wylogowanie użytkownika.
- **POST `/reset-password`:**
  - Inicjalizacja procesu odzyskiwania hasła, przyjmując adres email.

**Modele danych:**

- **Użytkownik:**
  - _email_ – unikalny identyfikator użytkownika.
  - _created_at_ oraz _updated_at_ – znaczniki czasowe.
  - Dodatkowe pola (np. nazwa użytkownika) mogą być rozbudowane w kolejnych iteracjach.
- Operacje związane z zarządzaniem użytkownikami delegowane są do Supabase, który obsługuje przechowywanie i uwierzytelnianie.

**Mechanizmy walidacji danych wejściowych:**

- Weryfikacja formatu email oraz siły hasła (np. długość, złożoność).
- Sprawdzenie zgodności pól hasła i potwierdzenia hasła w przypadku rejestracji.
- Możliwe użycie bibliotek typu Zod lub własnych funkcji walidacyjnych.
- Wykonanie walidacji zarówno po stronie klienta, jak i backendu, by zabezpieczyć system przed nieprawidłowymi danymi.

**Obsługa wyjątków:**

- Stosowanie bloków try/catch w każdym endpointzie API.
- Zwracanie właściwych kodów HTTP:
  - **400** – błąd walidacji danych wejściowych.
  - **401** – błąd autoryzacji (np. niepoprawne dane logowania).
  - **500** – błąd serwera.
- Logowanie błędów (np. za pomocą narzędzi monitorujących) dla celów debugowania i bezpieczeństwa.

---

## 3. SYSTEM AUTENTYKACJI

**Integracja z Supabase Auth:**

- **Rejestracja:**
  - Wywołanie metody `supabase.auth.signUp({ email, password })` celem utworzenia konta użytkownika.
- **Logowanie:**
  - Realizacja logowania przez `supabase.auth.signInWithPassword({ email, password })`.
- **Wylogowywanie:**
  - Obsługa wylogowania za pomocą `supabase.auth.signOut()`.
- **Odzyskiwanie hasła:**
  - Implementacja procesu resetowania hasła wykorzystując funkcję `supabase.auth.resetPasswordForEmail(email)` lub inny dedykowany mechanizm Supabase.

**Integracja z Astro:**

- **Endpointy API:**
  - Endpointy wywołujące metody Supabase są zintegrowane z backendem Astro, korzystając z konfiguracji zawierającej zmienne środowiskowe (klucze API, URL Supabase).
- **Zarządzanie sesją:**
  - Po stronie klienta użycie biblioteki supabase-js dla utrzymania stanu sesji, wraz z aktualizacją interfejsu poprzez Zustand.
- **Middleware:**
  - Wdrożenie middleware (w `/src/middleware`) chroniącego zasoby wymagające autoryzacji poprzez weryfikację tokenu JWT.

**Bezpieczeństwo:**

- Przechowywanie tokenów autentykacyjnych przy użyciu bezpiecznych mechanizmów (np. httpOnly cookies).
- Wymóg korzystania z HTTPS w celu zabezpieczenia transmisji danych.
- Dodatkowa weryfikacja unikalności adresu email podczas rejestracji oraz egzekwowanie polityki silnych haseł.
