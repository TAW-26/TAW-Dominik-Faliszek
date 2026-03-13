# System do zarządzania wypożyczalnią rowerów i hulajnóg

## Opis projektu
Aplikacja webowa do zarządzania wypożyczalnią rowerów i hulajnóg. System opiera się na sieci stacji bazowych (wirtualnych punktach postojowych). Umożliwia wypożyczenie i zwrot na konkretnych stacjach oraz zarządzanie poszczególnymi pojazdami i stacjami. System przewiduje podział na role użytkowników: Użytkownik oraz Administrator.

## Instrukcja uruchomienia

Projekt składa się z dwóch oddzielnych aplikacji: serwera backendowego w folderze `api` oraz aplikacji frontendowej w folderze `app`.

### Wymagania wstępne
* Środowisko Node.js.
* Baza danych MongoDB.

### Uruchomienie API (Backend)
1. Przejdź do katalogu `api`:
   ```bash
   cd api
   ```
2. Zainstaluj wymagane pakiety:
   ```bash
   npm install
   ```
3. Uruchom serwe:
   ```bash
   npm run dev
   ```

### Uruchomienie aplikacji klienckiej (Frontend)
1. Przejdź do katalogu `app`:
   ```bash
   cd app
   ```
2. Zainstaluj wymagane pakiety:
   ```bash
   npm install
   ```
3. Uruchom aplikację:
   ```bash
   npm run dev
   ```

## Użyte technologie

**Frontend:**
* React.js
* React Router DOM
* TypeScript
* Vite

**Backend:**
* Node.js oraz Express.js
* TypeScript
* Baza danych: MongoDB z wykorzystaniem biblioteki Mongoose

**Autoryzacja i zabezpieczenia:**
* Standard OAuth2 oraz JSON Web Token (JWT)
* Algorytm Argon2 do hashowania

## Dokumentacja

Pełna dokumentacja projektu znajduje się w folderze `docs/`:
* [Szczegółowy opis projektu i zakres funkcjonalny](./docs/topic-selection.md)
* [Diagram związków encji (ERD)](./docs/ERD.png)
* [Diagram przypadków użycia](./docs/UseCase.png)