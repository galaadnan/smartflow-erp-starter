import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { PermissionKey } from "../generated/prisma/enums";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

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

  const company = await prisma.company.findFirst({
    where: {
      name: "SmartFlow Demo Company",
    },
  });

  if (!company) {
    throw new Error("SmartFlow Demo Company not found.");
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

  const allPermissions = await prisma.permission.findMany();

  const rolePermissions: Record<string, PermissionKey[]> = {
    SUPER_ADMIN: permissions,
    ADMIN: permissions,

    MANAGER: [
      PermissionKey.CUSTOMERS_READ,
      PermissionKey.CUSTOMERS_CREATE,
      PermissionKey.CUSTOMERS_UPDATE,
      PermissionKey.PRODUCTS_READ,
      PermissionKey.PRODUCTS_CREATE,
      PermissionKey.PRODUCTS_UPDATE,
      PermissionKey.SALES_CREATE,
      PermissionKey.SALES_FULFILL,
      PermissionKey.INVOICES_READ,
      PermissionKey.INVOICES_CREATE,
      PermissionKey.PAYMENTS_CREATE,
      PermissionKey.EXPENSES_CREATE,
    ],

    EMPLOYEE: [
      PermissionKey.CUSTOMERS_READ,
      PermissionKey.CUSTOMERS_CREATE,
      PermissionKey.PRODUCTS_READ,
      PermissionKey.SALES_CREATE,
      PermissionKey.INVOICES_READ,
    ],
  };

  for (const [roleName, permissionKeys] of Object.entries(rolePermissions)) {
    const role = await prisma.role.findUnique({
      where: {
        companyId_name: {
          companyId: company.id,
          name: roleName,
        },
      },
    });

    if (!role) {
      throw new Error(`Role not found: ${roleName}`);
    }

    for (const permissionKey of permissionKeys) {
      const permission = allPermissions.find(
        (item) => item.key === permissionKey,
      );

      if (!permission) {
        throw new Error(`Permission not found: ${permissionKey}`);
      }

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }

  console.log("Role permissions assigned");
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
