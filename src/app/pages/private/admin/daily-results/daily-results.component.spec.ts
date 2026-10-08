import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyResultsComponent } from './daily-results.component';

describe('DailyResultsComponent', () => {
  let component: DailyResultsComponent;
  let fixture: ComponentFixture<DailyResultsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyResultsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DailyResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
