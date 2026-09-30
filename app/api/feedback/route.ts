import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEffectiveWorkspaceContext } from "@/lib/demo-session";

// GET /api/feedback - Retrieve feedback for the current tenant workspace
export async function GET() {
  const { workspaceId } = await getEffectiveWorkspaceContext();

  const feedback = await prisma.feedback.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(feedback);
}

// POST /api/feedback - Submit new customer feedback bound to the tenant workspace
export async function POST(req: Request) {
  const { workspaceId } = await getEffectiveWorkspaceContext();

  try {
    const { content, source, customerEmail } = await req.json();

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const newFeedback = await prisma.feedback.create({
      data: {
        content,
        channel: source || "web_portal",
        customerLabel: customerEmail || null,
        workspaceId,
      },
    });

    return NextResponse.json(newFeedback, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create feedback entry" },
      { status: 500 }
    );
  }
}