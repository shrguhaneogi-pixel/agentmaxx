/**
 * MARZBAN'S BAZAAR STALL & NEGOTIATION ENGINE
 *
 * Implements the stateful inventory, mood system, negotiation rules,
 * private floor hiding, buyer confirmation gate, and checkout state machine.
 */
import crypto from "crypto";

export type Mood = "cheerful" | "neutral" | "grumpy";

export interface Item {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  privateCost: number;
  askingPrice: number;
  availability: "available" | "reserved" | "sold";
  roundsConsumed: number;
  agreedPrice?: number;
  paymentState?: "pending" | "processing" | "completed" | "failed";
}

export interface PublicWare {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  askingPrice: number;
  availability: "available" | "reserved" | "sold";
  roundsConsumed: number;
  roundsRemaining: number;
}

export interface Deal {
  id: string;
  itemId: string;
  itemName: string;
  agreedPrice: number;
  status: "pending_payment" | "completed" | "failed";
  paymentState: "pending" | "processing" | "completed" | "failed";
  createdAt: number;
}

export interface Receipt {
  id: string;
  dealId: string;
  itemId: string;
  itemName: string;
  silverPrice: number;
  payer: string;
  timestamp: string;
  txHash?: string;
}

export interface StallStatus {
  mood: Mood;
  wares: PublicWare[];
  activePendingDeals: Array<{
    dealId: string;
    itemId: string;
    itemName: string;
    agreedPrice: number;
    createdAt: number;
  }>;
  completedReceiptsCount: number;
}

export type HaggleStatus =
  | "accepted"
  | "counter"
  | "rejected_insulting"
  | "negotiation_closed"
  | "error";

export interface HaggleResult {
  status: HaggleStatus;
  itemId?: string;
  itemName?: string;
  agreedPrice?: number;
  dealId?: string;
  counterPrice?: number;
  askingPrice?: number;
  finalAskingPrice?: number;
  roundsConsumed?: number;
  roundsRemaining?: number;
  mood?: Mood;
  message: string;
  error?: string;
}

export interface BuyerConfirmationResult {
  authorized: boolean;
  reason?: string;
  dealId?: string;
}

export interface BazaarStall {
  mood: Mood;
  items: Map<string, Item>;
  deals: Map<string, Deal>;
  receipts: Receipt[];
}

export const MOOD_FACTORS: Record<Mood, number> = {
  cheerful: 0.95,
  neutral: 1.0,
  grumpy: 1.15,
};

const INITIAL_WARES: ReadonlyArray<Omit<Item, "askingPrice" | "availability" | "roundsConsumed">> = [
  {
    id: "brass-astrolabe",
    name: "Brass Astrolabe",
    description: "Hand-engraved, points at stars and at your ambitions.",
    basePrice: 120,
    privateCost: 60,
  },
  {
    id: "saffron-tin",
    name: "Saffron Threads 5g tin",
    description: "Deep red, fragrant, worth its weight in gossip.",
    basePrice: 45,
    privateCost: 20,
  },
  {
    id: "silk-scarf",
    name: "Hand-loomed Silk Scarf",
    description: "Soft as a rumor, strong as a promise.",
    basePrice: 70,
    privateCost: 30,
  },
  {
    id: "haunted-lamp",
    name: "Slightly Haunted Oil Lamp",
    description: "Flickers when someone lies nearby.",
    basePrice: 90,
    privateCost: 25,
  },
  {
    id: "spice-box",
    name: "Seven-Spice Box",
    description: "Seven compartments, seven moods.",
    basePrice: 55,
    privateCost: 28,
  },
  {
    id: "map-scroll",
    name: "Treasure Map",
    description: "Authenticity not guaranteed. Adventure is.",
    basePrice: 35,
    privateCost: 5,
  },
];

const MOODS: Mood[] = ["cheerful", "neutral", "grumpy"];

function getRandomMood(): Mood {
  return MOODS[Math.floor(Math.random() * MOODS.length)];
}

function createInitialStall(presetMood?: Mood): BazaarStall {
  const items = new Map<string, Item>();
  for (const ware of INITIAL_WARES) {
    items.set(ware.id, {
      ...ware,
      askingPrice: ware.basePrice,
      availability: "available",
      roundsConsumed: 0,
    });
  }

  return {
    mood: presetMood ?? getRandomMood(),
    items,
    deals: new Map<string, Deal>(),
    receipts: [],
  };
}

// Preserve stall state across hot module reloading in development
const globalForBazaar = globalThis as unknown as {
  __marzban_stall?: BazaarStall;
};

export const stall: BazaarStall = globalForBazaar.__marzban_stall ?? createInitialStall();
globalForBazaar.__marzban_stall = stall;

export function resetStall(presetMood?: Mood): void {
  const newStall = createInitialStall(presetMood);
  stall.mood = newStall.mood;
  stall.items = newStall.items;
  stall.deals = newStall.deals;
  stall.receipts = newStall.receipts;
}

/**
 * Calculates the private acceptance threshold:
 * min(basePrice, ceil(privateCost * 1.15 * moodThresholdFactor))
 */
export function getPrivateAcceptanceThreshold(item: Item, mood: Mood = stall.mood): number {
  const factor = MOOD_FACTORS[mood] ?? 1.0;
  return Math.min(item.basePrice, Math.ceil(item.privateCost * 1.15 * factor));
}

/**
 * Calculates a public counter price strictly above the private threshold.
 * Enforces the strict floor-hiding requirement so counter prices cannot reveal the threshold.
 */
export function calculateCounterPrice(item: Item, offer: number, threshold: number): number {
  // Safe margin above threshold so public counter never reveals or clamps to private threshold
  const safeMargin = Math.max(2, Math.floor((item.basePrice - threshold) * 0.1));
  const minPublicCounter = threshold + safeMargin;

  // If asking price has already reached the lowest safe level above threshold, it cannot concede further
  if (item.askingPrice <= minPublicCounter) {
    return Math.min(item.basePrice, minPublicCounter);
  }

  // Responsive concession:
  // Gap between current asking price and the safe floor
  const remainingSpread = item.askingPrice - minPublicCounter;

  // Higher offers (closer to threshold) yield slightly greater merchant concessions
  const safeOffer = Math.max(0, Math.min(threshold, offer));
  const offerRatio = threshold > 0 ? safeOffer / threshold : 0.5;
  const responsivenessFactor = 0.3 + 0.15 * offerRatio; // between 0.30 and 0.45

  const concession = Math.max(1, Math.round(remainingSpread * responsivenessFactor));
  const candidateCounter = item.askingPrice - concession;

  // Counter must be:
  // 1. Strictly less than current asking price: <= item.askingPrice - 1
  // 2. Strictly greater than threshold: >= minPublicCounter (>= threshold + 2)
  // 3. No greater than basePrice
  let counter = Math.max(minPublicCounter, Math.min(item.askingPrice - 1, candidateCounter));
  if (counter <= threshold) {
    counter = threshold + 1;
  }
  if (counter >= item.askingPrice && item.askingPrice > threshold + 1) {
    counter = item.askingPrice - 1;
  }
  return Math.min(item.basePrice, counter);
}

export function listWares(): PublicWare[] {
  const wares: PublicWare[] = [];
  for (const item of stall.items.values()) {
    wares.push({
      id: item.id,
      name: item.name,
      description: item.description,
      basePrice: item.basePrice,
      askingPrice: item.askingPrice,
      availability: item.availability,
      roundsConsumed: item.roundsConsumed,
      roundsRemaining: item.availability === "available" ? Math.max(0, 4 - item.roundsConsumed) : 0,
    });
  }
  return wares;
}

export function getItem(itemId: string): Item | undefined {
  if (!itemId || typeof itemId !== "string") return undefined;
  const clean = itemId.trim().toLowerCase();
  const direct = stall.items.get(clean);
  if (direct) return direct;

  const strippedClean = clean.replace(/[^a-z0-9]/g, "");
  if (!strippedClean) return undefined;

  for (const item of stall.items.values()) {
    const itemIdStripped = item.id.toLowerCase().replace(/[^a-z0-9]/g, "");
    const itemNameStripped = item.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (
      item.id.toLowerCase() === clean ||
      item.name.toLowerCase() === clean ||
      itemIdStripped === strippedClean ||
      itemNameStripped === strippedClean ||
      itemIdStripped.includes(strippedClean) ||
      itemNameStripped.includes(strippedClean)
    ) {
      return item;
    }
  }
  return undefined;
}

export function getPublicWare(itemId: string): PublicWare | undefined {
  const item = stall.items.get(itemId);
  if (!item) return undefined;
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    basePrice: item.basePrice,
    askingPrice: item.askingPrice,
    availability: item.availability,
    roundsConsumed: item.roundsConsumed,
    roundsRemaining: item.availability === "available" ? Math.max(0, 4 - item.roundsConsumed) : 0,
  };
}

export function getStallStatus(): StallStatus {
  const activePendingDeals = Array.from(stall.deals.values())
    .filter((d) => d.status === "pending_payment")
    .map((d) => ({
      dealId: d.id,
      itemId: d.itemId,
      itemName: d.itemName,
      agreedPrice: d.agreedPrice,
      createdAt: d.createdAt,
    }));

  return {
    mood: stall.mood,
    wares: listWares(),
    activePendingDeals,
    completedReceiptsCount: stall.receipts.length,
  };
}

export function createDeal(item: Item, agreedPrice: number): Deal {
  const dealId = `deal-${crypto.randomUUID().slice(0, 8)}`;
  const deal: Deal = {
    id: dealId,
    itemId: item.id,
    itemName: item.name,
    agreedPrice,
    status: "pending_payment",
    paymentState: "pending",
    createdAt: Date.now(),
  };
  stall.deals.set(dealId, deal);
  item.availability = "reserved";
  item.agreedPrice = agreedPrice;
  item.paymentState = "pending";
  return deal;
}

export function getDeal(dealId: string): Deal | undefined {
  return stall.deals.get(dealId);
}

/**
 * Core negotiation engine.
 */
export function haggle(itemId: string, offer: number): HaggleResult {
  if (!itemId || typeof itemId !== "string") {
    return {
      status: "error",
      error: "Item ID must be a non-empty string.",
      message: "Please specify which item you would like to haggle for.",
    };
  }

  const item = getItem(itemId);
  if (!item) {
    return {
      status: "error",
      error: `Item "${itemId}" not found in bazaar inventory.`,
      message: `I do not carry "${itemId}" in my stall, traveler. Browse my wares to see what is available.`,
    };
  }

  // Validate offer: must be positive, finite safe integer
  if (typeof offer !== "number" || !Number.isSafeInteger(offer) || offer <= 0) {
    return {
      status: "error",
      itemId: item.id,
      itemName: item.name,
      error: "Offer must be a positive integer amount of silver.",
      message: "Silver must be counted in honest, whole positive coins, friend! Name a real integer offer.",
    };
  }

  if (item.availability === "sold") {
    return {
      status: "negotiation_closed",
      itemId: item.id,
      itemName: item.name,
      finalAskingPrice: item.askingPrice,
      message: `Alas! The ${item.name} has already been sold to another discerning patron.`,
    };
  }

  if (item.availability === "reserved") {
    return {
      status: "negotiation_closed",
      itemId: item.id,
      itemName: item.name,
      finalAskingPrice: item.askingPrice,
      message: `The ${item.name} is currently reserved pending payment on an agreed deal.`,
    };
  }

  // Check round limit: 4 rounds maximum per item
  if (item.roundsConsumed >= 4) {
    if (offer >= item.askingPrice) {
      // User meets or exceeds the final standing asking price
      const agreedPrice = item.askingPrice;
      const deal = createDeal(item, agreedPrice);
      item.availability = "reserved";
      return {
        status: "accepted",
        itemId: item.id,
        itemName: item.name,
        agreedPrice,
        dealId: deal.id,
        roundsConsumed: item.roundsConsumed,
        roundsRemaining: 0,
        mood: stall.mood,
        message: `At last! You meet my final asking price of ${agreedPrice} silver for the ${item.name}. Deal agreed! Would you like to proceed to checkout?`,
      };
    }

    return {
      status: "negotiation_closed",
      itemId: item.id,
      itemName: item.name,
      finalAskingPrice: item.askingPrice,
      roundsConsumed: item.roundsConsumed,
      roundsRemaining: 0,
      mood: stall.mood,
      message: `Four rounds of bargaining have already passed for the ${item.name}. My final asking price of ${item.askingPrice} silver stands firm.`,
    };
  }

  const threshold = getPrivateAcceptanceThreshold(item, stall.mood);

  // Insulting offer check: offer is ridiculously low (below 70% of cost)
  const insultThreshold = Math.floor(item.privateCost * 0.7);
  if (offer < insultThreshold) {
    item.roundsConsumed += 1;
    // Mood degrades
    if (stall.mood === "cheerful") stall.mood = "neutral";
    else if (stall.mood === "neutral") stall.mood = "grumpy";

    return {
      status: "rejected_insulting",
      itemId: item.id,
      itemName: item.name,
      askingPrice: item.askingPrice,
      roundsConsumed: item.roundsConsumed,
      roundsRemaining: Math.max(0, 4 - item.roundsConsumed),
      mood: stall.mood,
      message: `${offer} silver?! For my glorious ${item.name}?! That is not a bid, that is highway robbery! My wounded pride demands no less than ${item.askingPrice} silver.`,
    };
  }

  // Accepted offer check: offer meets or exceeds private acceptance threshold
  if (offer >= threshold) {
    item.roundsConsumed += 1;
    const agreedPrice = Math.min(offer, item.askingPrice);
    const deal = createDeal(item, agreedPrice);
    item.availability = "reserved";

    // Mood improves on a good deal
    if (stall.mood === "grumpy") stall.mood = "neutral";
    else if (stall.mood === "neutral" && agreedPrice >= Math.floor(item.basePrice * 0.85)) {
      stall.mood = "cheerful";
    }

    return {
      status: "accepted",
      itemId: item.id,
      itemName: item.name,
      agreedPrice,
      dealId: deal.id,
      roundsConsumed: item.roundsConsumed,
      roundsRemaining: Math.max(0, 4 - item.roundsConsumed),
      mood: stall.mood,
      message: `You drive a spirited bargain, traveler! I accept your offer of ${agreedPrice} silver for the ${item.name}. Would you like to proceed to checkout?`,
    };
  }

  // Counter offer: offer is below threshold but not insulting
  item.roundsConsumed += 1;
  const counterPrice = calculateCounterPrice(item, offer, threshold);
  item.askingPrice = counterPrice;

  return {
    status: "counter",
    itemId: item.id,
    itemName: item.name,
    counterPrice,
    roundsConsumed: item.roundsConsumed,
    roundsRemaining: Math.max(0, 4 - item.roundsConsumed),
    mood: stall.mood,
    message: `${offer} silver is too lean for craftsmanship such as this. But I am fond of your spirit! How about ${counterPrice} silver for the ${item.name}?`,
  };
}

/**
 * Conservative authorization gate for buyer confirmation.
 * Verifies that the buyer explicitly authorized payment for this deal.
 * Model-generated arguments cannot bypass this verification.
 */
export function verifyBuyerConfirmation(
  dealId: string,
  ctx?: {
    lastUserMessage?: string;
    confirmedDealId?: string;
    turnStartTime?: number;
    messages?: Array<{ role: "user" | "agent"; text: string }>;
  }
): BuyerConfirmationResult {
  if (!dealId || typeof dealId !== "string") {
    return { authorized: false, reason: "A valid dealId is required." };
  }

  const deal = stall.deals.get(dealId);
  if (!deal) {
    return { authorized: false, reason: `No deal found with ID "${dealId}".` };
  }

  if (deal.status === "completed" || deal.paymentState === "completed") {
    return { authorized: false, reason: `Deal "${dealId}" has already been completed and paid.` };
  }

  // 1. Direct verified client confirmation
  if (ctx?.confirmedDealId === dealId) {
    return { authorized: true, dealId };
  }

  // 2. Prevent same-turn automated execution:
  // If the deal was created in this turn (after turn started), Gemini cannot auto-call pay_invoice
  // without asking the buyer first and receiving their reply in a subsequent turn.
  if (ctx?.turnStartTime && deal.createdAt >= ctx.turnStartTime) {
    return {
      authorized: false,
      reason:
        "The deal was just agreed in this turn. You must ask the buyer for explicit confirmation before proceeding to checkout.",
    };
  }

  // 3. Chat-based confirmation verification from user's latest message turn
  const userText = ctx?.lastUserMessage?.trim();
  if (!userText) {
    return {
      authorized: false,
      reason: "No user message found to verify buyer confirmation in the current turn.",
    };
  }

  // 4. Questions are NOT purchase confirmations (unless starting with 'how about <price>' offer)
  if (
    !/^\s*how about\s+\d+/i.test(userText) &&
    (userText.endsWith("?") || /^(can|could|would|will|how|what|why|where|who|is|are)\b/i.test(userText))
  ) {
    return {
      authorized: false,
      reason: "Buyer asked a question rather than providing explicit purchase confirmation.",
    };
  }

  // 5. Negative / dissent / hesitation phrases disqualify authorization immediately
  // Note: Allow "no problem", "no worries", "no issue", "no objection" as affirmative phrases
  const dissentRegex =
    /\b(no(?!\s+(?:problem|worries|issue|objection))|wait|cancel|stop|don't|dont|do not|won't|wont|will not|can't|cant|cannot|nevermind|never mind|decline|reject|abort|too expensive|too much|not yet|hold on|never|refuse|bad deal|terrible deal|awful deal|no deal|wrong item)\b/i;
  if (dissentRegex.test(userText)) {
    return {
      authorized: false,
      reason: "Buyer indicated hesitation, dissent, refusal, or cancellation in the current turn.",
    };
  }

  // 6. Price proposals or haggle offers are NOT purchase confirmations
  // Reject explicit haggle/counter proposal phrases
  if (/\b(offer|counter|how about|give you|will you take|can you take|can you do)\s+\d+/i.test(userText)) {
    return {
      authorized: false,
      reason: "Buyer is proposing a price or haggling rather than confirming checkout.",
    };
  }

  // If user explicitly mentions a silver amount or price ("for X", "X silver"), verify it matches agreed price
  const silverMatch = userText.match(/\b(\d+)\s*silver\b/i);
  if (silverMatch) {
    const mentionedPrice = parseInt(silverMatch[1], 10);
    if (mentionedPrice !== deal.agreedPrice) {
      return {
        authorized: false,
        reason: `Buyer is proposing or mentioning a different price (${mentionedPrice} silver vs agreed ${deal.agreedPrice} silver) rather than confirming checkout.`,
      };
    }
  }

  const forPriceMatch = userText.match(/\bfor\s+(\d+)\b/i);
  if (forPriceMatch) {
    const mentionedPrice = parseInt(forPriceMatch[1], 10);
    if (mentionedPrice !== deal.agreedPrice) {
      return {
        authorized: false,
        reason: `Buyer is proposing or mentioning a different price (${mentionedPrice} silver vs agreed ${deal.agreedPrice} silver) rather than confirming checkout.`,
      };
    }
  }

  // 7. Check for item mismatch:
  // A. Check against other stall wares
  const itemKeywords: Record<string, string[]> = {
    "brass-astrolabe": ["astrolabe", "brass"],
    "saffron-tin": ["saffron", "tin"],
    "silk-scarf": ["scarf", "silk"],
    "haunted-lamp": ["lamp", "haunted"],
    "spice-box": ["spice", "seven-spice"],
    "map-scroll": ["map", "treasure map", "scroll"],
  };

  for (const [otherItemId, keywords] of Object.entries(itemKeywords)) {
    if (otherItemId !== deal.itemId) {
      for (const kw of keywords) {
        const kwRegex = new RegExp(`\\b${kw}\\b`, "i");
        if (kwRegex.test(userText)) {
          return {
            authorized: false,
            reason: `Buyer mentioned "${kw}", which does not match the item for this deal (${deal.itemName}).`,
          };
        }
      }
    }
  }

  // B. Check if user explicitly names an uncataloged / non-stall item target
  // e.g. "for the magic carpet", "checkout the flying carpet", "buy the sword"
  const targetMatch =
    userText.match(/\bfor\s+(?:the\s+|a\s+|an\s+)?([a-z\s-]+?)(?:\s+(?:now|please|with|at)|\s*[,.?!]|\s*$)/i) ||
    userText.match(
      /\b(?:checkout|buy|purchase|pay for)\s+(?:the\s+|a\s+|an\s+)?([a-z\s-]+?)(?:\s+(?:now|please|with|at)|\s*[,.?!]|\s*$)/i
    );
  if (targetMatch) {
    const rawTarget = targetMatch[1].trim().toLowerCase();
    const nonItemWords = new Set([
      "now",
      "please",
      "immediately",
      "today",
      "asap",
      "it",
      "this",
      "that",
      "the item",
      "item",
      "the ware",
      "ware",
      "the deal",
      "deal",
      "purchase",
      "checkout",
      "payment",
      "order",
      "the goods",
      "goods",
      "one",
      "silver",
    ]);
    if (
      !nonItemWords.has(rawTarget) &&
      !/^\d+$/.test(rawTarget) &&
      !/^\d+\s*silver$/.test(rawTarget) &&
      !rawTarget.startsWith("for ")
    ) {
      const thisKeywords = itemKeywords[deal.itemId] ?? [];
      const itemWords = deal.itemName.toLowerCase().split(/\s+/);
      const allThisWords = new Set([...thisKeywords, ...itemWords]);
      const targetWords = rawTarget.split(/\s+/).filter((w) => !nonItemWords.has(w));
      if (targetWords.length > 0) {
        const matchesThisDeal = targetWords.some((w) => allThisWords.has(w));
        if (!matchesThisDeal) {
          return {
            authorized: false,
            reason: `Buyer mentioned "${rawTarget}", which does not match the item for this deal (${deal.itemName}).`,
          };
        }
      }
    }
  }

  // 8. Multi-deal conversation turn disambiguation:
  // Tie confirmation to current user action and prevent model-supplied argument bypass
  const pendingDeals = Array.from(stall.deals.values()).filter((d) => d.status === "pending_payment");
  if (pendingDeals.length > 1) {
    // Check if user explicitly named this deal's item in their text
    const thisKeywords = itemKeywords[deal.itemId] ?? [];
    const itemWords = deal.itemName.toLowerCase().split(/\s+/);
    const allThisWords = new Set([...thisKeywords, ...itemWords]);
    const userMentionsThisItem = Array.from(allThisWords).some((w) => new RegExp(`\\b${w}\\b`, "i").test(userText));

    if (!userMentionsThisItem) {
      // User did not name the item in this turn; inspect preceding agent turn to see what was asked
      const lastAgentMsg = ctx?.messages
        ? [...ctx.messages].reverse().find((m) => m.role === "agent")?.text
        : undefined;

      if (lastAgentMsg) {
        // If the preceding agent message was offering / asking about another item,
        // then the user's generic confirmation belongs to THAT item, NOT this deal!
        const discussesThisDeal =
          lastAgentMsg.toLowerCase().includes(deal.itemName.toLowerCase()) ||
          lastAgentMsg.includes(deal.id) ||
          thisKeywords.some((kw) => new RegExp(`\\b${kw}\\b`, "i").test(lastAgentMsg));

        if (!discussesThisDeal) {
          return {
            authorized: false,
            reason: `Current conversation turn is discussing another item; confirmation cannot be applied to deal "${dealId}" (${deal.itemName}).`,
          };
        }
      } else {
        return {
          authorized: false,
          reason: "Multiple pending deals exist. Buyer must specify which item they wish to checkout.",
        };
      }
    }
  }

  // 9. Explicit affirmative confirmation check
  const explicitAffirmativePatterns = [
    /^(?:please\s+)?(yes|yep|yeah|sure|ok|okay|proceed|confirm|checkout|agreed|done deal|let's do it|lets do it|go ahead|deal|i accept|accept|take it|buy it|pay for it|purchase it)\b/i,
    /\b(proceed to checkout|confirm checkout|confirm purchase|confirm payment|proceed with payment|go ahead and checkout|go ahead with (the )?payment|pay for it|buy it now|let's checkout|lets checkout|let's pay|lets pay|checkout now)\b/i,
    /\b(deal, let's pay|i accept, go ahead with purchase|yes please|yes, proceed|no problem, proceed|no problem, let's checkout|no worries, proceed)\b/i,
  ];

  const hasAffirmative = explicitAffirmativePatterns.some((pattern) => pattern.test(userText));
  if (hasAffirmative) {
    return { authorized: true, dealId };
  }

  return {
    authorized: false,
    reason:
      "Explicit buyer confirmation (e.g. 'yes, proceed to checkout') was not detected in the current user turn.",
  };
}

/**
 * Payment state transitions and concurrency locking.
 */
export function beginPayment(dealId: string): { ok: true; deal: Deal } | { ok: false; error: string } {
  const deal = stall.deals.get(dealId);
  if (!deal) {
    return { ok: false, error: `Deal "${dealId}" not found.` };
  }
  if (deal.status === "completed" || deal.paymentState === "completed") {
    return { ok: false, error: `Deal "${dealId}" is already paid and completed.` };
  }
  if (deal.paymentState === "processing") {
    return { ok: false, error: `A payment is already currently processing for deal "${dealId}".` };
  }

  deal.paymentState = "processing";
  const item = stall.items.get(deal.itemId);
  if (item) {
    item.paymentState = "processing";
  }
  return { ok: true, deal };
}

export function completePayment(
  dealId: string,
  payer: string,
  txHash?: string
): { ok: true; receipt: Receipt } | { ok: false; error: string } {
  const deal = stall.deals.get(dealId);
  if (!deal) {
    return { ok: false, error: `Deal "${dealId}" not found.` };
  }

  // Idempotency: if already completed, return existing receipt without duplicating
  if (deal.status === "completed" || deal.paymentState === "completed") {
    const existing = stall.receipts.find((r) => r.dealId === dealId);
    if (existing) {
      return { ok: true, receipt: existing };
    }
  }

  const item = stall.items.get(deal.itemId);
  if (!item) {
    return { ok: false, error: `Item "${deal.itemId}" not found in inventory.` };
  }

  deal.status = "completed";
  deal.paymentState = "completed";
  item.availability = "sold";
  item.agreedPrice = deal.agreedPrice;
  item.paymentState = "completed";

  // Form a standard 0x-prefixed 32-byte hex hash for test receipts
  const formattedTxHash =
    txHash && /^0x[0-9a-fA-F]{64}$/.test(txHash)
      ? txHash
      : `0x${crypto.createHash("sha256").update(txHash || `${dealId}-${payer}-${Date.now()}`).digest("hex")}`;

  const receipt: Receipt = {
    id: `rcpt-${crypto.randomUUID().slice(0, 8)}`,
    dealId: deal.id,
    itemId: deal.itemId,
    itemName: deal.itemName,
    silverPrice: deal.agreedPrice,
    payer,
    timestamp: new Date().toISOString(),
    txHash: formattedTxHash,
  };

  stall.receipts.push(receipt);
  return { ok: true, receipt };
}

export function failPayment(dealId: string, reason?: string): void {
  const deal = stall.deals.get(dealId);
  if (deal && deal.status !== "completed") {
    deal.paymentState = "failed";
    const item = stall.items.get(deal.itemId);
    if (item && item.availability !== "sold") {
      item.paymentState = "failed";
      item.availability = "reserved"; // Crucial requirement: item remains reserved if payment fails
    }
  }
}

export function getReceipt(identifier?: string): Receipt | undefined {
  if (!identifier) {
    return stall.receipts[stall.receipts.length - 1];
  }
  const clean = identifier.trim().toLowerCase();
  return stall.receipts.find(
    (r) =>
      r.id.toLowerCase() === clean ||
      r.dealId.toLowerCase() === clean ||
      r.itemId.toLowerCase() === clean ||
      r.itemName.toLowerCase() === clean
  );
}

export function getAllReceipts(): Receipt[] {
  return [...stall.receipts];
}
