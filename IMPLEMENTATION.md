# Governed citizen-service workflow

The `/api/governed-service` boundary is the supported narrow workflow. An authenticated user creates a tenant, registers checksummed knowledge sources, submits content for injection screening and independent review, and requests deterministic evidence retrieval. No evidence produces an escalation—not an invented answer. Tool actions are allow-listed and stop at `approved_for_dispatch`; a real ticketing adapter must dispatch them and record its provider reference.

Run `scripts/bootstrap.sh` once, configure `.env`, run `scripts/migrate.sh`, then use `start.sh`. Startup never installs, migrates, seeds, creates databases, or kills ports. `scripts/seed-demo.sh` is guarded.

External identity/content/ticketing/channel/model adapters, accessibility testing with users, and production security review remain deployment work. Generated `gap-*` routes are retained as source history but are no longer mounted.
