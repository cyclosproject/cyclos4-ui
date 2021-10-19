import { NgModule, Optional, SkipSelf } from '@angular/core';
import { AuthHelperService } from 'app/core/auth-helper.service';
import { CaptchaHelperService } from 'app/core/captcha-helper.service';
import { CameraService } from 'app/core/camera.service';
import { ConfirmationService } from 'app/core/confirmation.service';
import { CoreBasicModule } from 'app/core/core-basic.module';
import { FieldHelperService } from 'app/core/field-helper.service';
import { PushNotificationsService } from 'app/core/push-notifications.service';
import { UserCacheService } from 'app/core/user-cache.service';
import { StoredFileCacheService } from 'app/core/stored-file-cache.service';
import { SharedModule } from 'app/shared/shared.module';

/**
 * Module that declares components used only by the core app module
 */
@NgModule({
  imports: [
    CoreBasicModule,
    SharedModule,
  ],
  exports: [
    SharedModule,
  ],
  providers: [
    CameraService,
    ConfirmationService,
    PushNotificationsService,
    UserCacheService,
    StoredFileCacheService,
    AuthHelperService,
    CaptchaHelperService,
    FieldHelperService,
  ]
})
export class CoreModule {
  constructor(
    @Optional() @SkipSelf() parentModule: CoreModule,
  ) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded. '
        + 'It should only be imported in AppModule');
    }
  }
}
