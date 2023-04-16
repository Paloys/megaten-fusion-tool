import {Component, OnDestroy, OnInit} from '@angular/core';
import {Compendium, RecipeGeneratorConfig, SquareChart} from "../../compendium/models";
import {FusionDataService} from "../fusion-data.service";
import {Title} from "@angular/platform-browser";
import {Subscription} from "rxjs";

@Component({
  template: `
    <app-recipe-generator
      [defaultDemon]="defaultDemon"
      [maxSkills]="maxSkills"
      [compendium]="compendium"
      [squareChart]="squareChart"
      [recipeConfig]="recipeConfig"
      [better]="better">
    </app-recipe-generator>
  `
})
export class BetterRecipeGeneratorComponent implements OnInit, OnDestroy {
  defaultDemon = "Pixie";
  maxSkills = 8;
  compendium: Compendium;
  squareChart: SquareChart;
  recipeConfig: RecipeGeneratorConfig;
  subscriptions: Subscription[] = [];
  better = true;

  constructor(private fusionDataService: FusionDataService, private title: Title) {
    const compConfig = this.fusionDataService.compConfig;
    this.maxSkills = compConfig.skillElems.includes('tra') ? 9 : 8;
    this.recipeConfig = {
      fissionCalculator: this.fusionDataService.fissionCalculator,
      fusionCalculator: this.fusionDataService.fusionCalculator,
      races: compConfig.races,
      skillElems: compConfig.skillElems,
      inheritElems: compConfig.inheritElems,
      restrictInherits: true,
      triExclusiveRaces: [],
      triFissionCalculator: null,
      triFusionCalculator: null
    };
  }

  ngOnInit()    { this.setTitle(); this.subscribeAll(); }
  ngOnDestroy() { this.unsubscribeAll(); }

  setTitle() {
    this.title.setTitle(`Recipe Generator - ${this.fusionDataService.appName}`);
  }

  subscribeAll() {
    this.subscriptions.push(
      this.fusionDataService.compendium.subscribe(comp => {
        this.compendium = comp;
      }));

    this.subscriptions.push(
      this.fusionDataService.fusionChart.subscribe(chart => {
        this.squareChart = {
          normalChart: chart,
          tripleChart: chart,
          raceOrder: this.fusionDataService.compConfig.raceOrder
        }
      }));
  }

  unsubscribeAll() {
    for (const subscription of this.subscriptions) { subscription.unsubscribe(); }
  }

}
