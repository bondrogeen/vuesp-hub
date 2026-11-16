export interface IBlockModBusProps {
  data?: number[];
}

export interface IBlockModBusEmits {
  send: [value: number[]];
}
