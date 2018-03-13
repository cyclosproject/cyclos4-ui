import { NgModule } from '@angular/core';

import { SettingsComponent } from 'app/settings/settings.component';
import { SharedModule } from 'app/shared/shared.module';

/**
 * Module comprising the settings functionality
 */
@NgModule({
  declarations: [
    SettingsComponent
  ],
  imports: [
    SharedModule
  ]
})
export class SettingsModule { }
