import { TestBed, inject } from '@angular/core/testing';

import { WalletGenerationService } from './wallet-generation.service';

describe('WalletGenerationService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WalletGenerationService]
    });
  });

  it('should be created', inject([WalletGenerationService], (service: WalletGenerationService) => {
    expect(service).toBeTruthy();
  }));
});
