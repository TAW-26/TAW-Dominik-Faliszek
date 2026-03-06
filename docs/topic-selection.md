# System do zarządzania wypożyczalnią rowerów i hulajnóg
### 1. Opis wybranego tematu projektu
Aplikacja webowa do zarządzania wypożyczalnią rowerów i hulajnóg. System opiera się na sieci stacji bazowych (wirtualnych punktach postojowych). Umożliwia wypożyczenie i zwrot na konkretnych stacjach oraz zarządzanie poszczególnymi pojazdami i stacjami.

### 2. Cel projektu
Stworzenie działającej aplikacji internetowej realizującej procesy obsługi wypożyczalni, z podziałem na role użytkowników.

### 3. Zakres funkcjonalny
* **Autentykacja i autoryzacja:** Logowanie do systemu z wykorzystaniem standardu OAuth2, podział na role.
* **Rola Użytkownik:**
    * Podgląd listy stacji i dostępnych na nich pojazdów.
    * Wypożyczenie wybranego pojazdu.
    * Zwrot pojazdu na wybranej stacji.
    * Wgląd w historię własnych wypożyczeń.
* **Rola Administrator:**
    * Zarządzanie flotą (dodawanie/edycja pojazdów).
    * Zarządzanie stacjami.
    * Wgląd w ogólną historię wypożyczeń w systemie.

### 4. Proponowane technologie
* **Frontend:** React.js
* **Backend:** Express.js (Node.js)
* **Baza danych:** MongoDB
* **Autoryzacja:** OAuth2, JWT