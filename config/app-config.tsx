import { unstable_noStore as noStore } from "next/cache"

export function getInitServerPhase(): string {
    noStore();
    return process.env.SERVER_PHASE ?? "local"
}