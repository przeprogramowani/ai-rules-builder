# Dokument wymagań produktu (PRD) - Prompt Manager POC
## 1. Przegląd produktu
Prompt Manager POC to pierwsza iteracja menedżera promptów uruchamiana pod ścisłą kontrolą flagi funkcji, która ma zweryfikować przepływ kuracji i konsumpcji treści przez kohortę 10xDevs. Projekt zakłada wykorzystanie istniejących wzorców Astro + Supabase oraz dostarczenie kompletnego przepływu admin → member w ciągu około trzech sprintów, zanim zespół rozszerzy produkt o wersjonowanie i analitykę.
- Funkcjonalność jest ukryta za flagą `PROMPT_MANAGER_ENABLED`, a dostęp do tras `/prompts` i `/prompts/admin` wymaga pozytywnej walidacji członkostwa w organizacji Supabase.
- Supabase przechowuje schemat organizacji, kolekcji, segmentów i promptów, utrzymując pojedynczą aktywną wersję na wpis przy równoczesnym seedowaniu danych startowych dla 10xDevs.
- Interfejs administracyjny reużywa tabele, widoki i komponenty Rules Buildera, koncentrując się na edycji, publikacji i filtrowaniu promptów w ramach jednej organizacji.
- Interfejs członkowski udostępnia wybór organizacji, filtr kolekcji/segmentów oraz akcje kopiuj/pobierz dla opublikowanych promptów z zachowaniem spójności formatowania.

## 2. Problem użytkownika
- Członkowie organizacji nie mają bezpiecznego katalogu promptów dopasowanego do ich ról; obecnie znalezienie aktualnych wersji wymaga ręcznego wyszukiwania lub proszenia administratorów.
- Administratorzy merytoryczni nie dysponują scentralizowanym narzędziem do kuracji promptów dla różnych organizacji, przez co trudno utrzymać spójność treści i kontrolować publikację.

## 3. Wymagania funkcjonalne
- Feature flag i middleware: `PROMPT_MANAGER_ENABLED` musi warunkować ładowanie tras, a middleware ma weryfikować sesję Supabase, członkostwo organizacyjne i rolę (`member` lub `admin`).
- Zarządzanie organizacjami: schemat Supabase obejmuje tabele `organizations`, `organization_members`, `prompt_collections`, `prompt_collection_segments` oraz `prompts`, wraz z seedami dla 10xDevs i ograniczeniem ról w członkostwach.
- Interfejs admina: tabela z listą promptów, modal tworzenia/edycji, przypisanie do kolekcji/segmentu, przełącznik statusu draft/published oraz dostęp tylko dla ról `admin` w bieżącej organizacji.
- Interfejs członka: selector organizacji (domyślnie 10xDevs), filtry kolekcji/segmentu, lista promptów z markdown, akcje kopiuj i pobierz, widoczność wyłącznie opublikowanych wpisów.
- API i logika serwerowa: końcówki Astro `/api/prompts/admin/*` dla operacji CRUD z weryfikacją roli i `/api/prompts/*` dla listowania publikacji, wykorzystujące klucze Supabase (service role dla admin, anon dla member) z wymuszonym filtrowaniem po `organization_id`.
- Migracje i seedy: dwa pliki migracji z indeksami, domyślnymi wartościami, wstawieniem organizacji 10xDevs, kolekcji, segmentów i przykładowych promptów oraz instrukcją aktualizacji dokumentacji po wdrożeniu.
- Testy i dokumentacja: pokrycie Vitest dla flag, helperów dostępu i API, scenariusz Playwright admin→member, aktualizacja README i `.ai/test-plan.md` po ukończeniu MVP.

## 4. Granice produktu
- Brak wersjonowania promptów, historii zmian oraz porównywania diffów; POC utrzymuje pojedynczą aktywną wersję wpisu.
- Brak telemetrycznych tabel `prompt_usage_logs`, brak opt-out oraz brak anonimowych statystyk do czasu kolejnych faz.
- Brak automatycznej lokalizacji, przełącznika języków i pipeline'u tłumaczeń; zawartość POC pozostaje w jednym języku z placeholderem komunikatu.
- Brak zaawansowanych workflow (bulk publish, szkielety ładowania, zaawansowane filtry) oraz brak dedykowanych magazynów stanów (Zustand/React Query) poza lokalnym stanem komponentów.
- Brak reguł RLS podczas POC; bezpieczeństwo egzekwują middleware i klucze serwisowe, co wymaga świadomego operacyjnego nadzoru.
- Brak integracji z zewnętrznymi rosterami i automatycznej synchronizacji członkostw; przypisania odbywają się ręcznie lub skryptem seedującym.

## 5. Historyjki użytkowników
### US-001
- ID: US-001
- Tytuł: Sterowanie flagą Prompt Manager
- Opis: Jako operator platformy chcę móc włączać i wyłączać flagę `PROMPT_MANAGER_ENABLED`, aby bezpiecznie kontrolować rollout funkcji w środowiskach.
- Kryteria akceptacji: 1) `PROMPT_MANAGER_ENABLED` domyślnie ukrywa trasy `/prompts` i `/prompts/admin`; 2) Zmiana flagi w konfiguracji środowiska natychmiast blokuje lub udostępnia interfejs bez dodatkowego wdrożenia kodu; 3) Przy wyłączonej fladze użytkownicy widzą stan „request access”, a komponenty promptów nie są renderowane.

### US-002
- ID: US-002
- Tytuł: Egzekwowanie uwierzytelnienia i członkostwa
- Opis: Jako użytkownik chcę, aby dostęp do promptów wymagał aktywnej sesji i członkostwa w organizacji, żeby treść była chroniona przed nieuprawnionymi osobami.
- Kryteria akceptacji: 1) Brak sesji Supabase skutkuje przekierowaniem do logowania przed wejściem na `/prompts`; 2) Użytkownik z sesją, lecz bez rekordu w `organization_members`, otrzymuje komunikat o konieczności uzyskania dostępu i nie widzi treści; 3) Middleware dopuszcza użytkowników jedynie, gdy istnieje powiązanie z aktywną organizacją przypisaną do flagi.

### US-003
- ID: US-003
- Tytuł: Wybór organizacji i filtrów przez członka
- Opis: Jako członek organizacji chcę wybierać organizację, kolekcję i segment, aby szybko znaleźć odpowiednie prompty.
- Kryteria akceptacji: 1) Domyślna organizacja to pierwsza dostępna (10xDevs) i można ją zmienić; 2) Lista kolekcji i segmentów pobierana jest dla bieżącej organizacji; 3) Zastosowanie filtra odświeża listę promptów bez przeładowania strony; 4) Reset filtrów przy zmianie organizacji zapobiega pustym wynikom.

### US-004
- ID: US-004
- Tytuł: Konsumpcja promptów przez członka
- Opis: Jako członek organizacji chcę oglądać treść promptów, kopiować ją do schowka i pobierać, aby używać ich w pracy.
- Kryteria akceptacji: 1) Publikowane prompty są renderowane w markdown zgodnie z projektem; 2) Akcja kopiuj zachowuje formatowanie kompatybilne z edytorami typu Cursor; 3) Akcja pobierz udostępnia plik tekstowy lub markdown z aktualną treścią; 4) Prompty w statusie draft nie są widoczne dla członków.

### US-005
- ID: US-005
- Tytuł: Dostęp administratora do panelu kuracji
- Opis: Jako administrator organizacji chcę mieć dostęp do `/prompts/admin`, aby zarządzać promptami i kontrolować status publikacji.
- Kryteria akceptacji: 1) Użytkownik z rolą `admin` w `organization_members` może wejść na `/prompts/admin`; 2) Użytkownik `member` próbuje wejść na `/prompts/admin` i otrzymuje komunikat o braku uprawnień oraz przekierowanie do widoku członka; 3) Wejście na panel admina po wyłączeniu flagi skutkuje blokadą dostępu jak w historii US-001.

### US-006
- ID: US-006
- Tytuł: Tworzenie i edycja draftów promptów
- Opis: Jako administrator chcę tworzyć i edytować prompty w wersji roboczej, aby przygotować treści przed publikacją.
- Kryteria akceptacji: 1) Formularz wymaga tytułu, kolekcji i treści markdown przed zapisem; 2) Zapis tworzy rekord w `prompts` powiązany z aktualną organizacją i kolekcją; 3) Edycja aktualizuje treść oraz `updated_at`, zachowując historię w Supabase; 4) Błędy walidacji wyświetlają się inline bez utraty wprowadzonych treści.

### US-007
- ID: US-007
- Tytuł: Publikacja i cofnięcie publikacji
- Opis: Jako administrator chcę przełączać status promptu między draft a published, aby kontrolować jego dostępność dla członków.
- Kryteria akceptacji: 1) Przełącznik statusu zmienia pole `status` i natychmiast odświeża listę członków; 2) Prompty w statusie published pojawiają się w widoku członka po aktualizacji bez konieczności ponownego logowania; 3) Cofnięcie publikacji usuwa prompt z listy członka, pozostawiając go w panelu admina jako draft.

### US-008
- ID: US-008
- Tytuł: Seedowanie organizacji i katalogu bazowego
- Opis: Jako inżynier wdrożeniowy chcę posiadać migracje i seedy tworzące organizację 10xDevs, kolekcje, segmenty i przykładowe prompty, aby środowiska startowały z kompletnymi danymi do demo.
- Kryteria akceptacji: 1) Migracje tworzą tabele z indeksami i ograniczeniami zgodnie ze schematem POC; 2) Seedy dodają organizację 10xDevs oraz minimum dwie przykładowe kolekcje i prompty; 3) Uruchomienie migracji wielokrotnie nie duplikuje danych dzięki klauzulom `on conflict do nothing`.

### US-009
- ID: US-009
- Tytuł: Testy end-to-end ścieżki admin → member
- Opis: Jako zespół QA chcę wykonać scenariusz end-to-end tworzenia, publikacji i konsumpcji promptu, aby potwierdzić gotowość POC.
- Kryteria akceptacji: 1) Vitest pokrywa helpery flag, middleware oraz API admin/member z fixture wieloorganizacyjnym; 2) Playwright przeprowadza scenariusz stworzenia draftu, publikacji i odczytu przez członka; 3) Raport testów jest częścią artefaktów wdrożeniowych i wykorzystywany w przeglądzie POC.

## 6. Metryki sukcesu
- Osiągnięcie 100% zgodności kontroli dostępu w testach QA (brak przypadków nieautoryzowanego wejścia na `/prompts`).
- Co najmniej dwóch administratorów 10xDevs jest w stanie stworzyć i opublikować prompt end-to-end w środowisku staging w czasie krótszym niż 10 minut.
- Minimum pięciu członków 10xDevs korzysta z widoku `/prompts`, a w logach telemetrycznych POC (manualnych) odnotowano co najmniej 10 akcji kopiuj/pobierz w tygodniu pilota.
- Migracje i seedy są uruchomione bez błędów w trzech środowiskach (local, integration, prod) i raportowane w README.
- Playwright smoke test admin → member przechodzi w pipeline CI przy każdym wdrożeniu z włączoną flagą.
