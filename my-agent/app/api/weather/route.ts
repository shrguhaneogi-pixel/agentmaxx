/**
 * A MOCK PAID WEATHER API
 *
 * Pretend this is someone else's API that charges per request.
 * No payment → 402 Payment Required. Valid signed payment → the weather.
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyPayment } from "@/agent/wallet";

export const dynamic = "force-dynamic";

const PRICE = "0.01";
const ASSET = "USDC";
const PAY_TO = "0x000000000000000000000000000000000000dEaD"; // the API owner's wallet (demo)

interface WeatherSuccessResponse {
  city: string;
  temperatureC: number;
  condition: string;
  paidBy: string;
}

interface WeatherErrorResponse {
  error: string;
  price?: string;
  asset?: string;
  payTo?: string;
}

export async function GET(req: NextRequest): Promise<NextResponse<WeatherSuccessResponse | WeatherErrorResponse>> {
  const city = req.nextUrl.searchParams.get("city") ?? "Unknown";

  const payment = await verifyPayment(req.headers.get("X-PAYMENT"));
  if (!payment || payment.to !== PAY_TO || Number(payment.amount) < Number(PRICE)) {
    return NextResponse.json(
      { error: "Payment Required", price: PRICE, asset: ASSET, payTo: PAY_TO },
      { status: 402 }
    );
  }

  // Fake weather — swap in a real API here if you like.
  const conditions = ["Sunny", "Cloudy", "Rainy", "Windy", "Stormy"];
  return NextResponse.json({
    city,
    temperatureC: Math.round(15 + Math.random() * 20),
    condition: conditions[Math.floor(Math.random() * conditions.length)],
    paidBy: payment.from,
  });
}

