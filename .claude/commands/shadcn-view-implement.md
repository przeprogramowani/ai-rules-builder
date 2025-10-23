# shadcn-view-implement

Prompt do iteracyjnej implementacji widoku z shadcn/ui.

```
Twoim zadaniem jest zaimplementowanie widoku frontendu w oparciu o podany plan implementacji i zasady implementacji. Twoim celem jest stworzenie szczegółowej i dokładnej implementacji, która jest zgodna z dostarczonym planem, poprawnie reprezentuje strukturę komponentów, integruje się z API i obsługuje wszystkie określone interakcje użytkownika.

Najpierw przejrzyj plan implementacji:

<implementation_plan>
{{implementation-plan}} <- zamień na referencję do planu implementacji widoku (np. @generations-view-implementation-plan.md)
</implementation_plan>

Teraz przejrzyj zasady implementacji:

<implementation_rules>
{{frontend-rules}}  <- zamień na referencję do reguł frontendowych (np. @shared.mdc, @frontend.mdc, @astro.mdc, @react.mdc, @ui-shadcn-helper.mdc)
</implementation_rules>

Przejrzyj zdefiniowane typy:

<types>
{{types}} <- zamień na referencję do definicji DTOsów (np. @types.ts)
</types>

Wdrażaj plan zgodnie z następującym podejściem:

<implementation_approach>
Realizuj maksymalnie 3 kroki planu implementacji, podsumuj krótko co zrobiłeś i opisz plan na 3 kolejne działania - zatrzymaj w tym momencie pracę i czekaj na mój feedback.
</implementation_approach>

Dokładnie przeanalizuj plan wdrożenia i zasady. Zwróć szczególną uwagę na strukturę komponentów, wymagania dotyczące integracji API i interakcje użytkownika opisane w planie.

Wykonaj następujące kroki, aby zaimplementować widok frontendu:

1. Struktura komponentów:
   - Zidentyfikuj wszystkie komponenty wymienione w planie wdrożenia.
   - Utwórz hierarchiczną strukturę tych komponentów.
   - Upewnij się, że obowiązki i relacje każdego komponentu są jasno zdefiniowane.

2. Integracja API:
   - Zidentyfikuj wszystkie endpointy API wymienione w planie.
   - Wdróż niezbędne wywołania API dla każdego endpointa.
   - Obsłuż odpowiedzi z API i odpowiednio aktualizacji stan komponentów.

3. Interakcje użytkownika:
   - Wylistuj wszystkie interakcje użytkownika określone w planie wdrożenia.
   - Wdróż obsługi zdarzeń dla każdej interakcji.
   - Upewnij się, że każda interakcja wyzwala odpowiednią akcję lub zmianę stanu.

4. Zarządzanie stanem:
   - Zidentyfikuj wymagany stan dla każdego komponentu.
   - Zaimplementuj zarządzanie stanem przy użyciu odpowiedniej metody (stan lokalny, custom hook, stan współdzielony).
   - Upewnij się, że zmiany stanu wyzwalają niezbędne ponowne renderowanie.

5. Stylowanie i layout:
   - Zastosuj określone stylowanie i layout, jak wspomniano w planie wdrożenia.
   - Zapewnienie responsywności, jeśli wymaga tego plan.

6. Obsługa błędów i przypadki brzegowe:
   - Wdrożenie obsługi błędów dla wywołań API i interakcji użytkownika.
   - Rozważ i obsłuż potencjalne edge case'y wymienione w planie.

7. Optymalizacja wydajności:
   - Wdrożenie wszelkich optymalizacji wydajności określonych w planie lub zasadach.
   - Zapewnienie wydajnego renderowania i minimalnej liczby niepotrzebnych ponownych renderowań.

8. Testowanie:
   - Jeśli zostało to określone w planie, zaimplementuj testy jednostkowe dla komponentów i funkcji.
   - Dokładnie przetestuj wszystkie interakcje użytkownika i integracje API.

W trakcie całego procesu implementacji należy ściśle przestrzegać dostarczonych zasad implementacji. Zasady te mają pierwszeństwo przed wszelkimi ogólnymi najlepszymi praktykami, które mogą być z nimi sprzeczne.

Upewnij się, że twoja implementacja dokładnie odzwierciedla dostarczony plan implementacji i przestrzega wszystkich określonych zasad. Zwróć szczególną uwagę na strukturę komponentów, integrację API i obsługę interakcji użytkownika.
```
