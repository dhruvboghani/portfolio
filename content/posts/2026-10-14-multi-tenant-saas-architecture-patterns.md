---
title: Multi-tenant SaaS architecture patterns explained
description: Multi-tenant SaaS patterns compared: shared schema, schema per tenant and database per tenant, plus isolation, security, scaling and noisy neighbours.
date: 2026-10-14
tags: saas, architecture, databases
---
A multi-tenant SaaS application serves many customers, called tenants, from one product. The architecture decides how their data is separated, how safely they are isolated from each other and how much it costs to run each one.

There is no single correct pattern. The right choice depends on your customers, compliance needs and team size, and many products end up mixing patterns.

## The three main data patterns

**Shared database, shared schema.** All tenants live in the same tables, and every row carries a `tenant_id`.

- Cheapest to run and simplest to deploy: one schema, one migration.
- Scales to a very large number of small tenants.
- Isolation depends entirely on your code and database rules. One missing filter can expose another tenant's data.
- Per-tenant backup, restore and data export take more effort.

**Shared database, schema per tenant.** Each tenant gets its own schema inside one database.

- Stronger logical separation; a query runs against one tenant's schema.
- Per-tenant restore and export are easier.
- Migrations must run across every schema, which gets slow and risky as tenant count grows.
- Many databases struggle with very large numbers of schemas and tables.

**Database per tenant.** Each tenant has a separate database, sometimes on separate servers.

- Strongest isolation, and the easiest to explain to enterprise and regulated customers.
- Per-tenant scaling, backups, encryption keys and data residency are straightforward.
- Highest cost and operational effort: connections, monitoring and migrations multiply with each tenant.

A common approach is **hybrid**: small tenants share a pooled database, while large or regulated tenants get dedicated databases. Your application then needs a tenant directory that records where each tenant's data lives.

## Enforcing isolation in a shared schema

If tenants share tables, isolation must be enforced in more than one place.

- **Resolve the tenant once**, from the subdomain, a token claim or an API key, at the edge of the request.
- **Carry it in request context**, not as a parameter each developer must remember to pass.
- **Scope queries automatically** with a repository layer or ORM manager that always adds the tenant filter.
- **Add database-level protection.** PostgreSQL row-level security can enforce the tenant filter even if application code forgets it.

```sql
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON invoices
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- per request, inside a transaction
SET LOCAL app.tenant_id = '4f1c...';
```

- **Include `tenant_id` in indexes and unique constraints**, for example a unique invoice number per tenant rather than globally.
- **Test for leaks:** write automated tests that sign in as one tenant and try to read another tenant's records.

## Beyond the database

Tenancy touches every layer, not only tables.

- **Caches:** prefix every cache key with the tenant id, or one tenant can see another's cached data.
- **File storage:** use tenant-specific prefixes or buckets in S3 or MinIO, with access policies that match.
- **Background jobs and queues:** every job must carry its tenant id and restore the tenant context before running.
- **Search and vector indexes:** filter by tenant on every query. For AI features, never let retrieval mix documents across tenants.
- **Logs and metrics:** tag them with tenant id so you can debug one customer without reading everyone's data.
- **Configuration:** store feature flags, plans and limits per tenant instead of branching code per customer.

## Noisy neighbours and scaling

In shared infrastructure, one busy tenant can slow down everyone else.

- **Rate limit per tenant** at the API gateway, not only globally.
- **Set quotas** on storage, jobs and expensive operations such as AI calls.
- **Use fair queues** so one tenant's bulk import does not block other tenants' jobs.
- **Watch per-tenant usage** and move a tenant that outgrows the pool to dedicated resources.

## Identity and access

Users usually belong to a tenant, and sometimes to several.

- Put the tenant id in the authentication token and verify it on every request.
- Apply role-based access control inside each tenant, for example admin, manager and viewer.
- Support enterprise single sign-on per tenant when larger customers need it.
- Log administrative actions per tenant for audits.

## How to choose

- Many small customers and a lean team: start with a **shared schema** and strong automatic tenant scoping.
- Customers who need clear separation, easy restores and moderate tenant counts: consider **schema per tenant**.
- Enterprise or regulated customers, data residency or custom encryption: offer **database per tenant**, often as a premium tier.

Whichever you start with, keep the tenant lookup in one place, so moving a tenant to a different storage pattern later is a data migration rather than a rewrite.

## Takeaway

Multi-tenancy is a trade-off between cost, isolation and operational effort. Choose a data pattern that fits your customers, enforce the tenant boundary in code and in the database, carry tenant context through caches, files, jobs and AI retrieval, and plan from day one for the large tenant that will eventually need its own resources.
