## Context

The help page (`src/help/help-page.tsx`) currently has 6 cards across 3 rows. The e2ee encryption layer (Argon2id + AES-256-GCM) is fully implemented but invisible to users. We want to add a "Šifrovanje" card so users can see that their data is encrypted and understand what algorithms protect it.

## Goals / Non-Goals

**Goals:**

- Add a "Šifrovanje" card listing the encryption algorithms (Argon2id, AES-256-GCM) and zero-knowledge property
- Reflow the help page grid to accommodate the new card without clutter
- Move "Licenca" from row 3 to row 4, paired with "Šifrovanje" as a 2-col row

**Non-Goals:**

- No changes to the encryption implementation itself
- No separate security policy page (this is just a help page section)
- No interactive elements — the card is informational only
- No external links in the Šifrovanje card (no canonical source to link to)

## Decisions

### Layout: 4 rows, 2-col row 3, 2-col row 4

Current layout:

```
Row 1 (full):  O projektu
Row 2 (2-col): Kako prijaviti problem | Zakonski propisi
Row 3 (3-col): Doprinesite | Autori | Licenca
```

New layout:

```
Row 1 (full):  O projektu
Row 2 (2-col): Kako prijaviti problem | Zakonski propisi
Row 3 (2-col): Doprinesite projektu | Autori
Row 4 (2-col): Licenca              | Šifrovanje
```

Rationale: The 3-col row was unbalanced with License alone in column 3. Moving License down to pair with the new crypto card creates visual symmetry. Row 3 becomes a natural 2-col with Contribute + Authors.

### Card icon: LuKeyRound

Chosen over alternatives:

- `LuLockKeyhole` — implies a lock/unlock action, not a static info card
- `LuShieldCheck` — too similar to `LuShield` already used for License
- `LuKeyRound` — represents the cryptographic key concept cleanly, not used elsewhere

### Content: algorithm names + zero-knowledge statement

Sr-Latn (source):

> Vaši podaci su end-to-end šifrovani. Ključ za šifrovanje se izvodi iz vaše lozinke koristeći **Argon2id** algoritam, a svi podaci se šifruju **AES-256-GCM** algoritmom. Server nikada ne vidi vaše podatke u čitljivom obliku.

This names the two key algorithms (specific enough for the curious), explains the flow (password → Argon2id → key, data → AES-256-GCM), and states the zero-knowledge property. No parameter details (memory size, iterations, IV/tag sizes) — those belong in code/docs, not a user-facing help card.

### Styling: follow existing card patterns

The new card follows the exact same `Card.Header + Card.Content` pattern with `text-sm/relaxed text-muted` body. No new CSS or component variants needed.

## Risks / Trade-offs

- **Translation fidelity**: Algorithm names (Argon2id, AES-256-GCM) are proper nouns — they stay untranslated across locales. The surrounding explanatory text must be translated for `sr-Latn`, `en`, `ru`.
- **No link for verification**: Unlike other cards (GitHub links for issues/repo/license), there's no external URL to back up the security claims. Mitigation: the source code is open (linked in "Doprinesite" card), so technically-inclined users can verify.
