import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SenatranComponent } from './senatran.component';

describe('SenatranComponent', () => {
  let component: SenatranComponent;
  let fixture: ComponentFixture<SenatranComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SenatranComponent]
    });
    fixture = TestBed.createComponent(SenatranComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
