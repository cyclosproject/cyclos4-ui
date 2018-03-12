import { Injectable } from '@angular/core';
import { MatIconRegistry } from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';

/**
 * Intercepts requests to set the correct headers and handle errors
 */
@Injectable()
export class SvgIconRegistry {

  private registeredNames: string[] = [];

  constructor(
    private matIconRegistry: MatIconRegistry,
    private sanitizer: DomSanitizer) {
    this.register('account_balance_circle');
  }

  private register(name: string): void {
    this.matIconRegistry.addSvgIcon(name, this.sanitizer.bypassSecurityTrustResourceUrl(`icons/${name}.svg`));
    this.registeredNames.push(name);
  }

  /**
   * Returns whether an icon with the given name is an SVG icon
   * @param name The icon name
   */
  isSvgIcon(name: string) {
    return this.registeredNames.includes(name);
  }

}
