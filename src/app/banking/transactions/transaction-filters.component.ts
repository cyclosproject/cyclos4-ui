import { ChangeDetectionStrategy, Component, Injector, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { BaseComponent } from 'app/shared/base.component';
import { FieldOption } from 'app/shared/field-option';
import { TransactionDataForSearch, TransferFilter } from 'app/api/models';

/**
 * Filters used to search transactions (scheduled / recurring / authorized payments)
 */
@Component({
  selector: 'transaction-filters',
  templateUrl: 'transaction-filters.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransactionFitersComponentComponent
  extends BaseComponent {

  @Input() data: TransactionDataForSearch;
  @Input() heading: string;
  @Input() form: FormGroup;
  @Input() statusOptions: FieldOption[];
  @Input() transferFilters: TransferFilter[];

  constructor(injector: Injector) {
    super(injector);
  }
}
