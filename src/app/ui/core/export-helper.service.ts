import { HttpResponse } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { ExportFormat } from 'app/api/models';
import { SvgIcon } from 'app/core/svg-icon';
import { I18n, I18nInjectionToken } from 'app/i18n/i18n';
import { Action, HeadingAction } from 'app/shared/action';
import { downloadResponse, empty, setRootSpinnerVisible } from 'app/shared/helper';
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';

/**
 * Helper service for handling file exports
 */
@Injectable({
  providedIn: 'root'
})
export class ExportHelperService {
  static EXPORT_ACTION = 'exportAction';

  constructor(@Inject(I18nInjectionToken) private i18n: I18n) {}

  /**
   * Return a `HeadingAction` that can be used on pages to export data.
   * @param callback A callback invoked when the action is selected. The callback should call the corresponding service to get the content
   */
  headingActions(
    formats: ExportFormat[],
    callback: (f: ExportFormat) => Observable<HttpResponse<Blob>>
  ): HeadingAction[] {
    if (empty(formats)) {
      return [];
    }
    if (formats.length === 1) {
      const format = formats[0];
      // When there's a single export format, and is PDF, display as 'Print'
      if (format.internalName === 'pdf') {
        const action = new HeadingAction(
          SvgIcon.Printer,
          this.i18n.general.print,
          this.downloadHandler(format, callback),
          true
        );
        action.id = ExportHelperService.EXPORT_ACTION;
        return [action];
      } else {
        const action = new HeadingAction(
          SvgIcon.Download,
          this.i18n.general.downloadAs(format.name),
          this.downloadHandler(format, callback),
          true
        );
        action.id = ExportHelperService.EXPORT_ACTION;
        return [action];
      }
    } else {
      // When multiple export formats, handle them as sub-actions
      const action = new HeadingAction(SvgIcon.Download, this.i18n.general.download, () => null, true);
      action.subActions = formats.map(f => new Action(f.name, this.downloadHandler(f, callback)));
      action.id = ExportHelperService.EXPORT_ACTION;
      return [action];
    }
  }

  private downloadHandler(format: ExportFormat, callback: (f: ExportFormat) => Observable<HttpResponse<Blob>>) {
    return () => {
      setRootSpinnerVisible(true, false);
      callback(format)
        .pipe(first())
        .subscribe(
          r => {
            setRootSpinnerVisible(false);
            downloadResponse(r);
          },
          () => setRootSpinnerVisible(false)
        );
    };
  }

  /**
   * Returns a heading action that prints the current page
   */
  printAction() {
    return new HeadingAction(SvgIcon.Printer, this.i18n.general.print, () => self.print());
  }
}
