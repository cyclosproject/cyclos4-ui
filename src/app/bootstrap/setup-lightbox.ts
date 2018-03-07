import { Provider, APP_INITIALIZER } from '@angular/core';
import { LightboxConfig } from 'angular2-lightbox';

// Initializes the Lightbox configuration
export function setupLightbox(config: LightboxConfig): Function {
  return () => {
    config.centerVertically = true;
    config.fadeDuration = 0.4;
    config.resizeDuration = 0.4;
    config.disableScrolling = true;
    config.wrapAround = true;
  };
}
export const SETUP_LIGHTBOX: Provider = {
  provide: APP_INITIALIZER,
  useFactory: setupLightbox,
  deps: [LightboxConfig],
  multi: true
};
