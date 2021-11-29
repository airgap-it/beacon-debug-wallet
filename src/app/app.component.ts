import { PeerInfo, PermissionInfo } from '@airgap/beacon-types';
import { Component, OnInit } from '@angular/core';
import { BsModalService, ModalOptions } from 'ngx-bootstrap/modal';
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import { AccountsOverviewComponent } from './components/accounts-overview/accounts-overview.component';
import { ConfirmModalComponent } from './components/confirm-modal/confirm-modal.component';
import { HowToModalComponent } from './components/how-to-modal/how-to-modal.component';
import { LoadingModalComponent } from './components/loading-modal/loading-modal.component';
import { NodeSelectorModalComponent } from './components/node-selector-modal/node-selector-modal.component';
import { Account, AccountService } from './services/account.service';
import { ApiService } from './services/api.service';
import { BeaconService, LogAction } from './services/beacon.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  isCollapsed = true;

  connected: boolean | undefined;

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
    const bsModalRef = this.modalService.show(LoadingModalComponent, {});

    setTimeout(() => {
      navigator.clipboard
        .readText()
        .then(async (clipText) => {
          try {
            await this.beacon.addPeer(clipText);
          } catch {}
        })
        .finally(() => {
          bsModalRef.hide();
        });
    }, 500);
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
    const bsModalRef = this.modalService.show(ConfirmModalComponent, {});

    bsModalRef.onHide?.pipe(first()).subscribe(async (result) => {
      if (result === 'confirm') {
        await this.beacon.walletClient.removePeer(peer as any, true);
        this.getPeers();
      }
    });
  }

  async removePermission(permission: PermissionInfo) {
    const bsModalRef = this.modalService.show(ConfirmModalComponent, {});

    bsModalRef.onHide?.pipe(first()).subscribe(async (result) => {
      if (result === 'confirm') {
        await this.beacon.walletClient.removePermission(
          permission.accountIdentifier
        );
        this.getPeers();
      }
    });
  }

  async removeAccount(account: Account) {
    const bsModalRef = this.modalService.show(ConfirmModalComponent, {});

    bsModalRef.onHide?.pipe(first()).subscribe((result) => {
      if (result === 'confirm') {
        this.accountService.removeAccount(account);
      }
    });
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

  openNodeSelectorModal() {
    const initialState: ModalOptions = {
      initialState: {},
    };
    const bsModalRef = this.modalService.show(
      NodeSelectorModalComponent,
      initialState
    );
    (bsModalRef.content as any).closeBtnName = 'Close';
  }

  openHowToModal() {
    const initialState: ModalOptions = {
      initialState: {},
    };
    const bsModalRef = this.modalService.show(
      HowToModalComponent,
      initialState
    );
    (bsModalRef.content as any).closeBtnName = 'Close';
  }

  action(ev: Event, logItem: any, item: LogAction) {
    ev.preventDefault();
    ev.stopPropagation();
    item.action();
    logItem[3].length = 0;
  }
}
