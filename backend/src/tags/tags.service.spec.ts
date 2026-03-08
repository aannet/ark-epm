import { TagsService } from './tags.service';

describe('TagsService', () => {
  let service: TagsService;

  beforeEach(() => {
    service = new TagsService({} as any);
  });

  describe('normalizePath', () => {
    it('should normalize "Europe / France / Paris" to "europe/france/paris"', () => {
      const result = service.normalizePath('Europe / France / Paris');
      expect(result).toBe('europe/france/paris');
    });

    it('should normalize "  Europe  " to "europe"', () => {
      const result = service.normalizePath('  Europe  ');
      expect(result).toBe('europe');
    });

    it('should normalize "Paris" to "paris"', () => {
      const result = service.normalizePath('Paris');
      expect(result).toBe('paris');
    });

    it('should throw on invalid characters like "<" and ">"', () => {
      expect(() => service.normalizePath('France<Paris>')).toThrow();
    });

    it('should throw on empty path', () => {
      expect(() => service.normalizePath('')).toThrow();
    });

    it('should throw on path with only slashes', () => {
      expect(() => service.normalizePath('////')).toThrow();
    });

    it('should replace spaces with dashes', () => {
      const result = service.normalizePath('europe west france');
      expect(result).toBe('europe-west-france');
    });
  });

  describe('getAncestorPaths', () => {
    it('should return ["a", "a/b"] for "a/b/c"', () => {
      const result = service.getAncestorPaths('a/b/c');
      expect(result).toEqual(['a', 'a/b']);
    });

    it('should return ["a"] for "a/b"', () => {
      const result = service.getAncestorPaths('a/b');
      expect(result).toEqual(['a']);
    });

    it('should return [] for "a" (root)', () => {
      const result = service.getAncestorPaths('a');
      expect(result).toEqual([]);
    });

    it('should return [] for single segment', () => {
      const result = service.getAncestorPaths('europe');
      expect(result).toEqual([]);
    });
  });

  describe('labelFromPath', () => {
    it('should convert "paris" to "Paris"', () => {
      const result = service.labelFromPath('paris');
      expect(result).toBe('Paris');
    });

    it('should convert "north-america" to "North America"', () => {
      const result = service.labelFromPath('north-america');
      expect(result).toBe('North America');
    });

    it('should convert "france" to "France"', () => {
      const result = service.labelFromPath('france');
      expect(result).toBe('France');
    });

    it('should handle single word', () => {
      const result = service.labelFromPath('europe');
      expect(result).toBe('Europe');
    });
  });
});
