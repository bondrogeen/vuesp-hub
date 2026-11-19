import type { DeviceRuntime } from '@core/application/deviceRuntime.ts';
import type { IActionTarget, ICommandExecution } from '@core/application/actionService.ts';
import type { IDeviceConnectionRecord } from '@root/shared/device.ts';
import type { IDashboardItem } from 'vuesp-dashboard-core';
import { buildTileCommands } from '@root/shared/dashboardTiles.ts';
import { normalizeState } from '@server/modules/devices/application/vuespObjectAdapter.ts';
import { errorMessage } from '@root/shared/errors.ts';

interface IListEntry {
  uuid?: string;
  ip: string;
  list?: unknown[];
  enums?: Record<string, Record<string, number>>;
}

export class VuespActionTarget implements IActionTarget {
  constructor(private readonly runtime: DeviceRuntime<IDeviceConnectionRecord>) {}

  async execute({ deviceId, entityKey, value }: { deviceId: string; entityKey: string; value: unknown }): Promise<ICommandExecution> {
    try {
      const entry = (this.runtime.getList() as IListEntry[]).find(item => item.uuid === deviceId);
      if (!entry) return { commands: [], error: { code: 'not_found', message: 'Device is not connected', at: Date.now() } };
      const tile = (entry.list ?? []).find(item => {
        return Boolean(item && typeof item === 'object' && (item as { id?: unknown }).id === entityKey);
      }) as IDashboardItem | undefined;
      if (!tile) return { commands: [], error: { code: 'not_found', message: 'Tile is not available', at: Date.now() } };

      const state = normalizeState(this.runtime.getState(entry.ip) ?? {});
      const commands = buildTileCommands(tile, value, state, entry.enums);
      if (!commands.length) return { commands: [], error: { code: 'no_commands', message: 'Tile has no command expression', at: Date.now() } };

      const results = commands.map(command => {
        const ok = this.runtime.send(entry.ip, command.comm, command.data);
        return { comm: command.comm, ok, ...(ok ? {} : { error: 'Transport rejected the command' }) };
      });
      const failed = results.find(result => !result.ok);
      return {
        commands: results,
        ...(failed ? { error: { code: 'transport', message: failed.error ?? 'Transport rejected the command', at: Date.now() } } : {}),
      };
    } catch (error) {
      return {
        commands: [],
        error: { code: 'transport', message: errorMessage(error), at: Date.now() },
      };
    }
  }
}
