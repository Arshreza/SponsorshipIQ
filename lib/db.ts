import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | any };

// Memory-based Mock Store for Local Testing without Database
const createMockPrismaClient = () => {
  const mockStore: Record<string, any[]> = {
    user: [
      { id: "mock-user-id", email: "admin@sponsorshipiq.com", name: "Campus Coordinator", passwordHash: "mock-hash" }
    ],
    sponsor: [
      { id: "sp-1", companyName: "GitHub", contactEmail: "hackathons@github.com", contactName: "Alex Mercer", industry: "Software", website: "github.com", notes: "Mock active tech sponsor" },
      { id: "sp-2", companyName: "Red Bull", contactEmail: "campus.india@redbull.com", contactName: "Vikram Rathore", industry: "Beverages", website: "redbull.com", notes: "Mock active beverage sponsor" },
      { id: "sp-3", companyName: "boAt Lifestyle", contactEmail: "marketing@boat-lifestyle.com", contactName: "Rohan Gupta", industry: "Consumer Electronics", website: "boat-lifestyle.com", notes: "Mock active device sponsor" }
    ],
    campaign: [
      { id: "camp-1", name: "Tech Fest 2025 Hackathon", status: "READY", totalSponsors: 3, drafted: 3, sent: 0, replied: 0, converted: 0, createdAt: new Date() }
    ],
    outreach: [
      { id: "out-1", campaignId: "camp-1", sponsorId: "sp-1", status: "DRAFTED", subject: "Sponsorship Pitch for Tech Fest 2025", body: "Hello GitHub Team,\n\nWe are organizing Tech Fest 2025...", createdAt: new Date(), updatedAt: new Date() },
      { id: "out-2", campaignId: "camp-1", sponsorId: "sp-2", status: "PENDING", createdAt: new Date(), updatedAt: new Date() },
      { id: "out-3", campaignId: "camp-1", sponsorId: "sp-3", status: "PENDING", createdAt: new Date(), updatedAt: new Date() }
    ],
    emailAccount: [
      { id: "email-1", emailAddress: "coordinator@sponsorshipiq.com", displayName: "Campus PR Team", provider: "GMAIL", status: "CONNECTED", dailyLimit: 50, sentToday: 0, createdAt: new Date() }
    ],
    festProfile: [
      { id: "fest-1", name: "Tech Fest 2025", college: "University Campus", city: "Metro City", expectedFootfall: 5000, packages: JSON.stringify([{ tier: "Title Sponsor", amount: "2,00,000", benefits: ["Logo on all banners", "Speaking slot"] }]), createdAt: new Date() }
    ],
    sponsorList: [
      { id: "list-1", name: "Premium Brands List", description: "Top level sponsors", createdAt: new Date() }
    ],
    llmConfig: [
      { id: "llm-1", apiBaseUrl: "https://api.openai.com/v1", apiKey: "mock-key", modelName: "gpt-4", isValid: true }
    ],
    globalSettings: [
      { id: "settings-1", dailyEmailLimit: 100 }
    ]
  };

  function attachRelations(modelName: string, item: any) {
    if (modelName === "sponsor") {
      return {
        _count: { outreaches: 0 },
        outreaches: [],
        ...item
      };
    }
    if (modelName === "campaign") {
      return {
        _count: { outreaches: 0 },
        festProfile: { name: "Tech Fest 2025", packages: JSON.stringify([{ tier: "Title Sponsor", amount: "2,00,000", benefits: ["Logo on all banners", "Speaking slot"] }]) },
        sponsorList: { name: "Premium Brands List" },
        outreaches: [],
        ...item
      };
    }
    if (modelName === "outreach") {
      const sp = mockStore.sponsor.find(s => s.id === item.sponsorId) || { companyName: "GitHub", contactEmail: "hackathons@github.com", contactName: "Alex Mercer", industry: "Software" };
      return {
        sponsor: sp,
        campaign: { name: "Tech Fest 2025 Hackathon", festProfile: { name: "Tech Fest 2025", packages: JSON.stringify([{ tier: "Title Sponsor", amount: "2,00,000", benefits: ["Logo display", "Workshop slot"] }]) } },
        ...item
      };
    }
    return item;
  }

  const mockDB: any = {};
  const handler = {
    get(target: any, modelName: string) {
      if (modelName === "$connect" || modelName === "$disconnect") {
        return () => Promise.resolve();
      }
      if (modelName === "$transaction") {
        return (val: any) => {
          if (typeof val === "function") return val(mockDB);
          return Promise.all(val);
        };
      }

      return {
        findMany: (args?: any) => {
          let list = mockStore[modelName] || [];
          if (args?.where) {
            list = list.filter(item => {
              for (const [key, val] of Object.entries(args.where)) {
                if (val && typeof val === "object" && "in" in val) {
                  if (!(val.in as any[]).includes(item[key])) return false;
                } else if (val && typeof val === "object") {
                  // Skip complex
                } else if (item[key] !== val) {
                  return false;
                }
              }
              return true;
            });
          }
          const enriched = list.map(item => attachRelations(modelName, item));
          return Promise.resolve(JSON.parse(JSON.stringify(enriched)));
        },
        findUnique: (args: any) => {
          const list = mockStore[modelName] || [];
          const item = list.find(item => {
            for (const [key, val] of Object.entries(args.where)) {
              if (item[key] === val) return true;
            }
            return false;
          });
          return Promise.resolve(item ? JSON.parse(JSON.stringify(attachRelations(modelName, item))) : null);
        },
        findFirst: (args?: any) => {
          let list = mockStore[modelName] || [];
          if (args?.where) {
            list = list.filter(item => {
              for (const [key, val] of Object.entries(args.where)) {
                if (item[key] !== val) return false;
              }
              return true;
            });
          }
          return Promise.resolve(list[0] ? JSON.parse(JSON.stringify(attachRelations(modelName, list[0]))) : null);
        },
        create: (args: any) => {
          const list = mockStore[modelName] || [];
          const newItem = { id: `mock-${modelName}-${Date.now()}`, ...args.data };
          list.push(newItem);
          mockStore[modelName] = list;
          return Promise.resolve(JSON.parse(JSON.stringify(newItem)));
        },
        update: (args: any) => {
          const list = mockStore[modelName] || [];
          const idx = list.findIndex(item => {
            for (const [key, val] of Object.entries(args.where)) {
              if (item[key] === val) return true;
            }
            return false;
          });
          if (idx !== -1) {
            list[idx] = { ...list[idx], ...args.data };
            mockStore[modelName] = list;
            return Promise.resolve(JSON.parse(JSON.stringify(list[idx])));
          }
          return Promise.resolve(null);
        },
        delete: (args: any) => {
          const list = mockStore[modelName] || [];
          const idx = list.findIndex(item => {
            for (const [key, val] of Object.entries(args.where)) {
              if (item[key] === val) return true;
            }
            return false;
          });
          if (idx !== -1) {
            const removed = list.splice(idx, 1)[0];
            mockStore[modelName] = list;
            return Promise.resolve(JSON.parse(JSON.stringify(removed)));
          }
          return Promise.resolve(null);
        },
        count: (args?: any) => {
          const list = mockStore[modelName] || [];
          return Promise.resolve(list.length);
        }
      };
    }
  };

  return new Proxy(mockDB, handler);
};

const getClient = () => {
  const connectionString = process.env.DATABASE_URL;
  // Fall back to Mock Client if URL is default/placeholder or empty
  if (
    !connectionString ||
    connectionString.includes("postgres://postgres") ||
    connectionString.includes("localhost") ||
    connectionString === ""
  ) {
    console.warn("DATABASE_URL is missing or localhost default, using local mock database fallback.");
    return createMockPrismaClient();
  }
  
  try {
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  } catch (err) {
    console.error("Prisma Client connection failed, falling back to mock client", err);
    return createMockPrismaClient();
  }
};

export const db = globalForPrisma.prisma || getClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
