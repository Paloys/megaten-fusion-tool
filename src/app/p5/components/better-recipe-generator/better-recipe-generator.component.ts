import { Component } from '@angular/core';

@Component({
  template: `
    <app-recipe-generator
      [defaultDemon]="defaultDemon"
      [maxSkills]="maxSkills"
      [compendium]="compendium"
      [squareChart]="squareChart"
      [recipeConfig]="recipeConfig">
    </app-recipe-generator>
  `
})
export class BetterRecipeGeneratorComponent {
  defaultDemon: any;
  maxSkills: any;
  compendium: any;
  squareChart: any;
  recipeConfig: any;

}
