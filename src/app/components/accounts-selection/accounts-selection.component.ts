import { Component, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-accounts-selection',
  templateUrl: './accounts-selection.component.html',
  styleUrls: ['./accounts-selection.component.scss'],
})
export class AccountsSelectionComponent implements OnInit {
  constructor(public bsModalRef: BsModalRef) {}

  ngOnInit(): void {}

  close(): void {
    this.bsModalRef.hide();
  }
}
