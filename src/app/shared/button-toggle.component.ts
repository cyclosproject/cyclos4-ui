import {
  ChangeDetectionStrategy, Component, Injector, Input, Optional, Host, SkipSelf, ViewChild, ElementRef
} from '@angular/core';
import { BaseControlComponent } from 'app/shared/base-control.component';
import { BehaviorSubject } from 'rxjs';
import { ControlContainer, NG_VALUE_ACCESSOR } from '@angular/forms';
import { LayoutService } from 'app/shared/layout.service';
import { TooltipDirective } from 'ngx-bootstrap/tooltip';
import { IconComponent } from 'app/shared/icon.component';

/**
 * A button that switches between two icons.
 */
@Component({
  selector: 'button-toggle',
  templateUrl: 'button-toggle.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: ButtonToggleComponent, multi: true }
  ]
})
export class ButtonToggleComponent extends BaseControlComponent<boolean> {

  icon$ = new BehaviorSubject<string>(null);

  @Input() onIcon: string;
  @Input() offIcon: string;
  @Input() iconTooltip: string;

  @ViewChild('button', { static: true }) button: ElementRef;
  @ViewChild(IconComponent, { static: true }) iconComponent: IconComponent;
  @ViewChild('ttip', { static: true }) ttip: TooltipDirective;

  state: boolean;

  constructor(injector: Injector,
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    private layout: LayoutService) {
    super(injector, controlContainer);
  }

  toggle() {
    this.state = !this.state;
    this.setValue(this.state);
    this.ttip.hide();
  }

  onValueInitialized(value: boolean) {
    this.state = value;
    // Update the icon whenever the value changes
    this.iconComponent.icon = this.icon;
  }

  onDisabledChange(isDisabled: boolean) {
    if (this.layout.xxs) {
      this.button.nativeElement.style.display = isDisabled ? 'none' : '';
    } else {
      this.button.nativeElement.style.visibility = isDisabled ? 'hidden' : '';
    }
  }

  get icon(): string {
    return this.state ? this.onIcon : this.offIcon;
  }

  get tooltip(): string {
    const currentState = this.state ? this.i18n.general.enabled : this.i18n.general.disabled;
    return this.iconTooltip + ': ' + currentState.toLowerCase();
  }

}
