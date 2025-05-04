---
description:
globs:
alwaysApply: false
---
# Mermaid Diagram - Auth Architecture

Jesteś specjalistą ds. bezpieczeństwa, którego zadaniem jest utworzenie diagramu Mermaid w celu wizualizacji przepływu autentykacji dla modułu logowania i rejestracji. Diagram powinien zostać utworzony w następującym pliku: DESTINATION

Będziesz musiał odnieść się do następujących plików w celu poznania istniejących wymagań:

<file_references>
[project-prd.md](mdc:.ai/project-prd.md)
</file_references>

<destination>
.ai/diagrams/auth.md
</destination>

Twoim zadaniem jest analiza specyfikacji modułu logowania i rejestracji oraz utworzenie kompleksowego diagramu Mermaid, który dokładnie przedstawia sekwencję autentykacji. Diagram powinien być w języku polskim.

Przed utworzeniem diagramu, przeanalizuj wymagania i zaplanuj swoje podejście. Umieść swoją analizę wewnątrz tagów <authentication_analysis>. W tej analizie:

1. Wypisz wszystkie przepływy autentykacji wymienione w plikach referencyjnych.
2. Zidentyfikuj głównych aktorów i ich interakcje.
3. Określ procesy weryfikacji i odświeżania tokenów.
4. Dostarcz krótki opis każdego kroku autentykacji.

Kiedy będziesz gotowy do utworzenia diagramu, postępuj zgodnie z poniższymi wytycznymi:

1. Rozpocznij diagram od następującej składni:

   ```mermaid
   sequenceDiagram
   ```

2. Uwzględnij następujące elementy w swoim diagramie:

   - Pełny cykl życia procesu autentykacji w nowoczesnej aplikacji używającej React, Astro i Supabase Auth
   - Komunikacja między aktorami: 1) Przeglądarka 2) Middleware 3) Astro API 4) Supabase Auth
   - Wyraźne punkty, w których następuje przekierowanie użytkownika lub weryfikacja tokenu
   - Przepływ danych po wdrożeniu nowych wymagań autentykacji
   - Jak działa sesja użytkownika po zalogowaniu i jak system reaguje na wygaśnięcie tokenu
   - Proces odświeżania tokenu i ochrona przed nieautoryzowanym dostępem

3. Przestrzegaj tych zasad składni Mermaid:

   - Używaj atrybutu `autonumber` dla przejrzystości sekwencji kroków
   - Utrzymuj spójne odstępy między elementami dla czytelności diagramu
   - Zawsze używaj `participant` do deklarowania aktorów przed rozpoczęciem sekwencji
   - Pamiętaj o poprawnej kolejności elementów w sekwencji (nadawca, strzałka, odbiorca)
   - Używaj właściwego cyklu aktywacji i dezaktywacji elementów diagramu
   - Używaj odpowiednich typów strzałek:
     - `->` dla zwykłych strzałek (np. `Browser->API`)
     - `-->` dla przerywanych strzałek (np. `API-->Browser: Token expired`)
     - `->>` dla strzałek z pustymi grotami (np. `Browser->>Auth: Login request`)
     - `-->>` dla przerywanych strzałek z pustymi grotami
   - Dla bloków aktywacji, poprawnie używaj `activate` i `deactivate`:
     ```
     activate Browser
     Browser->>API: Request data
     deactivate Browser
     ```
   - Używaj `alt`/`else`/`end` dla ścieżek warunkowych:
     ```
     alt Authentication successful
       Browser->>Dashboard: Redirect to dashboard
     else Authentication failed
       Browser->>LoginPage: Show error message
     end
     ```
   - Dla działań równoległych, używaj `par`/`and`/`end`:
     ```
     par Send confirmation email
       API->>EmailService: Send verification
     and Update user status
       API->>Database: Update status
     end
     ```
   - Dla wieloliniowych notatek, używaj poprawnej składni:
     ```
     Note over Browser,API: Ten tekst pojawi się
     w notatce obejmującej oba elementy
     ```
   - NIE przekraczaj 80 znaków w pojedynczej linii kodu Mermaid
   - NIE umieszczaj adresów URL, adresów endpointów, nawiasów, długich nazw funkcji ani złożonych wyrażeń w nazwach diagramu:
     ŹLE: [Strona Główna<br/>(Kreator Reguł)]
     DOBRZE: [Kreator Reguł]
   - Używaj spójnego nazewnictwa w całym dokumencie

4. Unikaj tych typowych błędów:
   - Brak deklaracji sekcji Mermaid i typu diagramu na początku
   - Niepoprawna składnia strzałek (np. -> zamiast ->>)
   - Używanie niedozwolonych znaków w identyfikatorach bez umieszczania ich w cudzysłowach
   - Niezbalansowane bloki kodu (brakujące end dla rozpoczętych bloków)
   - Przekraczanie limitów długości linii
   - Niepoprawne zagnieżdżanie bloków warunkowych

Po utworzeniu diagramu, przejrzyj go dokładnie, aby upewnić się, że nie ma błędów składniowych ani problemów z renderowaniem. Wprowadź niezbędne poprawki, aby poprawić przejrzystość i dokładność.

Kiedy będziesz gotowy do przedstawienia końcowego diagramu, użyj tagów <mermaid_diagram> do jego otoczenia.
