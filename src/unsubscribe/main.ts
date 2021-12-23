import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { UnsubscribeModule } from '../app/unsubscribe/unsubscribe.module';
import { environment } from '../environments/environment';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(UnsubscribeModule)
  .catch(err => console.error(err));
