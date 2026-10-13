# Concepts

Status: DRAFT (2026-10-13), written from the user's own statements and the project GDD; nothing here is new design. Where something is not known it is listed as an OPEN QUESTION, never filled in.

This folder is the place for the ideas the project is built on. It answers "what is this for and what do we call things". `docs/crystallizers/` answers "how was crystallizer N built". If a concept changes, it changes HERE first and the crystallizer READMEs follow.

## The project in one paragraph (user, 2026-10-13)

The work concentrates on solving the CREATION MECHANISMS: **Semantic Macroform**, **Semantic Landmark** and **Numeric World**. A crystallizer is an example of how to give geometry to what a mechanism produces; on its own it is useless, because it only makes sense against a SCOPE, and the scope is usually graphic or visual. If the scope were "a combat scenario in a castle, 2D-HD", we would go to the HD-2D crystallizer and adjust it from there. The crystallizers are the base geometry; after that the result is handed to Unity to be implemented. Each game or scenario is created, modelled, and then goes to Unity pre-generated or pre-proc-gen.

```
 SCOPE (usually visual)  ------------------------------+
                                                         v
 SEMANTIC PASS  -->  NUMERIC WORLD  -->  CRYSTALLIZER (geometry)  -->  UNITY (implementation)
 (rules)             (the fields)         chosen by the scope          pre-generated / pre-proc-gen
```

## Files

| File | What it holds |
|---|---|
| [01-creation-mechanisms.md](01-creation-mechanisms.md) | The three mechanisms, their core example and where each stands |
| [02-semantic-pass.md](02-semantic-pass.md) | How a semantic statement becomes rules on the numeric world (the part that is NOT yet well expressed) |
| [03-crystallizers.md](03-crystallizers.md) | What a crystallizer is, scope to crystallizer, the default camera of each |
| [04-handoff-to-unity.md](04-handoff-to-unity.md) | What goes to Unity and how |
| [05-decisions-to-revisit.md](05-decisions-to-revisit.md) | Decisions taken to simplify, to review when every crystallizer is finished |

Add a file here for every new concept; keep each one short and keep the open questions at the end.

## Sources used

- The user's statements in the sessions of 2026-10-12 and 2026-10-13 (tagged "user").
- `EvoDun_Semantic_Landscape_GDD_v0.2` (tagged "GDD", with the section number).
- The repo (tagged "repo"): `CLAUDE.md`, `docs/crystallizers/`.
