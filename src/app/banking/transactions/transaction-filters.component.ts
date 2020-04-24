import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { TransactionDataForSearch, TransferFilter } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
import { FieldOption } from 'app/shared/field-option';

/**
 * Filters used to search transactions (scheduled / recurring / authorized payments)
 */
@Component({
  selector: 'transaction-filters',
  templateUrl: 'transaction-filters.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionFitersComponent
  extends BaseComponent implements OnInit {

  @Input() data: TransactionDataForSearch;
  @Input() heading: string;
  @Input() mobileHeading: string;
  @Input() form: FormGroup;
  @Input() statusOptions: FieldOption[];
  @Input() transferFilters: TransferFilter[];
  self: boolean;

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.self = this.authHelper.isSelf(this.data.user);
  }
}
