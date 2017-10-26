import { Component, ChangeDetectionStrategy, Input, OnInit, OnDestroy } from "@angular/core";
import { TdStepsComponent, TdStepComponent, IStepChangeEvent, StepState } from "@covalent/core";
import { BehaviorSubject, Subscription } from "rxjs";
import { Observable } from "rxjs/Observable";

/**
 * Controls a teradata covalent stepper to implement the logic of a linear stepper
 */
@Component({
  selector: 'linear-stepper-control',
  template: '<ng-content></ng-content>',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LinearStepperControlComponent implements OnInit, OnDestroy {

  @Input() stepper: TdStepsComponent;

  activeStep = new BehaviorSubject<TdStepComponent>(null);

  disabledSteps = new BehaviorSubject<Set<TdStepComponent>>(new Set());

  private monitors = new Map<TdStepComponent, Observable<boolean>>();
  private subscriptions: Subscription[] = [];

  ngOnInit() {
    this.stepper.onStepChange.subscribe((event: IStepChangeEvent) => {
      this.activate(event.newStep);
    });

    let sub = this.activeStep.subscribe(step => {
      if (step) {
        this.doActivate(step);
      }
    });
    this.subscriptions.push(sub);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Returns an observable notified when the given step active status has changed
   */
  monitor(step: TdStepComponent): Observable<boolean> {
    let mon = this.monitors.get(step);
    if (mon == null) {
      let subj = new BehaviorSubject<boolean>(this.activeStep.value == step);
      let sub = this.activeStep.subscribe(it => {
        if (step == it) {
          subj.next(true);
        } else if (subj.value) {
          subj.next(false);
        }
      });
      this.subscriptions.push(sub);
      mon = subj.asObservable();
      this.monitors.set(step, mon);
    }
    return mon;
  }

  /**
   * Activates the given step
   */
  activate(step: TdStepComponent): void {
    this.activeStep.next(step);
  }

  /**
   * Marks the given step as disabled, so it is never activated
   */
  disable(step: TdStepComponent) {
    let disabled = this.disabledSteps.value;
    if (!disabled.has(step)) {
      disabled.add(step);
      this.disabledSteps.next(disabled);
    }
  }

  /**
   * Re-enables a step previously marked as disabled
   */
  enable(step: TdStepComponent) {
    let disabled = this.disabledSteps.value;
    if (disabled.has(step)) {
      disabled.delete(step);
      this.disabledSteps.next(disabled);
    }
  }  

  private doActivate(step: TdStepComponent) {
    // Disable all steps greater than the current step
    let steps = this.stepper.steps;
    let index = steps.indexOf(step);
    let disabled = this.disabledSteps.value;
    for (let i = 0; i < steps.length; i++) {
      let current = steps[i];
      current.disabled = disabled.has(current) || i > index;
      if (i > index) {
        current.state = StepState.None;
      } else if (i < index) {
        if (this.disabledSteps.value.has(current)) {
          current.state = StepState.None;
        } else {
          current.state = StepState.Complete;
        }
      }
    }
    step.open();
  }

}