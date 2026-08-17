import type { Market, SiteContent } from "@/types/content";
import { br } from "./br";
import { us } from "./us";

const dictionaries: Record<Market, SiteContent> = { br, us };

export const markets: Market[] = ["br", "us"];

export const isMarket = (value: string): value is Market =>
  markets.includes(value as Market);

export const getContent = (market: Market): SiteContent => dictionaries[market];
