import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BetterRecipeGeneratorComponent } from './better-recipe-generator.component';

describe('BetterRecipeGeneratorComponent', () => {
  let component: BetterRecipeGeneratorComponent;
  let fixture: ComponentFixture<BetterRecipeGeneratorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BetterRecipeGeneratorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BetterRecipeGeneratorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
