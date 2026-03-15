import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Project, ProjectStatus } from '@prisma/client';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@Body() dto: CreateProjectDto): Promise<Project> {
    return this.projectsService.create(dto);
  }

  @Get()
  findAll(@Query('status') status?: string): Promise<Project[]> {
    if (!status) {
      return this.projectsService.findAll();
    }

    if (!Object.values(ProjectStatus).includes(status as ProjectStatus)) {
      throw new BadRequestException(
        `status must be one of: ${Object.values(ProjectStatus).join(', ')}`,
      );
    }

    return this.projectsService.findAll(status as ProjectStatus);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Project> {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ): Promise<Project> {
    return this.projectsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<Project> {
    return this.projectsService.archive(id);
  }
}
