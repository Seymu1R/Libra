import { cookies } from "next/headers";
import { parseSport, SPORT_COOKIE, type Sport } from "@/lib/config";

/** Sport chosen in the header switch (cookie); soccer by default. */
export async function currentSport(): Promise<Sport> {
  return parseSport((await cookies()).get(SPORT_COOKIE)?.value);
}
