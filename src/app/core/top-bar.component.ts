import { Component, OnInit, ChangeDetectionStrategy, Output, EventEmitter, Input } from '@angular/core';
import { FormatService } from 'app/core/format.service';
import { User } from 'app/api/models';
import { LayoutService } from 'app/shared/layout.service';
import { BreadcrumbService } from 'app/core/breadcrumb.service';
import { Router } from '@angular/router';

/**
 * The top bar, which is always visible
 */
@Component({
  selector: 'top-bar',
  templateUrl: 'top-bar.component.html',
  styleUrls: ['top-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopBarComponent implements OnInit {
  constructor(
    public breadcrumb: BreadcrumbService,
    public format: FormatService,
    public layout: LayoutService,
    public router: Router) {
  }

  @Input() user: User;
  @Input() principal: string;

  @Output() togglePersonalMenu = new EventEmitter<HTMLElement>();
  @Output() toggleSidenav = new EventEmitter<void>();

  ngOnInit(): void {
  }
}
