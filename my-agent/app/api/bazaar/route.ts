import { NextResponse } from "next/server";
import { getStallStatus, listWares, stall } from "@/agent/bazaar";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const status = getStallStatus();
    return NextResponse.json({
      success: true,
      mood: status.mood,
      wares: status.wares,
      activePendingDeals: status.activePendingDeals,
      completedReceiptsCount: status.completedReceiptsCount,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to query bazaar inventory" },
      { status: 500 }
    );
  }
}
