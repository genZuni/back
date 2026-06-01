# Wallet DTOs

Data Transfer Objects for the Wallet module. Request DTOs are validated by the
global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform` — see
`src/main.ts`) via `class-validator`. All DTOs carry Swagger (`@ApiProperty`)
metadata for the generated OpenAPI docs at `/api`.

## Request DTOs
| DTO | Used by | Fields |
| --- | --- | --- |
| `RechargeRequestDto` | `POST /wallet/recharge` | `amount` (positive, <=2 decimals) |
| `ConfirmPaymentDto` | confirm flow (body variant) | `transactionId` (positive int) |
| `AdminApproveDto` | approve / reject | `adminNote?` (string <=500) |
| `DeductBalanceDto` | `POST /admin/wallet/deduct` | `userId` (uuid), `amount`, `classId` |

## Response DTOs
| DTO | Shape |
| --- | --- |
| `TransactionResponseDto` | A single transaction. `fromEntity()` maps a `TransactionEntity` -> DTO, coerces the decimal `amount` to a number, and maps the internal enums to friendly API values (`recharge`/`payment`, `pending`/`approved`/`rejected`). |
| `WalletBalanceDto` | `balance`, `totalRecharged`, `totalSpent`. |
| `PaginatedTransactionsDto` | `data[]`, `total`, `page`, `limit`, `totalPages`. |

> Note: the confirm endpoint takes the transaction id from the URL
> (`PATCH /wallet/recharge/:id/confirm`) via `ParseIntPipe`. `ConfirmPaymentDto`
> is provided for body-based clients/reuse but the route itself uses the param.
