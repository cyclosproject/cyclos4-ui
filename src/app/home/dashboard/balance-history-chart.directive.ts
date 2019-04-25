import { Directive, ElementRef, Input, OnInit } from '@angular/core';
import { AccountBalanceHistoryResult } from 'app/api/models';
import { Chart } from 'chart.js';
import moment from 'moment-mini-ts';
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
    setTimeout(() => this.initialize(), 100);
  }

  private initialize() {
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
          borderColor: this.layout.chartColor,
          backgroundColor: 'transparent'
        }]
      },
      options: {
        legend: {
          display: false
        },
        animation: {
          duration: 0
        },
        tooltips: {
          callbacks: {
            title: item => {
              return item.map(i => {
                const balance = this.history.balances[i.index];
                return this.format.formatAsDate(balance.date);
              });
            },
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
