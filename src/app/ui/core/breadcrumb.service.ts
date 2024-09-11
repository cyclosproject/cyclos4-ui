import { Injectable } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { DataForFrontendHolder } from 'app/core/data-for-frontend-holder';
import { empty } from 'app/shared/helper';
import { BehaviorSubject } from 'rxjs';
import { filter, map } from 'rxjs/operators';

const IGNORE_BREADCRUMB = ['', '/home', '/login', '/forgot-password'];

/**
 * Service used to navigate between pages and managing the component state
 */
@Injectable({
  providedIn: 'root'
})
export class BreadcrumbService {
  url$ = new BehaviorSubject<string>(null);

  /**
   * The current breadcrumb entries
   */
  breadcrumb$ = new BehaviorSubject<string[]>([]);

  constructor(private router: Router, dataForFrontendHolder: DataForFrontendHolder) {
    dataForFrontendHolder.subscribe(() => this.clear());
    this.router.events
      .pipe(
        filter(e => e instanceof NavigationStart),
        map(e => e as NavigationStart)
      )
      .subscribe(event => {
        this.onRouterEvent(event);
      });
  }

  /**
   * Returns whether the breadcrumb is empty
   */
  get empty(): boolean {
    return empty(this.breadcrumb$.value);
  }

  /**
   * Indicates whether the current element is the dashboard
   */
  get dashboardOnly(): boolean {
    const value = this.breadcrumb$.value;
    return value?.length > 0 && value[value.length - 1] === '/dashboard';
  }

  /**
   * Clears the navigation state
   */
  clear(): void {
    this.breadcrumb$.next([]);
  }

  private onRouterEvent(event: NavigationStart): void {
    this.url$.next(event.url);

    if (IGNORE_BREADCRUMB.includes(event.url)) {
      // Ignore the breadcrumb for this URL
      return;
    }

    let entries = this.breadcrumb$.value;

    // Find the breadcrumb entry for this path
    let index = -1;
    for (let i = entries.length - 1; i >= 0; i--) {
      if (entries[i] === event.url) {
        index = i;
        break;
      }
    }
    if (index >= 0) {
      // Going back to an URL that was previously in navigation
      entries.splice(index + 1, entries.length - index - 1);
    } else {
      // Going to a new URL
      entries = entries.slice();
      entries.push(event.url);
    }
    this.breadcrumb$.next(entries);
  }

  /**
   * Goes back one or more levels
   */
  back(count = 1): boolean {
    const breadcrumb = this.breadcrumb$.value;
    if (breadcrumb.length > count) {
      history.go(-count);
      return true;
    }
    return false;
  }

  /**
   * Removes the last entry in the breadcrumb and returns it, without triggering any navigation
   */
  pop(): string | undefined {
    const breadcrumb = this.breadcrumb$.value;
    if (breadcrumb.length > 0) {
      const result = breadcrumb[breadcrumb.length - 1];
      this.breadcrumb$.next(breadcrumb.slice(0, breadcrumb.length - 1));
      return result;
    }
  }
}
