import { ChangeDetectionStrategy, Component, EventEmitter, Injector, Input, OnInit, Output } from '@angular/core';
import { IdentityProvider } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';

/**
 * Public registration step: select whether to use an identity provider
 */
@Component({
  selector: 'registration-step-idp',
  templateUrl: 'registration-step-idp.component.html',
  styleUrls: ['registration-step-idp.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationStepIdPComponent extends BaseComponent implements OnInit {
  @Input() identityProviders: IdentityProvider[];

  @Output() continue = new EventEmitter<IdentityProvider>();

  constructor(injector: Injector) {
    super(injector);
  }

  registerWith(idp: IdentityProvider) {
    this.continue.emit(idp);
  }
}
