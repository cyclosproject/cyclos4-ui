import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml, SafeStyle, SafeScript, SafeUrl, SafeResourceUrl } from '@angular/platform-browser';

/**
 * Pipe used to trust code (for example, HTML) to be rendered "as-is"
 */
@Pipe({
  name: 'trust'
})
export class TrustPipe implements PipeTransform {

  constructor(private sanitizer: DomSanitizer) {
  }

  public transform(value: string, type: string): SafeHtml | SafeStyle | SafeScript | SafeUrl | SafeResourceUrl {
    switch (type) {
      case 'style':
        return this.sanitizer.bypassSecurityTrustStyle(value);
      case 'script':
        return this.sanitizer.bypassSecurityTrustScript(value);
      case 'url':
        return this.sanitizer.bypassSecurityTrustUrl(value);
      case 'resourceUrl':
        return this.sanitizer.bypassSecurityTrustResourceUrl(value);
      default:
        // Includes HTML
        return this.sanitizer.bypassSecurityTrustHtml(value);
    }
  }

}