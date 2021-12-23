import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Injector, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { VoucherInitialDataForTransaction } from 'app/api/models';
import { AuthHelperService } from 'app/core/auth-helper.service';
import { BaseComponent } from 'app/shared/base.component';
import { empty, focus } from 'app/shared/helper';
import { InputFieldComponent } from 'app/shared/input-field.component';
import { ScanQrCodeComponent } from 'app/shared/scan-qrcode.component';
import { BsModalService } from 'ngx-bootstrap/modal';
import { first } from 'rxjs/operators';

/**
 * Component used for inputting a voucher token for a voucher transaction
 */
@Component({
  selector: 'voucher-transaction-step-token',
  templateUrl: './voucher-transaction-step-token.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoucherTransactionStepTokenComponent extends BaseComponent implements OnInit {

  @Input() token: FormControl;
  @Input() data: VoucherInitialDataForTransaction;
  @Output() scan = new EventEmitter();

  self: boolean;

  @ViewChild('inputField') inputField: ElementRef<InputFieldComponent>;

  constructor(
    injector: Injector,
    private authHelper: AuthHelperService,
    private modal: BsModalService
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.self = this.authHelper.isSelf(this.data.user);
  }

  showScanQrCode() {
    const ref = this.modal.show(ScanQrCodeComponent, {
      class: 'modal-form',
    });
    const component = ref.content as ScanQrCodeComponent;
    component.select.pipe(first()).subscribe(value => {
      this.token.setValue(value);
      this.scan.emit();
    });
    this.modal.onHide.pipe(first()).subscribe(() => focus(this.inputField, true));
  }

  maybeSubmit() {
    if (this.data.mask) {
      if (this.token.value?.length === this.data.mask.length) {
        this.scan.emit();
      }
    } else {
      if (!empty(this.token.value)) {
        this.scan.emit();
      }
    }
  }
}
