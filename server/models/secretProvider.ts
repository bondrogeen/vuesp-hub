export interface SecretProvider {
  encrypt(value: string): string;
  decrypt(value: string): string;
}
