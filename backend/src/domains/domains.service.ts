import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TagsService } from '../tags/tags.service';
import { CreateDomainDto } from './dto/create-domain.dto';
import { UpdateDomainDto } from './dto/update-domain.dto';

@Injectable()
export class DomainsService {
  private readonly logger = new Logger(DomainsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tagsService: TagsService,
  ) {}

  async findAll() {
    this.logger.log({ method: 'findAll' });
    return this.prisma.domain.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, userId?: string) {
    this.logger.log({ method: 'findOne', id });
    const domain = await this.prisma.domain.findUnique({
      where: { id },
    });
    if (!domain) {
      throw new NotFoundException({
        code: 'DOMAIN_NOT_FOUND',
        message: "Le domaine n'existe pas",
      });
    }
    
    // Load tags via TagService
    const tags = await this.tagsService.getEntityTags('domain', id);
    
    return {
      ...domain,
      tags,
    };
  }

  async create(createDomainDto: CreateDomainDto, userId: string) {
    this.logger.log({ method: 'create', data: createDomainDto });
    
    await this.setCurrentUser(userId);
    
    try {
      const domain = await this.prisma.domain.create({
        data: {
          name: createDomainDto.name.trim(),
          description: createDomainDto.description?.trim() || null,
          comment: createDomainDto.comment?.trim() || null,
          updatedAt: new Date(),
        },
      });
      this.logger.log({ method: 'create', result: domain.id });
      
      // Return domain with empty tags array
      return {
        ...domain,
        tags: [],
      };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException({
          code: 'CONFLICT',
          message: 'Domain name already in use',
        });
      }
      throw error;
    }
  }

  async update(id: string, updateDomainDto: UpdateDomainDto, userId: string) {
    this.logger.log({ method: 'update', id, data: updateDomainDto });
    
    await this.setCurrentUser(userId);
    
    try {
      const domain = await this.prisma.domain.update({
        where: { id },
        data: {
          name: updateDomainDto.name?.trim(),
          description: updateDomainDto.description?.trim() || null,
          comment: updateDomainDto.comment?.trim() || null,
          updatedAt: new Date(),
        },
      });
      this.logger.log({ method: 'update', result: domain.id });
      
      // Load tags for the response
      const tags = await this.tagsService.getEntityTags('domain', id);
      
      return {
        ...domain,
        tags,
      };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException({
          code: 'CONFLICT',
          message: 'Domain name already in use',
        });
      }
      if (error.code === 'P2025') {
        throw new NotFoundException({
          code: 'DOMAIN_NOT_FOUND',
          message: "Le domaine n'existe pas",
        });
      }
      throw error;
    }
  }

  async remove(id: string, userId: string) {
    this.logger.log({ method: 'remove', id });
    
    await this.setCurrentUser(userId);

    const domain = await this.prisma.domain.findUnique({
      where: { id },
      select: {
        _count: {
          select: { applications: true, businessCapabilities: true },
        },
      },
    });

    if (!domain) {
      throw new NotFoundException({
        code: 'DOMAIN_NOT_FOUND',
        message: "Le domaine n'existe pas",
      });
    }

    const total =
      domain._count.applications + domain._count.businessCapabilities;
    if (total > 0) {
      throw new ConflictException({
        code: 'DEPENDENCY_CONFLICT',
        message: `Domain is used by ${domain._count.applications} application(s) and ${domain._count.businessCapabilities} business capability(ies)`,
      });
    }

    await this.prisma.domain.delete({ where: { id } });
    this.logger.log({ method: 'remove', result: id });
  }
  
  private async setCurrentUser(userId: string): Promise<void> {
    try {
      await this.prisma.$executeRaw`SET LOCAL ark.current_user_id = ${userId}`;
    } catch (error) {
      this.logger.warn(`Failed to set current user: ${error}`);
    }
  }
}
