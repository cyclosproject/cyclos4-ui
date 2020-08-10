import { NgModule } from '@angular/core';
import { SharedModule } from 'app/shared/shared.module';
import { RunWizardComponent } from './run-wizard.component';
import { RunWizardStepGroupComponent } from './run-wizard-step-group.component';
import { RunWizardStepIdPComponent } from './run-wizard-step-idp.component';
import { RunWizardStepFieldsComponent } from './run-wizard-step-fields.component';
import { WizardsRoutingModule } from './wizard-routing.module';
import { WizardCallbackComponent } from './wizard-callback.component';

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
    SharedModule,
  ],
})
export class WizardsModule { }
