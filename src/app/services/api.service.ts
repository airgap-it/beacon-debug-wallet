import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as bs58check from 'bs58check';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(public readonly http: HttpClient) {}

  public async getPublicKeyForAddress(address: string): Promise<string> {
    const url = `https://mainnet-tezos.giganode.io/chains/main/blocks/head/context/contracts/${address}/manager_key`;

    const response = await this.http.get<string>(url).toPromise();

    console.log(response);

    return response;
  }
}
