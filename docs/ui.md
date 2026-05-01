## Opis interfejsu użytkownika (UI) - Wypożyczalnia

### 1. Pasek nawigacji (Header) - Wspólny dla widoków po zalogowaniu
*   **Lewa strona:** Nazwa aplikacji
*   **Prawa strona:** Nazwa zalogowanego użytkownika, rola, przycisk "Wyloguj".
*   *Dla użytkownika:* Przycisk "Moja Historia" (otwiera modal).
*   *Dla administratora:* Przyciski: "Stacje", "Flota", "Historia Globalna".

---

### 2. Widok: Logowanie
Wyśrodkowany widok na pełnym ekranie, pełniący rolę strony startowej dla niezalogowanych.
*   Nazwa aplikacji.
*   Przycisk i formularz logowania/rejestracji (obsługa OAuth2).

---

### 3. Widok: Główny Panel Użytkownika (Widok Mapy)
Większość ekranu zajmuje mapa. To główne i podstawowe narzędzie dla Użytkownika.

*   **Mapa:** Wyświetla znaczniki (punkty) reprezentujące stacje.
*   **Interakcja 1 - Kliknięcie w stację:** Otwiera panel boczny. Widok panelu zależy od statusu użytkownika:
    *   **Brak wypożyczonego pojazdu:** Wyświetla się lista dostępnych urządzeń na tej stacji (każde urządzenie to wiersz z ikoną roweru/hulajnogi i jej ID).
    *   **Użytkownik aktualnie wypożycza pojazd:** Zamiast listy urządzeń, pojawia się duży przycisk **"Zwróć pojazd na tej stacji"**. Stacja musi mieć wolne miejsce. Po kliknięciu tego przycisku pojawia się mały modal z potwierdzeniem operacji.
*   **Interakcja 2 - Kliknięcie w konkretny pojazd (z listy na stacji):** Otwiera na środku ekranu **Modal**.
    *   Zawartość modala: Szczegóły pojazdu.
    *   Przycisk na dole modala: **"Wypożycz"**. Po kliknięciu okno się zamyka, a aplikacja przechodzi w tryb "Aktywnego wypożyczenia". Kolejne kliknięcie w dowolną stację z wolnym miejscem pokaże opcję zwrotu. Po lewej stronie pojawi się okno ze szczegółami aktualnie wypożyczonego pojazdu.

### 4. Modal: Historia Użytkownika
Szeroki modal otwierany z górnego paska, pozwalający na wgląd w transakcje bez opuszczania widoku mapy.
*   **Tabela:** Zawiera kolumny: Data, Typ pojazdu, ID pojazdu, Stacja, Typ wydarzenia (RENT/RETURN).

---

### 5. Widok: Panel Administratora

#### 5.1 Zakładka: Stacje
*   Przycisk: **"+ Dodaj stację"** (otwiera modal z polami na dane stacji).
*   **Tabela:** Lista stacji ze wszystkimi danymi.
*   **Akcje w tabeli:** [Edytuj] (otwiera ten sam modal co przy dodawaniu, ale z wypełnionymi danymi do edycji), [Usuń].

#### 5.2 Zakładka: Flota (Pojazdy)
*   Przycisk: **"+ Dodaj pojazd"** (otwiera modal: dane pojazdu, wybór stacji początkowej).
*   **Tabela:** Lista i dane pojazdów.
*   **Akcje w tabeli:** [Edytuj] (otwiera modal z obecnymi danymi pojazdu w celu ich edycji), [Usuń].

#### 5.3 Zakładka: Historia Wypożyczeń
*   **Tabela:** Lista wszystkich transakcji w systemie, z tymi samymi polami co Historia Użytkownika.
*   Nad tabelą pole do wyszukiwania po ID użytkownika lub ID pojazdu.