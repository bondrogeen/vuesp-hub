import VuespStruct from 'vuesp-struct';

export interface IProtocolField {
  name: string;
  type: string;
  dimensions?: number[];
}

export interface IProtocolDefinition {
  protocolVersion?: number;
  enums: TProtocolEnums;
  structs: Record<string, IProtocolField[]>;
}

export const SUPPORTED_PROTOCOL_VERSION = 2;

export type TProtocolEnums = Record<string, Record<string, number>>;

export interface IProtocolMessage {
  key: string;
  object: Record<string, unknown>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNumberRecord = (value: unknown): value is Record<string, number> =>
  isRecord(value) && Object.values(value).every(item => typeof item === 'number' && Number.isSafeInteger(item));

const isDimensions = (value: unknown): value is number[] =>
  Array.isArray(value) && value.every(item => Number.isSafeInteger(item) && item > 0);

const isProtocolField = (value: unknown): value is IProtocolField =>
  isRecord(value) &&
  typeof value.name === 'string' &&
  value.name.length > 0 &&
  typeof value.type === 'string' &&
  value.type.length > 0 &&
  (value.dimensions === undefined || isDimensions(value.dimensions));

export const parseProtocolDefinition = (value: unknown): IProtocolDefinition => {
  if (!isRecord(value)) throw new TypeError('Device protocol definition must be an object');
  const protocolVersion = value.protocolVersion ?? value.protocol;
  if (protocolVersion !== undefined && protocolVersion !== SUPPORTED_PROTOCOL_VERSION) {
    throw new TypeError(`Unsupported device protocol version: ${String(protocolVersion)}`);
  }
  if (!isRecord(value.enums)) throw new TypeError('Device protocol enums must be an object');
  if (!isRecord(value.structs)) throw new TypeError('Device protocol structs must be an object');

  const enums: TProtocolEnums = {};
  for (const [group, members] of Object.entries(value.enums)) {
    if (!isNumberRecord(members)) throw new TypeError(`Device protocol enum ${group} is invalid`);
    enums[group] = members;
  }
  if (!enums.KEY) throw new TypeError('Device protocol KEY enum is required');

  const structs: Record<string, IProtocolField[]> = {};
  for (const [name, entry] of Object.entries(value.structs)) {
    // Accept both the compact list (`Name: [fields]`) and the full
    // `parseProtocol` shape (`Name: { size, fields }`).
    const fields = Array.isArray(entry)
      ? entry
      : isRecord(entry) && Array.isArray(entry.fields)
        ? entry.fields
        : null;
    if (!fields || !fields.every(isProtocolField)) {
      throw new TypeError(`Device protocol struct ${name} is invalid`);
    }
    structs[name] = fields;
  }

  return { ...(protocolVersion === undefined ? {} : { protocolVersion: SUPPORTED_PROTOCOL_VERSION }), enums, structs };
};

export class DeviceProtocol {
  readonly #codec: VuespStruct;
  #enums: TProtocolEnums = {};
  #names = new Map<number, string>();

  constructor(codec = new VuespStruct()) {
    this.#codec = codec;
  }

  get enums(): TProtocolEnums {
    return this.#enums;
  }

  initialize(definition: unknown): void {
    const parsed = parseProtocolDefinition(definition);
    this.#codec.init(parsed);
    this.#enums = parsed.enums;
    this.#names = new Map(
      Object.entries(parsed.enums.KEY).map(([name, index]) => [index, name]),
    );
  }

  encode(command: string | number, data?: Record<string, unknown>): ArrayBuffer | null | false {
    return this.#codec.set(command, data);
  }

  decode(frame: ArrayBuffer): IProtocolMessage | null {
    const message = this.#codec.get(frame);
    if (!message) return null;
    const key = this.#names.get(message.key);
    return key ? { key, object: message.object } : null;
  }
}
