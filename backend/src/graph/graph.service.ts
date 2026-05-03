import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FocalType, GraphLayer, QueryGraphDto } from './dto/query-graph.dto';
import {
  GraphEdge,
  GraphNode,
  GraphResponse,
} from './dto/graph-response.dto';

const DEFAULT_LAYERS = [GraphLayer.APPLICATIONS, GraphLayer.INTERFACES];

type AppWithDomain = {
  id: string;
  name: string;
  criticality: string | null;
  lifecycleStatus: string | null;
  domain: { id: string; name: string } | null;
};

@Injectable()
export class GraphService {
  private readonly logger = new Logger(GraphService.name);

  constructor(private readonly prisma: PrismaService) {}

  async buildGraph(query: QueryGraphDto): Promise<GraphResponse> {
    const {
      focalType,
      focalId,
      depth = 1,
      layers = DEFAULT_LAYERS,
    } = query;

    this.logger.log({ method: 'buildGraph', focalType, focalId, depth, layers });

    const { rootAppIds, focalEntityNode } = await this.buildRootNodes(
      focalType,
      focalId,
    );

    if (rootAppIds.length === 0) {
      return { nodes: focalEntityNode ? [focalEntityNode] : [], edges: [] };
    }

    const visitedAppIds = new Set<string>();
    const allAppIds = await this.bfsExpand(rootAppIds, depth, visitedAppIds);

    const layerNodes = await this.fetchLayerNodes(allAppIds, layers);

    const mergeMap = new Map<string, GraphNode>();
    if (focalEntityNode) {
      mergeMap.set(focalEntityNode.id, focalEntityNode);
    }
    for (const n of layerNodes) {
      const node =
        focalType === FocalType.APPLICATION && n.id === focalId
          ? { ...n, isFocal: true }
          : n;
      if (!mergeMap.has(node.id) || node.isFocal) {
        mergeMap.set(node.id, node);
      }
    }

    const edges = layers.includes(GraphLayer.INTERFACES)
      ? await this.fetchEdges(visitedAppIds)
      : [];

    return { nodes: Array.from(mergeMap.values()), edges };
  }

  private async buildRootNodes(
    focalType: FocalType,
    focalId: string,
  ): Promise<{ rootAppIds: string[]; focalEntityNode: GraphNode | null }> {
    switch (focalType) {
      case FocalType.APPLICATION: {
        const app = await this.prisma.application.findUnique({
          where: { id: focalId },
          select: {
            id: true,
            name: true,
            criticality: true,
            lifecycleStatus: true,
            domain: { select: { id: true, name: true } },
          },
        });
        if (!app) throw new NotFoundException({ code: 'ENTITY_NOT_FOUND' });
        return {
          rootAppIds: [focalId],
          focalEntityNode: this.mapApplicationToNode(app, true),
        };
      }

      case FocalType.BUSINESS_CAPABILITY: {
        const bc = await this.prisma.businessCapability.findUnique({
          where: { id: focalId },
          select: { id: true, name: true, level: true, domainId: true },
        });
        if (!bc) throw new NotFoundException({ code: 'ENTITY_NOT_FOUND' });
        const mappings = await this.prisma.appCapabilityMap.findMany({
          where: { capabilityId: focalId },
          select: { applicationId: true },
        });
        return {
          rootAppIds: mappings.map((m) => m.applicationId),
          focalEntityNode: this.mapBcToNode(bc, true),
        };
      }

      case FocalType.DOMAIN: {
        const domain = await this.prisma.domain.findUnique({
          where: { id: focalId },
          select: { id: true },
        });
        if (!domain) throw new NotFoundException({ code: 'ENTITY_NOT_FOUND' });
        const apps = await this.prisma.application.findMany({
          where: { domainId: focalId },
          select: { id: true },
        });
        return {
          rootAppIds: apps.map((a) => a.id),
          focalEntityNode: null,
        };
      }

      case FocalType.PROVIDER: {
        const provider = await this.prisma.provider.findUnique({
          where: { id: focalId },
          select: { id: true, name: true },
        });
        if (!provider) throw new NotFoundException({ code: 'ENTITY_NOT_FOUND' });
        const mappings = await this.prisma.applicationProviderMap.findMany({
          where: { providerId: focalId },
          select: { applicationId: true },
        });
        return {
          rootAppIds: mappings.map((m) => m.applicationId),
          focalEntityNode: this.mapProviderToNode(provider, true),
        };
      }

      case FocalType.IT_COMPONENT: {
        const itc = await this.prisma.itComponent.findUnique({
          where: { id: focalId },
          select: { id: true, name: true },
        });
        if (!itc) throw new NotFoundException({ code: 'ENTITY_NOT_FOUND' });
        const mappings = await this.prisma.appItComponentMap.findMany({
          where: { itComponentId: focalId },
          select: { applicationId: true },
        });
        return {
          rootAppIds: mappings.map((m) => m.applicationId),
          focalEntityNode: this.mapItComponentToNode(itc, true),
        };
      }

      case FocalType.DATA_OBJECT: {
        const dataObj = await this.prisma.dataObject.findUnique({
          where: { id: focalId },
          select: { id: true, name: true },
        });
        if (!dataObj) throw new NotFoundException({ code: 'ENTITY_NOT_FOUND' });
        const mappings = await this.prisma.appDataObjectMap.findMany({
          where: { dataObjectId: focalId },
          select: { applicationId: true },
        });
        return {
          rootAppIds: mappings.map((m) => m.applicationId),
          focalEntityNode: this.mapDataObjectToNode(dataObj, true),
        };
      }
    }
  }

  private async bfsExpand(
    seedAppIds: string[],
    depth: number,
    visitedAppIds: Set<string>,
  ): Promise<string[]> {
    for (const id of seedAppIds) visitedAppIds.add(id);
    let frontier = [...seedAppIds];
    const all = [...seedAppIds];

    for (let d = 0; d < depth; d++) {
      if (frontier.length === 0) break;

      const ifaces = await this.prisma.interface.findMany({
        where: {
          OR: [
            { sourceAppId: { in: frontier } },
            { targetAppId: { in: frontier } },
          ],
        },
        select: { sourceAppId: true, targetAppId: true },
      });

      const next: string[] = [];
      for (const { sourceAppId, targetAppId } of ifaces) {
        for (const id of [sourceAppId, targetAppId]) {
          if (!visitedAppIds.has(id)) {
            visitedAppIds.add(id);
            next.push(id);
            all.push(id);
          }
        }
      }
      frontier = next;
    }

    return all;
  }

  private async fetchLayerNodes(
    appIds: string[],
    layers: GraphLayer[],
  ): Promise<GraphNode[]> {
    const nodes: GraphNode[] = [];

    if (layers.includes(GraphLayer.APPLICATIONS)) {
      const apps = await this.prisma.application.findMany({
        where: { id: { in: appIds } },
        select: {
          id: true,
          name: true,
          criticality: true,
          lifecycleStatus: true,
          domain: { select: { id: true, name: true } },
        },
      });
      nodes.push(...apps.map((a) => this.mapApplicationToNode(a, false)));
    }

    if (layers.includes(GraphLayer.BUSINESS_CAPABILITIES)) {
      const mappings = await this.prisma.appCapabilityMap.findMany({
        where: { applicationId: { in: appIds } },
        include: {
          capability: { select: { id: true, name: true, level: true, domainId: true } },
        },
      });
      const seen = new Set<string>();
      for (const m of mappings) {
        if (!seen.has(m.capabilityId)) {
          seen.add(m.capabilityId);
          nodes.push(this.mapBcToNode(m.capability, false));
        }
      }
    }

    if (layers.includes(GraphLayer.PROVIDERS)) {
      const mappings = await this.prisma.applicationProviderMap.findMany({
        where: { applicationId: { in: appIds } },
        include: { provider: { select: { id: true, name: true } } },
      });
      const seen = new Set<string>();
      for (const m of mappings) {
        if (!seen.has(m.providerId)) {
          seen.add(m.providerId);
          nodes.push(this.mapProviderToNode(m.provider, false));
        }
      }
    }

    if (layers.includes(GraphLayer.IT_COMPONENTS)) {
      const mappings = await this.prisma.appItComponentMap.findMany({
        where: { applicationId: { in: appIds } },
        include: { itComponent: { select: { id: true, name: true } } },
      });
      const seen = new Set<string>();
      for (const m of mappings) {
        if (!seen.has(m.itComponentId)) {
          seen.add(m.itComponentId);
          nodes.push(this.mapItComponentToNode(m.itComponent, false));
        }
      }
    }

    if (layers.includes(GraphLayer.DATA_OBJECTS)) {
      const mappings = await this.prisma.appDataObjectMap.findMany({
        where: { applicationId: { in: appIds } },
        include: { dataObject: { select: { id: true, name: true } } },
      });
      const seen = new Set<string>();
      for (const m of mappings) {
        if (!seen.has(m.dataObjectId)) {
          seen.add(m.dataObjectId);
          nodes.push(this.mapDataObjectToNode(m.dataObject, false));
        }
      }
    }

    return nodes;
  }

  private async fetchEdges(visibleAppIds: Set<string>): Promise<GraphEdge[]> {
    if (visibleAppIds.size === 0) return [];

    const ids = Array.from(visibleAppIds);
    const ifaces = await this.prisma.interface.findMany({
      where: {
        sourceAppId: { in: ids },
        targetAppId: { in: ids },
      },
      select: {
        id: true,
        name: true,
        type: true,
        frequency: true,
        criticality: true,
        middlewareAppId: true,
        sourceAppId: true,
        targetAppId: true,
      },
    });

    return ifaces.map((i) => ({
      id: i.id,
      sourceId: i.sourceAppId,
      targetId: i.targetAppId,
      label: i.name ?? null,
      meta: {
        type: i.type,
        frequency: i.frequency ?? null,
        criticality: i.criticality ?? null,
        middlewareAppId: i.middlewareAppId ?? null,
      },
    }));
  }

  private mapApplicationToNode(app: AppWithDomain, isFocal: boolean): GraphNode {
    return {
      id: app.id,
      type: 'application',
      isFocal,
      label: app.name,
      meta: {
        criticality: app.criticality ?? null,
        lifecycleStatus: app.lifecycleStatus ?? null,
        domainId: app.domain?.id ?? null,
        domainName: app.domain?.name ?? null,
      },
    };
  }

  private mapBcToNode(
    bc: { id: string; name: string; level?: number | null; domainId?: string | null },
    isFocal: boolean,
  ): GraphNode {
    return {
      id: bc.id,
      type: 'bc',
      isFocal,
      label: bc.name,
      meta: {
        level: bc.level ?? null,
        domainId: bc.domainId ?? null,
      },
    };
  }

  private mapProviderToNode(
    p: { id: string; name: string },
    isFocal: boolean,
  ): GraphNode {
    return { id: p.id, type: 'provider', isFocal, label: p.name };
  }

  private mapItComponentToNode(
    c: { id: string; name: string },
    isFocal: boolean,
  ): GraphNode {
    return { id: c.id, type: 'it_component', isFocal, label: c.name };
  }

  private mapDataObjectToNode(
    d: { id: string; name: string },
    isFocal: boolean,
  ): GraphNode {
    return { id: d.id, type: 'data_object', isFocal, label: d.name };
  }
}
