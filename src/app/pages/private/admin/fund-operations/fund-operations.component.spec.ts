import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FundOperationsComponent } from './fund-operations.component';

describe('FundOperationsComponent', () => {
  let component: FundOperationsComponent;
  let fixture: ComponentFixture<FundOperationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FundOperationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FundOperationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
