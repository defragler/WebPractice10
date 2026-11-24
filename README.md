# Практична робота № 10

## Тема: Комунікація у реальному часі та система нотифікацій

---

## Мета роботи

- Опанувати принципи організації двостороннього повнодуплексного зв'язку між клієнтом та сервером у реальному часі за допомогою протоколу WebSockets та бібліотеки Socket.IO у NestJS.
- Навчитися створювати та конфігурувати WebSocket Gateways, обробляти хуки життєвого циклу підключень клієнтів (`OnGatewayConnection`, `OnGatewayDisconnect`) та налаштовувати CORS.
- Опанувати роботу з подіями, механізмом широкомовлення (`broadcasting`) та ізольованими каналами передачі даних (кімнатами — `Rooms`).
- Створити клієнтський інтерфейс на базі HTML та JavaScript для тестування взаємодії через Socket.IO.
- Засвоїти роботу з протоколом Server-Sent Events (SSE) у NestJS для односторонньої потокової передачі даних клієнту на основі реактивних потоків RxJS (`Observable`).
- Навчитися інтегрувати поштові сервіси та відправляти форматовані HTML-нотифікації користувачам за допомогою `nodemailer` та локального емулятора SMTP-сервера.

---

## Технічне забезпечення

- Операційна система: Windows, macOS або Linux.
- Середовище розробки: Visual Studio Code (із розширенням Live Server або вбудованим браузером).
- Платформа виконання: Node.js версії 18+ (LTS) та пакетний менеджер npm.
- Контейнеризація: Docker Engine та Docker Compose (V2) для запуску SMTP-пастки (Mailpit).
- Бібліотеки бекенду: NestJS, `@nestjs/websockets`, `@nestjs/platform-socket.io`, `socket.io`, `rxjs`, `nodemailer`, `@types/nodemailer`.
- Клієнтська частина: будь-який веббраузер (Google Chrome, Firefox, Safari) та бібліотека `socket.io-client`.
- Термінал / CLI: bash, zsh або PowerShell.
- Система контролю версій: Git.

---

## Короткі теоретичні відомості

### 1. Архітектура WebSocket у NestJS на базі Socket.IO

Протокол WebSocket забезпечує постійне двостороннє з'єднання між браузером і сервером поверх одного TCP-з'єднання. У NestJS шлюз створюється за допомогою декоратора `@WebSocketGateway()`:

```typescript
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Клієнт підключився: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Клієнт відключився: ${client.id}`);
  }

  @SubscribeMessage('sendMessage')
  handleMessage(@MessageBody() data: string, @ConnectedSocket() client: Socket) {
    // Відправка відповіді всім підключеним клієнтам (broadcasting)
    this.server.emit('newMessage', { sender: client.id, message: data });
  }
}
```

---

### 2. Кімнати (Rooms) у Socket.IO

Кімнати — це механізм групування сокетів, який дозволяє відправляти повідомлення лише обмеженому колу підписників (наприклад, покупцю та менеджеру конкретного замовлення):

```typescript
// Приєднання клієнта до кімнати
@SubscribeMessage('joinRoom')
handleJoinRoom(@MessageBody('roomId') roomId: string, @ConnectedSocket() client: Socket) {
  client.join(roomId);
  client.emit('joined', { status: 'success', roomId });
}

// Відправка повідомлення всім сокетам у конкретній кімнаті
sendNotificationToRoom(roomId: string, event: string, payload: any) {
  this.server.to(roomId).emit(event, payload);
}
```

---

### 3. Потокові оновлення через Server-Sent Events (SSE)

Server-Sent Events — це стандарт передачі односторонніх подій від сервера до клієнта поверх звичайного HTTP-з'єднання з заголовком `Content-Type: text/event-stream`. У NestJS це реалізується за допомогою декоратора `@Sse()` та RxJS `Observable`:

```typescript
import { Controller, Sse, MessageEvent } from '@nestjs/common';
import { Observable, interval, map } from 'rxjs';

@Controller('stream')
export class StreamController {
  @Sse('events')
  sendEvents(): Observable<MessageEvent> {
    return interval(3000).pipe(
      map((num) => ({
        data: { timestamp: new Date().toISOString(), tick: num, message: 'Статус оновлено' },
      })),
    );
  }
}
```

На клієнті отримання подій здійснюється вбудованим браузерним класом `EventSource`:

```javascript
const eventSource = new EventSource('/stream/events');
eventSource.onmessage = ({ data }) => {
  console.log('Нова подія з сервера:', JSON.parse(data));
};
```

---

### 4. Відправка Email через Nodemailer та Mailpit

Для тестування відправки листів без ризику потрапляння в спам використовується локальний SMTP-сервер **Mailpit**, який перехоплює всі відправлені листи та відображає їх у зручному вебінтерфейсі.

Фрагмент `docker-compose.yml`:

```yaml
services:
  mailpit:
    image: axllent/mailpit:latest
    container_name: nest_mailpit
    restart: unless-stopped
    ports:
      - "1025:1025" # SMTP-порт
      - "8025:8025" # Web UI
```

Налаштування транспорту в сервісі NestJS:

```typescript
import * as nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 1025,
  ignoreTLS: true,
});

await transporter.sendMail({
  from: '"E-Commerce Store" <no-reply@store.local>',
  to: 'customer@example.com',
  subject: 'Підтвердження вашого замовлення',
  html: '<h1>Дякуємо за замовлення!</h1><p>Ваше замовлення успішно прийнято в обробку.</p>',
});
```

---

## Постановка задачі

Розширити функціональність розроблюваної системи інтернет-магазину механізмами оповіщення користувачів у реальному часі та сервісом email-нотифікацій. Створити WebSocket Gateway для відстеження статусів операцій, реалізувати персоналізовані кімнати підписників, надати ендпоінт Server-Sent Events для потокової передачі метрик/оновлень, а також налаштувати генерацію та відправку HTML-листів через SMTP.

У межах практичної роботи необхідно:

1. Створити модуль `NotificationsModule` та описати шлюз `EventsGateway` на базі Socket.IO.
2. Налаштувати обробку подій життєвого циклу клієнтських сокетів (`handleConnection`, `handleDisconnect`) із фіксацією утилітарних логів.
3. Створити окрему вебсторінку `client.html` із підключеним клієнтом Socket.IO для демонстрації інтерактивного обміну даними з бекендом.
4. Реалізувати механізм приєднання клієнтів до кімнат (`Rooms`) відповідно до ідентифікаторів сутностей свого варіанта та адресне сповіщення підписників конкретної кімнати.
5. Створити контролер з ендпоінтом `@Sse()` для потокової трансляції змін або системних показників через RxJS Observable.
6. Розгорнути локальний емулятор SMTP-сервера (Mailpit) через Docker Compose.
7. Інтегрувати бібліотеку `nodemailer` та реалізувати метод відправки електронних листів з адаптивним HTML-шаблоном.
8. Зв'язати зміну стану замовлення чи створення сутності у сервісі з одночасною відправкою WebSocket-оповіщення у кімнату та відправкою листа покупцю.

Параметри предметної області, події для WebSocket-кімнат та тематика email-повідомлень визначаються індивідуальним *варіантом за номером у журналі*:

### Таблиця варіантів системи нотифікацій

| Варіант | Предметна область | Назва кімнати (Room) | WebSocket-подія | Тема та зміст Email-нотифікації |
|---|---|---|---|---|
| **1** | Гаджети та електроніка | `order_<orderId>` | `orderStatusChanged` | Підтвердження покупки гаджета та зміна статусу гарантії |
| **2** | Книжковий онлайн-магазин | `preorder_<bookId>` | `bookStockArrived` | Сповіщення про надходження очікуваного тиражу книги |
| **3** | Одяг та взуття | `drop_<collectionId>` | `dropStarted` | Початок продажу нової сезонної колекції одягу |
| **4** | Ресторан та доставка їжі | `delivery_<orderId>` | `courierLocationUpdated` | Етапи приготування страви та передача кур'єру |
| **5** | Онлайн-аптека | `prescription_<rxId>` | `prescriptionApproved` | Верифікація рецепта фармацевтом та готовність ліків |
| **6** | Будівельні матеріали | `shipment_<batchId>` | `batchDispatched` | Формування накладної та виїзд вантажівки зі складу |
| **7** | Автозапчастини | `request_<vinCode>` | `partFound` | Результати підбору сумісної запчастини менеджером |
| **8** | Квитки на події | `queue_<eventId>` | `ticketReserved` | Підтвердження бронювання місця та квитанція з QR-кодом |
| **9** | Онлайн-курси | `homework_<userId>` | `gradePublished` | Оцінка практичного завдання ментором з коментарями |
| **10** | Зоотовари | `reminder_<petId>` | `feedingPlanUpdated` | Графік прийому ліків для тварини та оновлення раціону |

---

## Завдання

Практична робота складається з трьох послідовних рівнів. Кожен наступний рівень базується на попередньому та розширює функціональність розроблюваного рішення.

### Рівень 1. Базовий

1. **Налаштування WebSocket Gateway:**
   - Встановити необхідні залежності:
     ```bash
     npm i @nestjs/websockets @nestjs/platform-socket.io socket.io
     ```
   - Створити клас `EventsGateway` із декоратором `@WebSocketGateway()`, налаштувавши дозвіл CORS для будь-яких джерел (`cors: { origin: '*' }`).
   - Реалізувати інтерфейси `OnGatewayConnection` та `OnGatewayDisconnect`, виводячи в консоль сервера повідомлення про підключення та відключення клієнтів із зазначенням їхнього `socket.id`.
2. **Обробка та трансляція повідомлень:**
   - Реалізувати обробник `@SubscribeMessage('ping')`, який приймає повідомлення від клієнта та надсилає у відповідь подію `pong` з поточним таймстемпом.
   - Реалізувати обробник `@SubscribeMessage('broadcastNotification')`, який приймає текстове повідомлення та транслює його усім активним сокетам через `this.server.emit('globalAlert', data)`.
3. **Клієнтський тестовий інтерфейс:**
   - Створити простий HTML-файл `client.html` (у корені проєкту або папці `public`), що підключає клієнтську бібліотеку `socket.io-client`.
   - Додати поле введення тексту, кнопку відправки повідомлення та блок списку (`<ul>`) для динамічного відображення отриманих з сервера подій без перезавантаження сторінки.
   - Відкрити клієнт у двох різних вкладках браузера та продемонструвати обмін повідомленнями через широкомовлення (broadcast).

### Рівень 2. Середній

1. **Робота з цільовими кімнатами (Rooms):**
   - Реалізувати обробник підписки клієнта на кімнату `@SubscribeMessage('joinRoom')`, що отримує назву або ідентифікатор кімнати згідно з варіантом (наприклад, `order_101`) та викликає `client.join(roomId)`.
   - Реалізувати обробник виходу з кімнати `@SubscribeMessage('leaveRoom')` через `client.leave(roomId)`.
   - Реалізувати метод шлюзу або сервісу `emitToRoom(roomId: string, event: string, data: any)`, який відправляє подію виключно сокетам, що знаходяться у зазначеній кімнаті (`this.server.to(roomId).emit(...)`).
   - Доповнити `client.html` можливістю ввести назву кімнати, кнопками приєднання/виходу та блоком виведення подій кімнати.
2. **Реалізація Server-Sent Events (SSE):**
   - Створити контролер `NotificationsController` з ендпоінтом `@Sse('events/stream')`.
   - Використати RxJS-оператори `interval()` та `map()` для генерування потоку подій кожні 5 секунд, що повертають об'єкт `MessageEvent` із системними даними (наприклад, статус сервера, кількість активних підключень або поточний час сервера).
   - Додати у `client.html` секцію слухача `EventSource`, яка підключається до ендпоінта SSE та виводить отримані стрімінгові оновлення.

### Рівень 3. Просунутий

1. **Розгортання поштової пастки (Mailpit):**
   - Додати опис сервісу Mailpit у файл `docker-compose.yml` (порти `1025` для SMTP та `8025` для Web UI).
   - Запустити контейнер за допомогою команди `docker compose up -d`.
2. **Інтеграція сервісу відправки Email:**
   - Встановити бібліотеку `nodemailer` та типи:
     ```bash
     npm i nodemailer
     npm i -D @types/nodemailer
     ```
   - Створити сервіс `MailService`, що ініціалізує транспорт `nodemailer.createTransport` з налаштуваннями на локальний SMTP-сервер `localhost:1025`.
   - Реалізувати метод `sendNotificationEmail(to: string, subject: string, htmlContent: string)`.
   - Створити якісний HTML-шаблон листа відповідно до тематики індивідуального варіанта (наприклад, гарно зверстаний лист із логотипом, таблицею параметрів замовлення та кнопкою переходу).
3. **Комплексний бізнес-сценарій оповіщення:**
   - Додати REST-ендпоінт у контролер (наприклад, `POST /orders/:id/status` або аналогічний ресурс свого варіанта).
   - При виклику цього ендпоінта сервіс повинен синхронно виконати дві дії:
     1. Відправити миттєве сповіщення через WebSocket шлюз у кімнату цього замовлення/користувача (`this.eventsGateway.emitToRoom(...)`);
     2. Відправити форматований HTML-лист на email отримувача через `MailService`.
   - Продемонструвати у вебінтерфейсі Mailpit (`http://localhost:8025`) успішне отримання листа та одночасне оновлення статусу на відкритій вебсторінці клієнта `client.html`.

---

## Приклад очікуваного виведення програми

```text
[Nest] 51200  - 09/09/2026, 22:50:00     LOG [NestFactory] Starting Nest application...
[Nest] 51200  - 09/09/2026, 22:50:00     LOG [EventsGateway] EventsGateway initialized on port 3000 +15ms
[Nest] 51200  - 09/09/2026, 22:50:00     LOG [RoutesResolver] NotificationsController {/notifications}: +3ms
[Nest] 51200  - 09/09/2026, 22:50:00     LOG [NestApplication] Nest application successfully started on port 3000 +2ms

[EventsGateway] Клієнт підключився: s8A1fk29LmPq0192AB
[EventsGateway] Клієнт s8A1fk29LmPq0192AB приєднався до кімнати: order_101

=== ТЕСТУВАННЯ ЕНДПОІНТА ЗМІНИ СТАТУСУ ТА НОТИФІКАЦІЙ ===

> PATCH /orders/101/status HTTP/1.1
> Host: localhost:3000
> Content-Type: application/json

{
  "status": "SHIPPED",
  "customerEmail": "client@example.com"
}

< HTTP/1.1 200 OK
{
  "success": true,
  "message": "Статус замовлення оновлено, сповіщення надіслано в кімнату та на пошту"
}

[EventsGateway] Сповіщення надіслано в кімнату order_101: { event: 'orderStatusChanged', status: 'SHIPPED' }
[MailService] Лист успішно надіслано на адресу client@example.com (Message ID: <b761-91a2-mailpit>)
```

---

## Контрольні питання

1. У чому полягають ключові відмінності між протоколами HTTP (Request-Response) та WebSocket (повнодуплексний зв'язок)?
2. Які переваги та додаткові можливості надає бібліотека Socket.IO над стандартним чистим WebSocket API у браузері?
3. Що таке механізм Broadcating у Socket.IO та чим він відрізняється від відправки повідомлення конкретному сокету?
4. Як працює концепція «кімнат» (Rooms) у Socket.IO? Чому приєднання клієнтів до кімнат відбувається на стороні сервера?
5. Що таке Server-Sent Events (SSE)? У яких прикладних сценаріях SSE є більш доцільним вибором, ніж повноцінні WebSockets?
6. Як влаштований формат даних у потоці `text/event-stream` та які ключові поля містить повідомлення SSE (`data`, `id`, `event`, `retry`)?
7. Яку роль відіграють реактивні потоки RxJS (`Observable`) у забезпеченні потокової обробки подій у фреймворку NestJS?
8. Що таке SMTP-пастка (наприклад, Mailpit або Mailtrap) та чому її використання є обов'язковим стандартом під час локальної розробки та тестування?
9. Які переваги надає комбінування WebSockets (для миттєвого інформування в активній вкладці) та Email-нотифікацій (для довгострокових або фонових сповіщень)?

---

## Критерії оцінювання

Оцінювання здійснюється за шкалою повноти реалізації рівнів практичної роботи:

- **«Задовільно» (Рівень 1):** реалізовано базовий прототип, створено структуру проєкту, програма успішно компілюється та виконує базові сценарії.
- **«Добре» (Рівень 2):** виконано базовий рівень та реалізовано ключову функціональність заняття, забезпечено надійність і безпеку виконання коду.
- **«Відмінно» (Рівень 3):** повністю завершено всі три рівні завдання з дотриманням кращих інженерних практик, чистоти архітектури та оптимізації.
- **Усний захист:** обов'язкове пояснення логіки коду та впевнені відповіді на контрольні питання викладача.

## Вимоги до звітності

1. Опублікувати вихідний код у Git-репозиторії.
2. Оформити файл `README.md` з описом проєкту, інструкцією запуску та обов'язковими скриншотами роботи програми (включаючи демонстрацію відсутності помилок).
3. Продемонструвати роботу програми викладачеві та захистити результати.
