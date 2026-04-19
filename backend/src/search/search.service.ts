import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  QuerySearchDto,
  SearchableEntityType,
} from './dto/query-search.dto';

export interface SearchResultItem {
  id: string;
  type: SearchableEntityType;
  name: string;
  description: string | null;
  score: number;
  meta?: {
    domainName?: string;
    criticality?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    lifecycleStatus?: string;
  };
}

export interface SearchMeta {
  total: number;
  query: string;
  types: SearchableEntityType[];
  limit: number;
}

export interface SearchResponse {
  data: SearchResultItem[];
  meta: SearchMeta;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(private readonly prisma: PrismaService) {}

  async search(query: QuerySearchDto): Promise<SearchResponse> {
    const { q, types, limit = 20 } = query;

    // Validate query length (at least 2 non-space characters)
    const trimmedQuery = q.trim();
    if (trimmedQuery.length < 2) {
      throw new BadRequestException({
        code: 'SEARCH_QUERY_INVALID',
        message: 'Le terme de recherche doit contenir au moins 2 caractères',
      });
    }

    this.logger.log({
      method: 'search',
      query: trimmedQuery,
      types,
      limit,
    });

    // Determine which entity types to search
    const typesToSearch = types && types.length > 0
      ? types
      : Object.values(SearchableEntityType);

    // Execute parallel searches with limit * 2 to ensure diversity
    const internalLimit = limit * 2;
    const searchPromises: Promise<SearchResultItem[]>[] = [];

    for (const type of typesToSearch) {
      searchPromises.push(this.searchByType(type, trimmedQuery, internalLimit));
    }

    const resultsByType = await Promise.all(searchPromises);
    let allResults: SearchResultItem[] = resultsByType.flat();

    // Calculate scores and sort
    allResults = allResults.map((item) => ({
      ...item,
      score: this.calculateScore(item.name, item.description, trimmedQuery),
    }));

    // Sort by score descending, then by name alphabetically
    allResults.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });

    // Apply final limit
    const limitedResults = allResults.slice(0, limit);

    return {
      data: limitedResults,
      meta: {
        total: allResults.length,
        query: trimmedQuery,
        types: typesToSearch,
        limit,
      },
    };
  }

  /**
   * Calculate relevance score based on match quality
   * - Score 10: exact match on name (case-insensitive)
   * - Score 9: name starts with query
   * - Score 5: name contains query
   * - Score 1: description contains query
   */
  calculateScore(
    name: string,
    description: string | null,
    query: string,
  ): number {
    const normalizedName = name.toLowerCase();
    const normalizedQuery = query.toLowerCase();

    // Exact match
    if (normalizedName === normalizedQuery) {
      return 10;
    }

    // Starts with
    if (normalizedName.startsWith(normalizedQuery)) {
      return 9;
    }

    // Contains in name
    if (normalizedName.includes(normalizedQuery)) {
      return 5;
    }

    // Contains in description
    if (description?.toLowerCase().includes(normalizedQuery)) {
      return 1;
    }

    // Default (should not happen as we only return matching items)
    return 0;
  }

  private async searchByType(
    type: SearchableEntityType,
    query: string,
    limit: number,
  ): Promise<SearchResultItem[]> {
    const whereClause = {
      OR: [
        { name: { contains: query, mode: 'insensitive' as const } },
        { description: { contains: query, mode: 'insensitive' as const } },
      ],
    };

    switch (type) {
      case SearchableEntityType.APPLICATION:
        return this.searchApplications(whereClause, limit);
      case SearchableEntityType.DOMAIN:
        return this.searchDomains(whereClause, limit);
      case SearchableEntityType.BUSINESS_CAPABILITY:
        return this.searchBusinessCapabilities(whereClause, limit);
      case SearchableEntityType.PROVIDER:
        return this.searchProviders(whereClause, limit);
      case SearchableEntityType.IT_COMPONENT:
        return this.searchItComponents(whereClause, limit);
      case SearchableEntityType.DATA_OBJECT:
        return this.searchDataObjects(whereClause, limit);
      case SearchableEntityType.INTERFACE:
        return this.searchInterfaces(whereClause, limit);
      default:
        return [];
    }
  }

  private async searchApplications(
    where: any,
    limit: number,
  ): Promise<SearchResultItem[]> {
    const apps = await this.prisma.application.findMany({
      where,
      take: limit,
      include: { domain: { select: { name: true } } },
    });

    return apps.map((app) => ({
      id: app.id,
      type: SearchableEntityType.APPLICATION,
      name: app.name,
      description: app.description,
      score: 0, // Will be calculated later
      meta: {
        domainName: app.domain?.name,
        criticality: app.criticality as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | undefined,
        lifecycleStatus: app.lifecycleStatus ?? undefined,
      },
    }));
  }

  private async searchDomains(
    where: any,
    limit: number,
  ): Promise<SearchResultItem[]> {
    const domains = await this.prisma.domain.findMany({
      where,
      take: limit,
    });

    return domains.map((domain) => ({
      id: domain.id,
      type: SearchableEntityType.DOMAIN,
      name: domain.name,
      description: domain.description,
      score: 0,
    }));
  }

  private async searchBusinessCapabilities(
    where: any,
    limit: number,
  ): Promise<SearchResultItem[]> {
    const bcs = await this.prisma.businessCapability.findMany({
      where,
      take: limit,
      include: { domain: { select: { name: true } } },
    });

    return bcs.map((bc) => ({
      id: bc.id,
      type: SearchableEntityType.BUSINESS_CAPABILITY,
      name: bc.name,
      description: bc.description,
      score: 0,
      meta: {
        domainName: bc.domain?.name,
      },
    }));
  }

  private async searchProviders(
    where: any,
    limit: number,
  ): Promise<SearchResultItem[]> {
    const providers = await this.prisma.provider.findMany({
      where,
      take: limit,
    });

    return providers.map((provider) => ({
      id: provider.id,
      type: SearchableEntityType.PROVIDER,
      name: provider.name,
      description: provider.description,
      score: 0,
    }));
  }

  private async searchItComponents(
    where: any,
    limit: number,
  ): Promise<SearchResultItem[]> {
    const components = await this.prisma.itComponent.findMany({
      where,
      take: limit,
    });

    return components.map((component) => ({
      id: component.id,
      type: SearchableEntityType.IT_COMPONENT,
      name: component.name,
      description: component.description,
      score: 0,
    }));
  }

  private async searchDataObjects(
    where: any,
    limit: number,
  ): Promise<SearchResultItem[]> {
    const objects = await this.prisma.dataObject.findMany({
      where,
      take: limit,
    });

    return objects.map((obj) => ({
      id: obj.id,
      type: SearchableEntityType.DATA_OBJECT,
      name: obj.name,
      description: obj.description,
      score: 0,
    }));
  }

  private async searchInterfaces(
    where: any,
    limit: number,
  ): Promise<SearchResultItem[]> {
    // Interfaces have 'name' and 'description' fields per schema
    const interfaces = await this.prisma.interface.findMany({
      where,
      take: limit,
    });

    return interfaces
      .filter((iface) => iface.name !== null) // Skip interfaces without names
      .map((iface) => ({
        id: iface.id,
        type: SearchableEntityType.INTERFACE,
        name: iface.name!, // Non-null assertion after filter
        description: iface.description,
        score: 0,
        meta: {
          criticality: iface.criticality as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | undefined,
        },
      }));
  }
}
