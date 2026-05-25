<<<<<<< HEAD
# Transactions
=======
# PrivatTracker — Expo

## Швидкий старт

### 1. Встанови залежності
```bash
npm install
```

### 2. Налаштуй IP сервера
Відкрий `src/services/api.ts` і вкажи IP машини де запущений бекенд:
```ts
const BASE_URL = 'http://192.168.1.100:3000/api/v1'; // твій IP
```
> ⚠️ `localhost` не працює з фізичного пристрою — тільки для браузерного веб-режиму.

### 3. Запусти

| Команда | Де запускається |
|---|---|
| `npx expo start --web` | Браузер (Chrome/Firefox) |
| `npx expo start` | QR-код → Expo Go на телефоні |
| `npx expo start --android` | Android емулятор |

### Тестування в браузері (найпростіше на Windows)
```bash
npx expo start --web
# Автоматично відкриє http://localhost:8081
```

### Тестування на телефоні через QR
1. Встанови **Expo Go** з App Store / Google Play
2. Запусти `npx expo start`
3. Відскануй QR телефоном (iOS камерою або Expo Go на Android)
4. Телефон і комп'ютер мають бути в одній Wi-Fi мережі

---

## Запуск бекенду

```bash
cd ../privat-tracker
cp .env.example .env
# Заповни .env своїми credentials від ПриватБанку

docker-compose up -d
# API доступне на http://localhost:3000/api/v1
```

### Перший синк
```bash
curl -X POST http://localhost:3000/api/v1/privatbank/sync?days=30
```

---

## Структура проєкту
```
src/
├── types/        — TypeScript інтерфейси
├── theme/        — кольори, spacing, categoryMeta
├── services/     — axios API клієнт
├── hooks/        — useTransactions, useAccounts
├── components/   — TransactionItem, BalanceCard
├── screens/      — 5 екранів
└── navigation/   — Tab + Stack навігатор
```

## iOS збірка через AltStore (фінальний крок)
1. Потрібен Mac з Xcode
2. `npx expo prebuild --platform ios`
3. Відкрий `ios/PrivatTracker.xcworkspace` в Xcode
4. Build → отримай `.ipa`
5. Встанови через AltStore
>>>>>>> master
