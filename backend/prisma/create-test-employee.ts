import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import * as bcrypt from "bcrypt";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const company = await prisma.company.findFirst({
    where: { name: "SmartFlow Demo Company" },
  });

  if (!company) {
    throw new Error("SmartFlow Demo Company not found.");
  }

  const role = await prisma.role.findUnique({
    where: {
      companyId_name: {
        companyId: company.id,
        name: "EMPLOYEE",
      },
    },
  });

  if (!role) {
    throw new Error("EMPLOYEE role not found for SmartFlow Demo Company.");
  }

  if (role.companyId !== company.id) {
    throw new Error("Role does not belong to SmartFlow Demo Company.");
  }

  const passwordHash = await bcrypt.hash("SfEmployee@2026!", 12);

  const user = await prisma.user.upsert({
    where: {
      companyId_email: {
        companyId: company.id,
        email: "employee@smartflow.test",
      },
    },
    update: {},
    create: {
      companyId: company.id,
      roleId: role.id,
      firstName: "Test",
      lastName: "Employee",
      email: "employee@smartflow.test",
      username: "testemployee",
      passwordHash,
    },
    select: {
      id: true,
      email: true,
      username: true,
      status: true,
      passwordHash: true,
      company: { select: { name: true } },
      role: { select: { name: true } },
    },
  });

  // Verify
  if (user.company.name !== "SmartFlow Demo Company") {
    throw new Error("Verification failed: wrong company.");
  }
  if (user.role.name !== "EMPLOYEE") {
    throw new Error("Verification failed: wrong role.");
  }
  if (user.status !== "ACTIVE") {
    throw new Error("Verification failed: status is not ACTIVE.");
  }
  const hashValid = await bcrypt.compare("SfEmployee@2026!", user.passwordHash);
  if (!hashValid) {
    throw new Error("Verification failed: password hash does not match.");
  }

  console.log("Test employee created and verified:");
  console.log({
    id: user.id,
    email: user.email,
    username: user.username,
    company: user.company.name,
    role: user.role.name,
    status: user.status,
  });
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
