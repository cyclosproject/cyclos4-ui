import { NgModule } from '@angular/core';
import { UiSharedModule } from 'app/ui/shared/ui-shared.module';
import { RunWizardStepFieldComponent } from './run-wizard-step-field.component';
import { RunWizardStepGroupComponent } from './run-wizard-step-group.component';
import { RunWizardStepIdPComponent } from './run-wizard-step-idp.component';
import { RunWizardStepVerificationComponent } from './run-wizard-step-verification.component';
import { RunWizardComponent } from './run-wizard.component';
import { WizardCallbackComponent } from './wizard-callback.component';
import { WizardsRoutingModule } from './wizard-routing.module';

/**
 * Module for running custom wizards
 */
@NgModule({
  declarations: [
    RunWizardComponent,
    RunWizardStepGroupComponent,
    RunWizardStepIdPComponent,
    RunWizardStepFieldComponent,
    RunWizardStepVerificationComponent,
    WizardCallbackComponent,
  ],
  imports: [
    WizardsRoutingModule,
    UiSharedModule
  ]
})
export class WizardsModule { }
