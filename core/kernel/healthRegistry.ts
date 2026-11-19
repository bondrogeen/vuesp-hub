import type {
  ICoreHealthSnapshot,
  IServiceHealth,
  TCoreHealthStatus,
} from './types.ts';

export class HealthRegistry {
  private status: TCoreHealthStatus = 'starting';
  private reason: string | undefined;
  private readonly startedAt = Date.now();
  private updatedAt = this.startedAt;
  private readonly services = new Map<string, IServiceHealth>();

  setStatus(status: TCoreHealthStatus, reason?: string): void {
    this.status = status;
    this.reason = reason;
    this.updatedAt = Date.now();
  }

  markDegraded(reason: string): void {
    this.reason = reason;
    this.updatedAt = Date.now();
    if (this.status === 'ready' || this.status === 'starting') this.status = 'degraded';
  }

  setService(name: string, status: TCoreHealthStatus, message?: string): void {
    if (!name) throw new TypeError('Service name is required');
    this.services.set(name, { status, ...(message ? { message } : {}), updatedAt: Date.now() });
    this.updatedAt = Date.now();
    if (status === 'error' || status === 'degraded') {
      this.markDegraded(message ?? `Service ${name} is ${status}`);
    }
  }

  removeService(name: string): void {
    if (this.services.delete(name)) this.updatedAt = Date.now();
  }

  snapshot(): ICoreHealthSnapshot {
    const services: Record<string, IServiceHealth> = {};
    for (const [name, health] of this.services) services[name] = { ...health };

    let status = this.status;
    if (status === 'ready' && Object.values(services).some(item => item.status !== 'ready')) {
      status = 'degraded';
    }

    return {
      status,
      startedAt: this.startedAt,
      updatedAt: this.updatedAt,
      services,
      ...(this.reason ? { reason: this.reason } : {}),
    };
  }
}
