# Cloudflare Worker and Durable Object Monorepo Examples

> typesafe and fun

## Examples

### Durable Object

- [x] State persistence
- [x] SQLite database
- [x] Object storage
- [x] WebSocket connection
- [x] Request/Response with rpc

### Worker to Worker

- [x] worker A server using `hono`
- [x] rpc communication with worker B
- [x] worker B uses worker entrypoint

### Cyclical Worker

- [x] worker entrypoint
- [x] spawn the same worker recursively
- [x] make a bunch of outgoing connections in parallel

### TODO: Cyclical Worker to Worker

- [ ] might be an antipattern. Deployment is a pain and will probs need be in two stages. You get an error deploying a worker with a non existent binding.

## Mini hacks and bugs

Setting the ports for the workers in the dev scripts allows you to run all the workers locally with `npm run dev`.

---

Thanks to @threepointone for all the help getting setup.
