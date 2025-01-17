import { DurableObject } from 'cloudflare:workers';

interface Env {
  ExampleDurableObject: DurableObjectNamespace<ExampleDurableObject>;
}

interface SomeState {
  currentlyConnectedWebSockets: number;
}

export class ExampleDurableObject extends DurableObject<Env> {
  static options = {
    // Hibernate the DO when it's not in use
    hibernate: true,
  };

  // create some internal state on the class
  state: SomeState = {
    currentlyConnectedWebSockets: 0,
  };

  async onStart() {
    // execute some sql
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS some_table (
        id TEXT PRIMARY KEY,
        some_key TEXT NOT NULL,
        some_value TEXT NOT NULL,
        timestamp INTEGER DEFAULT (unixepoch())
      );
    `);

    // you can also use object storage
    this.state = (await this.ctx.storage.get('state')) || this.state;
  }

  // requests via rpc are just functions
  async helloWorld(): Promise<string> {
    return 'hello world';
  }

  // websocket are better as fetch handlers?
  // https://developers.cloudflare.com/durable-objects/best-practices/websockets/
  async onConnection(request: Request): Promise<Response> {
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    this.ctx.acceptWebSocket(server);
    this.state.currentlyConnectedWebSockets += 1;

    server.addEventListener('message', (event: MessageEvent) => {
      server.send(
        `[Durable Object] currentlyConnectedWebSockets: ${this.state.currentlyConnectedWebSockets}. Message: ${event.data}`
      );
    });

    server.addEventListener('close', (cls: CloseEvent) => {
      this.state.currentlyConnectedWebSockets -= 1;
      server.close(cls.code, 'Durable Object is closing WebSocket');
    });

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }
}

// TODO: add hono router here.
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // assume the path is /durable-object/<id>/<endpoint>
    const path = url.pathname.split('/').filter(Boolean);

    if (path.length === 0) {
      return new Response('Hello from the worker durable-object');
    }

    const id = path[1] ?? env.ExampleDurableObject.newUniqueId();

    // /hello-world
    if (path.length === 3 && path[2] === 'hello-world') {
      const name = env.ExampleDurableObject.idFromName(id);
      const stub = env.ExampleDurableObject.get(name);
      const rpcResponse = await stub.helloWorld();

      return new Response(rpcResponse);
    }

    // websocket
    if (path.length === 3 && path[2] === 'websocket') {
      const name = env.ExampleDurableObject.idFromName(id);
      const stub = env.ExampleDurableObject.get(name);
      return await stub.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;
