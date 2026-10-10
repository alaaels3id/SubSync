import { describe, it, expect } from 'vitest';
import en from '../locales/en.json';
import ar from '../locales/ar.json';

describe('i18n Localization Integrity', () => {
  it('has identical top-level namespaces in English and Arabic', () => {
    const enKeys = Object.keys(en).sort();
    const arKeys = Object.keys(ar).sort();
    expect(enKeys).toEqual(arKeys);
  });

  it('contains all required keys across all sections', () => {
    const checkKeysRecursively = (enObj: Record<string, any>, arObj: Record<string, any>, path = '') => {
      for (const key of Object.keys(enObj)) {
        const currentPath = path ? `${path}.${key}` : key;
        expect(arObj, `Missing key in ar.json: ${currentPath}`).toHaveProperty(key);

        if (typeof enObj[key] === 'object' && enObj[key] !== null) {
          checkKeysRecursively(enObj[key], arObj[key], currentPath);
        } else {
          expect(typeof arObj[key]).toBe('string');
          expect(arObj[key].trim().length, `Empty translation for: ${currentPath}`).toBeGreaterThan(0);
        }
      }
    };

    checkKeysRecursively(en, ar);
  });

  it('validates common section contains essential keys', () => {
    expect(en.common).toHaveProperty('appName');
    expect(en.common).toHaveProperty('cancel');
    expect(en.common).toHaveProperty('save');
    expect(en.common).toHaveProperty('delete');
    expect(ar.common.appName).toBe('SubSync Studio');
  });
});
