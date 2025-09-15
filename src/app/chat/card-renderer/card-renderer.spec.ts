import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardRenderer } from './card-renderer';

describe('CardRenderer', () => {
  let component: CardRenderer;
  let fixture: ComponentFixture<CardRenderer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardRenderer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardRenderer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
