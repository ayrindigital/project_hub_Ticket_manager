import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProjectDto, ProjectStatus } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

interface Project {
	id: number;
	name: string;
	description?: string;
	status: ProjectStatus;
}

@Injectable()
export class ProjectsService {
	private projects: Project[] = [];
	private nextId = 1;

	create(dto: CreateProjectDto): Project {
		const project: Project = {
			id: this.nextId++,
			name: dto.name,
			description: dto.description,
			status: dto.status ?? ProjectStatus.ACTIVE,
		};
		this.projects.push(project);
		return project;
	}

	findAll(): Project[] {
		return this.projects;
	}

	findOne(id: number): Project {
		const project = this.projects.find((p) => p.id === id);
		if (!project) {
			throw new NotFoundException(`Project ${id} not found`);
		}
		return project;
	}

	update(id: number, dto: UpdateProjectDto): Project {
		const project = this.findOne(id);
		const updated: Project = {
			...project,
			...dto,
		};
		this.projects = this.projects.map((p) => (p.id === id ? updated : p));
		return updated;
	}

	archive(id: number): Project {
		const project = this.findOne(id);
		const archived: Project = { ...project, status: ProjectStatus.ARCHIVED };
		this.projects = this.projects.map((p) => (p.id === id ? archived : p));
		return archived;
	}
}
