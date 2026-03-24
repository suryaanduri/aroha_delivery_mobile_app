import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DaySummaryPage } from './day-summary.page';

describe('DaySummaryPage', () => {
  let component: DaySummaryPage;
  let fixture: ComponentFixture<DaySummaryPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DaySummaryPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
