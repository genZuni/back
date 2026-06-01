# Wallet Module

Manual-recharge wallet for the online class platform. Users top up their wallet
by transferring money to a fixed bank card; an admin verifies the transfer and
approves it, which credits the balance. The balance is then spent on classes.

> This is the **manual bank-card** flow. The online Zarinpal gateway flow lives
> separately in `src/order/` (its own `WalletController` at `PATCH /wallet/:amount`).
> Both reuse the shared `TransactionEntity` (`src/entity/transaction.entity.ts`).

## Files

| File | Responsibility |
| --- | --- |
| `wallet.module.ts` | Wires the entities, controllers and service. Exports `WalletService` so other modules (e.g. enrolment/checkout) can call `deductBalance()`. |
| `wallet.service.ts` | All business logic. Balance-changing operations use a TypeORM `QueryRunner` transaction with a pessimistic write lock (`SELECT ... FOR UPDATE`) for atomicity. |
| `wallet.controller.ts` | User-facing endpoints under `/wallet` (JWT protected). |
| `admin-wallet.controller.ts` | Admin endpoints under `/admin` (`JwtAuthGuard` + `RolesGuard`, `@Roles('admin')`). |
| `dto/` | Request/response DTOs with `class-validator` + Swagger decorators. |

## Endpoints

> The app sets a global prefix of `/:lang`, so real paths are e.g.
> `/english/wallet/recharge`.

### User (`/wallet`, requires JWT)
- `POST /wallet/recharge` — create a pending recharge, returns the bank card number.
- `PATCH /wallet/recharge/:id/confirm` — mark a pending recharge as paid.
- `GET /wallet/transactions?page=&limit=` — paginated list of own transactions.
- `GET /wallet/summary` — balance, total recharged, total spent.

### Admin (`/admin`, requires JWT + `admin` role)
- `GET /admin/transactions/pending` — pending transactions the user has confirmed.
- `POST /admin/transactions/:id/approve` — approve and apply balance change.
- `POST /admin/transactions/:id/reject` — reject, no balance change.
- `POST /admin/wallet/deduct` — debit a user's wallet for a class (testing).

## Data model notes

- **DB is MySQL** (`synchronize: false`, `autoLoadEntities: true`). New columns
  on `Transaction` and the new `wallet` table require a migration / manual DDL —
  they will **not** be auto-created.
- **`User.id` is a UUID string**, so `userId`/`approvedBy` are strings.
- The shared `TransactionEntity` uses internal enums; the API exposes friendly
  values via `TransactionResponseDto`:

  | Internal (`ETransaction` / `ETransactionStatus`) | API value |
  | --- | --- |
  | `INCOME` | `recharge` |
  | `PAYMENT` / `OUTCOME` | `payment` |
  | `WAITING` | `pending` |
  | `ACCEPTED` | `approved` |
  | `FAIL` | `rejected` |

## Transaction lifecycle

```
recharge: WAITING --(user confirms)--> WAITING + userConfirmed
                  --(admin approve)--> ACCEPTED (+balance)
                  --(admin reject)---> FAIL     (no change)
payment : created already ACCEPTED by deductBalance() (-balance, atomic)
```

## Configuration

- `BANK_CARD_NUMBER` — destination card number returned on recharge requests.
  Falls back to a placeholder if unset.

## Auto-creating a wallet on signup

`deductBalance`/`adminApproveTransaction` lazily create a wallet if one is
missing, but you should also create it eagerly when a user is created. The user
is persisted in `UsersService.create()` (called from `AuthService.AcceptSignUp`).
Add to that service:

```ts
// constructor: inject the wallet repository
@InjectRepository(Wallet)
private readonly walletRepository: Repository<Wallet>,

// right after the user is saved:
await this.walletRepository.save(
  this.walletRepository.create({ userId: user.id, balance: 0 }),
);
```

And register the entity in the owning module:

```ts
TypeOrmModule.forFeature([User, Wallet /* , ... */]),
```

## Notes

- MySQL returns `decimal` columns as strings; the service wraps them in
  `Number(...)` before arithmetic and exposes numbers in responses.
- `User` already has a legacy `balance` column; this module treats the new
  `wallet.balance` as the source of truth and does not touch `user.balance`.
