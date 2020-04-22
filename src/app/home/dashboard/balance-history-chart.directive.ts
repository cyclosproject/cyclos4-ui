import { Directive, ElementRef, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { AccountBalanceHistoryResult } from 'app/api/models';
import { FormatService } from 'app/core/format.service';
import { LayoutService } from 'app/shared/layout.service';
import { Chart } from 'chart.js';
import moment from 'moment-mini-ts';

/**
 * Renders a chart on a given canvas
 */
@Directive({
  selector: 'canvas[balanceHistoryChart]',
})
export class BalanceHistoryChartDirective implements OnInit, OnChanges {

  @Input() history: AccountBalanceHistoryResult;

  // This is actually used to force change detection when dark theme changes
  @Input() darkTheme: boolean;

  private chart: Chart;
  private amounts: number[];

  constructor(
    private element: ElementRef,
    private format: FormatService,
    private layout: LayoutService) {
  }

  ngOnInit() {
    this.initialize();
    setTimeout(() => this.chart.update(), 100);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.chart && changes.darkTheme) {
      this.setColors();
      setTimeout(() => this.chart.update(), 400);
    }
  }

  private initialize() {
    const canvas: HTMLCanvasElement = this.element.nativeElement;
    this.amounts = this.history.balances.map(b => parseFloat(b.amount));
    const hasNegative = this.amounts.find(a => a < 0);
    const currency = this.history.account.currency;
    this.chart = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: this.labels(),
        datasets: [{
          data: this.amounts,
          borderWidth: 3,
          lineTension: 0,
          backgroundColor: 'transparent',
        }],
      },
      options: {
        legend: {
          display: false,
        },
        animation: {
          duration: 0,
        },
        tooltips: {
          callbacks: {
            title: item => {
              return item.map(i => {
                const balance = this.history.balances[i.index];
                return this.format.formatAsDate(balance.date);
              });
            },
            label: n => this.format.formatAsCurrency(currency, this.amounts[n.index]),
          },
          displayColors: false,
        },
        scales: {
          xAxes: [{
            gridLines: {
              display: false,
            },
          }],
          yAxes: [{
            gridLines: {
              display: false,
            },
            ticks: {
              beginAtZero: !hasNegative,
              maxTicksLimit: 4,
              callback: n => this.format.formatAsCurrency(currency, n),
            },
          }],
        },
      },
    });
    this.setColors();
  }

  private setColors() {
    this.chart.data.datasets[0].borderColor = this.layout.chartColor;

    const options = this.chart.config.options;
    options.legend.labels.fontColor = this.layout.bodyColor;
    const x = options.scales.xAxes[0];
    const y = options.scales.yAxes[0];
    for (const axis of [x, y]) {
      axis.gridLines.display = true;
      axis.gridLines.drawBorder = true;
      axis.gridLines.drawTicks = true;
      axis.gridLines.drawOnChartArea = false;
      axis.gridLines.color = this.layout.borderColor;
      axis.ticks.fontColor = this.layout.textMutedColor;
    }
  }

  private labels(): string[] {
    return this.history.balances.map(b => this.format.shortMonthName(moment(b.date).month()));
  }

}
