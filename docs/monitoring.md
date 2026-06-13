# Dokumentacja Monitoringu

Ten dokument opisuje konfigurację stosu monitoringu dla projektu, wykorzystującego systemy Loki, Promtail, Prometheus oraz Grafana.

## Architektura
System wykorzystuje dwa główne źródła danych:
* Logi (Stos PLG): Loki (agregacja) + Promtail (zbieranie logów z plików combined.log i error.log).
* Metryki (Stos PMG): Prometheus (zbieranie metryk aplikacji, np. użycie CPU, liczba zapytań HTTP).

## Wymagania wstępne
Pobierz pliki binarne dla odpowiedniego systemu i umieść je w folderze api/monitoring/:
* Loki & Promtail: https://github.com/grafana/loki/releases/tag/v2.9.8
* Prometheus: https://prometheus.io/download/

## Struktura plików
```text
api/
├── monitoring/
│    ├── loki-config.yaml
│    ├── promtail-config.yaml
│    ├── prometheus.yml
│    ├── prometheus.exe
│    ├── loki-windows-amd64.exe
│    └── promtail-windows-amd64.exe
```

## Konfiguracja

1. Prometheus (monitoring/prometheus.yml)
Prometheus odpowiada za zbieranie metryk aplikacji. Konfiguracja zbiera dane z endpointu /metrics udostępnianego przez pakiet express-prom-bundle zaimplementowany w aplikacji Node.js.


2. Loki (monitoring/loki-config.yaml)
Konfiguracja włącza silnik przechowywania TSDB oraz automatyczne usuwanie starych danych.


3. Promtail (monitoring/promtail-config.yaml)
Konfiguracja rozdziela logi na dwa zadania: api_errors oraz api_traffic.


## Jak uruchomić stos
Wykonaj poniższe polecenia w osobnych terminalach z poziomu folderu głównego api/:

Uruchom Loki:
```powershell
.\monitoring\loki-windows-amd64.exe --config.file=monitoring/loki-config.yaml
```

Uruchom Promtail:
```powershell
.\monitoring\promtail-windows-amd64.exe --config.file=monitoring/promtail-config.yaml
```

Uruchom Prometheus:
```powershell
.\monitoring\prometheus.exe --config.file=monitoring/prometheus.yml
```

## Integracja z Grafaną

Źródła danych:
* Dodaj Loki (http://localhost:3101) – dla logów.
* Dodaj Prometheus (http://localhost:9090) – dla metryk.