import { ChangeDetectionStrategy, Component, EventEmitter, Injector, Input, OnInit, Output } from '@angular/core';
import { IdentityProvider } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
import { UiLayoutService } from 'app/ui/core/ui-layout.service';

/**
 * Public registration step: select whether to use an identity provider
 */
@Component({
  selector: 'registration-step-idp',
  templateUrl: 'registration-step-idp.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationStepIdPComponent extends BaseComponent implements OnInit {
  @Input() identityProviders: IdentityProvider[];

  @Output() continue = new EventEmitter<IdentityProvider>();

  constructor(
    injector: Injector,
    public uiLayout: UiLayoutService) {
    super(injector);
  }

  registerWith(idp: IdentityProvider) {
    this.continue.emit(idp);
  }
}
