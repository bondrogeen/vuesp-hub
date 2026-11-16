export interface ISecretProvider {
  encrypt(value: string): string;
  decrypt(value: string): string;
}
