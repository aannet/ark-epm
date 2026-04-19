import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

// Test timeout
jest.setTimeout(30000);

describe('Search API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;

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

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Get auth token
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@ark.local',
        password: 'password',
      });
    authToken = loginRes.body.accessToken;

    // Seed test data
    await seedTestData(prisma);
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData(prisma);
    await app.close();
  });

  async function seedTestData(prisma: PrismaService) {
    // Create test domain
    await prisma.domain.create({
      data: {
        id: 'search-test-domain-1',
        name: 'Search Test Domain',
        description: 'Domain for search tests',
      },
    });

    // Create test application
    await prisma.application.create({
      data: {
        id: 'search-test-app-1',
        name: 'CRM Test Application',
        description: 'CRM application for search tests',
        domainId: 'search-test-domain-1',
        lifecycleStatus: 'PRODUCTION',
      },
    });

    // Create test provider
    await prisma.provider.create({
      data: {
        id: 'search-test-provider-1',
        name: 'Salesforce Provider',
        description: 'CRM provider for search tests',
      },
    });
  }

  async function cleanupTestData(prisma: PrismaService) {
    await prisma.application.deleteMany({
      where: { id: 'search-test-app-1' },
    });
    await prisma.provider.deleteMany({
      where: { id: 'search-test-provider-1' },
    });
    await prisma.domain.deleteMany({
      where: { id: 'search-test-domain-1' },
    });
  }

  describe('GET /api/v1/search', () => {
    it('should return 200 with results when searching', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/search?q=CRM')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.query).toBe('CRM');
      expect(res.body.meta.total).toBeGreaterThan(0);
    });

    it('should return empty array for non-matching query', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/search?q=xyznonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data).toEqual([]);
      expect(res.body.meta.total).toBe(0);
    });

    it('should return 400 for query with 1 character', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/search?q=a')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(res.body.code).toBe('SEARCH_QUERY_INVALID');
    });

    it('should return 400 for whitespace-only query', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/search?q=%20%20')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(res.body.code).toBe('SEARCH_QUERY_INVALID');
    });

    it('should return 400 when q parameter is missing', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/search')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should return 200 for minimum 2 characters query', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/search?q=ab')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data).toBeInstanceOf(Array);
    });

    it('should filter by types parameter', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/search?q=CRM&types[]=application')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data.every((item: any) => item.type === 'application')).toBe(true);
      expect(res.body.meta.types).toEqual(['application']);
    });

    it('should ignore invalid types silently', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/search?q=CRM&types[]=application&types[]=invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Should still return results, ignoring the invalid type
      expect(res.body.data).toBeInstanceOf(Array);
    });

    it('should respect limit parameter', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/search?q=CRM&limit=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data.length).toBeLessThanOrEqual(2);
      expect(res.body.meta.limit).toBe(2);
    });

    it('should return results with required fields', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/search?q=CRM')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThan(0);
      const item = res.body.data[0];
      expect(item.id).toBeDefined();
      expect(item.type).toBeDefined();
      expect(item.name).toBeDefined();
      expect(item.score).toBeDefined();
    });

    it('should sort results by score descending (exact match first)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/search?q=CRM%20Test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      if (res.body.data.length > 1) {
        expect(res.body.data[0].score).toBeGreaterThanOrEqual(res.body.data[1].score);
      }
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/search?q=CRM')
        .expect(401);
    });

    it('should allow search for all authenticated users', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/search?q=test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data).toBeInstanceOf(Array);
    });
  });
});
