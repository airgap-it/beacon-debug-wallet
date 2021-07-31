import { Component, OnInit } from '@angular/core';
import { ApiService } from './services/api.service';
import { BeaconService } from './services/beacon.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  address = localStorage.getItem('address') ?? '';
  publicKey =
    localStorage.getItem('pubkey') ?? 'No public key. Please enter address';

  connected: boolean | undefined;

  status = '';

  constructor(
    public readonly api: ApiService,
    public readonly beacon: BeaconService
  ) {}

  async ngOnInit() {
    this.connected = await this.beacon.client.isConnected;
  }

  async updateAddress() {
    this.publicKey = 'Loading...';
    try {
      this.publicKey = await this.api.getPublicKeyForAddress(this.address);
      localStorage.setItem('address', this.address);
      localStorage.setItem('pubkey', this.publicKey);
    } catch {
      this.publicKey = 'Invalid Address';
    }
  }

  async paste() {
    console.log('CONNECT');
    navigator.clipboard.readText().then((clipText) => {
      this.beacon.addPeer(clipText);
    });
  }
}
