import {
  BeaconErrorType,
  BeaconMessageType,
  PermissionScope,
  Serializer,
  WalletClient,
} from '@airgap/beacon-sdk';
// import { TezosProtocol } from '@airgap/coinlib-core';
import { Injectable } from '@angular/core';
// import * as bs58check from 'bs58check';

@Injectable({
  providedIn: 'root',
})
export class BeaconService {
  public client: WalletClient;

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

  public async runOperations(operations: any) {
    // const tezosProtocol = new TezosProtocol();
    // let publicKey = localStorage.getItem('pubkey');
    // if (publicKey.startsWith('edpk') && publicKey.length === 54) {
    //   const edpkPrefixLength = 4;
    //   const decoded = bs58check.decode(publicKey);
    //   publicKey = decoded
    //     .slice(edpkPrefixLength, decoded.length)
    //     .toString('hex');
    // }
    // if (!publicKey) {
    //   console.error('NO PUBLIC KEY');
    //   return;
    // }
    // tezosProtocol
    //   .prepareOperations(publicKey, operations)
    //   .then(async (wrappedOperations) => {
    //     console.log('DONE');
    //     const signedTx = await tezosProtocol.forgeAndWrapOperations(
    //       wrappedOperations
    //     );
    //     tezosProtocol
    //       .getTransactionDetails({ publicKey, transaction: signedTx })
    //       .then((tx) => {
    //         console.log(tx);
    //       })
    //       .catch((error) => console.error('error1', error));
    //   })
    //   .catch((error) => {
    //     console.error('error2');
    //     console.error(JSON.stringify(error.data));
    //   });
  }
}
