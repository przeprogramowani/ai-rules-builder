# Specyfikacja techniczna modułu autentykacji

## 1. Nowe elementy interfejsu użytkownika

- **Dedykowane strony autoryzacyjne:**

  - **Strona logowania (`/login`):**
    Implementowana jako strona Astro zawierająca interaktywny komponent React (np. `LoginForm.tsx`), umożliwiający wpisanie adresu e-mail i hasła.
  - **Strona rejestracji (`/register`):**
    Strona umożliwiająca nowym użytkownikom utworzenie konta, z walidacją pól formularza.
  - **Strona odzyskiwania hasła (`/forgot-password`):**
    Umożliwiająca użytkownikowi wpisanie adresu e-mail celem wysłania żądania resetu hasła (może być też zaimplementowane jako modal).

- **Aktualizacja globalnego nagłówka:**
  - W prawym górnym rogu aplikacji dodać dynamiczny przycisk, który:
    - Dla niezalogowanych użytkowników wyświetla opcję "Zaloguj się" (oraz link do rejestracji).
    - Dla użytkowników zalogowanych – pokazuje imię/avatar oraz umożliwia wylogowanie.
  - Komponenty nagłówka powinny być zrealizowane przy użyciu React, z wykorzystaniem Tailwind CSS z domyślnym stylem dark mode, inspirowanym Fluent 2.0 (np. używając ikon z `lucide-react`).

## 2. Zmiany w logice backendowej

- **Integracja z Supabase:**

  - Wykorzystanie wbudowanego mechanizmu autentykacji Supabase do:
    - Rejestracji użytkowników (metoda `auth.signUp`).
    - Logowania użytkowników (metoda `auth.signIn`).
    - Resetowania hasła (metoda `auth.resetPassword`).
  - Konfiguracja klienta Supabase (przy użyciu `supabase-js`) odbywa się w dedykowanym module, np. w pliku `src/utils/supabaseClient.ts`.

- **Zabezpieczenie endpointów API:**
  - Nowe lub zmodyfikowane endpointy w katalogu `/src/pages/api` (np. endpointy związane z kolekcjami reguł) muszą wymuszać sprawdzanie tokenu JWT/sesji.
  - Dodanie mechanizmu middleware (lub bezpośrednia weryfikacja w funkcjach handler'ów) zabezpieczających operacje wymagające autoryzacji.
  - Upewnienie się, że tylko zalogowani użytkownicy mogą wykonywać operacje na kolekcjach reguł, zgodnie z wymaganiami US-004.

## 3. Mechanizm autentykacji i bezpiecznego dostępu do danych

- **Integracja logiki autoryzacyjnej na froncie:**

  - W komponentach logowania/rejestracji wykorzystanie metod Supabase:
    - Przykładowe wywołania:
      ```typescript
      supabase.auth.signIn({ email, password });
      supabase.auth.signUp({ email, password });
      ```
  - Obsługa procesu resetu hasła poprzez wywołanie:
    ```typescript
    supabase.auth.resetPasswordForEmail(email);
    ```

- **Zarządzanie stanem autentykacji:**

  - Utworzenie globalnego store za pomocą Zustand (np. `src/store/authStore.ts`), który przechowuje stan sesji użytkownika (obiekt użytkownika, token, itp.).
  - Store powinien być wykorzystywany przez:
    - Komponenty nagłówka (do wyświetlania stanu logowania).
    - Komponenty wymagające autoryzacji (np. widok kolekcji reguł).

- **Zapewnienie bezpiecznego dostępu:**
  - Po stronie backendu, w każdym zapytaniu do zabezpieczonych endpointów, weryfikować autentyczność sesji, np. odczytując token z nagłówka zapytania i walidując go przy użyciu metod Supabase.
  - W przypadku nieprawidłowej sesji lub braku autoryzacji zwracać odpowiedni status HTTP (np. `401 Unauthorized`).
  - Po wylogowaniu użytkownika stan w Zustand powinien zostać wyczyszczony, a przy kolejnych zapytaniach endpointy powinny odrzucać nieautoryzowane żądania.

## 4. Przykładowe fragmenty kodu

### Klient Supabase (inicjalizacja):

```typescript
// src/utils/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Store dla autoryzacji (Zustand):

```typescript
// src/store/authStore.ts
import create from 'zustand';

interface AuthState {
  user: any; // Zdefiniuj typ użytkownika zgodnie z modelem Supabase
  setUser: (user: any) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));
```

## 5. Kluczowe wnioski

- **Front-end:**

  - Wdrożenie nowych stron (`/login`, `/register`, `/forgot-password`) jako strony Astro z dynamicznymi komponentami React, stosując TypeScript i Tailwind CSS zgodnie z motywem dark mode.
  - Aktualizacja globalnego nagłówka, aby wyświetlać status logowania i umożliwiać zalogowanie/wylogowanie użytkownika.

- **Back-end:**

  - Wykorzystanie Supabase do obsługi pełnego cyklu autentykacji: rejestracja, logowanie, reset hasła oraz weryfikacja sesji w API.
  - Zabezpieczenie endpointów API poprzez weryfikację tokenów autoryzacyjnych, co gwarantuje dostęp do funkcji modyfikujących dane (np. kolekcje reguł) tylko dla autoryzowanych użytkowników.

- **Mechanizm autoryzacji:**
  - Stosowanie sprawdzonych rozwiązań autentykacyjnych (Supabase, JWT) oraz zarządzanie stanem użytkownika za pomocą Zustand zapewnia zgodność z branżowymi standardami bezpieczeństwa i wygodę użytkowania.
  - Obsługa błędów i komunikatów dla użytkownika (np. w przypadku nieudanej próby logowania) ma kluczowe znaczenie dla intuicyjności aplikacji.

Szczegółowe diagramy przepływu danych, architektury komponentów i ścieżek użytkownika znajdują się w pliku `.ai/auth-flows.md`.
