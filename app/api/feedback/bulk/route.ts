import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    let workspaceId = (session?.user as any)?.workspaceId;

    // Fallback: If no session exists during development testing, attach to the seeded demo workspace
    if (!workspaceId) {
      const demoWorkspace = await prisma.workspace.findFirst();
      if (!demoWorkspace) {
        return NextResponse.json({ error: "No active workspace found." }, { status: 400 });
      }
      workspaceId = demoWorkspace.id;
    }

    const { items } = await req.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Invalid payload. Provide an array of feedback items." },
        { status: 400 }
      );
    }

    // Filter valid rows containing content
    const recordsToCreate = items
      .filter((row: any) => row.content && String(row.content).trim().length > 0)
      .map((row: any) => ({
        content: String(row.content).trim(),
        channel: row.channel || row.source || "csv_import",
        customerLabel: row.customerLabel || row.customerEmail || row.email || null,
        workspaceId,
      }));

    if (recordsToCreate.length === 0) {
      return NextResponse.json(
        { error: "No valid rows with a 'content' header found in CSV." },
        { status: 400 }
      );
    }

    // Bulk insert into Neon PostgreSQL
    const result = await prisma.feedback.createMany({
      data: recordsToCreate,
    });

    return NextResponse.json({
      message: `Successfully imported ${result.count} feedback records.`,
      count: result.count,
    });
  } catch (error) {
    console.error("CSV Bulk Import Detailed Error:", error);
    return NextResponse.json(
      { error: "Failed to process bulk CSV import." },
      { status: 500 }
    );
  }
}