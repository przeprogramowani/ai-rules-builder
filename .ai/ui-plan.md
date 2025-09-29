# Architektura UI dla Prompt Manager POC

## 1. Przegląd struktury UI
Prompt Manager POC dodaje dwie główne powierzchnie UI do istniejącej aplikacji 10xRules.ai: widok ucznia oraz panel administracyjny. Obie powierzchnie są dostępne za funkcją `PROMPT_MANAGER_ENABLED` i wykorzystują komponenty shadcn/ui (np. `Tabs`, `Card`, `Dialog`, `Button`) stylowane Tailwindem zgodnie z motywem projektu. Nawigacja odbywa się poprzez główną nawigację aplikacji oraz wewnętrzne zakładki modułów/lekcji.

## 2. Lista widoków
### 2.1 Prompt Manager (Learner)
- **Ścieżka:** `/prompts`
- **Cel:** Przeglądanie, filtrowanie, kopiowanie i ulubienie promptów przypisanych do modułów i lekcji.
- **Kluczowe informacje:** moduły i lekcje (lista, aktywna pozycja), lista promptów (tytuł, tagi, status), szczegóły promptu (markdown, CTA kopiowania), oznaczenie ulubionych.
- **Kluczowe komponenty:**
  - `PromptLayout` (shell z nagłówkiem, opisem, flagą lokalizacji)
  - `ModuleTabs` (shadcn `TabsList` z `TabsTrigger`)
  - `LessonSelect` (shadcn `Combobox` lub `Select`)
  - `PromptCard` (shadcn `Card` + `Button` dla ulubionych/kopiowania)
  - `PromptDetailSheet` (shadcn `Sheet` lub `Dialog` na mobile)
- **UX/a11y/security:** responsywna siatka kart, focus states, przycisk kopiujący z `navigator.clipboard`, fallback do plain text, informacje o ograniczeniu dostępu (cohort guard placeholder), obsługa ładowania i błędów per sekcja.

### 2.2 Prompt Manager Admin
- **Ścieżka:** `/prompts/admin`
- **Cel:** Zarządzanie katalogiem promptów (dodawanie, edycja, publikacja, oznaczenie ulubionych w ramach QA).
- **Kluczowe informacje:** tabela promptów (status, moduł, lekcja), formularz edycji z markdownem, status publikacji.
- **Kluczowe komponenty:**
  - `AdminPromptTable` (shadcn `Table` + `Toolbar` z filtrami)
  - `PromptFormDrawer` (shadcn `Sheet` lub `Dialog` z `Form`/`Textarea`)
  - `PublishToggle` (shadcn `Switch` + `Badge` dla statusu)
  - `BulkActionsBar` (przyszłościowy placeholder; obecnie pojedyncze akcje)
- **UX/a11y/security:** role-based gating (`prompt_role`), walidacja formularza (React Hook Form + zod), jasne komunikaty toast (shadcn `Toast`), disable akcji podczas zapisu, confirm dialog przy usuwaniu.

### 2.3 Prompt Favorites
- **Ścieżka:** `/prompts/favorites` (opcjonalny tab w ramach `/prompts`)
- **Cel:** Przeglądanie ulubionych promptów użytkownika.
- **Kluczowe informacje:** lista kart promptów z oznaczeniem modułu/lekcji.
- **Kluczowe komponenty:** `Tabs`, `PromptCard` (komponent współdzielony), `EmptyState` (shadcn `Card` + `Button`).
- **UX/a11y/security:** dostępne tylko po zalogowaniu, komunikat pustej listy, synchronizacja ze stanem.

## 3. Mapa podróży użytkownika
1. Użytkownik loguje się i wybiera `Prompt Manager` z nawigacji (flaga aktywna).
2. Widok ładuje moduły i lekcje → użytkownik filtruje (tabs/select).
3. Użytkownik przegląda listę promptów → otwiera kartę/arkusz z detalami.
4. Akcje: kopiowanie promptu, dodanie do ulubionych (persist w Supabase).
5. Administrator dodatkowo przechodzi do `/prompts/admin`, filtruje listę, otwiera formularz, edytuje markdown, publikuje (toggle) i zapisuje.
6. Po zapisie UI odświeża listy (re-fetch, optimistic update). Telemetria (flagowana) loguje zdarzenia.

## 4. Układ i struktura nawigacji
- Główna nawigacja: pozycja „Prompt Manager” widoczna po włączeniu flagi i zalogowaniu.
- We wnętrzu: layout oparty o `Tabs` (moduły) + `Select` (lekcje) z dodatkowymi zakładkami (`Prompty`, `Ulubione`).
- Panel admina: boczny `Breadcrumb` + toolbar filtrów, tabela z paginacją.
- Mobilna nawigacja: `Tabs` przewijane, detail w `Sheet` full-screen.

## 5. Kluczowe komponenty wielokrotnego użytku
- `PromptCard` – karta promptu z przyciskami kopiowania i ulubionych (shadcn `Card`, `Button`, `Badge`).
- `PromptMarkdown` – wrapper renderujący markdown z sanitizacją i kontekstowym kopiowaniem.
- `PromptFilters` – sekcja filtrów (module tabs + lesson select + wyszukiwanie) z debounced input.
- `PromptForm` – formularz admina (React Hook Form + shadcn `Form`, `Textarea`, `Checkbox`, `Select`).
- `PromptToast` – helper do wyświetlania toastów (sukces/błąd) dla akcji promptów.
- `PromptEmptyState` – komponent pustego stanu (ikona + CTA) wspólny dla list i ulubionych.

## 6. Integracja shadcn/ui i Tailwind
- Wszystkie nowe komponenty bazują na shadcn/ui, rozszerzając istniejący motyw (new-york neutral).
- Layout budowany Tailwind utility (`grid`, `flex`, `gap`, `min-h-screen`), z naciskiem na responsywność.
- Dokumentacja komponentów przechowywana w `docs/prompts/ui.md` (do utworzenia w kolejnych iteracjach) wraz z kitchen sink.

## 7. Stany i obsługa błędów
- Globalna nakładka `Loader` (shadcn `Skeleton` lub `Spinner`) podczas fetch.
- Błędy fetch/submit wyświetlane jako toast oraz sekcja `InlineError` wewnątrz kart.
- Kopiowanie promptu potwierdzane toastem; fallback do manualnego zaznaczenia przy błędzie `navigator.clipboard`.

## 8. Testowanie UI
- Testy jednostkowe: komponenty filtrów i kart (snapshot + event handlers).
- Testy e2e (Playwright): podstawowy przepływ ucznia i edycji admina.
- Storybook/kitchen sink do manualnej weryfikacji (opcjonalnie w kolejnej fazie).

## 9. Automatyzacja i wiedza współdzielona
- Prompty i workflowy shadcn/ui utrzymuj jako komendy Codex (`.codex/commands/shadcn-*.md`), a indeks znajdziesz w `.ai/shadcn-prompts.md`.
- Każda nowa iteracja UI powinna aktualizować oba dokumenty tak, aby zachować zgodność między architekturą a automatyzacją.
- Przy rozbudowie komponentów kieruj się istniejącymi planami oraz dodawaj nowe prompty (np. kitchen sink, inspiracje) do wspomnianego pliku.
