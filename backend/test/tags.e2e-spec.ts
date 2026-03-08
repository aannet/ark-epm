import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as supertest from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

const request = supertest.default;

describe('TagsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let geographyDimensionId: string;
  let brandDimensionId: string;

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

    const dimensions = await prisma.tagDimension.findMany();
    geographyDimensionId = dimensions.find((d) => d.name === 'Geography')?.id || '';
    brandDimensionId = dimensions.find((d) => d.name === 'Brand')?.id || '';
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /tag-dimensions', () => {
    it('should return 200 with list of dimensions', async () => {
      const response = await request(app.getHttpServer())
        .get('/tag-dimensions')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should return seeded dimensions', async () => {
      const response = await request(app.getHttpServer())
        .get('/tag-dimensions')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      const names = response.body.map((d: { name: string }) => d.name);
      expect(names).toContain('Geography');
      expect(names).toContain('Brand');
      expect(names).toContain('LegalEntity');
    });
  });

  describe('POST /tag-dimensions', () => {
    it('should create a new dimension', async () => {
      const response = await request(app.getHttpServer())
        .post('/tag-dimensions')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'TestDimension', color: '#FF0000', icon: 'test' })
        .expect(201);
      expect(response.body.name).toBe('TestDimension');
      expect(response.body.color).toBe('#FF0000');
    });

    it('should return 409 for duplicate dimension name', async () => {
      await request(app.getHttpServer())
        .post('/tag-dimensions')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'DuplicateDimension', color: '#FF0000' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/tag-dimensions')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'DuplicateDimension', color: '#FF0000' })
        .expect(409);
    });
  });

  describe('GET /tags/autocomplete', () => {
    it('should return 200 with autocomplete results', async () => {
      const response = await request(app.getHttpServer())
        .get('/tags/autocomplete')
        .query({ dimension: geographyDimensionId, q: 'europe' })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return results without query', async () => {
      const response = await request(app.getHttpServer())
        .get('/tags/autocomplete')
        .query({ dimension: geographyDimensionId })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 404 for non-existent dimension', async () => {
      await request(app.getHttpServer())
        .get('/tags/autocomplete')
        .query({ dimension: '00000000-0000-0000-0000-000000000000' })
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('POST /tags/resolve', () => {
    it('should create a new tag value', async () => {
      const response = await request(app.getHttpServer())
        .post('/tags/resolve')
        .set('Authorization', `Bearer ${token}`)
        .send({ dimensionId: geographyDimensionId, path: 'test/path', label: 'Test Path' })
        .expect(201);
      expect(response.body.path).toBe('test/path');
      expect(response.body.label).toBe('Test Path');
    });

    it('should return existing tag for same path', async () => {
      await request(app.getHttpServer())
        .post('/tags/resolve')
        .set('Authorization', `Bearer ${token}`)
        .send({ dimensionId: geographyDimensionId, path: 'existing/path' })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/tags/resolve')
        .set('Authorization', `Bearer ${token}`)
        .send({ dimensionId: geographyDimensionId, path: 'existing/path' })
        .expect(201);
      expect(response.body.path).toBe('existing/path');
    });

    it('should return 400 for invalid path', async () => {
      await request(app.getHttpServer())
        .post('/tags/resolve')
        .set('Authorization', `Bearer ${token}`)
        .send({ dimensionId: geographyDimensionId, path: '' })
        .expect(400);
    });
  });

  describe('PUT /tags/entity/:entityType/:entityId', () => {
    let testAppId: string;

    beforeAll(async () => {
      const app = await prisma.application.create({
        data: { name: 'Test App for Tags' },
      });
      testAppId = app.id;
    });

    afterAll(async () => {
      await prisma.application.delete({ where: { id: testAppId } }).catch(() => {});
    });

    it('should assign tags to entity', async () => {
      const tag1 = await prisma.tagValue.create({
        data: { dimensionId: geographyDimensionId, path: 'entity-test-1', label: 'Entity Test 1', depth: 0 },
      });
      const tag2 = await prisma.tagValue.create({
        data: { dimensionId: geographyDimensionId, path: 'entity-test-2', label: 'Entity Test 2', depth: 0 },
      });

      const response = await request(app.getHttpServer())
        .put(`/tags/entity/application/${testAppId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ dimensionId: geographyDimensionId, tagValueIds: [tag1.id, tag2.id] })
        .expect(200);

      expect(response.body.length).toBe(2);
    });

    it('should replace tags for dimension', async () => {
      const tag = await prisma.tagValue.create({
        data: { dimensionId: geographyDimensionId, path: 'entity-test-replace', label: 'Replace', depth: 0 },
      });

      await request(app.getHttpServer())
        .put(`/tags/entity/application/${testAppId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ dimensionId: geographyDimensionId, tagValueIds: [tag.id] })
        .expect(200);
    });

    it('should return 400 for dimension mismatch', async () => {
      const brandTag = await prisma.tagValue.create({
        data: { dimensionId: brandDimensionId, path: 'brand-mismatch-test', label: 'Brand Test', depth: 0 },
      });

      await request(app.getHttpServer())
        .put(`/tags/entity/application/${testAppId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ dimensionId: geographyDimensionId, tagValueIds: [brandTag.id] })
        .expect(400);
    });
  });

  describe('GET /tags/entity/:entityType/:entityId', () => {
    let testAppId: string;

    beforeAll(async () => {
      const app = await prisma.application.create({
        data: { name: 'Test App for Get Tags' },
      });
      testAppId = app.id;
    });

    afterAll(async () => {
      await prisma.application.delete({ where: { id: testAppId } }).catch(() => {});
    });

    it('should return entity tags', async () => {
      const tag = await prisma.tagValue.create({
        data: { dimensionId: geographyDimensionId, path: 'get-test', label: 'Get Test', depth: 0 },
      });
      await prisma.entityTag.create({
        data: { entityType: 'application', entityId: testAppId, tagValueId: tag.id },
      });

      const response = await request(app.getHttpServer())
        .get(`/tags/entity/application/${testAppId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
