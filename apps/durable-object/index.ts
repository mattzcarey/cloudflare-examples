import { DurableObject } from 'cloudflare:workers';
import { Hono } from 'hono';

interface Env {
  ExampleDurableObject: DurableObjectNamespace<ExampleDurableObject>;
}

interface SomeState {
  someKey?: string;
}

export class ExampleDurableObject extends DurableObject<Env> {
  static options = {
    // Hibernate the DO when it's not in use
    hibernate: true,
  };

  // create some internal state on the class
  internalState: SomeState = {
    someKey: 'someValue',
  };

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);

    // execute some sql
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS some_table (
        id TEXT PRIMARY KEY,
        some_key TEXT NOT NULL,
        some_value TEXT NOT NULL,
        timestamp INTEGER DEFAULT (unixepoch())
      );
    `);
  }

  // you can also use some object storage to store state
  async getState() {
    this.internalState = (await this.ctx.storage.get('state')) || this.internalState;
  }

  // requests via rpc are just functions
  async helloWorld(): Promise<string> {
    return `hello world from the durable object. id: ${this.ctx.id.toString()}`;
  }

  // websocket are better as fetch handlers?
  // https://developers.cloudflare.com/durable-objects/best-practices/websockets/
  async fetch(request: Request): Promise<Response> {
    // Creates two ends of a WebSocket connection.
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    this.ctx.acceptWebSocket(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async webSocketMessage(ws: WebSocket, message: ArrayBuffer | string) {
    ws.send(
      `[Durable Object] message: ${message}, connections: ${this.ctx.getWebSockets().length}`
    );
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
    ws.close(code, 'Durable Object is closing WebSocket');
  }
}

const app = new Hono<{ Bindings: Env }>();

app.get('/', (c) => c.text('Hello from the durable object worker'));

app.get('/do/new', async (c) => {
  const doId = c.env.ExampleDurableObject.newUniqueId();
  return new Response(doId.toString());
});

app.get('/do/:id/hello', async (c) => {
  const doId = c.env.ExampleDurableObject.idFromString(c.req.param('id'));
  const stub = c.env.ExampleDurableObject.get(doId);
  const rpcResponse = await stub.helloWorld();

  return new Response(rpcResponse);
});

app.get('/do/:id/websocket', async (c) => {
  const doId = c.env.ExampleDurableObject.idFromString(c.req.param('id'));
  const stub = c.env.ExampleDurableObject.get(doId);
  return await stub.fetch(c.req.raw);
});

export default app;
