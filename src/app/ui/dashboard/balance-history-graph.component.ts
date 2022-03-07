import { AfterViewInit, ChangeDetectionStrategy, Component, Injector, Input } from '@angular/core';
import { FrontendDashboardAccount } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
import moment from 'moment-mini-ts';
import { BehaviorSubject, interval } from 'rxjs';
import { takeWhile } from 'rxjs/operators';

export interface DataPoint {
  x: number;
  y: number;
  value: number;
  formattedValue: string;
}

/**
 * A result when result type is map.
 */
@Component({
  selector: 'balance-history-graph',
  templateUrl: 'balance-history-graph.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BalanceHistoryGraphComponent extends BaseComponent implements AfterViewInit {

  @Input() account: FrontendDashboardAccount;

  initialized$ = new BehaviorSubject(false);

  width: number;
  xMin: number;
  xMax: number;
  height: number;
  yMin: number;
  yMax: number;

  xPoints: number[];
  yPoints: number[];
  xLabels: string[];
  yLabels: string[];

  data: DataPoint[];
  linePoints: string;

  constructor(injector: Injector) {
    super(injector);
  }

  ngAfterViewInit() {
    const element = this.element;
    this.addSub(interval(50).pipe(takeWhile(() => !this.initialized$.value)).subscribe(() => {
      const rect = element.getBoundingClientRect();
      if (rect.width > 0) {
        this.init(rect);
        this.initialized$.next(true);
      }
    }));
  }

  private init(bb: DOMRect): void {
    this.width = bb.width;
    this.height = bb.height;
    this.xMax = this.width - 20;
    this.yMin = 15;
    this.yMax = this.height - 40;

    const currency = this.account.account.currency;
    const balances = (this.account?.balances || []);
    if (balances.length <= 1) {
      // Won't show a graph with a single data point
      return;
    }
    const values = balances.map(b => parseFloat(b.amount));
    let maxValue = Math.max(...values);
    let minValue = Math.min(...values);
    let valueRange = maxValue - minValue;

    // Rescale the displayed max / min according to the actual range.
    // For example, from 1345 to 1378, consider from 1300 to 1400.
    let rangeStr = String(Math.floor(valueRange));
    if (rangeStr.startsWith('-')) {
      rangeStr = rangeStr.substring(1);
    }
    const rangePower = Math.pow(10, Math.max(0, rangeStr.length - 2));
    maxValue = Math.floor(maxValue / rangePower) * rangePower + rangePower;
    minValue = Math.floor(minValue / rangePower) * rangePower;
    valueRange = maxValue - minValue;

    const yRange = this.yMax - this.yMin;
    const yPos = (v: number) => {
      if (v > maxValue || v < minValue) {
        console.error(`Bad range! Expected from ${minValue} to ${maxValue}, got ${v}`);
      }
      const rescaled = ((v - minValue) * yRange / valueRange);
      return this.yMax - rescaled;
    };

    const distinct = new Set(values).size;
    const ySize = Math.min(3, distinct);
    this.yPoints = [];
    this.yLabels = [];
    const yDiv = valueRange / ySize;
    for (let i = 0; i <= ySize; i++) {
      const value = yDiv * i + minValue;
      this.yPoints.push(yPos(value));
      this.yLabels.unshift(this.format.formatAsNumber(value, 0));
    }
    this.xLabels = balances.map(balance => this.format.shortMonthName(moment(balance.date).month()));

    // Calculate the minimum x spot based on the largest label
    const maxLength = Math.max(...(this.yLabels.map(l => l.length)));
    this.xMin = 20 + 7 * maxLength;

    const xDiv = (this.xMax - this.xMin) / (balances.length - 1);
    this.xPoints = [];
    for (let i = 0; i <= balances.length - 1; i++) {
      this.xPoints.push(this.xMin + i * xDiv);
    }

    this.data = balances.map((balance, i) => {
      const value = parseFloat(balance.amount);
      return {
        x: this.xPoints[i],
        y: yPos(value),
        value,
        formattedValue: this.format.formatAsCurrency(currency, balance.amount)
      };
    });

    this.linePoints = '';
    this.data.forEach(p => this.linePoints += ` ${p.x},${p.y}`);
    this.linePoints = this.linePoints.trim();
  }
}
