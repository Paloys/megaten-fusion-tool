import { Component, ChangeDetectionStrategy, Input, OnChanges } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder } from '@angular/forms';

import { Demon, Skill, FusionRecipe, Compendium, SquareChart, RecipeGeneratorConfig } from '../../compendium/models';
import { createSkillsRecipe } from '../models/recipe-generator';

@Component({
  selector: 'app-recipe-generator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form">
      <h2>Recipe Generator</h2>
      <table class="entry-table">
        <tr><th colspan="2" class="title">Target</th></tr>
        <tr>
          <th style="width: 40%;">Race</th>
          <th style="width: 60%;">Name</th>
        </tr>
        <tr>
          <td>
            <select formControlName="race" (change)="setDemon(demons[form.controls.race.value][0])">
              <option *ngFor="let race of races" [value]="race">{{ race }}</option>
            </select>
          </td>
          <td>
            <select formControlName="demon" (change)="setDemon(form.controls.demon.value)">
              <option *ngFor="let demon of demons[form.controls.race.value]" [ngValue]="demon">{{ demon.name }}</option>
            </select>
          </td>
        </tr>
      </table>
      <table formArrayName="ingreds" class="entry-table">
        <tr><th colspan="5" class="title">Include Ingredients</th></tr>
        <tr>
          <th style="width: 20%">Search</th>
          <th style="width: 10%">Elem</th>
          <th style="width: 25%">Skill</th>
          <th style="width: 20%">Race</th>
          <th style="width: 25%">Ingredient</th>
        </tr>
        <ng-container *ngFor="let ingred of form.controls.ingreds['controls']; let i = index" [formGroupName]="i">
          <tr *ngIf="i < maxSkills">
            <td>
              <label>Search Skill
                <input formControlName="searchSkill" type="checkbox"
                (change)="setIngredDemon(ingred)">
              </label>
            </td>
            <td>
              <select formControlName="elem"
                [attr.disabled]="!ingred.controls.searchSkill.value || null"
                (change)="setIngredElem(ingred)">
                <option value="-">-</option>
                <option *ngFor="let elem of elems" [value]="elem">{{ elem }}</option>
              </select>
            </td>
            <td>
              <select formControlName="skill"
                [attr.disabled]="!ingred.controls.searchSkill.value || null"
                (change)="setIngredDemon(ingred)">
                <option *ngFor="let skill of skills[ingred.controls.elem.value]" [ngValue]="skill">{{ skill.name }}</option>
              </select>
            </td>
            <td>
              <select formControlName="race"
                [attr.disabled]="ingred.controls.searchSkill.value || null"
                (change)="setIngredDemon(ingred)">
                <option value="-">-</option>
                <option *ngFor="let race of races" [value]="race">{{ race }}</option>
              </select>
            </td>
            <td>
              <select *ngIf="ingred.controls.searchSkill.value" formControlName="demon">
                <option *ngFor="let demon of learnedBy[ingred.controls.skill.value.name]" [ngValue]="demon">{{ demon.name }} {{ demon.lvl ? '(' + demon.lvl + ')' : '' }}</option>
              </select>
              <select *ngIf="!ingred.controls.searchSkill.value" formControlName="demon">
                <option *ngFor="let demon of demons[ingred.controls.race.value]" [ngValue]="demon">{{ demon.name }} {{ demon.lvl ? '(' + demon.lvl + ')' : '' }}</option>
              </select>
            </td>
          </tr>
        </ng-container>
      </table>
      <table *ngIf="recipe" class="entry-table">
        <tr><th colspan="2" class="title">Fusion Recipe</th></tr>
        <tr><th>Left Chain</th><th>Right Chain</th></tr>
        <tr>
          <td style="width: 50%" *ngIf="recipeLeft.length"><ul><li *ngFor="let step of recipeLeft">{{ step }}</li></ul></td>
          <td style="width: 50%" *ngIf="!recipeLeft.length" style="padding: 1em; text-align: center;">No chains found</td>
          <td style="width: 50%" *ngIf="recipeRight.length"><ul><li *ngFor="let step of recipeRight">{{ step }}</li></ul></td>
          <td style="width: 50%" *ngIf="!recipeRight.length" style="padding: 1em; text-align: center;">No chains found</td>
        </tr>
        <tr><td colspan="2" style="padding: 1em; text-align: center;">
          <ng-container *ngIf="recipe.stepR.length">
            {{ recipeResult.join(' x ') }} = {{ recipe.result }}<br>
            [{{ resultSkills.join(', ') }}]
          </ng-container>
          <ng-container *ngIf="!recipe.stepR.length">No recipes found</ng-container>
        </td></tr>
      </table>
    </form>
  `,
  styles: [`
    ul { padding: 0 1em; list-style: none; }
    td select { width: 100%; }
  `]
})
export class RecipeGeneratorComponent implements OnChanges {
  @Input() defaultDemon = 'Pixie';
  @Input() maxSkills = 8;
  @Input() compendium: Compendium;
  @Input() squareChart: SquareChart;
  @Input() recipeConfig: RecipeGeneratorConfig;

  internalMaxSkills = 9;
  range99 = Array(99);
  races: string[];
  elems: string[];
  demons: { [race: string]: Demon[] } = {};
  skills: { [elem: string]: Skill[] } = {};
  learnedBy: { [skill: string]: Demon[] } = {};
  form: UntypedFormGroup;
  recipe: FusionRecipe;
  recipeLeft: string[];
  recipeRight: string[];
  recipeResult: string[];
  resultSkills: string[];

  blankDemon: Demon = {
    name: '-', race: '-', lvl: 0, currLvl: 0, price: 0, inherits: 0,
    skills: {}, stats: [], resists: [], affinities: [],
    fusion: 'normal', prereq: ''
  };

  blankSkill: Skill = {
    name: '-', element: '-', rank: 99, cost: 0,
    effect: '', target: '', level: 0, learnedBy: [{ demon: '-', level: 0 }]
  };

  constructor(private fb: UntypedFormBuilder) { this.createForm(); }

  ngOnChanges() { this.initDropdowns(); }

  createForm() {
    const ingreds = [];

    for (let i = 0; i < this.internalMaxSkills; i++) {
      ingreds.push(this.fb.group({ searchSkill: true, elem: '-', skill: this.blankSkill, race: '-', demon: this.blankDemon }));
    }

    this.form = this.fb.group({
      race: '-',
      demon: this.blankDemon,
      ingreds: this.fb.array(ingreds)
    });

    this.form.valueChanges.subscribe(form => {
      if (this.form.valid) {
        const ingreds = form.ingreds.filter(i => i.demon.name !== '-' && i.demon.name !== form.demon.name).map(i => i.demon.name);
        const skills = form.ingreds.filter(i => i.searchSkill && i.skill.name !== '-').map(i => i.skill.name);
        this.updateRecipe(createSkillsRecipe(form.demon.name, ingreds, skills, this.compendium, this.squareChart, this.recipeConfig));
      }
    });
  }

  setIngredElem(ingred: UntypedFormGroup) {
    ingred.controls.skill.setValue(this.skills[ingred.controls.elem.value][0]);
    this.setIngredDemon(ingred);
  }

  setIngredDemon(ingred: UntypedFormGroup) {
    const searchSkill: boolean = ingred.controls.searchSkill.value;
    const demon: Demon[] = searchSkill ? this.learnedBy[ingred.controls.skill.value.name] : this.demons[ingred.controls.race.value];
    ingred.controls.demon.setValue(demon[0]);
  }

  updateRecipe(recipe: FusionRecipe) {
    const skillRef: { [demon: string]: string[] } = {};

    for (const [skill, demon] of Object.entries(recipe.skills)) {
      if (!skillRef[demon]) { skillRef[demon] = []; }
      const slvl = this.compendium.getDemon(demon).skills[skill];
      skillRef[demon].push(skill + (slvl ? ` (${slvl})` : ''));
    }

    this.recipe = recipe;
    this.recipeLeft = this.decodeRecipechain(recipe.chain1, skillRef);
    this.recipeRight = this.decodeRecipechain(recipe.chain2, skillRef);
    this.resultSkills = [];
    this.recipeResult = [];

    for (const result of recipe.stepR) {
      this.recipeResult.push(skillRef[result] ? `${result} [${skillRef[result].join(', ')}]` : result);
    }

    for (const [skill, slvl] of Object.entries(this.compendium.getDemon(recipe.result).skills)
      .filter(s => s[1] < 2000)
      .sort((a, b) => a[1] - b[1])
    ) {
      this.resultSkills.push(skill + (slvl ? ` (${slvl})` : ''));
    }
  }

  private decodeRecipechain(chain: string[], skillRef: { [demon: string]: string[] } ): string[] {
    const steps = [];

    for (let i = 0; i < chain.length - 2; i += 2) {
      const skills1 = skillRef[chain[i]] ? '[' + skillRef[chain[i]].join(', ') + '] ' : '';
      const skills2 = skillRef[chain[i+1]] ? '[' + skillRef[chain[i+1]].join(', ') + '] ' : '';
      steps.push(`${chain[i]} ${skills1}x ${chain[i+1]} ${skills2}= ${chain[i+2]}`);
    }

    return steps;
  }

  initDropdowns() {
    if (!this.recipeConfig || !this.compendium || !this.squareChart) { return; }

    this.demons = { '-': [this.blankDemon] };
    this.skills = { '-': [this.blankSkill] };
    this.learnedBy = { '-': [this.blankDemon] };

    for (const demon of this.compendium.allDemons) {
      if (!demon.isEnemy) {
        if (!this.demons[demon.race]) { this.demons[demon.race] = []; }
        this.demons[demon.race].push(demon);

        for (const sname of Object.keys(demon.skills)) {
          if (!this.learnedBy[sname]) { this.learnedBy[sname] = []; }
          this.learnedBy[sname].push(demon);
        }
      }
    }

    for (const skill of this.compendium.allSkills.filter(s => s.rank < 50 && s.learnedBy.length > 0)) {
      if (!this.skills[skill.element]) { this.skills[skill.element] = []; }
      this.skills[skill.element].push(skill);
    }

    for (const demonList of Object.values(this.demons)) {
      demonList.sort((a, b) => a.lvl - b.lvl);
    }

    for (const demonList of Object.values(this.learnedBy)) {
      demonList.sort((a, b) => a.lvl - b.lvl);
    }

    for (const skillList of Object.values(this.skills)) {
      skillList.sort((a, b) => a.rank - b.rank);
    }

    this.races = this.recipeConfig.races.filter(r => this.demons[r]);
    this.elems = this.recipeConfig.skillElems.filter(e => this.skills[e]);
    this.setDemon(this.compendium.getDemon(this.defaultDemon));
  }

  setDemon(demon: Demon) {
    const excludeElems: string[] = [];
    const { inheritElems } = this.recipeConfig;
    const innateSkills = Object.entries(demon.skills)
      .filter(s => s[1] === 0)
      .map(s => this.compendium.getSkill(s[0]));

    for (let i = 0; i < inheritElems.length; i++) {
      if (!(demon.inherits & (1 << i))) {
        excludeElems.push(inheritElems[inheritElems.length - i - 1]);
      }
    }
    
    this.skills[this.blankSkill.element] = [this.blankSkill].concat(innateSkills);
    this.elems = this.recipeConfig.skillElems.filter(e => this.skills[e] && !excludeElems.includes(e));
    this.form.patchValue({
      race: demon.race,
      demon: demon,
      ingreds: innateSkills
        .concat(Array(this.internalMaxSkills - innateSkills.length).fill(this.blankSkill))
        .map(s => ({ searchSkill: true, elem: '-', skill: s, race: '-', demon: s.name !== '-' ? demon : this.blankDemon }))
    });
  }
}
