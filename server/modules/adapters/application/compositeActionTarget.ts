import type { IActionTarget, ICommandExecution } from '@core/application/actionService.ts';
import type { AdapterManager } from '@server/modules/adapters/application/adapterManager.ts';

/** Routes Vuesp entities to the device runtime and everything else to adapters. */
export class CompositeActionTarget implements IActionTarget {
  constructor(
    private readonly vuesp: IActionTarget,
    private readonly adapters: AdapterManager,
  ) {}

  async execute(request: { requestId: string; deviceId: string; entityKey: string; value: unknown }): Promise<ICommandExecution> {
    const result = await this.vuesp.execute(request);
    if (!result.error || result.error.code !== 'not_found') return result;
    const adapter = await this.adapters.execute(request.deviceId, request.entityKey, request.value, request.requestId);
    if (adapter.ok) return { commands: [{ comm: 'ADAPTER', ok: true }] };
    return { commands: [], error: { code: 'transport', message: adapter.error ?? 'Adapter rejected the command', at: Date.now() } };
  }
}
