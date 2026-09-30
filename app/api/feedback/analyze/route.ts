import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzeFeedback } from "@/lib/ai";
import { getEffectiveWorkspaceContext } from "@/lib/demo-session";

export async function POST(req: Request) {
  const { workspaceId } = await getEffectiveWorkspaceContext();

  try {
    const { feedbackId } = await req.json().catch(() => ({ feedbackId: null }));

    // Target a specific feedback item or batch-process pending items
    const targetFeedbackList = feedbackId
      ? await prisma.feedback.findMany({ where: { id: feedbackId, workspaceId } })
      : await prisma.feedback.findMany({ where: { workspaceId, sentiment: null }, take: 10 });

    if (targetFeedbackList.length === 0) {
      return NextResponse.json({ message: "No feedback items pending analysis." }, { status: 200 });
    }

    const processed = [];

    for (const item of targetFeedbackList) {
      const analysis = await analyzeFeedback(item.content);
      const themes = await Promise.all(
        analysis.themes.map(async (name) => {
          const existingTheme = await prisma.theme.findFirst({
            where: { name, workspaceId },
          });

          return (
            existingTheme ??
            prisma.theme.create({ data: { name, workspaceId } })
          );
        })
      );

      const updated = await prisma.feedback.update({
        where: { id: item.id },
        data: {
          sentiment: analysis.sentiment,
          sentimentScore: analysis.sentimentScore,
          themes: {
            deleteMany: {},
            create: themes.map((theme) => ({
              theme: { connect: { id: theme.id } },
            })),
          },
        },
      });

      processed.push({ ...updated, summary: analysis.summary });
    }

    return NextResponse.json({
      message: `Successfully analyzed ${processed.length} feedback item(s).`,
      results: processed,
    });
  } catch (error) {
    console.error("Analysis route error:", error);
    return NextResponse.json({ error: "Feedback analysis failed." }, { status: 500 });
  }
}