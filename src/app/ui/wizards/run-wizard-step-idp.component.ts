import { ChangeDetectionStrategy, Component, EventEmitter, Injector, Input, OnInit, Output } from '@angular/core';
import { IdentityProvider } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';

/**
 * Step in a custom wizard - identity provider
 */
@Component({
  selector: 'run-wizard-step-idp',
  templateUrl: 'run-wizard-step-idp.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RunWizardStepIdPComponent
  extends BaseComponent
  implements OnInit {

  @Input() identityProviders: IdentityProvider[];
  @Output() continue = new EventEmitter<IdentityProvider>();

  constructor(injector: Injector) {
    super(injector);
  }

  registerWith(idp: IdentityProvider) {
    this.continue.emit(idp);
  }
}
