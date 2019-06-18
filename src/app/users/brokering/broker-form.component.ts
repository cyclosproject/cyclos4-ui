import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { BrokerDataForAdd } from 'app/api/models';
import { BrokeringService } from 'app/api/services';
import { BasePageComponent } from 'app/shared/base-page.component';
import { FormGroup, Validators } from '@angular/forms';

/**
 * Operator group form - either to create or edit
 */
@Component({
  selector: 'broker-form',
  templateUrl: 'broker-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BrokerFormComponent
  extends BasePageComponent<BrokerDataForAdd>
  implements OnInit {

  id: string;
  user: string;
  form: FormGroup;

  constructor(
    injector: Injector,
    private brokeringService: BrokeringService) {
    super(injector);
    this.form = this.formBuilder.group({});
  }

  ngOnInit() {
    super.ngOnInit();
    this.user = this.route.snapshot.params.user;
    this.addSub(this.brokeringService.getBrokerDataForAdd({ user: this.user }).subscribe(data => {
      this.data = data;
    }));
  }

  onDataInitialized(data: BrokerDataForAdd) {
    if (data.brokers) {
      this.form.setControl('mainBroker', this.formBuilder.control(false));
    }
    this.form.setControl('broker', this.formBuilder.control(null, Validators.required));
  }

  submit() {

  }

  cancel() {

  }
}
