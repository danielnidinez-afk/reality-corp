# API SPECIFICATION (`apps/backend` & Supabase)
**Projekt:** REALITY CORP: THE AI WORLD TYCOON  
**Datum:** 11. November 2026  
**Basis-URL:** `/v1` (Node.js 24 + Fastify + Zod Validation)

---

## 1. Übergreifende API-Standards

1. **Authentifizierung:**
   - Alle geschützten Endpunkte erwarten `Authorization: Bearer <Supabase_JWT>`.
   - Das Backend validiert das JWT und erzeugt je Request einen **User-Scoped Supabase Client** (oder nutzt den Server-Admin-Client erst nach expliziter User-ID-Prüfung für autoritative State-Mutationen).
2. **Idempotenz:**
   - Alle mutierenden Endpunkte (`/sync/batch`, `/economy/purchase`, `/rewards/claim`, `/progression/prestige`) verlangen einen `X-Idempotency-Key: <UUIDv4>` Header oder pro Command im Batch.
   - Wiederholte Requests mit demselben Key geben das gespeicherte Ergebnis (`200 OK` mit `idempotentReplay: true`) zurück ohne erneute Ausführung.
3. **Eingabevalidierung:**
   - Jeder Request-Body und Query-Parameter wird mit zentralen **Zod-Schemas** aus `packages/shared-types` geprüft (`400 Bad Request` bei Schema-Verletzung).
4. **Rate Limiting:**
   - Pro User/IP standardmäßig max. **60 Requests/Minute** (ausgenommen `/sync/batch` mit max. 20/Min. und `/analytics/batch` mit max. 15/Min.).

---

## 2. Standard-Fehlerformat

```typescript
export interface ApiErrorResponse {
  error: {
    code:
      | 'VALIDATION_ERROR'
      | 'UNAUTHORIZED'
      | 'FORBIDDEN'
      | 'INSUFFICIENT_FUNDS'
      | 'CONFLICT_STATE_DIVERGENCE'
      | 'ALREADY_CLAIMED'
      | 'RATE_LIMITED'
      | 'INTERNAL_ERROR';
    message: string;
    retryable: boolean;
    canonicalState?: CanonicalWorldStateDTO; // Bei Sync-Konflikt mitgeliefert
  };
}
```

---

## 3. Kern-Endpunkte

### 3.1 Reality Sync & Offline Progress
#### `POST /v1/sync/batch`
Synchronisiert lokal ausgeführte Commands (aus Online- oder Offline-Phasen) und berechnet Offline-Fortschritt serverseitig nach.
- **Request:**
  ```json
  {
    "worldId": "apex-syndicate",
    "baseStateVersion": 42,
    "clientTimestampMs": 1794356400000,
    "commands": [
      {
        "idempotencyKey": "550e8400-e29b-41d4-a716-446655440000",
        "seq": 105,
        "type": "BUY_BUILDING_UPGRADE",
        "payload": { "buildingId": "garage_server", "count": 5 },
        "clientTimestampMs": 1794356380000
      }
    ]
  }
  ```
- **Server-Logik (inkl. Multi-Device-Divergenz-Schutz):**
  1. **Optimistic Concurrency Check:** Vergleicht `baseStateVersion` mit `player_world_states.state_version`. Bei Abweichung (z. B. Parallelspiel auf zwei Offline-Geräten) antwortet der Server sofort mit `409 CONFLICT_STATE_DIVERGENCE` und liefert `canonicalState` zur sauberen Client-Synchronisation.
  2. Prüft Zeitdelta $\Delta t = \text{serverNow} - \text{last\_server\_tick\_at}$ (begrenzt durch `MaxOfflineCap`, lehnt negative `clientTimestampMs` oder Zeitreisen ab).
  3. Wendet Offline-Fortschritt mit `@reality-corp/economy-engine` an.
  4. Spielt alle neuen `commands` (`seq > last_synced_seq`) deterministisch über `@reality-corp/game-engine` ab.
  5. Speichert neuen Zustand atomar (erhöht `state_version`) in `player_world_states` + `economy_transactions`.
- **Response (`200 OK`):**
  ```json
  {
    "canonicalState": { "...": "..." },
    "offlineGrant": { "elapsedSec": 1420, "cashEarned": { "m": 4.2, "e": 5 } },
    "rejectedCommands": [],
    "serverTimestampMs": 1794356401020
  }
  ```

---

### 3.2 Wirtschaft & Käufe (Direkte Online-Aktionen)
#### `POST /v1/economy/purchase`
- **Header:** `X-Idempotency-Key: <UUIDv4>`
- **Body:** `{ "worldId": "apex-syndicate", "targetType": "building" | "research" | "manager", "targetId": "gpu_cluster", "quantity": 1 | 10 | "max" }`
- **Validierung:** Prüft `idempotency_key`, Voraussetzungen (z. B. Research-DAG), verfügbare Mittel via BigVal und bucht atomar ab.

---

### 3.3 Progression, Prestige & Belohnungen
#### `POST /v1/progression/prestige`
- **Header:** `X-Idempotency-Key: <UUIDv4>`
- **Body:** `{ "worldId": "apex-syndicate", "expectedMinShares": { "m": 1.0, "e": 2 } }`
- **Server-Logik:** Berechnet `Equity Shares` aus serverseitigem `lifetime_earnings_jsonb`, setzt Gebäude/Cash der Welt zurück, erhöht `prestige_count` und schreibt `prestige_currency_jsonb` atomar gut.

#### `POST /v1/rewards/claim`
- **Header:** `X-Idempotency-Key: <UUIDv4>`
- **Body:** `{ "worldId": "apex-syndicate", "claimType": "mission" | "daily_challenge" | "achievement" | "event", "rewardId": "daily:2026-11-11:c_01" }`
- **Schutz gegen Doppelbelohnung:** Fügt `claim_key` in `reward_claims` (`UNIQUE(user_id, claim_key)`) ein. Existiert der Key bereits, antwortet der Server deterministisch mit `409 Conflict (ALREADY_CLAIMED)`.

---

### 3.4 Focus Timer
- **Offline vs. Ranked Boost Regel:** Lokal im Flugmodus läuft der Focus Timer als unboosteter Produktivitäts-Timer (kein Manipulationsrisiko). Ein **server-validierter Compute-Boost** erfordert zwingend den Start über `POST /v1/focus/start` bei aktiver Internetverbindung.

#### `POST /v1/focus/start`
- **Body:** `{ "worldId": "apex-syndicate", "targetDurationSec": 1500 }` (25 Min.)
- **Response:** `{ "sessionId": "<uuid>", "startedAt": "2026-11-11T01:00:00Z" }`

#### `POST /v1/focus/complete`
- **Body:** `{ "sessionId": "<uuid>" }`
- **Server-Logik:** Verifiziert atomar über bedingtes SQL-Update (`WHERE id = $1 AND user_id = $2 AND status = 'active'`), dass jede Session maximal einmal abgeschlossen wird (`409 ALREADY_CLAIMED` bei parallelen Requests), und prüft `(serverNow - started_at) >= target_duration_sec * 0.95` (5 % Toleranz für Uhrzeit-Jitter). Gewährt Fokus-Compute-Boost nur bei valider Mindestdauer; markiert Session als `completed`.

---

### 3.5 Profil, Guilds, Leaderboards & Events
| Methode & Pfad | Zweck | Zugriff / Schutz |
| :--- | :--- | :--- |
| `GET /v1/profile/me` | Eigenes Profil + freigeschaltete Welten laden | `authenticated` |
| `PATCH /v1/profile/me` | Username / aktive Welt wechseln | `authenticated` + Zod Length/Profanity Check |
| `DELETE /v1/profile/me` | DSGVO-Kontolöschung (`auth.users` Cascade) | `authenticated` + explizite Bestätigung |
| `GET /v1/leaderboards/:worldId` | Top-Spieler & eigener Rang (`?season=global&limit=50`) | `authenticated`; filtert `is_verified = true` |
| `POST /v1/guilds` | Neues Syndikat gründen (Phase-2 Feature-Flag) | `authenticated` + `X-Idempotency-Key` |
| `POST /v1/guilds/:id/join` | Syndikat beitreten (Phase-2; prüft `max_members` & 1-Guild-Limit) | `authenticated` |
| `POST /v1/guilds/:id/leave` | Syndikat verlassen (Phase-2) | `authenticated` |
| `GET /v1/events/active/:worldId` | Aktive globale Events & Multiplikatoren | Öffentlich / `authenticated` (gecached) |
| `POST /v1/analytics/batch` | Anonyme Telemetry-Events einliefern (max. 50 pro Batch) | `authenticated` + Payload-Größenlimit (64 KB) |

---

### 3.6 Admin Dashboard Endpunkte (`/v1/admin/*`)
Ausschließlich zugänglich für Nutzer mit `player_profiles.role === 'admin'` (doppelt geprüft über JWT-Claim + DB-Abfrage):
- `GET /v1/admin/anomalies` – Einsicht in `audit_anomaly_logs` & `shadow_flagged` Konten.
- `POST /v1/admin/users/:id/trust` – Verifizieren oder Sperren auffälliger Leaderboard-Profile.
- `POST /v1/admin/events` – Zeitgesteuerte Live-Events anlegen/deaktivieren (`game_events`).
- `GET /v1/admin/telemetry/summary` – Aggregierte Economy-Gesundheit (Sink/Source Ratios, Median TTNM).

