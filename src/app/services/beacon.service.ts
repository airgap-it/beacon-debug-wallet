import {
  BeaconErrorType,
  BeaconMessageType,
  PartialTezosOperation,
  PartialTezosTransactionOperation,
  PermissionScope,
  Serializer,
  WalletClient,
} from '@airgap/beacon-sdk';
import { Injectable } from '@angular/core';
// import * as bs58check from 'bs58check';

import { RpcClient, OperationContents, OpKind } from '@taquito/rpc';

const client = new RpcClient('https://mainnet-tezos.giganode.io');

@Injectable({
  providedIn: 'root',
})
export class BeaconService {
  public client: WalletClient;

  log: [Date, string, string][] = [];

  constructor() {
    this.client = new WalletClient({
      name: 'Beacon Debug Wallet',
    });

    this.connect();
  }

  connect() {
    this.client.init().then(() => {
      console.log('init');
      this.client
        .connect(async (message) => {
          this.log.push([
            new Date(),
            'INCOMING MESSAGE',
            JSON.stringify(message, null, 2),
          ]);
          console.log('message', message);
          // Example: Handle PermissionRequest. A wallet should handle all request types
          if (message.type === BeaconMessageType.PermissionRequest) {
            // Show a UI to the user where he can confirm sharing an account with the DApp

            const publicKey = localStorage.getItem('pubkey');
            console.log('Sharing ', publicKey);

            const response = {
              type: BeaconMessageType.PermissionResponse,
              network: message.network, // Use the same network that the user requested
              scopes: [PermissionScope.OPERATION_REQUEST], // Ignore the scopes that have been requested and instead give only operation permissions
              id: message.id,
              publicKey,
            };

            // Let's wait a little to make it more natural (to test the UI on the dApp side)
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Send response back to DApp
            this.client.respond(response as any);
          } else if (message.type === BeaconMessageType.OperationRequest) {
            this.runOperations(message.operationDetails);
          } else {
            console.error(
              'Only permission requests are supported in this demo'
            );
            console.error('Received: ', message);

            const response = {
              type: BeaconMessageType.Error,
              id: message.id,
              errorType: BeaconErrorType.ABORTED_ERROR,
            };
            this.client.respond(response as any);
          }
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
        this.client.addPeer(peer as any).then(() => {
          console.log('Peer added');
        });
      })
      .catch((e) => {
        console.error('not a valid sync code: ', e, text);
      });
  }

  public async runOperations(operations: PartialTezosOperation[]) {
    const address = localStorage.getItem('address');

    const { counter } = await client.getContract(address);
    const nextCounter = parseInt(counter || '0', 10) + 1;
    const branch = (await client.getBlockHeader()).hash;
    // RPC requires a signature but does not verify it
    const SIGNATURE_STUB =
      'edsigtkpiSSschcaCt9pUVrpNPf7TTcgvgDEDD6NCEHMy8NNQJCGnMfLZzYoQj74yLjo9wx6MPVV29CvVzgi7qEcEUok3k7AuMg';
    const chainId = await client.getChainId();

    const typedOperations: OperationContents[] = operations.map((op) => ({
      source: address,
      counter: String(nextCounter),
      fee: '10000',
      gas_limit: '1040000',
      storage_limit: '60000',
      ...(op as PartialTezosTransactionOperation),
      kind: OpKind.TRANSACTION,
    }));

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
        this.log.push([
          new Date(),
          'RUN OPERATION SUCCESS',
          JSON.stringify(res, null, 2),
        ]);
        console.log('RUN_OPERATION RESULT', res);
      })
      .catch((err) => {
        this.log.push([
          new Date(),
          'RUN OPERATION ERROR',
          JSON.stringify(err, null, 2),
        ]);
        console.log('RUN_OPERATION ERROR', err);
      });
  }
}
