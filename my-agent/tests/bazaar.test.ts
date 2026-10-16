import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import {
  beginPayment,
  calculateCounterPrice,
  completePayment,
  createDeal,
  failPayment,
  getAllReceipts,
  getDeal,
  getItem,
  getPrivateAcceptanceThreshold,
  getReceipt,
  getStallStatus,
  haggle,
  listWares,
  MOOD_FACTORS,
  resetStall,
  stall,
  verifyBuyerConfirmation,
  type Item,
  type Mood,
} from "../agent/bazaar";

describe("Marzban Bazaar Merchant Engine", () => {
  beforeEach(() => {
    resetStall("neutral");
  });

  describe("Inventory & Wares Initialization", () => {
    it("initializes all 6 wares with exact IDs, base prices, and private costs", () => {
      const expectedWares = [
        { id: "brass-astrolabe", base: 120, cost: 60 },
        { id: "saffron-tin", base: 45, cost: 20 },
        { id: "silk-scarf", base: 70, cost: 30 },
        { id: "haunted-lamp", base: 90, cost: 25 },
        { id: "spice-box", base: 55, cost: 28 },
        { id: "map-scroll", base: 35, cost: 5 },
      ];

      for (const expected of expectedWares) {
        const item = getItem(expected.id);
        assert.ok(item, `Item ${expected.id} must exist in inventory`);
        assert.equal(item.basePrice, expected.base, `Base price for ${expected.id} should match`);
        assert.equal(item.privateCost, expected.cost, `Cost for ${expected.id} should match`);
        assert.equal(item.askingPrice, expected.base, `Initial asking price should equal base price`);
        assert.equal(item.availability, "available", `Item should be initially available`);
        assert.equal(item.roundsConsumed, 0, `Initial rounds consumed should be 0`);
      }
    });

    it("listWares strictly omits privateCost and acceptance threshold fields", () => {
      const wares = listWares();
      assert.equal(wares.length, 6);

      for (const ware of wares) {
        const keys = Object.keys(ware);
        assert.ok(!keys.includes("privateCost"), "Public ware must NEVER contain privateCost");
        assert.ok(!keys.includes("threshold"), "Public ware must NEVER contain threshold");
        assert.ok(!keys.includes("acceptanceThreshold"), "Public ware must NEVER contain acceptanceThreshold");
        assert.ok(!keys.includes("floor"), "Public ware must NEVER contain floor");
        assert.ok(typeof ware.id === "string");
        assert.ok(typeof ware.name === "string");
        assert.ok(typeof ware.askingPrice === "number");
        assert.ok(typeof ware.roundsRemaining === "number");
      }
    });

    it("tracks agreedPrice and paymentState directly on Item", () => {
      const lamp = getItem("haunted-lamp")!;
      assert.equal(lamp.agreedPrice, undefined);
      assert.equal(lamp.paymentState, undefined);

      const deal = createDeal(lamp, 75);
      assert.equal(lamp.agreedPrice, 75);
      assert.equal(lamp.paymentState, "pending");
      assert.equal(lamp.availability, "reserved");

      beginPayment(deal.id);
      assert.equal(lamp.paymentState, "processing");

      completePayment(deal.id, "0x1111111111111111111111111111111111111111");
      assert.equal(lamp.paymentState, "completed");
      assert.equal(lamp.availability, "sold");
    });

    it("sets roundsRemaining to 0 when item is reserved or sold", () => {
      const map = getItem("map-scroll")!;
      assert.equal(listWares().find((w) => w.id === "map-scroll")?.roundsRemaining, 4);

      createDeal(map, 30);
      assert.equal(listWares().find((w) => w.id === "map-scroll")?.roundsRemaining, 0);
    });
  });

  describe("Mood System & Threshold Formula", () => {
    it("calculates private acceptance threshold: min(basePrice, ceil(privateCost * 1.15 * moodFactor))", () => {
      const astrolabe = getItem("brass-astrolabe")!;
      // Cost 60, Base 120
      // Cheerful (factor 0.95): ceil(60 * 1.15 * 0.95) = ceil(65.55) = 66
      assert.equal(getPrivateAcceptanceThreshold(astrolabe, "cheerful"), 66);
      // Neutral (factor 1.0): ceil(60 * 1.15 * 1.0) = ceil(69) = 69
      assert.equal(getPrivateAcceptanceThreshold(astrolabe, "neutral"), 69);
      // Grumpy (factor 1.15): ceil(60 * 1.15 * 1.15) = ceil(79.35) = 80
      assert.equal(getPrivateAcceptanceThreshold(astrolabe, "grumpy"), 80);

      const mapScroll = getItem("map-scroll")!;
      // Cost 5, Base 35
      // Cheerful: ceil(5 * 1.15 * 0.95) = ceil(5.4625) = 6
      assert.equal(getPrivateAcceptanceThreshold(mapScroll, "cheerful"), 6);
      // Neutral: ceil(5 * 1.15 * 1.0) = ceil(5.75) = 6
      assert.equal(getPrivateAcceptanceThreshold(mapScroll, "neutral"), 6);
      // Grumpy: ceil(5 * 1.15 * 1.15) = ceil(6.6125) = 7
      assert.equal(getPrivateAcceptanceThreshold(mapScroll, "grumpy"), 7);
    });

    it("ensures acceptance threshold never exceeds base price", () => {
      const mockItem: Item = {
        id: "expensive-item",
        name: "Expensive Item",
        description: "Test",
        basePrice: 50,
        privateCost: 100, // Cost exceeds base price
        askingPrice: 50,
        availability: "available",
        roundsConsumed: 0,
      };

      const threshold = getPrivateAcceptanceThreshold(mockItem, "grumpy");
      assert.equal(threshold, 50, "Threshold must be capped at basePrice");
    });
  });

  describe("Strict Floor-Hiding & Counter Prices", () => {
    it("never clamps counter price to the private threshold, keeping it strictly above the floor", () => {
      const astrolabe = getItem("brass-astrolabe")!;
      const threshold = getPrivateAcceptanceThreshold(astrolabe, "neutral"); // 69

      // Test multiple low and near-threshold offers
      const testOffers = [30, 45, 55, 60, 65, 68];
      for (const offer of testOffers) {
        const counter = calculateCounterPrice(astrolabe, offer, threshold);
        assert.ok(
          counter > threshold,
          `Counter price (${counter}) must be STRICTLY GREATER than private threshold (${threshold}) for offer ${offer}`
        );
        assert.ok(
          counter <= astrolabe.basePrice,
          `Counter price (${counter}) must not exceed base price (${astrolabe.basePrice})`
        );
      }
    });

    it("ensures counter price never increases from current asking price across negotiation turns", () => {
      const astrolabe = getItem("brass-astrolabe")!;
      const threshold = getPrivateAcceptanceThreshold(astrolabe, "neutral"); // 69

      // Simulate asking price having already reached 75 (near threshold + buffer)
      astrolabe.askingPrice = 75;
      const counter = calculateCounterPrice(astrolabe, 65, threshold);
      assert.ok(
        counter < 75,
        `Counter price (${counter}) must be STRICTLY LESS than previous asking price (75)`
      );
      assert.ok(
        counter > threshold,
        `Counter price (${counter}) must be STRICTLY GREATER than threshold (${threshold})`
      );
    });

    it("ensures public haggle response for counter-offer does not leak the floor", () => {
      const res = haggle("brass-astrolabe", 50);
      assert.equal(res.status, "counter");
      assert.ok(typeof res.counterPrice === "number");

      const threshold = getPrivateAcceptanceThreshold(getItem("brass-astrolabe")!, "neutral");
      assert.ok(res.counterPrice > threshold, "Counter price must be strictly above threshold");
      assert.equal((res as Record<string, unknown>).privateCost, undefined);
      assert.equal((res as Record<string, unknown>).threshold, undefined);
    });
  });

  describe("Offer Validation", () => {
    it("rejects non-integer, zero, negative, and invalid offers", () => {
      const invalidOffers = [-10, 0, 15.5, NaN, Infinity, -Infinity];
      for (const badOffer of invalidOffers) {
        const res = haggle("saffron-tin", badOffer);
        assert.equal(res.status, "error", `Offer ${badOffer} should be rejected as error`);
        assert.ok(res.error);
      }
    });

    it("rejects unknown item IDs", () => {
      const res = haggle("non-existent-item", 50);
      assert.equal(res.status, "error");
      assert.match(res.error!, /not found/i);
    });
  });

  describe("Insulting Offers & Mood Degradation", () => {
    it("marks offer < 70% of cost as rejected_insulting and degrades mood", () => {
      resetStall("cheerful");
      const astrolabe = getItem("brass-astrolabe")!;
      // Cost is 60, 70% is 42. Offer of 20 is insulting.
      const res = haggle("brass-astrolabe", 20);
      assert.equal(res.status, "rejected_insulting");
      assert.equal(astrolabe.roundsConsumed, 1);
      assert.equal(astrolabe.askingPrice, astrolabe.basePrice, "Asking price should not concede on insult");
      assert.equal(stall.mood, "neutral", "Cheerful mood should degrade to neutral");

      // Another insult degrades neutral to grumpy
      const res2 = haggle("brass-astrolabe", 15);
      assert.equal(res2.status, "rejected_insulting");
      assert.equal(stall.mood, "grumpy", "Neutral mood should degrade to grumpy");
    });
  });

  describe("Negotiation Progression & Round Limits", () => {
    it("enforces maximum 4 rounds per item and closes negotiation thereafter", () => {
      const astrolabe = getItem("brass-astrolabe")!;

      // Round 1
      const r1 = haggle("brass-astrolabe", 45);
      assert.equal(r1.status, "counter");
      assert.equal(astrolabe.roundsConsumed, 1);
      assert.equal(r1.roundsRemaining, 3);

      // Round 2
      const r2 = haggle("brass-astrolabe", 48);
      assert.equal(r2.status, "counter");
      assert.equal(astrolabe.roundsConsumed, 2);
      assert.equal(r2.roundsRemaining, 2);

      // Round 3
      const r3 = haggle("brass-astrolabe", 50);
      assert.equal(r3.status, "counter");
      assert.equal(astrolabe.roundsConsumed, 3);
      assert.equal(r3.roundsRemaining, 1);

      // Round 4
      const r4 = haggle("brass-astrolabe", 52);
      assert.equal(r4.status, "counter");
      assert.equal(astrolabe.roundsConsumed, 4);
      assert.equal(r4.roundsRemaining, 0);

      // Round 5: No more rounds available!
      const r5 = haggle("brass-astrolabe", 55);
      assert.equal(r5.status, "negotiation_closed");
      assert.match(r5.message, /Four rounds/i);
    });

    it("accepts offer meeting final asking price even after 4 rounds", () => {
      const item = getItem("spice-box")!;
      // Consume 4 rounds
      item.roundsConsumed = 4;
      item.askingPrice = 45;

      const res = haggle("spice-box", 45);
      assert.equal(res.status, "accepted");
      assert.equal(res.agreedPrice, 45);
      assert.ok(res.dealId);
      assert.equal(item.availability, "reserved");
    });
  });

  describe("Offer Acceptance & Deal Reservation", () => {
    it("accepts offer >= threshold and reserves item", () => {
      const scarf = getItem("silk-scarf")!;
      // Base 70, Cost 30, Neutral threshold: ceil(30 * 1.15) = 35
      const res = haggle("silk-scarf", 40);
      assert.equal(res.status, "accepted");
      assert.equal(res.agreedPrice, 40);
      assert.ok(res.dealId);
      assert.equal(scarf.availability, "reserved");

      const deal = getDeal(res.dealId!);
      assert.ok(deal);
      assert.equal(deal.agreedPrice, 40);
      assert.equal(deal.status, "pending_payment");
      assert.equal(deal.paymentState, "pending");

      // Attempting to haggle for reserved item is rejected
      const nextHaggle = haggle("silk-scarf", 50);
      assert.equal(nextHaggle.status, "negotiation_closed");
      assert.match(nextHaggle.message, /reserved/i);
    });
  });

  describe("Buyer Confirmation Authorization Gate", () => {
    it("authorizes payment when verified client confirmedDealId matches", () => {
      const res = haggle("map-scroll", 30);
      assert.equal(res.status, "accepted");
      const dealId = res.dealId!;

      const auth = verifyBuyerConfirmation(dealId, { confirmedDealId: dealId });
      assert.equal(auth.authorized, true);
    });

    it("authorizes payment when user chat text contains clear affirmative intent", () => {
      const res = haggle("map-scroll", 30);
      const dealId = res.dealId!;

      const affirmativePhrases = [
        "Yes, proceed to checkout",
        "Yes please!",
        "Confirm checkout",
        "Let's do it, buy the map",
        "Deal, let's pay",
        "I accept, go ahead with purchase",
        "Please checkout now",
      ];

      for (const phrase of affirmativePhrases) {
        const auth = verifyBuyerConfirmation(dealId, { lastUserMessage: phrase });
        assert.equal(auth.authorized, true, `Phrase "${phrase}" should be authorized`);
      }
    });

    it("rejects payment when user expresses hesitation, dissent, or cancellation", () => {
      const res = haggle("map-scroll", 30);
      const dealId = res.dealId!;

      const dissentPhrases = [
        "No, that's too expensive",
        "Wait, let me think",
        "Cancel the deal",
        "Stop, don't pay yet",
        "Not yet, wait a minute",
        "That's a bad deal",
        "Terrible deal",
        "I can't buy this",
        "I will not buy this",
        "I won't pay that much",
        "Refuse",
        "No deal",
      ];

      for (const phrase of dissentPhrases) {
        const auth = verifyBuyerConfirmation(dealId, { lastUserMessage: phrase });
        assert.equal(auth.authorized, false, `Phrase "${phrase}" should be rejected`);
        assert.match(auth.reason!, /hesitation|dissent|refusal/i);
      }
    });

    it("rejects payment when user asks a question instead of confirming", () => {
      const res = haggle("map-scroll", 30);
      const dealId = res.dealId!;

      const questionPhrases = [
        "Can I pay 50?",
        "How do I pay?",
        "Can I buy the Haunted Lamp for 60 silver?",
        "What do I have to pay?",
      ];

      for (const phrase of questionPhrases) {
        const auth = verifyBuyerConfirmation(dealId, { lastUserMessage: phrase });
        assert.equal(auth.authorized, false, `Question "${phrase}" should be rejected`);
        assert.match(auth.reason!, /question/i);
      }
    });

    it("rejects payment when user proposes a price or is haggling", () => {
      const res = haggle("map-scroll", 30);
      const dealId = res.dealId!;

      const hagglePhrases = [
        "I offer 20 silver",
        "How about 25 silver?",
      ];

      for (const phrase of hagglePhrases) {
        const auth = verifyBuyerConfirmation(dealId, { lastUserMessage: phrase });
        assert.equal(auth.authorized, false, `Haggle phrase "${phrase}" should be rejected`);
        assert.match(auth.reason!, /haggling|proposing/i);
      }
    });

    it("rejects payment when user mentions a different item", () => {
      const res = haggle("silk-scarf", 40);
      const dealId = res.dealId!;

      const auth = verifyBuyerConfirmation(dealId, {
        lastUserMessage: "Yes, buy the Haunted Lamp",
      });
      assert.equal(auth.authorized, false);
      assert.match(auth.reason!, /does not match/i);
    });

    it("rejects immediate same-turn payment if deal was created after turn started", () => {
      const turnStart = Date.now();
      const res = haggle("map-scroll", 30);
      const dealId = res.dealId!;

      const auth = verifyBuyerConfirmation(dealId, {
        lastUserMessage: "I offer 30 silver for map",
        turnStartTime: turnStart,
      });
      assert.equal(auth.authorized, false);
      assert.match(auth.reason!, /just agreed in this turn/i);
    });

    it("rejects non-existent deal IDs", () => {
      const auth = verifyBuyerConfirmation("non-existent-deal-id", {
        lastUserMessage: "Yes, checkout",
      });
      assert.equal(auth.authorized, false);
      assert.match(auth.reason!, /no deal found/i);
    });
  });

  describe("Checkout Concurrency Guard & State Machine", () => {
    it("locks deal during beginPayment to prevent concurrent double-payments", () => {
      const res = haggle("haunted-lamp", 50);
      const dealId = res.dealId!;

      const begin1 = beginPayment(dealId);
      assert.equal(begin1.ok, true);
      assert.equal(begin1.deal.paymentState, "processing");

      // Concurrent attempt while processing
      const begin2 = beginPayment(dealId);
      assert.equal(begin2.ok, false);
      assert.match(begin2.error, /already currently processing/i);
    });

    it("completes payment: marks item sold, updates deal, and creates receipt idempotently", () => {
      const res = haggle("haunted-lamp", 50);
      const dealId = res.dealId!;

      beginPayment(dealId);
      const completeRes = completePayment(dealId, "0x1234567890abcdef1234567890abcdef12345678");
      assert.equal(completeRes.ok, true);
      assert.ok(completeRes.receipt);
      assert.equal(completeRes.receipt.silverPrice, 50);
      assert.match(completeRes.receipt.txHash!, /^0x[0-9a-fA-F]{64}$/);

      const item = getItem("haunted-lamp")!;
      assert.equal(item.availability, "sold");
      assert.equal(item.paymentState, "completed");

      const deal = getDeal(dealId)!;
      assert.equal(deal.status, "completed");
      assert.equal(deal.paymentState, "completed");

      // Idempotency: calling completePayment again does not create duplicate receipts
      const initialCount = getAllReceipts().length;
      const secondComplete = completePayment(dealId, "0x1234567890abcdef1234567890abcdef12345678");
      assert.equal(secondComplete.ok, true);
      assert.equal(getAllReceipts().length, initialCount, "Receipt count must NOT duplicate");
      assert.equal(secondComplete.receipt.id, completeRes.receipt.id);

      // Subsequent beginPayment fails because deal is already completed
      const beginAfter = beginPayment(dealId);
      assert.equal(beginAfter.ok, false);
      assert.match(beginAfter.error, /already paid and completed/i);

      // Receipt can be retrieved by dealId, receiptId, itemId, or itemName
      assert.ok(getReceipt(dealId));
      assert.ok(getReceipt(completeRes.receipt.id));
      assert.ok(getReceipt("haunted-lamp"));
      assert.ok(getReceipt("Slightly Haunted Oil Lamp"));
    });

    it("keeps item reserved if payment fails and allows retry", () => {
      const res = haggle("spice-box", 40);
      const dealId = res.dealId!;

      beginPayment(dealId);
      failPayment(dealId, "Card declined / Insufficient test funds");

      const deal = getDeal(dealId)!;
      assert.equal(deal.paymentState, "failed");

      const item = getItem("spice-box")!;
      assert.equal(item.availability, "reserved", "Item MUST remain reserved when payment fails");
      assert.equal(item.paymentState, "failed");

      // Retry of payment succeeds to lock
      const retry = beginPayment(dealId);
      assert.equal(retry.ok, true);
    });
  });

  describe("Stall Status Sanitization", () => {
    it("sanitizes public stall status without leaking private costs or secrets", () => {
      const status = getStallStatus();
      assert.ok(["cheerful", "neutral", "grumpy"].includes(status.mood));
      assert.equal(status.wares.length, 6);

      const statusJson = JSON.stringify(status);
      assert.ok(!statusJson.includes("privateCost"), "Stall status JSON must NOT contain privateCost");
      assert.ok(!statusJson.includes("threshold"), "Stall status JSON must NOT contain threshold");
    });
  });
});
