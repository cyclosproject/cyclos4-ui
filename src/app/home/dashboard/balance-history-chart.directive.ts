import { Directive, ElementRef, Input, OnInit } from '@angular/core';
import { AccountBalanceHistoryResult } from 'app/api/models';
import { Chart } from 'chart.js';
import * as moment from 'moment-mini-ts';
import { FormatService } from 'app/core/format.service';
import { LayoutService } from 'app/shared/layout.service';

/**
 * Renders a chart on a given canvas
 */
@Directive({
  selector: 'canvas[balanceHistoryChart]'
})
export class BalanceHistoryChartDirective implements OnInit {

  @Input() history: AccountBalanceHistoryResult;

  chart: Chart;

  constructor(
    private element: ElementRef,
    private format: FormatService,
    private layout: LayoutService) {
  }

  ngOnInit() {
    const canvas: HTMLCanvasElement = this.element.nativeElement;
    const amounts = this.history.balances.map(b => parseFloat(b.amount));
    const hasNegative = amounts.find(a => a < 0);
    const currency = this.history.account.currency;
    this.chart = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: this.labels(),
        datasets: [{
          data: amounts,
          borderWidth: 3,
          lineTension: 0,
          borderColor: this.layout.secondaryColor,
          backgroundColor: 'transparent'
        }]
      },
      options: {
        legend: {
          display: false
        },
        tooltips: {
          callbacks: {
            label: n => this.format.formatAsCurrency(currency, amounts[n.index])
          },
          displayColors: false
        },
        scales: {
          xAxes: [{
            gridLines: {
              display: false
            }
          }],
          yAxes: [{
            gridLines: {
              display: false
            },
            ticks: {
              beginAtZero: !hasNegative,
              maxTicksLimit: 4,
              callback: n => this.format.formatAsCurrency(currency, n)
            }
          }]
        }
      }
    });
  }

  private labels(): string[] {
    return this.history.balances.map(b => this.format.shortMonthName(moment(b.date).month()));
  }
}
