# MVP dla 10xRules.ai

Główny problem: Aby podnieść jakość współpracy programisty z AI, konieczne jest zdefiniowanie projektowych reguł dla sztucznej inteligencji. Niestety, współczesne edytory zintegrowane z modelami językowymi używają różnych konwencji do definiowania tych reguł, a bez tego dokumentu jakość współpracy z AI jest niska. Do tego, precyzyjne definiowanie reguł wymaga doświadczenia i wiedzy o AI.

## Najmniejszy zestaw funkcjonalności:

- Katalog reguł dla AI w formacie Markdown na 3 poziomach - warstwy aplikacji, stacku i bibliotek (np. Frontend, React, Zustand)
- Udostępnienie konwencji do definiowania reguł dla AI w danym edytorze
- Pobieranie reguł w formacie Markdown
- Kopiowanie reguł do schowka
- Generowanie reguł na podstawie "dep-files" (np. package.json czy requirements.txt)

## Co NIE wchodzi w zakres MVP:

- Zaawansowane funkcje udostępniania reguł między użytkownikami
- Eksport do formatów innych niż Markdown
- Edycja reguł w aplikacji - użytkownik dostosowuje treść już na poziomie swojego projektu

## Kryteria sukcesu:

- Użytkownik może wygenerować zestaw reguł dla najpopularniejszych technologii webowych korzystając z gotowego katalogu
- Użytkownik może pobrać gotowy zestaw reguł lub skopiować do schowka
