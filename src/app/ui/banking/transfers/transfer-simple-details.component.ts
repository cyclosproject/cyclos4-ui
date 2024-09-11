import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { TransferView } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';

/**
 * Displays fields of a transfer or payment
 */
@Component({
  selector: 'transfer-simple-details',
  templateUrl: 'transfer-simple-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransferSimpleDetailsComponent extends BaseComponent implements OnInit {
  @Input() transfer: TransferView;

  constructor(injector: Injector) {
    super(injector);
  }
}
