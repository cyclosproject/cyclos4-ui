import { ChangeDetectionStrategy, Component, Injector, OnInit, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SvgIcon } from 'app/core/svg-icon';
import { focus, validateBeforeSubmit } from 'app/shared/helper';
import { InputFieldComponent } from 'app/shared/input-field.component';
import { ScanQrCodeComponent } from 'app/shared/scan-qrcode.component';
import { VoucherBasePageComponent } from 'app/voucher/voucher-base-page.component';
import { BsModalService } from 'ngx-bootstrap/modal';
import { first } from 'rxjs/operators';

/**
 * Initial component, used to input the voucher token
 */
@Component({
  selector: 'voucher-token',
  templateUrl: 'voucher-token.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VoucherTokenComponent extends VoucherBasePageComponent implements OnInit {
  SvgIcon = SvgIcon;

  token: FormControl;

  @ViewChild('inputField') private inputField: InputFieldComponent;

  constructor(private route: ActivatedRoute, private modal: BsModalService, injector: Injector) {
    super(injector);
  }

  ngOnInit(): void {
    super.ngOnInit();
    const route = this.route.snapshot;
    this.token = new FormControl(null, Validators.required);
    //when the param is the word 'token', show the page to manually enter the token
    if (route.params.token && route.params.token !== 'token') {
      this.token.setValue(route.params.token);
      this.proceed();
    }
  }

  proceed() {
    if (!this.state.processing$.value && validateBeforeSubmit(this.token)) {
      this.state.fetchByToken(this.token.value);
    }
  }

  showScanQrCode() {
    const ref = this.modal.show(ScanQrCodeComponent, {
      class: 'modal-form'
    });
    const component = ref.content as ScanQrCodeComponent;
    component.select.pipe(first()).subscribe(value => {
      this.token.setValue(value);
      this.proceed();
    });
    this.modal.onHide.pipe(first()).subscribe(() => focus(this.inputField, true));
  }
}
