import { TestBed } from '@angular/core/testing';

import { CdiService } from './cdi.service';

describe('CdiService', () => {
  let service: CdiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CdiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
