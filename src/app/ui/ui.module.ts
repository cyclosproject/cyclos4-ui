import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CoreBasicModule } from 'app/core/core-basic.module';
import { SharedModule } from 'app/shared/shared.module';
import { UiCoreModule } from 'app/ui/core/ui-core.module';
import { INITIALIZE } from 'app/ui/initialize';
import { UiRoutingModule } from 'app/ui/ui-routing.module';
import { UiComponent } from './ui.component';

@NgModule({
  declarations: [UiComponent],
  imports: [HttpClientModule, CoreBasicModule, UiCoreModule, SharedModule, BrowserAnimationsModule, UiRoutingModule],
  providers: [INITIALIZE],
  bootstrap: [UiComponent]
})
export class UiModule {}
