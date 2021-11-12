import { Component, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-node-selector-modal',
  templateUrl: './node-selector-modal.component.html',
  styleUrls: ['./node-selector-modal.component.scss'],
})
export class NodeSelectorModalComponent implements OnInit {
  closeBtnName?: string;

  constructor(public readonly bsModalRef: BsModalRef) {}

  ngOnInit(): void {}
}
