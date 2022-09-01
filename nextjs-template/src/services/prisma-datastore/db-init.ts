import {
  PrismaClient,
  Project,
  Prisma,
} from "@prisma/client";
import Config from "../../../Config";

const prisma = new PrismaClient();

// todo - move these up to the AppEvents defined against notehub

const motion = {
  qo: "motion.qo",
};

const air = {
  qo: "air.qo",
};

const sensors = {
  db: "sensors.db",
};

const _session = {
  qo: "_session.qo",
};

const _health = {
  qo: "_health.qo",
};




/**
 * Creates a new project.
 * @param projectUID
 */
async function createProject(prisma: PrismaClient, projectUID: string) {
  console.log(`Creating project with PROJECT_UID ${projectUID}`);
  const project = await upsertProject({
    prisma,
    projectUID,
    name: Config.companyName,
  });
  return project;
}



async function upsertProject({
  prisma,
  projectUID,
  name,
}: {
  prisma: PrismaClient;
  projectUID: string;
  name: string;
}) {
  const project = await prisma.project.upsert({
    where: {
      projectUID,
    }, // looks like the typescript info is broken and only supports id
    create: {
      projectUID,
      name,
    },
    update: {
      name,
    },
  });
  return project;
}

async function init() {
  createProject(prisma, Config.hubProjectUID);
}

init()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
