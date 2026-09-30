import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function getEffectiveWorkspaceContext() {
  const session = await getServerSession(authOptions);

  if (session?.user && (session.user as any).workspaceId) {
    return {
      workspaceId: (session.user as any).workspaceId,
      user: session.user,
      isDemo: false,
    };
  }

  const demoWorkspaceName = "Zidio Demo Workspace";

  let workspace = await prisma.workspace.findFirst({
    where: { name: demoWorkspaceName },
  });

  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: { name: demoWorkspaceName },
    });
  }

  const demoUserEmail = "admin@zidio.com";
  const demoUser = await prisma.user.upsert({
    where: { email: demoUserEmail },
    update: { workspaceId: workspace.id },
    create: {
      email: demoUserEmail,
      name: "Zidio Admin",
      passwordHash: "demo_password_hash",
      workspaceId: workspace.id,
      role: "ADMIN",
    },
  });

  return {
    workspaceId: demoUser.workspaceId,
    user: {
      id: demoUser.id,
      email: demoUser.email,
      name: demoUser.name,
      workspaceId: demoUser.workspaceId,
    },
    isDemo: true,
  };
}
