const SERVICE_NAME = /^[a-z][a-z0-9._:-]{0,63}$/i;

export interface IServiceRegistryOptions {
  allowReplace?: boolean;
}

/**
 * Named services with an explicit duplicate guard. Replace is opt-in so a
 * module cannot silently shadow another service.
 */
export class ServiceRegistry {
  private readonly services = new Map<string, unknown>();
  private readonly allowReplace: boolean;

  constructor({ allowReplace = false }: IServiceRegistryOptions = {}) {
    this.allowReplace = allowReplace;
  }

  register<T>(name: string, service: T): void {
    if (typeof name !== 'string' || !SERVICE_NAME.test(name)) {
      throw new TypeError(`Invalid service name: ${String(name)}`);
    }
    if (service === undefined || service === null) {
      throw new TypeError(`Service ${name} must not be null or undefined`);
    }
    if (this.services.has(name) && !this.allowReplace) {
      throw new Error(`Service already registered: ${name}`);
    }
    this.services.set(name, service);
  }

  get<T>(name: string): T | undefined {
    return this.services.get(name) as T | undefined;
  }

  getRequired<T>(name: string): T {
    const service = this.get<T>(name);
    if (service === undefined) throw new Error(`Service is not registered: ${name}`);
    return service;
  }

  has(name: string): boolean {
    return this.services.has(name);
  }

  unregister(name: string): boolean {
    return this.services.delete(name);
  }

  names(): string[] {
    return [...this.services.keys()];
  }

  clear(): void {
    this.services.clear();
  }
}
