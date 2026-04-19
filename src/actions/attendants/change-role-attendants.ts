"use server";

import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { Role, User } from "@prisma/client";
import { headers } from "next/headers";
import { findAttendantsById } from "./find-attendants-by-id";

type ChangeRoleAttendantProps = {
  attendantId: string;
  newRole: Role;
  adminPassword: string;
};

export async function changeRoleAttendant({
  adminPassword,
  newRole,
  attendantId,
}: ChangeRoleAttendantProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Não foi possivel encontrar a session");
  }

  const email = session.user.email;

  const response = await auth.api.signInEmail({
    body: {
      email,
      password: adminPassword,
    },
    asResponse: true,
  });

  if (response.status !== 200) {
    throw new Error("Não foi possivel alterar o cargo do funcionário");
  }

  const attendant = await findAttendantsById<User>(attendantId);

  const attendantUpdated = await prisma.user.update({
    where: {
      id: attendantId,
    },
    data: {
      role: newRole,
    },
  });

  await logger({
    category: "USER_MANAGEMENT",
    action: "attendant.role.changed",
    entityId: attendantId,
    userId: session.user.id,
    metadata: {
      attendantName: attendant.name,
      previousRole: attendant.role,
      newRole,
      changedBy: session.user.email,
    },
  });

  return attendantUpdated;
}
