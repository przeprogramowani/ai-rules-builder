## Plan Testów dla Projektu 10xRules.ai

**Wersja:** 1.0
**Data:** 2024-08-27
**Autor:** [Twoje Imię/Nazwa Zespołu QA]

---

**Spis Treści:**

1.  Wprowadzenie i Cele Testowania
2.  Zakres Testów
3.  Typy Testów
4.  Scenariusze Testowe (Kluczowe Funkcjonalności)
5.  Środowisko Testowe
6.  Narzędzia do Testowania
7.  Harmonogram Testów (Przykładowy)
8.  Kryteria Akceptacji Testów
9.  Role i Odpowiedzialności
10. Procedury Raportowania Błędów

---

### 1. Wprowadzenie i Cele Testowania

**1.1 Wprowadzenie**

Niniejszy dokument przedstawia plan testów dla aplikacji internetowej `10xRules.ai`. Aplikacja ta umożliwia użytkownikom generowanie, zarządzanie i udostępnianie zestawów reguł dla narzędzi wspomagających kodowanie AI (takich jak GitHub Copilot, Cursor, Windsurf) w oparciu o wybrany stos technologiczny. Projekt wykorzystuje technologie takie jak Astro, React, TypeScript, Zustand, Tailwind CSS oraz Supabase do backendu i autentykacji.

**1.2 Cele Testowania**

Głównymi celami testowania projektu `10xRules.ai` są:

- Weryfikacja zgodności funkcjonalnej aplikacji z jej przeznaczeniem (generowanie reguł, zarządzanie kolekcjami, autentykacja, parsowanie zależności).
- Zapewnienie wysokiej jakości i niezawodności aplikacji.
- Identyfikacja i raportowanie defektów w celu ich naprawy przed wdrożeniem.
- Ocena użyteczności i doświadczenia użytkownika (UX).
- Weryfikacja poprawności działania aplikacji na różnych przeglądarkach i urządzeniach.
- Zapewnienie bezpieczeństwa danych użytkowników i procesów autentykacji.
- Weryfikacja poprawności integracji z usługami zewnętrznymi (Supabase).
- Potwierdzenie poprawności generowanych reguł dla różnych środowisk AI.

### 2. Zakres Testów

**2.1 Funkcjonalności objęte testami:**

- **Moduł Budowania Reguł (Rule Builder):**
  - Interfejs wyboru warstw (Layers), stosów (Stacks) i bibliotek (Libraries).
  - Działanie akordeonu (rozwijanie, zwijanie).
  - Wizualne oznaczanie wybranych elementów i ich liczników.
  - Funkcjonalność wyszukiwania (filtrowanie, podświetlanie, auto-rozwijanie, stan "brak wyników").
  - Wyświetlanie wybranych reguł w sekcji "Selected Rules".
  - Usuwanie pojedynczych reguł z sekcji "Selected Rules".
  - Funkcjonalność "Wyczyść wszystko".
  - Poprawność wyświetlania tłumaczeń (i18n).
  - Dostępność (nawigacja klawiaturą, atrybuty ARIA).
- **Moduł Podglądu Reguł (Rule Preview):**
  - Dynamiczne generowanie podglądu Markdown na podstawie wybranych bibliotek i metadanych projektu (nazwa, opis).
  - Poprawność generowania treści dla trybu jedno- i wieloplikowego (`isMultiFileEnvironment`).
  - Przełączanie między środowiskami AI (GitHub, Cursor, Windsurf, etc.).
  - Poprawność wyświetlania ścieżki pliku (`RulesPath`) dla wybranego środowiska.
  - Funkcjonalność kopiowania wygenerowanych reguł do schowka.
  - Funkcjonalność pobierania reguł jako plik `.md` (tryb jednoplikowy) lub `.zip` (tryb wieloplikowy).
  - Poprawność formatowania Markdown (nagłówki, listy, wyróżnienia `{{placeholder}}`).
  - Działanie linku do dokumentacji (`RulesPreviewActions`).
  - Obsługa stanu braku wybranych reguł.
- **Moduł Kolekcji Reguł (Collections - Wymaga logowania):**
  - Wyświetlanie paska bocznego kolekcji (`CollectionsSidebar`).
  - Rozwijanie i zwijanie paska bocznego.
  - Wyświetlanie listy kolekcji użytkownika (`CollectionsList`).
  - Stan ładowania i obsługi błędów podczas pobierania kolekcji.
  - Wyświetlanie informacji o konieczności zalogowania dla niezalogowanych użytkowników.
  - Tworzenie nowej kolekcji (dialog, walidacja, zapis przez API).
  - Wybieranie kolekcji (ładowanie odpowiednich bibliotek do `RuleBuilder`, aktualizacja `techStackStore`).
  - Edycja nazwy i opisu kolekcji (dialog, zapis przez API).
  - Usuwanie kolekcji (dialog potwierdzający, usuwanie przez API, aktualizacja listy).
  - Wykrywanie niezapisanych zmian (`isDirty`) w wybranej kolekcji.
  - Wyświetlanie przycisku "Zapisz zmiany" dla zmodyfikowanej kolekcji.
  - Zapisywanie zmian w kolekcji (przez API, aktualizacja stanu `originalLibraries`).
  - Obsługa dialogu niezapisanych zmian przy próbie przełączenia kolekcji lub tworzenia nowej.
- **Moduł Autentykacji:**
  - Formularz logowania (walidacja pól, proces logowania przez API, obsługa błędów, przekierowanie).
  - Formularz rejestracji (walidacja pól, proces rejestracji, obsługa błędów).
  - Formularz resetowania hasła (walidacja email, komunikat po wysłaniu).
  - Proces wylogowania (przez API, aktualizacja stanu `authStore`, przekierowanie).
  - Ochrona tras wymagających zalogowania (działanie middleware).
  - Automatyczne przekierowanie zalogowanego użytkownika ze stron `/auth/*` na `/`.
  - Poprawne wyświetlanie informacji o użytkowniku (email) w `Topbar`.
  - Zarządzanie sesją użytkownika (ciasteczka Supabase).
- **Moduł Parsowania Zależności:**
  - Przycisk "Upload from deps" (`DependencyUploader`).
  - Proces wysyłania pliku (`package.json`, `requirements.txt`) przez formularz.
  - Funkcjonalność przeciągnij i upuść (Drag & Drop) pliku na obszar `RulePreview`.
  - Poprawność parsowania plików przez API (`upload-dependencies.ts`, `dependencyMappers.ts`).
  - Automatyczne zaznaczanie zidentyfikowanych bibliotek w `RuleBuilder`.
  - Wyświetlanie komunikatów o statusie uploadu (sukces, błąd, liczba znalezionych bibliotek).
  - Obsługa niepoprawnych formatów plików.
- **Ogólne Aspekty Aplikacji:**
  - Responsywność interfejsu użytkownika (Mobile, Tablet, Desktop).
  - Wygląd i spójność wizualna (Tailwind CSS, theming).
  - Poprawność działania komponentów UI (`Accordion`, `ConfirmDialog`).
  - Integracja z Supabase (Auth, Database API).
  - Obsługa błędów API i wyświetlanie komunikatów użytkownikowi.
  - Dostępność (WCAG).
  - Podstawowe testy bezpieczeństwa.

**2.2 Funkcjonalności wyłączone z testów:**

- Infrastruktura Supabase (zakładamy jej poprawność działania).
- Szczegółowe testy wydajnościowe (chyba że zostaną zidentyfikowane problemy).
- Testy penetracyjne (wymagają specjalistycznych narzędzi i wiedzy).
- Testowanie każdej pojedynczej reguły zdefiniowanej w `src/data/rules/*` pod kątem jej merytorycznej poprawności (zakładamy poprawność danych wejściowych, skupiamy się na generowaniu).
- Kompatybilność ze starszymi lub niszowymi przeglądarkami.
- Testowanie samego frameworka Astro lub biblioteki React (chyba że w kontekście integracji).

### 3. Typy Testów

W ramach projektu zostaną przeprowadzone następujące typy testów:

- **Testy Jednostkowe (Unit Tests):**
  - Cel: Weryfikacja poprawności działania izolowanych jednostek kodu (funkcje pomocnicze, logika store'ów Zustand, komponenty React z prostą logiką, logika parsowania zależności).
  - Narzędzia: Vitest/Jest, React Testing Library.
- **Testy Integracyjne (Integration Tests):**
  - Cel: Weryfikacja współpracy między różnymi modułami i komponentami (np. `RuleBuilder` <-> `RulePreview`, komponenty UI <-> Store'y Zustand, komponenty <-> API Astro, API Astro <-> Supabase).
  - Narzędzia: Vitest/Jest, React Testing Library, Mock Service Worker (MSW) do mockowania API.
- **Testy End-to-End (E2E Tests):**
  - Cel: Weryfikacja kompletnych przepływów użytkownika z perspektywy przeglądarki, symulując realne interakcje.
  - Narzędzia: Playwright / Cypress.
- **Testy Wizualne (Visual Regression Tests):**
  - Cel: Wykrywanie niezamierzonych zmian w interfejsie użytkownika poprzez porównywanie zrzutów ekranu.
  - Narzędzia: Funkcjonalności Playwright/Cypress, ewentualnie dedykowane narzędzia jak Chromatic (jeśli Storybook będzie używany szerzej).
- **Testy Dostępności (Accessibility Tests):**
  - Cel: Zapewnienie zgodności z wytycznymi WCAG (np. AA).
  - Narzędzia: Axe-core (automatyzacja), manualna weryfikacja (nawigacja klawiaturą, czytniki ekranu).
- **Testy Manualne (Manual Exploratory Tests):**
  - Cel: Eksploracja aplikacji w celu znalezienia nieoczywistych błędów, ocena UX/UI.
- **Testy Akceptacyjne Użytkownika (UAT):**
  - Cel: Potwierdzenie przez interesariuszy, że aplikacja spełnia wymagania biznesowe.

### 4. Scenariusze Testowe (Kluczowe Funkcjonalności)

Poniżej przedstawiono przykładowe, wysokopoziomowe scenariusze testowe. Szczegółowe przypadki testowe zostaną opracowane oddzielnie.

**4.1 Budowanie Reguł:**

- **TC-RB-01:** Wybór biblioteki powoduje jej pojawienie się w sekcji "Selected Rules" i aktualizację podglądu.
- **TC-RB-02:** Odznaczenie biblioteki usuwa ją z "Selected Rules" i aktualizuje podgląd.
- **TC-RB-03:** Rozwijanie/Zwijanie warstw i stosów w akordeonie działa poprawnie.
- **TC-RB-04:** Wyszukiwanie filtruje listę bibliotek, rozwija odpowiednie sekcje akordeonu i wyświetla liczbę wyników.
- **TC-RB-05:** Czyszczenie wyszukiwania przywraca pełną listę i poprzedni stan akordeonu.
- **TC-RB-06:** Przycisk "Wyczyść wszystko" usuwa wszystkie zaznaczenia i resetuje podgląd.
- **TC-RB-07:** Liczniki przy warstwach/stostach poprawnie pokazują liczbę wybranych/wszystkich bibliotek.
- **TC-RB-08:** Nawigacja klawiaturą po akordeonie i elementach (biblioteki, przyciski) jest możliwa i logiczna.

**4.2 Podgląd Reguł:**

- **TC-RP-01:** Podgląd aktualizuje się dynamicznie po zmianie selekcji w `RuleBuilder`.
- **TC-RP-02:** Wybór środowiska AI (np. Cursor) zmienia wyświetlaną ścieżkę pliku i potencjalnie formatowanie (jeśli strategia się różni).
- **TC-RP-03:** Przycisk "Kopiuj" kopiuje całą zawartość podglądu do schowka.
- **TC-RP-04:** Przycisk "Pobierz" pobiera plik `.md` lub `.zip` z poprawną zawartością i nazwą pliku.
- **TC-RP-05:** Formatowanie Markdown (nagłówki H2/H3/H4, listy, placeholdery `{{...}}`) jest renderowane poprawnie.
- **TC-RP-06:** Link do dokumentacji prowadzi do poprawnego URL dla wybranego środowiska.
- **TC-RP-07:** W trybie wieloplikowym (np. Cursor) podgląd generuje osobne sekcje lub pliki.

**4.3 Kolekcje Reguł (Wymaga logowania):**

- **TC-COL-01:** Niezalogowany użytkownik widzi komunikat o konieczności logowania w pasku kolekcji.
- **TC-COL-02:** Zalogowany użytkownik widzi listę swoich kolekcji.
- **TC-COL-03:** Utworzenie nowej kolekcji (walidacja nazwy/opisu, zapis, pojawienie się na liście, automatyczne wybranie).
- **TC-COL-04:** Wybranie istniejącej kolekcji ładuje jej biblioteki do `RuleBuilder`.
- **TC-COL-05:** Edycja nazwy/opisu kolekcji zapisuje zmiany i aktualizuje widok.
- **TC-COL-06:** Usunięcie kolekcji (potwierdzenie) usuwa ją z listy i resetuje/zmienia wybór.
- **TC-COL-07:** Modyfikacja wybranej kolekcji (dodanie/usunięcie biblioteki) aktywuje przycisk "Zapisz zmiany".
- **TC-COL-08:** Zapisanie zmian aktualizuje kolekcję i resetuje stan "dirty".
- **TC-COL-09:** Próba przełączenia na inną kolekcję przy niezapisanych zmianach wyświetla dialog (test opcji Zapisz/Pomiń/Anuluj).
- **TC-COL-10:** Wylogowanie czyści listę kolekcji i resetuje stan.

**4.4 Autentykacja:**

- **TC-AUTH-01:** Pomyślne logowanie z poprawnymi danymi.
- **TC-AUTH-02:** Nieudane logowanie z błędnymi danymi (poprawny komunikat błędu).
- **TC-AUTH-03:** Pomyślna rejestracja nowego użytkownika.
- **TC-AUTH-04:** Nieudana rejestracja (np. email zajęty, słabe hasło).
- **TC-AUTH-05:** Pomyślne wylogowanie.
- **TC-AUTH-06:** Ochrona tras - próba dostępu do `/` bez logowania przekierowuje na `/auth/login`.
- **TC-AUTH-07:** Ochrona API - próba dostępu do `/api/collections` bez logowania zwraca 401.
- **TC-AUTH-08:** Zalogowany użytkownik próbujący wejść na `/auth/login` jest przekierowywany na `/`.

**4.5 Parsowanie Zależności:**

- **TC-DEP-01:** Upload poprawnego `package.json` przez przycisk zaznacza odpowiednie biblioteki w `RuleBuilder`.
- **TC-DEP-02:** Upload poprawnego `requirements.txt` przez przycisk zaznacza odpowiednie biblioteki w `RuleBuilder`.
- **TC-DEP-03:** Drag & Drop poprawnego `package.json` na `RulePreview` zaznacza odpowiednie biblioteki.
- **TC-DEP-04:** Drag & Drop poprawnego `requirements.txt` na `RulePreview` zaznacza odpowiednie biblioteki.
- **TC-DEP-05:** Wyświetlenie poprawnego komunikatu sukcesu z liczbą znalezionych bibliotek.
- **TC-DEP-06:** Próba uploadu nieobsługiwanego pliku (np. `.zip`) wyświetla błąd.
- **TC-DEP-07:** Próba uploadu uszkodzonego pliku JSON wyświetla błąd.
- **TC-DEP-08:** Upload pliku bez zmapowanych zależności wyświetla komunikat "No libraries identified".

### 5. Środowisko Testowe

- **Środowiska:**
  - **Lokalne (Developerskie):** Używane przez deweloperów do testów jednostkowych i integracyjnych podczas rozwoju.
  - **Testowe/Staging:** Dedykowane środowisko QA, odzwierciedlające środowisko produkcyjne. Powinno zawierać osobną instancję Supabase (lub dane testowe w głównej instancji odizolowane np. przez RLS). Używane do testów integracyjnych, E2E, manualnych, UAT.
  - **Produkcyjne:** Środowisko live. Ograniczone testy (smoke tests) po wdrożeniu.
- **Przeglądarki:**
  - Google Chrome (najnowsza wersja)
  - Mozilla Firefox (najnowsza wersja)
  - Apple Safari (najnowsza wersja)
- **Urządzenia:**
  - Desktop (Windows, macOS)
  - Symulacja urządzeń mobilnych (Chrome DevTools) dla testów responsywności. W miarę możliwości testy na fizycznych urządzeniach (iOS, Android).
- **Dane Testowe:**
  - Konta użytkowników testowych (różne role, jeśli dotyczy).
  - Przykładowe kolekcje reguł.
  - Przykładowe pliki zależności (`package.json`, `requirements.txt`) z różnymi zestawami bibliotek, w tym rzadkimi i nieobsługiwanymi.

### 6. Narzędzia do Testowania

- **Test Runner / Framework:** Vitest / Jest
- **Biblioteki Asercji / Mockowania:** Vitest/Jest built-ins, Sinon (jeśli potrzebne)
- **Testowanie Komponentów React:** React Testing Library
- **Testy E2E / Automatyzacja UI:** Playwright / Cypress
- **Mockowanie API:** Mock Service Worker (MSW)
- **Testy Dostępności:** Axe-core, narzędzia przeglądarki, czytniki ekranu (NVDA, VoiceOver)
- **Testy Wizualne:** Wbudowane funkcje Playwright/Cypress, ewentualnie Storybook + Chromatic.
- **Zarządzanie Testami / Bug Tracking:** Jira, GitHub Issues lub inne narzędzie projektowe.
- **CI/CD:** GitHub Actions (lub inne używane w projekcie) do uruchamiania testów automatycznych.
- **Narzędzia Deweloperskie Przeglądarki:** Do inspekcji DOM, sieci, wydajności.

### 7. Harmonogram Testów (Przykładowy)

- **Faza Rozwoju (Sprinty):** Testy jednostkowe i integracyjne pisane równolegle z kodem przez deweloperów i QA. Testy manualne eksploracyjne nowych funkcjonalności przez QA pod koniec sprintu.
- **Faza Stabilizacji (Przed Wydaniem):** Pełna runda testów regresji (automatycznych E2E i manualnych kluczowych scenariuszy). Testy wizualne. Testy dostępności. Testy UAT.
- **Po Wdrożeniu:** Smoke tests na środowisku produkcyjnym w celu weryfikacji kluczowych funkcjonalności.

_Uwaga: Harmonogram jest elastyczny i będzie dostosowywany do postępów prac i priorytetów._

### 8. Kryteria Akceptacji Testów

**8.1 Kryteria Wejścia (Rozpoczęcia Testów):**

- Kod funkcjonalności został zaimplementowany i zintegrowany.
- Testy jednostkowe i podstawowe integracyjne (pisane przez deweloperów) przechodzą pomyślnie.
- Funkcjonalność jest wdrożona na środowisku testowym/staging.
- Środowisko testowe jest stabilne i dostępne.
- Dokumentacja (jeśli istnieje) jest dostępna.

**8.2 Kryteria Wyjścia (Zakończenia Testów / Gotowości do Wdrożenia):**

- Wszystkie zaplanowane testy (jednostkowe, integracyjne, E2E) przechodzą pomyślnie (np. >95% pass rate dla testów automatycznych).
- Brak otwartych błędów krytycznych (blokujących) i wysokiego priorytetu.
- Wszystkie błędy średniego i niskiego priorytetu są przeanalizowane, a decyzja o ich naprawie lub odroczeniu została podjęta.
- Spełnione zostały kryteria UAT (jeśli dotyczy).
- Dokumentacja testowa jest zaktualizowana.

### 9. Role i Odpowiedzialności

- **Inżynier QA:**
  - Tworzenie i utrzymanie planu testów, przypadków testowych.
  - Projektowanie i implementacja testów automatycznych (Integracyjne, E2E, Wizualne).
  - Wykonywanie testów manualnych (eksploracyjnych, regresji).
  - Raportowanie i śledzenie błędów.
  - Komunikacja z zespołem deweloperskim i Product Ownerem na temat jakości.
  - Utrzymanie środowiska testowego (wspólnie z DevOps/Developerami).
- **Deweloperzy:**
  - Pisanie testów jednostkowych i podstawowych integracyjnych.
  - Naprawa zgłoszonych błędów.
  - Code reviews pod kątem jakości i testowalności.
  - Wsparcie w diagnozowaniu problemów znalezionych przez QA.
- **Product Owner / Manager:**
  - Definiowanie wymagań i kryteriów akceptacji.
  - Priorytetyzacja błędów.
  - Przeprowadzanie testów UAT.
  - Podejmowanie decyzji o wydaniu produktu.

### 10. Procedury Raportowania Błędów

- **Narzędzie:** [Wskazać narzędzie, np. Jira, GitHub Issues]
- **Format Zgłoszenia:** Każdy zgłoszony błąd powinien zawierać:
  - **Tytuł:** Krótki, zwięzły opis problemu.
  - **Środowisko:** Gdzie błąd został zaobserwowany (np. Testowe, Produkcyjne, przeglądarka, wersja).
  - **Kroki do Reprodukcji:** Szczegółowa lista kroków pozwalająca odtworzyć błąd.
  - **Wynik Oczekiwany:** Jak system powinien się zachować.
  - **Wynik Rzeczywisty:** Jak system się zachował.
  - **Priorytet/Waga:** (np. Krytyczny, Wysoki, Średni, Niski) - ocena wpływu błędu.
  - **Załączniki:** Zrzuty ekranu, nagrania wideo, logi konsoli (jeśli relevantne).
  - **Przypisanie:** (Opcjonalnie) Sugerowany deweloper lub zespół.
- **Cykl Życia Błędu:** (np. Nowy -> W Analizie -> Do Naprawy -> W Testowaniu -> Zamknięty / Odrzucony / Ponownie Otwarty).
- **Komunikacja:** Regularne przeglądy błędów (Bug Triage) w celu priorytetyzacji i omówienia statusu.
