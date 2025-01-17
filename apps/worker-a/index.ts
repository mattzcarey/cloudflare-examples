import type WorkerB from '@examples/worker-b';
import { Hono } from 'hono';

const app = new Hono<{ Bindings: Env }>();

interface Env {
  WorkerB: Fetcher<WorkerB>;
}

app.get('/', (c) => c.text('Hello world from the Worker A!'));
app.get('/greet', async (c) => {
  return c.text(await c.env.WorkerB.greeting('Matt'));
});

export default app;
