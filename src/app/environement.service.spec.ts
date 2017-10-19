import { TestBed, inject } from '@angular/core/testing';

import { EnvironementService } from './environement.service';

describe('EnvironementService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EnvironementService]
    });
  });

  it('should be created', inject([EnvironementService], (service: EnvironementService) => {
    expect(service).toBeTruthy();
  }));
});
