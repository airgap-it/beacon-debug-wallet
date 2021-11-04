import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  public RPCs = {
    mainnet: [
      'https://mainnet.api.tez.ie',
      'https://mainnet.smartpy.io',
      'rpc.tzbeta.net',
      'teznode.letzbake.com',
      'mainnet-tezos.giganode.io',
    ],
    granadanet: [
      'https://granadanet.api.tez.ie',
      'https://granadanet.smartpy.io',
      'rpczero.tzbeta.net',
      'testnet-tezos.giganode.io/',
    ],
    hangzhounet: ['https://hangzhounet.api.tez.ie'],
  };

  public selectedRPC = this.RPCs.mainnet[0];

  constructor(public readonly http: HttpClient) {}

  public async getPublicKeyForAddress(address: string): Promise<string> {
    // Try to get the public key from any network
    const RPCs = Object.values(this.RPCs).map((element) => element[0]);

    // First try to get the public key from the selected RPC
    RPCs.unshift(this.selectedRPC);

    for (let rpc of RPCs) {
      const result = await this.getPublicKeyForAddressFromRPC(rpc, address);

      if (result) {
        return result;
      }
    }

    throw new Error('No entry found');
  }

  private async getPublicKeyForAddressFromRPC(
    rpc: string,
    address: string
  ): Promise<string | null> {
    const url = `${rpc}/chains/main/blocks/head/context/contracts/${address}/manager_key`;
    const response = await this.http.get<string | null>(url).toPromise();
    console.log(response);
    return response;
  }

  public async setCustomRPC(rpc: string) {
    this.selectedRPC = rpc;
  }
}
