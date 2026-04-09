# Security policy

## Supported versions

Maintenance is best-effort for the `main` branch in [rsasaki0109/mdchat-space](https://github.com/rsasaki0109/mdchat-space).

## Reporting a vulnerability

Please open a **private** security advisory on GitHub or email the repository owner with:

- A short description of the impact
- Steps to reproduce (safe, minimal)
- Any relevant version or deployment context (without secrets)

Do not post exploit details in public issues.

## Hardening notes

- Optional write protection: set `MDCHAT_API_WRITE_KEY` and send the same value in the `X-API-Key` header for `POST` / `PATCH` / `DELETE` on `/posts`. Point the browser UI at the matching `NEXT_PUBLIC_MDCHAT_WRITE_KEY` if you use the stock Next.js client.
- Keep PostgreSQL and the API off the public internet unless you add TLS and authentication appropriate to your threat model.
