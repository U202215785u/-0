import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildCatalog } from './build-catalog';

const temporaryDirectories: string[] = [];

afterEach(() => {
  temporaryDirectories.splice(0).forEach((directory) => rmSync(directory, { recursive: true, force: true }));
});

function fixtureDirectory(files: Record<string, unknown>): string {
  const directory = mkdtempSync(join(tmpdir(), 'family-recipe-catalog-'));
  temporaryDirectories.push(directory);
  Object.entries(files).forEach(([name, value]) => writeFileSync(join(directory, name), JSON.stringify(value)));
  return directory;
}

describe('buildCatalog', () => {
  it('sorts valid recipes by title', () => {
    const directory = fixtureDirectory({
      'a.json': { id: 'a', title: 'Zeta', ingredients: [{ name: 'a' }], steps: [{ text: '做' }] },
      'b.json': { id: 'b', title: 'Alpha', ingredients: [{ name: 'b' }], steps: [{ text: '做' }] },
    });

    expect(buildCatalog(directory).map((recipe) => recipe.id)).toEqual(['b', 'a']);
  });

  it('reports the filename that fails JSON parsing', () => {
    const directory = mkdtempSync(join(tmpdir(), 'family-recipe-catalog-invalid-'));
    temporaryDirectories.push(directory);
    mkdirSync(directory, { recursive: true });
    writeFileSync(join(directory, 'invalid.json'), '{not json');

    expect(() => buildCatalog(directory)).toThrow(/invalid\.json/);
  });

  it('reports the filename that fails recipe validation', () => {
    const directory = fixtureDirectory({
      'invalid.json': { id: 'bad', title: 'Bad', ingredients: [], steps: [] },
    });

    expect(() => buildCatalog(directory)).toThrow(/invalid\.json/);
  });
});
