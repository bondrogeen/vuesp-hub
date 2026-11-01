import VuespStruct from 'vuesp-struct';

export interface LegacyProtocolField {
  type: string;
  name: string;
  length?: number;
  byteOffset?: number;
}

export interface LegacyProtocolDefinition {
  keys?: string[];
  structs?: Record<string, LegacyProtocolField[]>;
}

export interface LegacyProtocolMessage {
  key: string;
  object: Record<string, unknown>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isProtocolField = (value: unknown): value is LegacyProtocolField =>
  isRecord(value) &&
  typeof value.type === 'string' &&
  typeof value.name === 'string' &&
  (value.length === undefined || (Number.isSafeInteger(value.length) && Number(value.length) > 0)) &&
  (value.byteOffset === undefined || (Number.isSafeInteger(value.byteOffset) && Number(value.byteOffset) >= 0));

const parseProtocolDefinition = (value: unknown): LegacyProtocolDefinition => {
  if (!isRecord(value)) throw new TypeError('Legacy protocol definition must be an object');
  if (value.keys !== undefined && (!Array.isArray(value.keys) || !value.keys.every(key => typeof key === 'string'))) {
    throw new TypeError('Legacy protocol keys must be an array of strings');
  }
  if (value.structs !== undefined) {
    if (!isRecord(value.structs)) throw new TypeError('Legacy protocol structs must be an object');
    for (const fields of Object.values(value.structs)) {
      if (!Array.isArray(fields) || !fields.every(isProtocolField)) {
        throw new TypeError('Legacy protocol struct fields are invalid');
      }
    }
  }
  return value;
};

export class LegacyDeviceProtocol {
  readonly #codec: VuespStruct;

  constructor(codec = new VuespStruct()) {
    this.#codec = codec;
  }

  initialize(definition: unknown): void {
    this.#codec.init(parseProtocolDefinition(definition));
  }

  encode(command: string, data: Record<string, unknown> = {}): ArrayBuffer | null | false {
    return this.#codec.set(command, data);
  }

  decode(frame: ArrayBuffer): LegacyProtocolMessage | null {
    const message = this.#codec.get(frame);
    if (!message) return null;
    return message;
  }
}
