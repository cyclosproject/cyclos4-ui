import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';

/**
 * Helper service that loads external scripts on demand
 * Based on https://gist.github.com/alexzuza/55f1c7567a0fede48403a5a791661bb7
 */
@Injectable({
  providedIn: 'root'
})
export class ScriptLoaderService {
  _loadedLibraries: { [url: string]: ReplaySubject<any> } = {};

  constructor(@Inject(DOCUMENT) private readonly document: HTMLDocument) {}

  /**
   * Loads a script from the given URL
   */
  loadScript(url: string): Observable<any> {
    let subject: ReplaySubject<any> = this._loadedLibraries[url];
    if (!subject) {
      subject = new ReplaySubject();
      this._loadedLibraries[url] = subject;

      const script = this.document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.src = url;
      script.onload = () => {
        subject.next();
        subject.complete();
      };
      script.onerror = e => {
        subject.error(e);
        subject.complete();
      };
      script.onabort = e => {
        subject.error(e);
        subject.complete();
      };
      this.document.body.appendChild(script);
    }
    return subject.asObservable();
  }
}
