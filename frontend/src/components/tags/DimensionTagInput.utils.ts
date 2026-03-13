import { TagValueResponse } from './DimensionTagInput.types';

/**
 * Deduplicate tags by keeping only the deepest tag per dimension.
 * When multiple tags from the same dimension exist, keeps the one with highest depth.
 */
export function deduplicateByDepth(tags: TagValueResponse[]): TagValueResponse[] {
  if (!tags || tags.length === 0) {
    return [];
  }

  const dimensionMap = new Map<string, TagValueResponse>();

  for (const tag of tags) {
    const existing = dimensionMap.get(tag.dimensionId);
    
    if (!existing || tag.depth > existing.depth) {
      dimensionMap.set(tag.dimensionId, tag);
    }
  }

  return Array.from(dimensionMap.values());
}

/**
 * Group tags by their dimension name for display purposes.
 */
export function groupByDimension(tags: TagValueResponse[]): Map<string, TagValueResponse[]> {
  const groups = new Map<string, TagValueResponse[]>();

  for (const tag of tags) {
    const key = tag.dimensionName;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(tag);
  }

  return groups;
}

/**
 * Get the color for a tag, falling back to a default if not provided.
 */
export function getTagColor(tag: TagValueResponse, defaultColor: string = '#757575'): string {
  return tag.dimensionColor || defaultColor;
}
