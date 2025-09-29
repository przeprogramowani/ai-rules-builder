# Feature Flags Module Plan

## Overview

Moduł flag funkcjonalności umożliwia oddzielenie deploymentów od release'ów poprzez wprowadzenie systemu flag, które pozwalają na kontrolowanie dostępności poszczególnych funkcjonalności w zależności od środowiska. System ten może być stosowany:

- na poziomie endpointów API (np. dla kolekcji, auth)
- na poziomie stron Astro (np. @login.astro, @signup.astro, @reset-password.astro)
- na poziomie widoczności kolekcji i komponentów (np. TwoPane.tsx, MobileNavigation.tsx)

## Wymagania

- **Środowiska:** modół obsługuje środowiska `local`, `integration` oraz `prod`.
- **Flagi:** Na początek moduł obsługuje flagi dla `auth`, `collections` i `authOnUI` jako proste wartości boolowskie (`true`/`false`).
- **Nowe flagi (Prompt Manager POC):**
  - `promptManager` — steruje dostępnością całego modułu Prompt Manager.
  - `promptUsageLogging` — włącza minimalny layer telemetryczny dla promptów (domyślnie wyłączony).
- **Użycie:** W aplikacji można importować moduł i wykonywać `isFeatureEnabled('key')` w celu sprawdzenia, czy dana funkcjonalność jest aktywna. Dostępne są także pomocnicze funkcje `isPromptManagerEnabled()` oraz `isPromptUsageLoggingEnabled()`.
- **Logowanie:** Każde zapytanie o flagę loguje informacje diagnostyczne, takie jak bieżące środowisko oraz wynik flagi.
- **Build Time:** Flagi są ustalane podczas kompilacji, wykorzystując zmienną środowiskową `import.meta.env.PUBLIC_ENV_NAME`, analogicznie do sposobu użycia w wytycznych @supabase.mdc.

## Implementacja

Moduł znajduje się w `src/features/featureFlags.ts` i składa się z następujących głównych elementów:

1. **Wykrywanie środowiska:**
   Moduł korzysta z `import.meta.env.PUBLIC_ENV_NAME`, aby określić bieżące środowisko. Jeśli zmienna nie jest ustawiona, zwraca `null`.

2. **Konfiguracja flag:**
   Obiekt konfiguracji mapuje nazwy funkcji na obiekty określające, czy funkcja jest włączona dla danego środowiska. Domyślnie `promptManager` jest aktywny tylko w środowisku `local`, natomiast `promptUsageLogging` pozostaje wyłączona we wszystkich środowiskach do czasu wdrożenia warstwy anonimizacji.

3. **Funkcje sprawdzające flagi:**
   Funkcje `isFeatureEnabled(feature: FeatureFlag)`, `isPromptManagerEnabled()`, `isPromptUsageLoggingEnabled()` pozwalają na czytelne sprawdzanie dostępności funkcjonalności.

4. **Przykładowy kod:**

`src/features/featureFlags.ts`

## Podsumowanie

Ten projekt modułu flag funkcjonalności zapewnia elastyczny system zarządzania funkcjami oparty na środowisku, który można wykorzystywać zarówno na backendzie, jak i frontendzie. Dodane flagi Prompt Managera pozwalają kontrolować wdrożenia POC i planowanych rozszerzeń telemetrii przed ich pełną publikacją.
