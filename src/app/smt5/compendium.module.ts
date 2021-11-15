import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser';

import { CompendiumRoutingModule } from '../smt4f/compendium-routing.module';
import { FusionDataService } from '../smt4f/fusion-data.service';

import { COMPENDIUM_CONFIG, FUSION_DATA_SERVICE } from '../compendium/constants';
import { Smt4CompendiumModule } from '../smt4f/smt4-compendium.module';
import { CompendiumConfig } from '../smt4f/models';

import COMP_CONFIG_JSON from './data/comp-config.json';
import DEMON_DATA_JSON from './data/demon-data.json';
import SKILL_DATA_JSON from './data/skill-data.json';
import FUSION_CHART_JSON from './data/fusion-chart.json';
import ELEMENT_CHART_JSON from './data/element-chart.json';
import FUSION_PREREQS_JSON from './data/fusion-prereqs.json';
import SPECIAL_RECIPES_JSON from './data/special-recipes.json';
import AFFINITIES_JSON from './data/affinity-bonuses.json';
import JAP_NAMES_JSON from './data/jap-names.json';

function getEnumOrder(target: string[]): { [key: string]: number } {
  return target.reduce((acc, t, i) => { acc[t] = i; return acc }, {});
}

const affinityElems = COMP_CONFIG_JSON.resistElems.concat(COMP_CONFIG_JSON.affinityElems);
const skillElems = affinityElems.concat(COMP_CONFIG_JSON.skillElems);
const affinityBonuses: { costs: number[][], upgrades: number[][] } = { costs: [], upgrades: [] };
const engNames: { [ename: string]: string } = {};

for (const [jname, ename] of Object.entries(JAP_NAMES_JSON)) {
  engNames[ename] = jname;
}

for (const elem of affinityElems) {
  const bonusElem = AFFINITIES_JSON['elements'][elem];
  affinityBonuses.costs.push(AFFINITIES_JSON['costs'][bonusElem]);
  affinityBonuses.upgrades.push(AFFINITIES_JSON['upgrades'][bonusElem]);
}

for (const demon of Object.values(DEMON_DATA_JSON)) {
  demon['price'] = demon['lvl'] * demon['lvl'] * 5 + 1000;
}

for (const skill of Object.values(SKILL_DATA_JSON)) {
  if (skill['rank']) { continue; }
  if (skill['cost']) { skill['rank'] = Math.ceil((skill['cost'] - 1000) / 5); }
  else { skill['rank'] = 1; }
}

for (const [name, prereq] of Object.entries(FUSION_PREREQS_JSON)) {
  DEMON_DATA_JSON[name].prereq = prereq;
}

export const SMT5_COMPENDIUM_CONFIG: CompendiumConfig = {
  appTitle: 'Shin Megami Tensei V',
  races: COMP_CONFIG_JSON.races,
  raceOrder: getEnumOrder(COMP_CONFIG_JSON.races),
  appCssClasses: ['smt4', 'smt5'],

  lang: 'en',
  engNames,
  affinityElems,
  skillData: SKILL_DATA_JSON,
  skillElems,
  elemOrder: getEnumOrder(skillElems),
  resistCodes: COMP_CONFIG_JSON.resistCodes,
  affinityBonuses,

  demonData: DEMON_DATA_JSON,
  evolveData: {},
  dlcDemons: COMP_CONFIG_JSON.dlcDemons,
  baseStats: COMP_CONFIG_JSON.baseStats,
  resistElems: COMP_CONFIG_JSON.resistElems,
  ailmentElems: COMP_CONFIG_JSON.ailments,

  normalTable: FUSION_CHART_JSON,
  elementTable: ELEMENT_CHART_JSON,
  specialRecipes: SPECIAL_RECIPES_JSON,

  settingsKey: 'smt5-fusion-tool-settings',
  settingsVersion: 2111141400
}

@NgModule({
  imports: [
    CommonModule,
    Smt4CompendiumModule,
    CompendiumRoutingModule
  ],
  providers: [
    Title,
    FusionDataService,
    [{ provide: FUSION_DATA_SERVICE, useExisting: FusionDataService }],
    [{ provide: COMPENDIUM_CONFIG, useValue: SMT5_COMPENDIUM_CONFIG }]
  ]
})
export class CompendiumModule { }
