import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { NetworkType } from '@airgap/beacon-types';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  public RPCs = {
    mainnet: [
      'https://mainnet.api.tez.ie',
      'https://mainnet.smartpy.io',
      'https://rpc.tzbeta.net',
      'https://teznode.letzbake.com',
      'https://mainnet-tezos.giganode.io',
    ],
    granadanet: [
      'https://granadanet.api.tez.ie',
      'https://granadanet.smartpy.io',
      'https://rpczero.tzbeta.net',
      'https://testnet-tezos.giganode.io/',
    ],
    hangzhounet: ['https://hangzhounet.api.tez.ie'],
  };

  public selectedRPC = this.RPCs.mainnet[0];

  constructor(public readonly http: HttpClient) {}

  public async getPublicKeyForAddress(
    address: string
  ): Promise<{ network: NetworkType; publicKey: string }> {
    // Try to get the public key from any network
    const RPCs: { network: NetworkType; url: string }[] = Object.entries(
      this.RPCs
    ).map((element) => ({
      network: element[0] as NetworkType,
      url: element[1][0],
    }));

    // First try to get the public key from the selected RPC
    RPCs.unshift({ network: NetworkType.MAINNET, url: this.selectedRPC });

    for (let rpc of RPCs) {
      const result = await this.getPublicKeyForAddressFromRPC(rpc.url, address);

      if (result) {
        return { network: rpc.network, publicKey: result };
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
