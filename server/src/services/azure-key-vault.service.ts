import { SecretClient } from '@azure/keyvault-secrets';
import { ClientSecretCredential } from '@azure/identity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AzureKeyVaultService {
  private client: SecretClient;

  constructor() {
    // const credential = new DefaultAzureCredential();
    // this.client = new SecretClient(process.env.KEY_VAULT_URL, credential);
    const credential = new ClientSecretCredential(
      process.env.AZURE_TENANT_ID,
      process.env.AZURE_CLIENT_ID,
      process.env.AZURE_CLIENT_SECRET,
    );
    const vaultUrl = `https://${process.env.AZURE_KEY_VAULT_NAME}.vault.azure.net`;
    this.client = new SecretClient(vaultUrl, credential);
  }

  async getPrivateKey(keyName: string): Promise<string> {
    const secret = await this.client.getSecret(keyName);
    return secret.value;
  }

  async setPrivateKey(keyName: string, privateKey: string): Promise<void> {
    await this.client.setSecret(keyName, privateKey);
  }

  async deletePrivateKey(keyName: string): Promise<void> {
    await this.client.beginDeleteSecret(keyName);
  }
}
