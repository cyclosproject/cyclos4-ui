import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { SendMediumEnum, WizardExecutionData, WizardStepKind } from 'app/api/models';
import { WizardsService } from 'app/api/services/wizards.service';
import { SvgIcon } from 'app/core/svg-icon';
import { BaseComponent } from 'app/shared/base.component';
import { RunWizardComponent } from 'app/ui/wizards/run-wizard.component';
import { BehaviorSubject } from 'rxjs';

const TimeoutSeconds = 30;

/**
 * Step in a custom wizard - email or phone verification
 */
@Component({
  selector: 'run-wizard-step-verification',
  templateUrl: 'run-wizard-step-verification.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RunWizardStepVerificationComponent extends BaseComponent implements OnInit {
  @Input() data: WizardExecutionData;
  @Input() control: FormControl;

  sendMedium: SendMediumEnum;
  to: string;
  icon: SvgIcon;
  message: string;
  seconds: number;
  sendMessage = new BehaviorSubject('');
  allowNewCode = new BehaviorSubject(false);
  timerControl: any;

  constructor(injector: Injector, private wizardsService: WizardsService, public runWizard: RunWizardComponent) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    const email = this.data.step.kind !== WizardStepKind.PHONE_VERIFICATION;
    this.sendMedium = email ? SendMediumEnum.EMAIL : SendMediumEnum.SMS;
    this.to = email ? this.data.codeSentToEmail : this.data.codeSentToPhone;
    this.icon = email ? SvgIcon.Envelope : SvgIcon.Phone;
    this.message = email
      ? this.i18n.wizard.verification.sentToEmail(this.to)
      : this.i18n.wizard.verification.sentToPhone(this.to);
    this.codeResent();
  }

  codeResent() {
    this.seconds = TimeoutSeconds;
    this.allowNewCode.next(false);
    this.timerControl = setInterval(() => {
      if (this.seconds <= 1) {
        clearInterval(this.timerControl);
        this.allowNewCode.next(true);
      } else {
        this.sendMessage.next(this.i18n.wizard.verification.new.seconds(--this.seconds));
      }
    }, 1000);
    this.sendMessage.next(this.i18n.wizard.verification.new.seconds(this.seconds));
  }

  get codeSentMessage() {
    return () => this.i18n.wizard.codeSent;
  }

  sendNewCode(event: MouseEvent) {
    event.preventDefault();

    this.addSub(
      this.wizardsService
        .sendWizardVerificationCode({
          key: this.data.key,
          body: { medium: this.sendMedium }
        })
        .subscribe(() => {
          this.codeResent();
          this.notification.snackBar(this.i18n.general.sentCodeTo(this.to));
        })
    );
  }
}
