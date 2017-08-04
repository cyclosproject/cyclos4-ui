
// Load the DataForUi before showing the application
import { FormatService } from "app/core/format.service";
import { UIService } from "app/api/services";
import { UiKind, DataForUi } from "app/api/models";
import { Provider, APP_INITIALIZER } from "@angular/core";

import { environment } from "environments/environment"

export function loadDataForUi(formatService: FormatService, uiService: UIService): Function {
  let init = (dataForUi: DataForUi) => {
    // Initialize the FormatService
    formatService.initialize(dataForUi);

    // Initialize the favorite icon
    let pageIcon = document.getElementById("pageIcon") as HTMLLinkElement;
    pageIcon.href = formatService.getLogoUrl('SHORTCUT_ICON');

    // Initialize the body lang
    document.body.lang = dataForUi.language.code;

    return dataForUi;
  }

  if (environment.dataForUi) {
    // The DataForUi is hardcoded in the environment - just get it
    return () => {
      return init(environment.dataForUi)
    }
  } else {
    // Fetch from the server
    let params: UIService.DataForUiParams = {
      kind: UiKind.PAY,
      themeIf: "false",
      headerIf: "false",
      footerIf: "false"
    }
    return () => uiService.dataForUi(params)
      .then(response => {
        return init(response.data);
      });
  }
}
export const LOAD_DATA_FOR_UI: Provider = {
  provide: APP_INITIALIZER,
  useFactory: loadDataForUi,
  deps: [FormatService, UIService],
  multi: true
};
