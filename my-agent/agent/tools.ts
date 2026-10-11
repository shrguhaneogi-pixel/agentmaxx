import { getWalletAddress, getWalletBalance, payAndFetch, type PaymentExecutionResult } from "./wallet";

export type Tool = {
  name: string;
  description: string;
  /** JSON Schema describing the inputs. */
  parameters: Record<string, unknown>;
  /** The code that runs when the agent calls this tool. */
  run: (args: Record<string, unknown>, ctx: { baseUrl: string }) => Promise<unknown>;
};

export const tools: Tool[] = [
  // ─── 1. A paid API: the agent's wallet signs a payment to unlock it ───
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
    run: async (args: Record<string, unknown>, { baseUrl }: { baseUrl: string }): Promise<PaymentExecutionResult> => {
      const city = typeof args.city === "string" ? args.city : String(args.city ?? "Unknown");
      return payAndFetch(`${baseUrl}/api/weather?city=${encodeURIComponent(city)}`);
    },
  },


  // ─── 2. Wallet tool: read the agent's own wallet ───
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
  
  // ─── 3. Get joke tool: Random jokes! ───
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

  // ─── 4. Country info tool: Get information about capital and population ───
  {
    name: "get_country_info",
    description: "Get information about a country. User wants to know about the capital and population.",
    parameters: {
      type: "object",
      properties: {
        country: { 
          type: "string", 
          description: "Country name, e.g. India" 
        },
      },
      required: ["country"],
    },
    run: async (args: Record<string, unknown>) => {
      const rawCountry = typeof args.country === "string" ? args.country : String(args.country ?? "");
      // Curated fast offline database for popular travel destinations and prompt examples
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

      const normalized = rawCountry.trim().toLowerCase();
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
  }
];
