import { Injectable } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { BreadCrumbEntry } from './breadcrumb-entry';
import { filter } from 'rxjs/operators/filter';
import { map } from 'rxjs/operators/map';
import { LoginService } from './login.service';

const IGNORE_BREADCRUMB = ['', '/home', '/login'];

/**
 * Service used to navigate between pages and managing the component state
 */
@Injectable()
export class BreadcrumbService {

  /**
   * The current breadcrumb entries
   */
  breadcrumb = new BehaviorSubject<BreadCrumbEntry[]>([]);

  constructor(
    router: Router,
    loginService: LoginService) {
    loginService.subscribeForAuth(a => this.clear());
    router.events
      .pipe(
        filter(e => e instanceof NavigationStart),
        map(e => e as NavigationStart)
      )
      .subscribe(event => {
        this.onRouterEvent(event);
      });
  }

  /**
   * Clears the navigation state
   */
  clear(): void {
    this.breadcrumb.next([]);
  }

  /**
   * Sets the title for the current entry
   */
  set title(title: string) {
    const entries = this.breadcrumb.value.slice();
    if (entries.length === 0) {
      return;
    }
    entries[entries.length - 1].title = title;
    this.breadcrumb.next(entries);
  }

  /**
   * Returns the title for the current entry
   */
  get title(): string {
    const entries = this.breadcrumb.value;
    if (entries.length === 0) {
      return null;
    }
    return entries[entries.length - 1].title;
  }

  private onRouterEvent(event: NavigationStart): void {
    if (IGNORE_BREADCRUMB.includes(event.url)) {
      // Ignore the breadcrumb for this URL
      return;
    }

    let entries = this.breadcrumb.value;

    // Find the breadcrumb entry for this path
    let index = -1;
    for (let i = 0; i < entries.length; i++) {
      if (entries[i].url === event.url) {
        index = i;
        break;
      }
    }
    if (index >= 0) {
      // Going back to an URL that was previously in navigation
      entries.splice(index, entries.length - index - 1);
    } else {
      // Going to a new URL
      entries = entries.slice();
      entries.push(new BreadCrumbEntry(event.url));
    }
    this.breadcrumb.next(entries);
  }

}
