import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { VoucherState } from 'app/voucher/voucher-state';

@Injectable()
export class VoucherGuard implements CanActivate {
  constructor(private state: VoucherState, private router: Router) {}

  canActivate(_route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): boolean | UrlTree {
    if (this.state.voucher?.token) {
      return true;
    }
    this.router.navigate(['token']);
    return false;
  }
}
