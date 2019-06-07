import { Component, OnInit, Injector } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/compiler/src/core';
import { VoucherView } from 'app/api/models';
import { BasePageComponent } from 'app/shared/base-page.component';

@Component({
  selector: 'app-view-voucher',
  templateUrl: './view-voucher.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewVoucherComponent extends BasePageComponent<VoucherView> implements OnInit {

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {
  }

}
