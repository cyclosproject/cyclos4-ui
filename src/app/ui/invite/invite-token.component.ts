import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

/**
 * Stores the invite token and redirects to the home page
 */
@Component({
  selector: 'invite-token',
  templateUrl: 'invite-token.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InviteTokenComponent implements OnInit {

  constructor(private router: Router, private route: ActivatedRoute) {
  }

  ngOnInit() {
    const route = this.route.snapshot;
    localStorage.setItem('inviteToken', route.params.token);
    this.router.navigate(['/home']);
  }

}
