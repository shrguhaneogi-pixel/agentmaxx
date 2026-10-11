import { getWalletAddress, getWalletBalance, payAndFetch } from "./wallet";

export type Tool = {
  name: string;
  description: string;
  /** JSON Schema describing the inputs. */
  parameters: object;
  /** The code that runs when the agent calls this tool. */
  run: (args: any, ctx: { baseUrl: string }) => Promise<unknown>;
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
    run: async ({ city }, { baseUrl }) => {
      return payAndFetch(`${baseUrl}/api/weather?city=${encodeURIComponent(city)}`);
    },
  },

  // ─── 2. Wallet tool: read the agent's own wallet ───
  {
    name: "get_my_wallet",
    description: "Get the agent's own wallet address and its ETH balance on Base Sepolia (testnet).",
    parameters: { type: "object", properties: {} },
    run: async () => ({
      address: getWalletAddress(),
      balance: await getWalletBalance(),
      network: "Base Sepolia (testnet)",
    }),
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
      const response = await fetch("https://official-joke-api.appspot.com/random_joke");
      const joke = await response.json();
      return { setup: joke.setup, punchline: joke.punchline };
    },
  },

  // ─── 4. Country info tool: Get information about capital and population ───
  {
    name: "get_country_info",
    description: "Get information about a country. User wants to know about the capital and population .",
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
    run: async ({ country }) => {
      const res = await fetch(
        `https://api.restcountries.com/countries/v5?name=${encodeURIComponent(country)}`,
        {headers: { 'Authorization': 'Bearer rc_live_6ff2dad9093e4b07a258f0b1ebf86ca1' }}
      );

      const data = await res.json();

      return {
        capital: data.capital?.[0],
        population: data.population,
        region: data.region,
      };
    },
  }

];
