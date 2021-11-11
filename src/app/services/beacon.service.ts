import {
  NetworkType,
  BeaconMessageType,
  BeaconErrorType,
  PermissionRequestOutput,
  PermissionScope,
  OperationRequestOutput,
  SignPayloadRequestOutput,
  PartialTezosOperation,
  PartialTezosTransactionOperation,
} from '@airgap/beacon-types';
import { DAppClient } from '@airgap/beacon-dapp';
import { WalletClient } from '@airgap/beacon-wallet';
import { LocalStorage, Serializer } from '@airgap/beacon-core';
import { Injectable } from '@angular/core';
// import * as bs58check from 'bs58check';

import { first } from 'rxjs/operators';

import { RpcClient, OperationContents, OpKind } from '@taquito/rpc';
import { Account, AccountService, AccountType } from './account.service';

@Injectable({
  providedIn: 'root',
})
export class BeaconService {
  public walletClient: WalletClient;
  public dAppClient: DAppClient;

  log: [Date, string, any][] = [];

  constructor(private readonly accountService: AccountService) {
    const storage = new LocalStorage('INCOMING');
    this.walletClient = new WalletClient({
      name: 'Beacon Debug Wallet',
      storage,
    });

    const storageDApp = new LocalStorage('OUTGOING');
    this.dAppClient = new DAppClient({
      name: 'Beacon Debug Wallet',
      storage: storageDApp,
    });

    this.connect();
  }

  connect() {
    this.walletClient.init().then(async () => {
      console.log('---');
      console.log('name', this.walletClient.name);
      console.log('appUrl', this.walletClient.appUrl);
      console.log('iconUrl', this.walletClient.iconUrl);
      console.log('beaconId', await this.walletClient.beaconId);
      console.log('connectionStatus', this.walletClient.connectionStatus);
      console.log('getAccounts', await this.walletClient.getAccounts());
      console.log(
        'getAppMetadataList',
        await this.walletClient.getAppMetadataList()
      );
      console.log(
        'getOwnAppMetadata',
        await this.walletClient.getOwnAppMetadata()
      );
      console.log('getPeers', await this.walletClient.getPeers());
      console.log('getPermissions', await this.walletClient.getPermissions());
      console.log('---');
      console.log('init');
      this.walletClient
        .connect(async (message) => {
          this.log.push([new Date(), 'INCOMING MESSAGE', message]);
          console.log('message', message);

          this.accountService.accounts$.pipe(first()).subscribe((accounts) => {
            const account = accounts[0];
            console.log('SELECTED ACCOUNT', account);

            if (message.type === BeaconMessageType.PermissionRequest) {
              this.handlePermissionRequest(account, message);
            } else if (message.type === BeaconMessageType.OperationRequest) {
              this.handleOperationRequest(account, message);
            } else if (message.type === BeaconMessageType.SignPayloadRequest) {
              this.handleSignPayload(account, message);
            } else {
              console.error('Message type not supported');
              console.error('Received: ', message);

              const response = {
                type: BeaconMessageType.Error,
                id: message.id,
                errorType: BeaconErrorType.ABORTED_ERROR,
              };
              this.walletClient.respond(response as any);
            }
          });
        })
        .catch((error) => console.error('connect error', error));
    }); // Establish P2P connection
  }

  public async addPeer(text: string) {
    const serializer = new Serializer();
    serializer
      .deserialize(text)
      .then((peer) => {
        console.log('Adding peer', peer);
        this.walletClient.addPeer(peer as any).then(() => {
          console.log('Peer added');
        });
      })
      .catch((e) => {
        console.error('not a valid sync code: ', e, text);
      });
  }

  private handlePermissionRequest(
    account: Account,
    message: PermissionRequestOutput
  ) {
    console.log('Sharing ', account);

    const response = {
      type: BeaconMessageType.PermissionResponse,
      network: message.network,
      scopes: [PermissionScope.OPERATION_REQUEST],
      id: message.id,
      publicKey: account.publicKey,
    };

    this.log.push([new Date(), 'PERMISSION RESPONSE', response]);

    // Send response back to DApp
    this.walletClient.respond(response as any);
  }

  public async handleOperationRequest(
    account: Account,
    message: OperationRequestOutput
  ) {
    const operations: PartialTezosOperation[] = message.operationDetails;

    const client = new RpcClient(
      message.network.type === NetworkType.GRANADANET
        ? 'https://granadanet.api.tez.ie'
        : 'https://mainnet.api.tez.ie'
    );

    const { counter } = await client.getContract(account.address);
    console.log('COUNTER FROM API', counter);
    const nextCounter = parseInt(counter || '0', 10) + 1;
    console.log('nextCounter', nextCounter);
    const branch = (await client.getBlockHeader()).hash;
    // RPC requires a signature but does not verify it
    const SIGNATURE_STUB =
      'edsigtkpiSSschcaCt9pUVrpNPf7TTcgvgDEDD6NCEHMy8NNQJCGnMfLZzYoQj74yLjo9wx6MPVV29CvVzgi7qEcEUok3k7AuMg';
    const chainId = await client.getChainId();

    const typedOperations: OperationContents[] = operations.map(
      (op) =>
        ({
          source: account.address,
          counter: String(nextCounter),
          fee: '10000',
          gas_limit: '1040000',
          storage_limit: '60000',
          ...(op as PartialTezosTransactionOperation),
          kind: OpKind.TRANSACTION,
        } as any)
    );

    client
      .runOperation({
        operation: {
          branch,
          contents: typedOperations,
          signature: SIGNATURE_STUB,
        },
        chain_id: chainId,
      })
      .then((res) => {
        this.log.push([new Date(), 'RUN OPERATION SUCCESS', res]);
        console.log('RUN_OPERATION RESULT', res);
      })
      .catch((err) => {
        this.log.push([new Date(), 'RUN OPERATION ERROR', err]);
        console.log('RUN_OPERATION ERROR', err);
      })
      .finally(() => {
        if (account.type === AccountType.BEACON) {
          this.dAppClient
            .requestOperation({
              operationDetails: operations,
            })
            .then((res) => {
              console.log('res', res);
              // this.walletClient.respond();
            })
            .catch((err) => {
              console.log('BEACON WALLET ERROR', err);
            });
        } else {
          console.log('ACCOUNT TYPE NOT BEACON');
        }
      });
  }

  private handleSignPayload(
    account: Account,
    message: SignPayloadRequestOutput
  ) {
    // const publicKey = localStorage.getItem('pubkey');
    // console.log('Sharing ', publicKey);
    // const response = {
    //   type: BeaconMessageType.SignPayloadResponse,
    //   network: message.network,
    //   scopes: [PermissionScope.OPERATION_REQUEST],
    //   id: message.id,
    //   publicKey,
    // };
    // // Send response back to DApp
    // this.walletClient.respond(response as any);
  }
}
