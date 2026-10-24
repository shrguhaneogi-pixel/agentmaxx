import type { Address } from "viem";
import {
  beginPayment,
  completePayment,
  failPayment,
  getReceipt,
  getStallStatus,
  haggle,
  listWares,
  verifyBuyerConfirmation,
} from "./bazaar";
import {
  executeOnChainSettlement,
  getWalletAddress,
  getWalletBalance,
  payAndFetch,
  type OnChainSettlementOptions,
  type OnChainSettlementResult,
  type PaymentExecutionResult,
} from "./wallet";

export type ToolContext = {
  baseUrl: string;
  messages?: Array<{ role: "user" | "agent"; text: string }>;
  lastUserMessage?: string;
  confirmedDealId?: string;
  turnStartTime?: number;
  onChain?: boolean;
  onChainOptions?: OnChainSettlementOptions;
};

export type Tool = {
  name: string;
  description: string;
  /** JSON Schema describing the inputs. */
  parameters: Record<string, unknown>;
  /** The code that runs when the agent calls this tool. */
  run: (args: Record<string, unknown>, ctx?: ToolContext) => Promise<unknown>;
};

export const tools: Tool[] = [
  // ─── BAZAAR TOOL 1: Browse Wares ───
  {
    name: "list_wares",
    description:
      "Browse all wares currently offered in Marzban's bazaar stall, including description, base price, public asking price, availability, and remaining negotiation rounds.",
    parameters: {
      type: "object",
      properties: {},
    },
    run: async () => {
      return { wares: listWares() };
    },
  },

  // ─── BAZAAR TOOL 2: Haggle Offer ───
  {
    name: "haggle_offer",
    description:
      "Submit an offer in silver for an item in Marzban's bazaar. Required parameters: itemId (string) and offer (positive integer amount of silver).",
    parameters: {
      type: "object",
      properties: {
        itemId: {
          type: "string",
          description:
            "The unique ID of the item (e.g. 'brass-astrolabe', 'saffron-tin', 'silk-scarf', 'haunted-lamp', 'spice-box', 'map-scroll').",
        },
        offer: {
          type: "integer",
          description: "The amount of silver offered by the buyer (must be a positive integer).",
        },
      },
      required: ["itemId", "offer"],
    },
    run: async (args: Record<string, unknown>) => {
      const safeArgs = args && typeof args === "object" ? args : {};
      const rawItemId = safeArgs.itemId ?? safeArgs.item_id;
      const itemId = typeof rawItemId === "string" ? rawItemId : String(rawItemId ?? "");
      const rawOffer = typeof safeArgs.offer === "number" ? safeArgs.offer : Number(safeArgs.offer);
      return haggle(itemId, rawOffer);
    },
  },

  // ─── BAZAAR TOOL 3: Pay Invoice (Checkout) ───
  {
    name: "pay_invoice",
    description:
      "Request the bazaar checkout for an agreed deal using the agent's wallet. Can settle via true on-chain smart contract escrow (Base Sepolia) or off-chain x402 HTTP flow. Required parameter: dealId. Explicit buyer confirmation in the current conversation turn is required before calling this tool.",
    parameters: {
      type: "object",
      properties: {
        dealId: {
          type: "string",
          description: "The ID of the pending agreed deal (e.g. 'deal-xxxxxxxx').",
        },
        mode: {
          type: "string",
          enum: ["on-chain", "off-chain"],
          description:
            "Optional settlement mode: 'on-chain' for Base Sepolia smart contract escrow settlement, or 'off-chain' for x402 endpoint settlement.",
        },
        amount: {
          type: "string",
          description: "Optional settlement amount (for on-chain settlement, e.g. '0.01').",
        },
        asset: {
          type: "string",
          description: "Optional settlement asset (for on-chain settlement, e.g. 'ETH' or 'USDC').",
        },
      },
      required: ["dealId"],
    },
    run: async (args: Record<string, unknown>, ctx?: ToolContext) => {
      const safeArgs = args && typeof args === "object" ? args : {};
      const rawDealId = safeArgs.dealId ?? safeArgs.deal_id;
      const dealId = typeof rawDealId === "string" ? rawDealId : String(rawDealId ?? "");
      if (!dealId) {
        return { error: "Missing required parameter: dealId" };
      }

      const rawBase = ctx?.baseUrl || "http://localhost:3000";
      const cleanBase = rawBase.replace(/\/+$/, "");
      const safeCtx: ToolContext = ctx ? { ...ctx, baseUrl: cleanBase } : { baseUrl: cleanBase };

      // Enforce the conservative authorization gate
      const auth = verifyBuyerConfirmation(dealId, safeCtx);
      if (!auth.authorized) {
        return {
          error: `Payment authorization denied: ${auth.reason}`,
          dealId,
          buyerConfirmationRequired: true,
          hint: "Ask the buyer for explicit confirmation before proceeding to checkout.",
        };
      }

      // Check deal and guard against concurrent payment attempts
      const beginRes = beginPayment(dealId);
      if (!beginRes.ok) {
        return { error: beginRes.error, dealId };
      }

      const requestedMode = typeof safeArgs.mode === "string" ? safeArgs.mode : "";
      const isExplicitOnChain =
        requestedMode === "on-chain" ||
        safeArgs.onChain === true ||
        process.env.SETTLEMENT_MODE === "on-chain" ||
        Boolean(ctx?.onChain);

      if (isExplicitOnChain) {
        try {
          const amount = typeof safeArgs.amount === "string" ? safeArgs.amount : "0.01";
          const asset = typeof safeArgs.asset === "string" ? safeArgs.asset : "ETH";
          const payTo =
            typeof safeArgs.payTo === "string" ? (safeArgs.payTo as Address) : undefined;

          const settlement = await executeOnChainSettlement(
            dealId,
            amount,
            asset,
            payTo,
            ctx?.onChainOptions
          );

          const buyer = getWalletAddress() || "0x000000000000000000000000000000000000dEaD";
          const completion = completePayment(dealId, buyer, settlement.txHash);

          if (!completion.ok) {
            failPayment(dealId, completion.error);
            return {
              error: `On-chain settlement succeeded but inventory state update failed: ${completion.error}`,
              dealId,
              txHash: settlement.txHash,
            };
          }

          return {
            success: true,
            dealId,
            receiptId: completion.receipt.id,
            receipt: completion.receipt,
            txHash: settlement.txHash,
            blockNumber: settlement.blockNumber.toString(),
            gasUsed: settlement.gasUsed.toString(),
            settlement,
            message: "On-chain payment settled on Base Sepolia and verified. Deal is completed.",
          };
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          failPayment(dealId, msg);
          return {
            error: `On-chain payment failure: ${msg}. The item remains reserved.`,
            dealId,
          };
        }
      }

      try {
        const checkoutUrl = `${cleanBase}/api/bazaar/checkout?dealId=${encodeURIComponent(dealId)}`;
        const result: PaymentExecutionResult = await payAndFetch(checkoutUrl);
        const data = (result.data && typeof result.data === "object" ? result.data : {}) as Record<
          string,
          unknown
        >;

        if (Boolean(data.success) && (!result.payment || result.payment.status === 200)) {
          return {
            success: true,
            dealId,
            receiptId: data.receiptId,
            details: data,
            payment: result.payment,
            message: "Payment successfully signed and verified. Deal is completed.",
          };
        } else {
          failPayment(dealId, "Payment failed or was rejected by checkout endpoint");
          return {
            error: "Checkout payment failed or was not accepted by endpoint. The item remains reserved.",
            details: data,
            payment: result.payment,
          };
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        failPayment(dealId, msg);
        return {
          error: `Payment network failure: ${msg}. The item remains reserved.`,
          dealId,
        };
      }
    },
  },

  // ─── BAZAAR TOOL 4: Get Receipt ───
  {
    name: "get_receipt",
    description:
      "Retrieve a receipt for a completed bazaar purchase by dealId, receiptId, or itemId, or retrieve the most recent receipt if unspecified.",
    parameters: {
      type: "object",
      properties: {
        receiptId: {
          type: "string",
          description: "Optional receipt ID (e.g. 'rcpt-xxxxxxxx').",
        },
        dealId: {
          type: "string",
          description: "Optional deal ID (e.g. 'deal-xxxxxxxx').",
        },
        itemId: {
          type: "string",
          description: "Optional item ID (e.g. 'brass-astrolabe').",
        },
      },
    },
    run: async (args: Record<string, unknown>) => {
      const safeArgs = args && typeof args === "object" ? args : {};
      const rawIdentifier =
        safeArgs.receiptId ??
        safeArgs.receipt_id ??
        safeArgs.dealId ??
        safeArgs.deal_id ??
        safeArgs.itemId ??
        safeArgs.item_id;
      const identifier =
        typeof rawIdentifier === "string" && rawIdentifier.trim()
          ? rawIdentifier.trim()
          : undefined;
      const receipt = getReceipt(identifier);
      if (!receipt) {
        return {
          error: identifier
            ? `No completed purchase receipt found for identifier "${identifier}".`
            : "No completed purchases or receipts on record in the bazaar stall.",
        };
      }
      return {
        receiptId: receipt.id,
        dealId: receipt.dealId,
        itemId: receipt.itemId,
        itemName: receipt.itemName,
        silverPrice: receipt.silverPrice,
        payer: receipt.payer,
        timestamp: receipt.timestamp,
        txHash: receipt.txHash,
        status: "completed",
        summary: `Receipt ${receipt.id}: Purchased ${receipt.itemName} for ${receipt.silverPrice} silver. Signed test payment verified on Base Sepolia.`,
      };
    },
  },

  // ─── BAZAAR TOOL 5: Get Stall Status ───
  {
    name: "get_stall_status",
    description:
      "Refresh and inspect Marzban's current stall status, including current mood, remaining negotiation rounds per item, and active pending deals.",
    parameters: {
      type: "object",
      properties: {},
    },
    run: async () => {
      return getStallStatus();
    },
  },

  // ─── 6. A paid API: the agent's wallet signs a payment to unlock it ───
  {
    name: "get_weather",
    description: "Get the current weather for a city. Costs 0.01 USDC, paid automatically from the agent's wallet.",
    parameters: {
      type: "object",
      properties: {
        city: { type: "string", description: "City name, e.g. Mumbai" },
      },
      required: ["city"],
    },
    run: async (args: Record<string, unknown>, ctx?: ToolContext): Promise<PaymentExecutionResult | { error: string }> => {
      const rawBase = ctx?.baseUrl || "http://localhost:3000";
      const baseUrl = rawBase.replace(/\/+$/, "");
      const safeArgs = args && typeof args === "object" ? args : {};
      const rawCity = safeArgs.city ?? safeArgs.location;
      const city = typeof rawCity === "string" && rawCity.trim() ? rawCity.trim() : "Mumbai";
      try {
        return await payAndFetch(`${baseUrl}/api/weather?city=${encodeURIComponent(city)}`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return { error: `Weather service unavailable: ${msg}` };
      }
    },
  },

  // ─── 7. Wallet tool: read the agent's own wallet ───
  {
    name: "get_my_wallet",
    description: "Get the agent's own wallet address and its ETH balance on Base Sepolia (testnet).",
    parameters: { type: "object", properties: {} },
    run: async () => {
      const address = getWalletAddress();
      if (!address) {
        return {
          status: "no_wallet",
          message: "The agent does not have a wallet yet. The user should click 'Create wallet' or configure WALLET_PRIVATE_KEY.",
        };
      }
      return {
        address,
        balance: await getWalletBalance().catch(() => "unavailable"),
        network: "Base Sepolia (testnet)",
      };
    },
  },

  // ─── 8. Get joke tool: Random jokes! ───
  {
    name: "get_joke",
    description: "Get a random joke. User wants a joke to be told.",
    parameters: {
      type: "object",
      properties: {},
    },
    run: async () => {
      try {
        const response = await fetch("https://official-joke-api.appspot.com/random_joke", {
          signal: AbortSignal.timeout(4000),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const joke = (await response.json()) as { setup?: string; punchline?: string };
        return {
          setup: joke.setup ?? "Why do programmers prefer dark mode?",
          punchline: joke.punchline ?? "Because light attracts bugs!",
        };
      } catch {
        return {
          setup: "Why do programmers prefer dark mode?",
          punchline: "Because light attracts bugs!",
        };
      }
    },
  },

  // ─── 9. Country info tool: Get information about capital and population ───
  {
    name: "get_country_info",
    description: "Get information about a country. User wants to know about the capital and population.",
    parameters: {
      type: "object",
      properties: {
        country: {
          type: "string",
          description: "Country name, e.g. India",
        },
      },
      required: ["country"],
    },
    run: async (args: Record<string, unknown>) => {
      const safeArgs = args && typeof args === "object" ? args : {};
      const rawCountry = typeof safeArgs.country === "string" ? safeArgs.country : String(safeArgs.country ?? "");
      const normalized = rawCountry.trim().toLowerCase();
      if (!normalized) {
        return {
          error: "Missing required parameter: country",
          suggestion: "Please provide a valid country name, e.g. 'India', 'Japan', or 'France'.",
        };
      }
      const KNOWN_COUNTRIES: Record<string, { capital: string; population: string; region: string; cuisine?: string }> = {
        india: { capital: "New Delhi", population: "1,428,000,000", region: "Asia", cuisine: "Biryani, Butter Chicken, Masala Dosa" },
        france: { capital: "Paris", population: "68,000,000", region: "Europe", cuisine: "Croissants, Coq au Vin, Ratatouille" },
        japan: { capital: "Tokyo", population: "125,000,000", region: "Asia", cuisine: "Sushi, Ramen, Tempura" },
        "united states": { capital: "Washington, D.C.", population: "335,000,000", region: "Americas", cuisine: "Barbecue, Apple Pie, Clam Chowder" },
        usa: { capital: "Washington, D.C.", population: "335,000,000", region: "Americas", cuisine: "Barbecue, Apple Pie, Clam Chowder" },
        italy: { capital: "Rome", population: "59,000,000", region: "Europe", cuisine: "Pizza Napoletana, Carbonara, Gelato" },
        spain: { capital: "Madrid", population: "47,000,000", region: "Europe", cuisine: "Paella, Tapas, Gazpacho" },
        germany: { capital: "Berlin", population: "84,000,000", region: "Europe", cuisine: "Bratwurst, Sauerbraten, Pretzel" },
        "united kingdom": { capital: "London", population: "67,000,000", region: "Europe", cuisine: "Fish and Chips, Shepherd's Pie, Roast Beef" },
        uk: { capital: "London", population: "67,000,000", region: "Europe", cuisine: "Fish and Chips, Shepherd's Pie, Roast Beef" },
        canada: { capital: "Ottawa", population: "40,000,000", region: "Americas", cuisine: "Poutine, Butter Tarts, Tourtière" },
        australia: { capital: "Canberra", population: "26,000,000", region: "Oceania", cuisine: "Meat Pies, Pavlova, Vegemite Toast" },
        brazil: { capital: "Brasília", population: "215,000,000", region: "Americas", cuisine: "Feijoada, Pão de Queijo, Moqueca" },
        china: { capital: "Beijing", population: "1,410,000,000", region: "Asia", cuisine: "Peking Duck, Dim Sum, Kung Pao Chicken" },
        mexico: { capital: "Mexico City", population: "128,000,000", region: "Americas", cuisine: "Tacos al Pastor, Mole Poblano, Tamales" },
        thailand: { capital: "Bangkok", population: "72,000,000", region: "Asia", cuisine: "Pad Thai, Tom Yum Goong, Green Curry" },
        switzerland: { capital: "Bern", population: "8,900,000", region: "Europe", cuisine: "Cheese Fondue, Raclette, Rösti" },
        singapore: { capital: "Singapore", population: "5,900,000", region: "Asia", cuisine: "Hainanese Chicken Rice, Chili Crab, Laksa" },
        netherlands: { capital: "Amsterdam", population: "17,800,000", region: "Europe", cuisine: "Stroopwafel, Bitterballen, Herring" },
        turkey: { capital: "Ankara", population: "85,000,000", region: "Europe / Asia", cuisine: "Kebabs, Baklava, Meze" },
        indonesia: { capital: "Jakarta", population: "277,000,000", region: "Asia", cuisine: "Nasi Goreng, Rendang, Satay" },
        egypt: { capital: "Cairo", population: "109,000,000", region: "Africa", cuisine: "Koshari, Ful Medames, Shawarma" },
        "united arab emirates": { capital: "Abu Dhabi", population: "9,900,000", region: "Asia", cuisine: "Shawarma, Al Harees, Machboos" },
        uae: { capital: "Abu Dhabi", population: "9,900,000", region: "Asia", cuisine: "Shawarma, Al Harees, Machboos" },
      };

      if (KNOWN_COUNTRIES[normalized]) {
        return {
          country: rawCountry,
          ...KNOWN_COUNTRIES[normalized],
        };
      }

      try {
        const res = await fetch(
          `https://restcountries.com/v3.1/name/${encodeURIComponent(rawCountry)}?fields=name,capital,population,region`,
          { signal: AbortSignal.timeout(4000) }
        ).catch(() => null);

        if (res && res.ok) {
          const raw: unknown = await res.json();
          if (Array.isArray(raw) && raw.length > 0) {
            const data = raw[0] as { capital?: unknown; population?: unknown; region?: unknown };
            return {
              country: rawCountry,
              capital: Array.isArray(data?.capital) ? String(data.capital[0]) : typeof data?.capital === "string" ? data.capital : "Unknown",
              population: data?.population ? Number(data.population).toLocaleString() : "Unknown",
              region: typeof data?.region === "string" ? data.region : "Unknown",
            };
          }
        }

        return {
          country: rawCountry,
          error: `Could not retrieve live details for "${rawCountry}".`,
          suggestion: "Please check the country name spelling or try a major destination like India, France, or Japan.",
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to fetch country info";
        return { country: rawCountry, error: message };
      }
    },
  },
];
