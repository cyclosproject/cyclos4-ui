import { Component, OnInit, ChangeDetectionStrategy, Injector } from '@angular/core';
import { BaseComponent } from './base.component';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'breadcrumb',
  templateUrl: 'breadcrumb.component.html',
  styleUrls: ['breadcrumb.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class BreadcrumbComponent extends BaseComponent {
  constructor(injector: Injector) {
    super(injector);
  }

  entries = this.breadcrumb.breadcrumb;

  isCurrent(url: string): boolean {
    const entries = this.entries.value;
    if (entries.length === 0) {
      return false;
    }
    return entries[entries.length - 1].url === url;
  }
}
