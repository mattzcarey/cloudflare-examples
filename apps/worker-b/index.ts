import { WorkerEntrypoint } from 'cloudflare:workers';

export default class WorkerB extends WorkerEntrypoint {
  async fetch(request: Request) {
    return new Response('Hello world from the fetch handler at WorkerB');
  }

  async greeting(name: string): Promise<string> {
    return `Hello ${name} from greeting at WorkerB`;
  }
}
