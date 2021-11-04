import { NetworkType, PeerInfo, PermissionInfo } from '@airgap/beacon-sdk';
import { Component, OnInit } from '@angular/core';
import { BsModalService, ModalOptions } from 'ngx-bootstrap/modal';
import { Observable } from 'rxjs';
import { AccountsOverviewComponent } from './components/accounts-overview/accounts-overview.component';
import { Account, AccountService } from './services/account.service';
import { ApiService } from './services/api.service';
import { BeaconService } from './services/beacon.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  isCollapsed = true;

  connected: boolean | undefined;

  status = '';

  accounts$: Observable<Account[]>;

  peersAndPermissions: [PeerInfo, PermissionInfo[]][] = [];

  constructor(
    public readonly api: ApiService,
    public readonly beacon: BeaconService,
    private readonly accountService: AccountService,
    private readonly modalService: BsModalService
  ) {
    this.accounts$ = this.accountService.accounts$;
  }

  async ngOnInit() {
    this.connected = await this.beacon.walletClient.isConnected;
    this.getPeers();
  }

  async paste() {
    console.log('CONNECT');
    navigator.clipboard.readText().then((clipText) => {
      this.beacon.addPeer(clipText);
    });
  }

  async getPeers() {
    const peers = await this.beacon.walletClient.getPeers();
    const permissions = await this.beacon.walletClient.getPermissions();

    this.peersAndPermissions = peers.map((peer) => {
      return [
        peer,
        permissions.filter((perm) => perm.senderId === (peer as any).senderId),
      ];
    });
  }

  async removePeer(peer: PeerInfo) {
    await this.beacon.walletClient.removePeer(peer as any, true);
    this.getPeers();
  }

  async removePermission(permission: PermissionInfo) {
    await this.beacon.walletClient.removePermission(
      permission.accountIdentifier
    );
    this.getPeers();
  }

  async openAccountsOverview() {
    const initialState: ModalOptions = {
      initialState: {},
    };
    const bsModalRef = this.modalService.show(
      AccountsOverviewComponent,
      initialState
    );
    (bsModalRef.content as any).closeBtnName = 'Close';
  }
}
