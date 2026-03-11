import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as supertest from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

const request = supertest.default;

describe('DomainsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@ark.io', password: 'admin123456' });
    token = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /domains', () => {
    it('should return array of domains', async () => {
      const response = await request(app.getHttpServer())
        .get('/domains')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return empty array when no domains exist', async () => {
      const response = await request(app.getHttpServer())
        .get('/domains')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('GET /domains/:id with tags', () => {
    it('should return domain with tags including ancestor and descendant (no backend filtering)', async () => {
      // First, create a Geography dimension if not exists
      const dimensionResponse = await request(app.getHttpServer())
        .get('/tag-dimensions')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      let geographyDim = dimensionResponse.body.find((d: any) => d.name === 'Geography');
      
      if (!geographyDim) {
        const createDimResponse = await request(app.getHttpServer())
          .post('/tag-dimensions')
          .set('Authorization', `Bearer ${token}`)
          .send({ name: 'Geography', color: '#2196F3' })
          .expect(201);
        geographyDim = createDimResponse.body;
      }

      // Create ancestor tag: europe/france
      const ancestorTag = await request(app.getHttpServer())
        .post('/tags/resolve')
        .set('Authorization', `Bearer ${token}`)
        .send({ dimensionId: geographyDim.id, path: 'europe/france', label: 'France' })
        .expect(201);

      // Create descendant tag: europe/france/paris
      const descendantTag = await request(app.getHttpServer())
        .post('/tags/resolve')
        .set('Authorization', `Bearer ${token}`)
        .send({ dimensionId: geographyDim.id, path: 'europe/france/paris', label: 'Paris' })
        .expect(201);

      // Create a domain
      const domain = await request(app.getHttpServer())
        .post('/domains')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: `Domain With Tags ${Date.now()}` })
        .expect(201);

      // Add both tags to the domain
      await request(app.getHttpServer())
        .put(`/tags/entity/domain/${domain.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ dimensionId: geographyDim.id, tagValueIds: [ancestorTag.body.id, descendantTag.body.id] })
        .expect(200);

      // Get domain and verify both tags are present
      const response = await request(app.getHttpServer())
        .get(`/domains/${domain.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.tags).toBeDefined();
      expect(response.body.tags).toHaveLength(2);
      
      // Verify both ancestor and descendant are present (no backend deduplication)
      const tagPaths = response.body.tags.map((t: any) => t.tagValue.path);
      expect(tagPaths).toContain('europe/france');
      expect(tagPaths).toContain('europe/france/paris');
    });

    it('should return tags with depth and dimensionColor fields', async () => {
      // Get the Geography dimension
      const dimensionResponse = await request(app.getHttpServer())
        .get('/tag-dimensions')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      let geographyDim = dimensionResponse.body.find((d: any) => d.name === 'Geography');
      
      if (!geographyDim) {
        const createDimResponse = await request(app.getHttpServer())
          .post('/tag-dimensions')
          .set('Authorization', `Bearer ${token}`)
          .send({ name: 'Geography', color: '#2196F3' })
          .expect(201);
        geographyDim = createDimResponse.body;
      }

      // Create a tag with depth > 0
      const tagValue = await request(app.getHttpServer())
        .post('/tags/resolve')
        .set('Authorization', `Bearer ${token}`)
        .send({ dimensionId: geographyDim.id, path: 'europe/france/paris', label: 'Paris' })
        .expect(201);

      // Create a domain
      const domain = await request(app.getHttpServer())
        .post('/domains')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: `Domain Tag Fields ${Date.now()}` })
        .expect(201);

      // Add tag to domain
      await request(app.getHttpServer())
        .put(`/tags/entity/domain/${domain.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ dimensionId: geographyDim.id, tagValueIds: [tagValue.body.id] })
        .expect(200);

      // Get domain and verify tag fields
      const response = await request(app.getHttpServer())
        .get(`/domains/${domain.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.tags).toBeDefined();
      expect(response.body.tags).toHaveLength(1);
      
      const tagValueResponse = response.body.tags[0].tagValue;
      
      // Verify depth field is present
      expect(tagValueResponse).toHaveProperty('depth');
      expect(typeof tagValueResponse.depth).toBe('number');
      expect(tagValueResponse.depth).toBe(2); // europe/france/paris is at depth 2

      // Verify dimensionColor field is present
      expect(tagValueResponse).toHaveProperty('dimensionColor');
      expect(tagValueResponse.dimensionColor).toBe('#2196F3');

      // Verify dimensionName field is present
      expect(tagValueResponse).toHaveProperty('dimensionName');
      expect(tagValueResponse.dimensionName).toBe('Geography');
    });

    it('should return 404 for non-existent uuid', async () => {
      const response = await request(app.getHttpServer())
        .get('/domains/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
      expect(response.body.code).toBe('DOMAIN_NOT_FOUND');
    });
  });

  describe('POST /domains', () => {
    it('should create a domain', async () => {
      const uniqueName = `Test Domain ${Date.now()}`;
      const response = await request(app.getHttpServer())
        .post('/domains')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: uniqueName, description: 'Test description' })
        .expect(201);
      expect(response.body.name).toBe(uniqueName);
    });

    it('should return 400 when name is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/domains')
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'Test description' })
        .expect(400);
    });

    it('should return 400 when name is whitespace only', async () => {
      const response = await request(app.getHttpServer())
        .post('/domains')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: '   ' })
        .expect(400);
    });

    it('should return 409 for duplicate name', async () => {
      const uniqueName = `Duplicate ${Date.now()}`;
      await request(app.getHttpServer())
        .post('/domains')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: uniqueName })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/domains')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: uniqueName })
        .expect(409);
      expect(response.body.code).toBe('CONFLICT');
    });
  });

  describe('PATCH /domains/:id', () => {
    it('should update a domain', async () => {
      const domain = await request(app.getHttpServer())
        .post('/domains')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: `Update Test ${Date.now()}` })
        .expect(201);

      const response = await request(app.getHttpServer())
        .patch(`/domains/${domain.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'Updated description' })
        .expect(200);
      expect(response.body.description).toBe('Updated description');
    });

    it('should return 409 for duplicate name', async () => {
      const domain1 = await request(app.getHttpServer())
        .post('/domains')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: `Domain1 ${Date.now()}` })
        .expect(201);

      const domain2 = await request(app.getHttpServer())
        .post('/domains')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: `Domain2 ${Date.now()}` })
        .expect(201);

      const response = await request(app.getHttpServer())
        .patch(`/domains/${domain2.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: domain1.body.name })
        .expect(409);
      expect(response.body.code).toBe('CONFLICT');
    });
  });

  describe('DELETE /domains/:id', () => {
    it('should delete a domain with no linked entities', async () => {
      const domain = await request(app.getHttpServer())
        .post('/domains')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: `Delete Test ${Date.now()}` })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/domains/${domain.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);
    });

    it('should return 409 when applications are linked', async () => {
      const domain = await request(app.getHttpServer())
        .post('/domains')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: `Domain With App ${Date.now()}` })
        .expect(201);

      await request(app.getHttpServer())
        .post('/applications')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: `App for Domain ${Date.now()}`, domainId: domain.body.id })
        .expect(201);

      const response = await request(app.getHttpServer())
        .delete(`/domains/${domain.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(409);
      expect(response.body.code).toBe('DEPENDENCY_CONFLICT');
      expect(response.body.message).toContain('application(s)');
    });

    it('should return 409 when business capabilities are linked', async () => {
      const domain = await request(app.getHttpServer())
        .post('/domains')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: `Domain With BC ${Date.now()}` })
        .expect(201);

      await request(app.getHttpServer())
        .post('/business-capabilities')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: `BC for Domain ${Date.now()}`, domainId: domain.body.id, level: 1 })
        .expect(201);

      const response = await request(app.getHttpServer())
        .delete(`/domains/${domain.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(409);
      expect(response.body.code).toBe('DEPENDENCY_CONFLICT');
      expect(response.body.message).toContain('business capability(ies)');
    });

    it('should return 409 with both apps and business capabilities linked', async () => {
      const domain = await request(app.getHttpServer())
        .post('/domains')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: `Domain With Both ${Date.now()}` })
        .expect(201);

      await request(app.getHttpServer())
        .post('/applications')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: `App for Both ${Date.now()}`, domainId: domain.body.id })
        .expect(201);

      await request(app.getHttpServer())
        .post('/business-capabilities')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: `BC for Both ${Date.now()}`, domainId: domain.body.id, level: 1 })
        .expect(201);

      const response = await request(app.getHttpServer())
        .delete(`/domains/${domain.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(409);
      expect(response.body.code).toBe('DEPENDENCY_CONFLICT');
      expect(response.body.message).toContain('application(s)');
      expect(response.body.message).toContain('business capability(ies)');
    });
  });
});
