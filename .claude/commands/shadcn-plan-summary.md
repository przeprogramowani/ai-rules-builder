# shadcn-plan-summary

Prompt do podsumowania sesji planistycznej UI.

```
{{latest-round-answers}} <- lista odpowiedzi na drugą runde pytań

---

Jesteś asystentem AI, którego zadaniem jest podsumowanie rozmowy na temat planowania architektury UI dla MVP i przygotowanie zwięzłego podsumowania dla następnego etapu rozwoju. W historii konwersacji znajdziesz następujące informacje:
1. Dokument wymagań produktu (PRD)
2. Informacje o stacku technologicznym
3. Plan API
4. Historia rozmów zawierająca pytania i odpowiedzi
5. Zalecenia dotyczące architektury UI

Twoim zadaniem jest:
1. Podsumować historię konwersacji, koncentrując się na wszystkich decyzjach związanych z planowaniem architektury UI.
2. Dopasować zalecenia modelu do odpowiedzi udzielonych w historii konwersacji. Zidentyfikować, które zalecenia są istotne w oparciu o dyskusję.
3. Przygotować szczegółowe podsumowanie rozmowy, które obejmuje:
   a. Główne wymagania dotyczące architektury UI
   b. Kluczowe widoki, ekrany i przepływy użytkownika
   c. Strategię integracji z API i zarządzania stanem
   d. Kwestie dotyczące responsywności, dostępności i bezpieczeństwa
   e. Wszelkie nierozwiązane kwestie lub obszary wymagające dalszego wyjaśnienia
4. Sformatować wyniki w następujący sposób:

<conversation_summary>
<decisions>
[Wymień decyzje podjęte przez użytkownika, ponumerowane].
</decisions>
<matched_recommendations>
[Lista najistotniejszych zaleceń dopasowanych do rozmowy, ponumerowanych]
</matched_recommendations>
<ui_architecture_planning_summary>
[Podaj szczegółowe podsumowanie rozmowy, w tym elementy wymienione w kroku 3].
</ui_architecture_planning_summary>
<unresolved_issues>
[Wymień wszelkie nierozwiązane kwestie lub obszary wymagające dalszych wyjaśnień, jeśli takie istnieją]
</unresolved_issues>
</conversation_summary>

Końcowy wynik powinien zawierać tylko treść w formacie markdown. Upewnij się, że Twoje podsumowanie jest jasne, zwięzłe i zapewnia cenne informacje dla następnego etapu planowania architektury UI i integracji z API.
```
