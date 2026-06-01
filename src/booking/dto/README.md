# Booking DTOs

Request/response shapes for the Booking module. All are validated by the global
`ValidationPipe` (`whitelist + forbidNonWhitelisted + transform`) and documented
with Swagger `@ApiProperty`.

## Requests
- **set-availability.dto.ts** — `SetAvailabilityDto { slots: AvailabilitySlotDto[] }`;
  each slot: `dayOfWeek` (0–6), `startTime`/`endTime` (`HH:mm`). Replaces the
  teacher's whole weekly schedule.
- **available-slots-query.dto.ts** — `AvailableSlotsQueryDto { from?, to? }`
  (ISO dates) for the slot lookup; also exports `AvailableSlotDto` (response item).
- **trial-book.dto.ts** — `TrialBookDto { teacherId, startDateTime }`.
- **paid-book.dto.ts** — `PaidBookDto { teacherId, startDateTime, numberOfSessions,
  frequency? }` and the `EBookingFrequency` enum (`weekly` | `daily`).
- **resolve-dispute.dto.ts** — `ResolveDisputeDto { action, note? }` and the
  `EDisputeAction` enum (`release` | `refund`) for the admin endpoint.

## Responses
- **availability-response.dto.ts** — `AvailabilityResponseDto.fromEntity(...)`.
- **session-response.dto.ts** — `SessionResponseDto.fromEntity(...)` (maps a
  `Session` entity to the API shape; `price` is coerced to a number).
