import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CoreBasicModule } from 'app/core/core-basic.module';
import { UnsubscribeDoneComponent } from 'app/unsubscribe/unsubscribe-done.component';
import { UnsubscribeFormComponent } from 'app/unsubscribe/unsubscribe-form.component';
import { UnsubscribeState } from 'app/unsubscribe/unsubscribe-state';
import { UnsubscribeComponent } from 'app/unsubscribe/unsubscribe.component';

@NgModule({
  declarations: [
    UnsubscribeComponent,
    UnsubscribeFormComponent,
    UnsubscribeDoneComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    CoreBasicModule,
  ],
  providers: [
    UnsubscribeState,
  ],
  bootstrap: [UnsubscribeComponent],
})
export class UnsubscribeModule { }
