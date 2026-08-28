import { describe, expect, it } from 'vitest';
import { AutoTagger } from './auto-tagger';

describe('AutoTagger', () => {
  it('exposes every supported tag category', () => {
    const tagger = new AutoTagger();

    expect(tagger.getAllCategories()).toEqual([
      'language',
      'domain',
      'complexity',
      'type',
    ]);
  });
});
