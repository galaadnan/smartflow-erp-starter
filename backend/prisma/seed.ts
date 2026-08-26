import { PrismaClient, PermissionKey } from "../generated/prisma";

const prisma = new PrismaClient();

async function main() {
  const permissions = Object.values(PermissionKey);

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: {
        key: permission,
      },
      update: {},
      create: {
        key: permission,
      },
    });
  }

  console.log("Permissions created");


  const company = await prisma.company.findFirst();

  if (!company) {
    throw new Error("No company found. Create a company first.");
  }


  const roles = [
    "SUPER_ADMIN",
    "ADMIN",
    "MANAGER",
    "EMPLOYEE",
  ];


  for (const roleName of roles) {
    await prisma.role.upsert({
      where: {
        companyId_name: {
          companyId: company.id,
          name: roleName,
        },
      },
      update: {},
      create: {
        companyId: company.id,
        name: roleName,
      },
    });
  }

  console.log("Roles created");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
