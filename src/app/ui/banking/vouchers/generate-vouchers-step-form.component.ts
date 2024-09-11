import { ChangeDetectionStrategy, Component, Injector, Input, OnInit, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
  Currency,
  VoucherDataForGenerate,
  VoucherGenerationAmountEnum,
  VoucherGenerationStatusEnum
} from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
import { UserFieldComponent } from 'app/shared/user-field.component';

@Component({
  selector: 'generate-vouchers-step-form',
  templateUrl: 'generate-vouchers-step-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GenerateVouchersStepFormComponent extends BaseComponent implements OnInit {
  @Input() data: VoucherDataForGenerate;
  @Input() form: FormGroup;
  @ViewChild(UserFieldComponent) userField: UserFieldComponent;
  showAmount: boolean;
  showUser: boolean;

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.addSub(this.form.get('user').valueChanges.subscribe(() => this.saveUserData()));
    this.showAmount = this.data.generationAmount === VoucherGenerationAmountEnum.GENERATION;
    this.showUser = this.data.generationStatus !== VoucherGenerationStatusEnum.INACTIVE;
  }

  saveUserData() {
    if (this.userField.user) {
      this.form.get('userData').setValue(this.userField.user);
    }
  }

  get currency(): Currency {
    return this.data.account.currency;
  }
}
