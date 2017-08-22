import { Component, Injector } from '@angular/core';
import { BaseBankingComponent } from "app/banking/base-banking.component";
import { AccountPermissions, DataForTransaction } from "app/api/models";
import { PaymentKind } from "app/banking/payments/payment-kind";
import { PaymentStep } from "app/banking/payments/payment-step";
import { IdMethod } from "app/banking/payments/id-method";


/**
 * Component used to choose which kind of payment will be performed
 */
@Component({
  selector: 'perform-payment',
  templateUrl: 'perform-payment.component.html'
})
export class PerformPaymentComponent extends BaseBankingComponent {

  step: PaymentStep = PaymentStep.KIND;
  kind: PaymentKind;

  idMethod: IdMethod;
  user: string;

  allowedKinds: PaymentKind[];

  constructor(
    injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.initAllowedKinds();
    this.kind = this.allowedKinds[0];
  }

  private initAllowedKinds() {
    let permissions = this.login.auth.permissions;
    let accounts = permissions.accounts;

    let hasAny = prop => {
      for (let account of accounts) {
        if (account[prop] != null && account[prop].length > 0) {
          return true;
        }
      }
      return false;
    }

    this.allowedKinds = [];
    if (hasAny('userPayments')) {
      this.allowedKinds.push('user');
    }
    if (hasAny('selfPayments')) {
      this.allowedKinds.push('self');
    }
    if (hasAny('systemPayments')) {
      this.allowedKinds.push('system');
    }
  }

  next() {
    let allSteps = this.allSteps();
    let index = allSteps.indexOf(this.step);
    if (index < allSteps.length - 1) {
      this.step = allSteps[index + 1];
    }
    if (this.step == PaymentStep.USER) {
      this.user = null;
    }
  }

  get nextEnabled(): boolean {
    if (this.step == PaymentStep.USER) {
      return this.user != null && this.user.length > 0;
    }
    return ![PaymentStep.CONFIRM, PaymentStep.DONE].includes(this.step);
  }

  previous() {
    let allSteps = this.allSteps();
    let index = allSteps.indexOf(this.step);
    if (index > 0) {
      this.step = allSteps[index - 1];
    }
  }

  private allSteps(): PaymentStep[] {
    let allSteps = PaymentStep.values();
    if (this.kind != PaymentKind.USER) {
      // When not paying to a user, remove the id-method and user selection steps
      allSteps.splice(allSteps.indexOf(PaymentStep.ID_METHOD), 1);
      allSteps.splice(allSteps.indexOf(PaymentStep.USER), 1);
    }
    return allSteps;
  }
}
