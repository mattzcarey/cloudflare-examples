import { WorkerEntrypoint } from 'cloudflare:workers';

interface Env {
  CyclicalWorker: Fetcher<CyclicalWorker>;
}

// representative of steps in a AI workflow
const MAX_DEPTH = 10;
// representative of tool calls in a AI workflow
const MAX_CONNECTIONS = 20;

export default class CyclicalWorker extends WorkerEntrypoint<Env> {
  async fetch(request: Request) {
    const results = await this.spawnWorkers(0);
    return new Response(JSON.stringify(results, null, 2));
  }

  async spawnWorkers(currentDepth: number): Promise<Record<number, number>> {
    console.log(`Testing at depth: ${currentDepth}`);

    if (currentDepth >= MAX_DEPTH) {
      return {};
    }

    const connectionCount = await this.testMaxConnections();
    const results: Record<number, number> = {
      [currentDepth]: connectionCount,
    };

    try {
      const nextResults = await this.env.CyclicalWorker.spawnWorkers(currentDepth + 1);
      return { ...results, ...nextResults };
    } catch (error) {
      console.error(`Failed to spawn at depth ${currentDepth}:`, error);
      return results;
    }
  }

  private async testMaxConnections(): Promise<number> {
    let connections = 0;
    const BATCH_SIZE = 5; // Test connections in batches

    try {
      while (connections < MAX_CONNECTIONS) {
        const batch = Array(BATCH_SIZE)
          .fill(0)
          .map(() =>
            fetch('https://example.com')
              .then(() => true)
              .catch(() => false)
          );

        const results = await Promise.all(batch);
        const successfulConnections = results.filter(Boolean).length;

        if (successfulConnections < BATCH_SIZE) {
          return connections + successfulConnections;
        }

        connections += successfulConnections;
      }
    } catch (error) {
      console.log(`Max connections reached: ${connections}`);
    }

    return connections;
  }
}
