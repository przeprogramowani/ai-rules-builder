# Feature Flags Module Plan

## Overview

Moduł flag funkcjonalności umożliwia oddzielenie deploymentów od release'ów poprzez wprowadzenie systemu flag, które pozwalają na kontrolowanie dostępności poszczególnych funkcjonalności w zależności od środowiska. System ten może być stosowany:

- na poziomie endpointów API (np. dla kolekcji, auth)
- na poziomie stron Astro (np. @login.astro, @signup.astro, @reset-password.astro)
- na poziomie widoczności kolekcji i komponentów (np. TwoPane.tsx, MobileNavigation.tsx)

## Wymagania

- **Środowiska:** modół obsługuje środowiska `local`, `integration` oraz `prod`.
- **Flagi:** Na początek moduł obsługuje flagi dla `auth` i `collections` jako proste wartości boolowskie (`true`/`false`).
- **Użycie:** W aplikacji można importować moduł i wykonywać `isFeatureEnabled('key')` w celu sprawdzenia, czy dana funkcjonalność jest aktywna.
- **Logowanie:** Każde zapytanie o flagę loguje informacje diagnostyczne, takie jak bieżące środowisko oraz wynik flagi.
- **Build Time:** Flagi są ustalane podczas kompilacji, wykorzystując zmienną środowiskową `import.meta.env.PUBLIC_ENV_NAME`, analogicznie do sposobu użycia w wytycznych @supabase.mdc.

## Implementacja

Moduł znajduje się w `src/features/featureFlags.ts` i składa się z następujących głównych elementów:

1. **Wykrywanie środowiska:**
   Moduł korzysta z `import.meta.env.PUBLIC_ENV_NAME`, aby określić bieżące środowisko. Jeśli zmienna nie jest ustawiona, zwraca `null`.

2. **Konfiguracja flag:**
   Obiekt konfiguracji mapuje nazwy funkcji na obiekty określające, czy funkcja jest włączona dla danego środowiska.

3. **Funkcja sprawdzająca flagę:**
   Funkcja `isFeatureEnabled(feature: string): boolean` sprawdza, czy dana flaga jest zdefiniowana, loguje wynik i zwraca ustawioną wartość flagi dla bieżącego środowiska.

4. **Przykładowy kod:**

`src/features/featureFlags.ts`

## Podsumowanie

Ten projekt modułu flag funkcjonalności zapewnia elastyczny system zarządzania funkcjami oparty na środowisku, który można wykorzystywać zarówno na backendzie, jak i frontendzie. Podejście to umożliwia łatwą rozbudowę systemu o kolejne flagi oraz umożliwia diagnostykę dzięki logowaniu stanu flag w trakcie wywołań.
