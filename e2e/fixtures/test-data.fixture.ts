import { APIRequestContext } from '@playwright/test';

export interface CleanupFunction {
  (): Promise<void>;
}

export class TestDataFactory {
  private cleanupStack: CleanupFunction[] = [];

  constructor(private request: APIRequestContext) {}

  async createDomain(data: { name: string; description?: string; comment?: string }) {
    const response = await this.request.post('domains', {
      data,
    });

    if (!response.ok()) {
      const error = await response.text();
      throw new Error(`Failed to create domain: ${error}`);
    }

    const domain = await response.json();

    this.cleanupStack.push(async () => {
      try {
        await this.request.delete(`domains/${domain.id}`);
      } catch {
        // Ignore cleanup errors
      }
    });

    return domain;
  }

  async createApplication(data: {
    name: string;
    description?: string;
    comment?: string;
    domainId?: string;
    providerId?: string;
    ownerId?: string;
    criticality?: string;
    lifecycleStatus?: string;
  }) {
    const response = await this.request.post('applications', {
      data,
    });

    if (!response.ok()) {
      const error = await response.text();
      throw new Error(`Failed to create application: ${error}`);
    }

    const application = await response.json();

    this.cleanupStack.push(async () => {
      try {
        const depsResponse = await this.request.get(`applications/${application.id}/dependencies`);
        if (depsResponse.ok()) {
          const deps = await depsResponse.json();
          if (!deps.hasDependencies) {
            await this.request.delete(`applications/${application.id}`);
          }
        }
      } catch {
        // Ignore cleanup errors
      }
    });

    return application;
  }

  async createProvider(data: { name: string; description?: string }) {
    const response = await this.request.post('providers', {
      data,
    });

    if (!response.ok()) {
      const error = await response.text();
      throw new Error(`Failed to create provider: ${error}`);
    }

    const provider = await response.json();

    this.cleanupStack.push(async () => {
      try {
        await this.request.delete(`providers/${provider.id}`);
      } catch {
        // Ignore cleanup errors
      }
    });

    return provider;
  }

  async createBusinessCapability(data: {
    name: string;
    description?: string;
    domainId: string;
    level: number;
    parentId?: string;
  }) {
    const response = await this.request.post('business-capabilities', {
      data,
    });

    if (!response.ok()) {
      const error = await response.text();
      throw new Error(`Failed to create business capability: ${error}`);
    }

    const bc = await response.json();

    this.cleanupStack.push(async () => {
      try {
        await this.request.delete(`business-capabilities/${bc.id}`);
      } catch {
        // Ignore cleanup errors
      }
    });

    return bc;
  }

  async createInterface(data: {
    name?: string;
    sourceAppId: string;
    targetAppId: string;
    type: string;
    frequency?: string;
    criticality?: string;
  }) {
    const response = await this.request.post('interfaces', {
      data,
    });

    if (!response.ok()) {
      const error = await response.text();
      throw new Error(`Failed to create interface: ${error}`);
    }

    const iface = await response.json();

    this.cleanupStack.push(async () => {
      try {
        await this.request.delete(`interfaces/${iface.id}`);
      } catch {
        // Ignore cleanup errors
      }
    });

    return iface;
  }

  async createTagDimension(data: { name: string; color?: string; description?: string }) {
    const response = await this.request.post('tag-dimensions', {
      data,
    });

    if (!response.ok()) {
      const error = await response.text();
      throw new Error(`Failed to create tag dimension: ${error}`);
    }

    const dimension = await response.json();

    this.cleanupStack.push(async () => {
      try {
        await this.request.delete(`tag-dimensions/${dimension.id}`);
      } catch {
        // Ignore cleanup errors
      }
    });

    return dimension;
  }

  async resolveTagValue(data: {
    dimensionId: string;
    path: string;
    label: string;
  }) {
    const response = await this.request.post('tags/resolve', {
      data,
    });

    if (!response.ok()) {
      const error = await response.text();
      throw new Error(`Failed to resolve tag value: ${error}`);
    }

    return await response.json();
  }

  async attachTagsToEntity(
    entityType: string,
    entityId: string,
    dimensionId: string,
    tagValueIds: string[]
  ) {
    const response = await this.request.put(`tags/entity/${entityType}/${entityId}`, {
      data: { dimensionId, tagValueIds },
    });

    if (!response.ok()) {
      const error = await response.text();
      throw new Error(`Failed to attach tags: ${error}`);
    }

    return await response.json();
  }

  async cleanup() {
    const errors: Error[] = [];

    while (this.cleanupStack.length > 0) {
      const cleanupFn = this.cleanupStack.pop();
      if (cleanupFn) {
        try {
          await cleanupFn();
        } catch (error) {
          errors.push(error as Error);
        }
      }
    }

    if (errors.length > 0) {
      console.warn('Some cleanup operations failed:', errors);
    }
  }
}
