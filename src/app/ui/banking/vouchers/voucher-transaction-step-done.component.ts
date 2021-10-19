import { ChangeDetectionStrategy, Component, Injector, Input, OnDestroy, OnInit } from '@angular/core';
import { Currency, VoucherTransactionResult } from 'app/api/models';
import { AuthHelperService } from 'app/core/auth-helper.service';
import { StoredFileCacheService } from 'app/core/stored-file-cache.service';
import { BaseComponent } from 'app/shared/base.component';

/**
 * Component used for displaying the final result of a voucher transaction
 */
@Component({
  selector: 'voucher-transaction-step-done',
  templateUrl: './voucher-transaction-step-done.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoucherTransactionStepDoneComponent extends BaseComponent implements OnInit, OnDestroy {

  @Input() result: VoucherTransactionResult;

  self: boolean;
  currency: Currency;

  constructor(
    injector: Injector,
    private authHelper: AuthHelperService,
    private storedFileCacheService: StoredFileCacheService
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.self = this.authHelper.isSelf(this.result.user);
    this.currency = this.result.type.configuration.currency;
  }

  ngOnDestroy() {
    this.storedFileCacheService.clear();
  }

}
