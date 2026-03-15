const {
  PrismaClient,
  Priority,
  ProjectStatus,
  TicketStatus,
} = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  await prisma.comment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.project.deleteMany();

  const project = await prisma.project.create({
    data: {
      name: 'Intern Demo Project',
      description: 'Basic Day 5 seed data for learning',
      status: ProjectStatus.ACTIVE,
    },
  });

  const ticketOne = await prisma.ticket.create({
    data: {
      projectId: project.id,
      title: 'Set up login page UI',
      description: 'Create basic login page layout and validation',
      status: TicketStatus.IN_PROGRESS,
      priority: Priority.HIGH,
    },
  });

  const ticketTwo = await prisma.ticket.create({
    data: {
      projectId: project.id,
      title: 'Fix API timeout issue',
      description: 'Investigate timeout for project list endpoint',
      status: TicketStatus.TODO,
      priority: Priority.MEDIUM,
    },
  });

  await prisma.comment.createMany({
    data: [
      {
        ticketId: ticketOne.id,
        author: 'Sagar',
        content: 'Started working on the login form inputs.',
      },
      {
        ticketId: ticketOne.id,
        author: 'Mentor',
        content: 'Good start. Please add basic validation messages too.',
      },
      {
        ticketId: ticketTwo.id,
        author: 'Sagar',
        content: 'Will debug timeout after finishing login UI task.',
      },
    ],
  });

  console.log('Seed complete: 1 project, 2 tickets, 3 comments.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
