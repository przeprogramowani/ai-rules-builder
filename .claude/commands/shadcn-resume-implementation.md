# shadcn-resume-implementation

Prompt do wznowienia implementacji widoku na podstawie zapisanego statusu.

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

Nie zaczynaj pracy od poczatku kroków implementacji, weź pod uwagę obecny status:

<implementation_status>
{{implementation-status}} <- zamień na referencję do utworzonego statusu implementacji 👈
</implementation_status>

Dokładnie przeanalizuj plan wdrożenia, zasady i jego obecny status (zacznij od "Następne kroki"). Zwróć szczególną uwagę na strukturę komponentów, wymagania dotyczące integracji API i interakcje użytkownika opisane w planie.

// reszta prompta taka sama jak w oryginalnym poleceniu implementacji
```
