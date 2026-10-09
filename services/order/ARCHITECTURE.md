# Order service architecture

This service uses a hexagonal architecture (also called "ports and adapters").

## Overview

```
  INPUT (who calls us)                                                    OUTPUT (what we call)
  infrastructure/http/                                                    infrastructure/

  ┌───────────────────┐      ┌──────────────── application/ ────────────────┐
  │ OrderController   │      │                                              │   ports/ (interfaces)      adapters (classes)
  │ ZodValidationPipe │ ───► │  PlaceOrder           GetOrder               │
  │ ErrorFilter       │      │                                              │ ─► OrderRepository ◄┄┄┄┄ InMemoryOrderRepository  (tests)
  │ toOrderResponse   │      │  OrderNotFoundError                          │                    ◄┄┄┄┄ PrismaOrderRepository    (prod)
  └───────────────────┘      │                                              │                                  │
     turns HTTP into         │     ┌────────────── domain/ ──────────────┐  │                                  ▼
     use case calls          │     │                                     │  │                             PostgreSQL
                             │     │  Order                              │  │                             database order_db
                             │     │    place()          ← create        │  │
                             │     │    reconstitute()   ← load          │  │ ─► Clock           ◄┄┄┄┄ SystemClock
                             │     │    confirm() cancel() ship()        │  │
                             │     │  OrderLine                          │  │ ─► IdGenerator     ◄┄┄┄┄ RandomIdGenerator
                             │     │  DomainError, EmptyOrderError,      │  │
                             │     │  InvalidQuantityError,              │  │
                             │     │  InvalidStatusTransitionError       │  │
                             │     └─────────────────────────────────────┘  │
                             └──────────────────────────────────────────────┘

  WIRING (composition root)
  main.ts              loadConfig() → createPrismaClient() → PrismaOrderRepository → OrderModule.register()
  order.module.ts      gets the repository, builds PlaceOrder and GetOrder, declares the controller and the error filter
```

**Legend**

| Symbol  | Meaning                                                           |
| ------- | ----------------------------------------------------------------- |
| `───►`  | "depends on" or "calls". These arrows always point to the center. |
| `◄┄┄┄┄` | "implements". An adapter implements a port with real technology.  |

**The main rule**: the domain knows nobody. The application only knows the domain and its own ports. The infrastructure knows everybody.

## Layers

| Layer             | Contains                                     | Can import    | Must never import                                        |
| ----------------- | -------------------------------------------- | ------------- | -------------------------------------------------------- |
| `domain/`         | entities, value objects, business rules      | its own files | any package, `application/`, `infrastructure/`           |
| `application/`    | use cases, ports (interfaces), their errors  | `domain/`     | `infrastructure/`, `@nestjs/*`, `@prisma/*`, `pg`, Kafka |
| `infrastructure/` | adapters: HTTP, database, clock, ids, config | everything    | nothing is forbidden, but no business rules here         |
| `main.ts`         | wiring and startup                           | everything    | no logic: it only connects the pieces                    |

### Files by layer

```
src/
├── domain/                          ← the core: business rules, no dependencies
│   ├── order.ts                       Order, OrderStatus, place(), reconstitute()
│   ├── order-line.ts                  OrderLine (immutable value object)
│   └── errors.ts                      DomainError and its subclasses
│
├── application/                     ← use cases and what they need
│   ├── place-order.ts                 PlaceOrder
│   ├── get-order.ts                   GetOrder
│   ├── errors.ts                      OrderNotFoundError
│   ├── ports/
│   │   ├── order-repository.ts        interface OrderRepository
│   │   ├── clock.ts                   interface Clock
│   │   └── id-generator.ts            interface IdGenerator
│   └── testing/fakes.ts               fakes for the use case tests
│
├── infrastructure/                  ← the technology
│   ├── config.ts                      loadConfig(): DATABASE_URL and PORT, checked with Zod
│   ├── system-clock.ts                SystemClock          implements Clock
│   ├── random-id-generator.ts         RandomIdGenerator    implements IdGenerator
│   ├── in-memory-order-repository.ts  InMemoryOrderRepository  implements OrderRepository
│   ├── persistence/
│   │   ├── prisma-client.ts           createPrismaClient()
│   │   ├── prisma-order-repository.ts PrismaOrderRepository  implements OrderRepository
│   │   └── generated/                 generated Prisma client (not in git)
│   └── http/
│       ├── order.module.ts            OrderModule.register({ orderRepository })
│       ├── order.controller.ts        POST /orders, GET /orders/:id
│       ├── zod-validation.pipe.ts     checks the shape of request bodies
│       ├── error.filter.ts            errors → HTTP status codes
│       └── order-presenter.ts         Order → JSON
│
└── main.ts                          ← wiring: picks PostgreSQL
```

Outside `src/`:

```
services/order/
├── prisma/
│   ├── schema.prisma                describes the tables
│   └── migrations/                  generated SQL, kept in git, applied in order
├── prisma.config.ts                 where to find the schema, the migrations and DATABASE_URL
├── .env                             local values (not in git)
└── .env.example                     template for .env (in git)
```

## Ports and adapters

| Port (`application/ports/`) | Test adapter                                                                  | Production adapter      |
| --------------------------- | ----------------------------------------------------------------------------- | ----------------------- |
| `OrderRepository`           | `FakeOrderRepository` (use case tests), `InMemoryOrderRepository` (API tests) | `PrismaOrderRepository` |
| `Clock`                     | `FixedClock`                                                                  | `SystemClock`           |
| `IdGenerator`               | `FixedIdGenerator`                                                            | `RandomIdGenerator`     |

Moving from in-memory storage to PostgreSQL needed **no change** in `application/`. The domain only got `reconstitute()`, to load an order from the database.

## Who picks the adapter?

The wiring code, and only the wiring code. The module does not pick: it **receives** the repository.

```ts
// main.ts: in production, PostgreSQL
OrderModule.register({ orderRepository: new PrismaOrderRepository(prisma) });

// order.api.test.ts: in API tests, memory (fast, no Docker)
OrderModule.register({ orderRepository: new InMemoryOrderRepository() });
```

## What happens on `POST /orders`

| #   | Where                                           | What happens                                                                                  |
| --- | ----------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 1   | `ZodValidationPipe` (infrastructure)            | checks the **shape** of the JSON. Wrong shape: `ZodError`, 400.                               |
| 2   | `OrderController.place()` (infrastructure)      | calls the use case. No business rules here.                                                   |
| 3   | `PlaceOrder.execute()` (application)            | builds the `OrderLine`s, asks `IdGenerator` for an id and `Clock` for a date.                 |
| 4   | `Order.place()` (domain)                        | applies the **rules**: at least one line, valid quantities. Status `PENDING`, total computed. |
| 5   | `OrderRepository.save()` (port)                 | the use case only knows the interface.                                                        |
| 6   | `PrismaOrderRepository.save()` (infrastructure) | in one transaction: `upsert` of the order and its lines.                                      |
| 7   | `toOrderResponse()` (infrastructure)            | turns the order into JSON, 201. On error, `ErrorFilter` picks 400 or 404.                     |

For `GET /orders/:id`, step 6 becomes `findById()`: Prisma reads `orders` and `order_lines`, then `Order.reconstitute()` rebuilds the order **without running the creation rules again**.

## Storage

### Tables (`order_db`)

```
orders                                   order_lines
┌──────────────┬─────────────┐           ┌──────────────────┬─────────┐
│ id           │ uuid  PK    │ ◄──────── │ order_id         │ uuid FK │  ON DELETE CASCADE
│ customer_id  │ text        │           │ position         │ int     │  PK (order_id, position)
│ status       │ OrderStatus │  (enum)   │ sku              │ text    │
│ placed_at    │ timestamptz │           │ quantity         │ int     │  CHECK (quantity > 0)
└──────────────┴─────────────┘           │ unit_price_cents │ int     │
                                         └──────────────────┴─────────┘
```

There is no total column: the total comes from the lines, and `Order` computes it.

### Domain ⇄ database mapping (in `PrismaOrderRepository`)

| Domain                            | Database                                              | Used in      |
| --------------------------------- | ----------------------------------------------------- | ------------ |
| `order.lines[i]`                  | an `order_lines` row with `position = i`              | `save()`     |
| a Prisma line row                 | `OrderLine.create({ sku, quantity, unitPriceCents })` | `findById()` |
| Prisma lines sorted by `position` | `Order.reconstitute({ …, status })`                   | `findById()` |
| `undefined` (order not found)     | `null` returned by Prisma                             | `findById()` |
| `order.totalCents`                | nothing, computed again                               | both         |

Types generated by Prisma **never** leave `infrastructure/persistence/`.

### One database per service

One PostgreSQL server (Docker Compose) hosts `order_db`, `stock_db` and `payment_db`. The order service only connects to `order_db`, through `DATABASE_URL`. It never reads the tables of another service.

## Safety nets

`pnpm lint` enforces the layer boundaries:

- in `domain/`, any import that does not start with `.` is refused, and so is any path to `application/` or `infrastructure/`;
- in `application/`, imports of `infrastructure/`, `generated/`, `@nestjs/*`, `@prisma/*`, `pg` and Kafka are refused;
- so the `application/` tests use fakes instead of real adapters.

`pnpm typecheck` checks the types (Vitest does not). `loadConfig()` stops the service at startup if `DATABASE_URL` is missing or invalid.

## Where does a new file go?

Ask these questions in order. The first "yes" gives the layer.

1. Is it a rule that would still be true if the shop ran on paper? → `domain/`
2. Is it the list of steps for something a user does? → `application/`
3. Does the use case need something from outside (storage, time, ids, email)? → an interface in `application/ports/`, and its adapter in `infrastructure/`
4. Does it name a technology (NestJS, Zod, Prisma, PostgreSQL, Kafka, `node:crypto`)? → `infrastructure/`
5. Does it connect pieces together? → `main.ts` or `order.module.ts`

## Useful commands

```bash
docker compose up -d                              # start PostgreSQL
pnpm --filter @hexashop/order dev                 # run the service (reads .env)
pnpm --filter @hexashop/order db:migrate          # create / apply migrations
pnpm --filter @hexashop/order db:generate         # generate the Prisma client again
pnpm typecheck && pnpm lint && pnpm test          # check everything (tests run in memory, no Docker)
```
