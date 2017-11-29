
// Load the DataForUi before showing the application
import { FormatService } from 'app/core/format.service';
import { UIService } from 'app/api/services';
import { UiKind, DataForUi } from 'app/api/models';
import { Provider, APP_INITIALIZER, Injector } from '@angular/core';

import { environment } from 'environments/environment';
import { ApiInterceptor } from 'app/core/api.interceptor';
import { HttpErrorResponse } from '@angular/common/http/src/response';
import { ErrorHandlerService } from 'app/core/error-handler.service';

export function loadDataForUi(injector: Injector): Function {

  const init = (dataForUi: DataForUi) => {
    // Initialize the FormatService
    const formatService = injector.get(FormatService);
    formatService.initialize(dataForUi);

    // Initialize the favorite icon
    const pageIcon = document.getElementById('pageIcon') as HTMLLinkElement;
    pageIcon.href = formatService.getLogoUrl('SHORTCUT_ICON');

    // Initialize the body lang
    document.body.lang = dataForUi.language.code;

    return dataForUi;
  };

  if (environment.dataForUi) {
    // The DataForUi is hardcoded in the environment - just get it
    return () => {
      return init(environment.dataForUi);
    };
  } else {
    // Fetch from the server
    const params: UIService.DataForUiParams = {
      kind: UiKind.PAY,
      themeIf: 'false',
      headerIf: 'false',
      footerIf: 'false'
    };
    return () => {
      const uiService = injector.get(UIService);
      const interceptor = injector.get(ApiInterceptor);
      // Set the interceptor to ignore any errors. In case some occurred, will retry once.
      interceptor.ignoreNextError();
      uiService.dataForUi(params)
      .toPromise()
      .then(init)
      .catch((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Had an invalid session token. Clear it and try again.
          interceptor.sessionToken = null;
          uiService.dataForUi(params).subscribe(init);
        } else {
          // Handle the error
          injector.get(ErrorHandlerService).handleHttpError(error);
        }
      });
    };
  }
}
export const LOAD_DATA_FOR_UI: Provider = {
  provide: APP_INITIALIZER,
  useFactory: loadDataForUi,
  deps: [Injector],
  multi: true
};
