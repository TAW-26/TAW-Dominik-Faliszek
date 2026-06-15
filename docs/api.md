# Dokumentacja Rental API
Poniżej znajduje się pełna specyfikacja endpointów API wraz z przykładami zapytań. Wszystkie chronione zasoby wymagają przesłania tokena JWT w nagłówku: `Authorization: Bearer <token_jwt>`.
## Globalna Obsługa Błędów Autoryzacji
W przypadku przesłania wygasłego, nieprawidłowego lub zmodyfikowanego tokenu JWT, każdy chroniony endpoint natychmiast przerywa proces przetwarzania i zwraca ujednoliconą strukturę błędu:
- Kod Statusu HTTP: `401 Unauthorized`
- Body Odpowiedzi:
```json
{
  "message": "Token expired or invalid"
}
```
## 1. Użytkownicy i Autentykacja

### Rejestracja użytkownika (Publiczna)
- **URL:** `/api/user/register`
- **Metoda:** `POST`
- **Body:**
```json
{
  "login": "jan_kowalski",
  "password": "haslo_uzytkownika",
  "username": "Jan Kowalski"
}
```

### Logowanie (Publiczne)
- **URL:** `/api/user/login`
- **Metoda:** `POST`
- **Body:**
```json
{
  "login": "jan_kowalski",
  "password": "haslo_uzytkownika"
}
```
- **Odpowiedź:** `{"token": "eyJhbGciOi..."}`

---

## 2. Zarządzanie Stacjami (Stations)

Wymagany nagłówek: `Authorization: Bearer <token_jwt>`

### Lista wszystkich stacji
- **URL:** `/api/station`
- **Metoda:** `GET`

### Dodawanie stacji (Tylko Admin)
- **URL:** `/api/station/create`
- **Metoda:** `POST`
- **Body:**
```json
{
  "name": "Stacja Główna",
  "status": "active",
  "capacity": 10,
  "lon": 21.0122,
  "lat": 52.2297
}
```

### Edycja stacji (Tylko Admin)
- **URL:** `/api/station/:id`
- **Metoda:** `PATCH`
- **Body (przykład):**
```json
{
  "name": "Nowa Nazwa Stacji",
  "capacity": 15
}
```

### Usuwanie stacji (Tylko Admin)
- **URL:** `/api/station/:id`
- **Metoda:** `DELETE`
- **Uwaga:** Stacja może zostać usunięta tylko, jeśli nie znajduje się na niej żadne urządzenie (`device_count` musi wynosić 0).

---

## 3. Urządzenia (Devices)
### Pobranie Aktywnego Wypożyczenia Użytkownika
- URL: `/api/device/active`
- Metoda: `GET`
- Wymagana rola: `User`
- Opis: Zwraca szczegóły urządzenia aktualnie wypożyczonego przez zalogowanego użytkownika (na podstawie powiązania sesji).
- Odpowiedź (Sukces - 200 OK):
```json
{
"_id": "65f123abc456...",
"type": "bike",
"status": "rented",
"updated_at": "2026-06-14T20:00:00.000Z"
}
```
- Odpowiedź (Brak wypożyczenia - 200 OK): `null`  ### Pobranie Urządzeń Przypisanych do Stacji- URL: `/api/device/:stationId`- Metoda: `GET`- Wymagana rola: `User` / `Admin`- Opis: Zwraca listę wszystkich pojazdów zadokowanych na wybranej stacji bazowej.- Odpowiedź (Sukces - 200 OK):```json[{"_id": "65f987xyz123...","type": "ebike","status": "active"}]```
- ### Wypożyczenie (Rola: User)
- URL: `/api/device/:id/rent`
- Metoda: `POST`  ### Zwrot (Rola: User)
- URL: `/api/device/:id/return`
- Metoda: `POST`
- Body:
```json
{
  "stationId": "65f123abc456..."
}
```

### Edycja urządzenia (Tylko Admin)
- **URL:** `/api/device/:id`
- **Metoda:** `PATCH`
- **Body (przykład):**
```json
{
  "status": "maintenance",
  "type": "ebike"
}
```

### Usuwanie urządzenia (Tylko Admin)
- **URL:** `/api/device/:id`
- **Metoda:** `DELETE`
- **Opis:** Usunięcie urządzenia automatycznie aktualizuje stan liczników na stacji, do której było przypisane.

---

## 4. Testowanie

### Testy Automatyczne (Jest & Supertest)
Aplikacja zawiera kompletny zestaw testów integracyjnych pokrywający:
- Logikę wypożyczeń i zwrotów.
- Zabezpieczenia ról (RBAC).
- Warunki brzegowe (np. blokada usunięcia niepustej stacji).

**Uruchomienie:**
```
npm install
npm run test
```