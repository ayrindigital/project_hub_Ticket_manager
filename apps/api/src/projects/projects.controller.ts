import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

interface Project {
	id: number;
	name: string;
	description?: string;
	status: string;
}

@Controller('projects')
export class ProjectsController {
	constructor(private readonly projectsService: ProjectsService) {}

	@Post()
	create(@Body() dto: CreateProjectDto): Project {
		return this.projectsService.create(dto);
	}

	@Get()
	findAll(): Project[] {
		return this.projectsService.findAll();
	}

	@Get(':id')
	findOne(@Param('id', ParseIntPipe) id: number): Project {
		return this.projectsService.findOne(id);
	}

	@Patch(':id')
	update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProjectDto): Project {
		return this.projectsService.update(id, dto);
	}

	@Delete(':id')
	remove(@Param('id', ParseIntPipe) id: number): Project {
		return this.projectsService.archive(id);
	}
}
