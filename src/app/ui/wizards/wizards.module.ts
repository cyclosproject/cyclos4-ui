import { NgModule } from '@angular/core';
import { UiSharedModule } from 'app/ui/shared/ui-shared.module';
import { RunWizardStepFieldsComponent } from './run-wizard-step-fields.component';
import { RunWizardStepGroupComponent } from './run-wizard-step-group.component';
import { RunWizardStepIdPComponent } from './run-wizard-step-idp.component';
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
    RunWizardStepFieldsComponent,
    WizardCallbackComponent,
  ],
  imports: [
    WizardsRoutingModule,
    UiSharedModule
  ]
})
export class WizardsModule { }
