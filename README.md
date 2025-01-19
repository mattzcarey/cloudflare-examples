# Cloudflare Worker and Durable Object Monorepo Examples

> typesafe and fun

## Examples

### Durable Object

- [x] State persistence
- [x] SQLite database
- [x] Object storage
- [x] WebSocket connection
- [x] Request/Response with rpc

### Worker A

- [x] server using `hono`
- [x] rpc communication with Worker B

### Worker B

- [x] worker entrypoint

### Cyclical Worker

- [x] worker entrypoint
- [x] spawn the same worker recursively
- [x] make a bunch of outgoing connections in parallel

## Mini hacks and bugs

Setting the ports for the workers in the dev scripts allows you to run all the workers locally with `npm run dev`.

---

Thanks to @threepointone for all the help getting setup.
