import { Component, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Observable } from 'rxjs';
import { Account, AccountService } from 'src/app/services/account.service';

@Component({
  selector: 'app-accounts-selection',
  templateUrl: './accounts-selection.component.html',
  styleUrls: ['./accounts-selection.component.scss'],
})
export class AccountsSelectionComponent implements OnInit {
  accounts$: Observable<Account[]>;
  constructor(
    public bsModalRef: BsModalRef,
    private readonly accountService: AccountService
  ) {
    this.accounts$ = this.accountService.accounts$;
  }

  ngOnInit(): void {}

  close(): void {
    this.bsModalRef.hide();
  }

  select(account: Account) {
    this.bsModalRef.onHide?.emit({ isAccount: true, account });
    this.close();
  }
}
