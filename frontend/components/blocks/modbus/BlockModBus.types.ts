export interface BlockModBusProps {
  data?: number[];
}

export interface BlockModBusEmits {
  send: [value: number[]];
}
