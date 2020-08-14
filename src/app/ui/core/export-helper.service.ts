import { HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ExportFormat } from 'app/api/models';
import { I18n } from 'app/i18n/i18n';
import { Action, HeadingAction } from 'app/shared/action';
import { downloadResponse, empty } from 'app/shared/helper';
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';

/**
 * Helper service for handling file exports
 */
@Injectable({
  providedIn: 'root',
})
export class ExportHelperService {

  constructor(private i18n: I18n) {
  }

  /**
   * Return a `HeadingAction` that can be used on pages to export data.
   * @param callback A callback invoked when the action is selected. The callback should call the corresponding service to get the content
   */
  headingActions(formats: ExportFormat[], callback: (f: ExportFormat) => Observable<HttpResponse<Blob>>): HeadingAction[] {
    if (empty(formats)) {
      return [];
    }
    if (formats.length === 1) {
      const format = formats[0];
      // When there's a single export format, and is PDF, display as 'Print'
      if (format.internalName === 'pdf') {
        return [new HeadingAction('print', this.i18n.general.print, this.downloadHandler(format, callback), true)];
      } else {
        return [new HeadingAction('save_alt', this.i18n.general.downloadAs(format.name), this.downloadHandler(format, callback), true)];
      }
    } else {
      // When multiple export formats, handle them as sub-actions
      const action = new HeadingAction('save_alt', this.i18n.general.download, () => null);
      action.subActions = formats.map(f => new Action(f.name, this.downloadHandler(f, callback)));
      return [action];
    }
  }

  private downloadHandler(format: ExportFormat, callback: (f: ExportFormat) => Observable<HttpResponse<Blob>>) {
    return () => {
      callback(format).pipe(first()).subscribe(downloadResponse);
    };
  }

  /**
   * Returns a heading action that prints the current page
   */
  printAction() {
    return new HeadingAction('print', this.i18n.general.print, () => self.print());
  }
}
