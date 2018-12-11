import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { User } from 'app/api/models';
import { BreadcrumbService } from 'app/core/breadcrumb.service';
import { FormatService } from 'app/core/format.service';
import { LoginService } from 'app/core/login.service';
import { LayoutService } from 'app/shared/layout.service';

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
    public login: LoginService,
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
