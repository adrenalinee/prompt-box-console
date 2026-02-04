import { unstable_noStore as noStore } from "next/cache";

type ServerPhaseGlobal = {
    __SERVER_PHASE__?: string;
};

export function getInitServerPhase(): string {
    if (typeof window === "undefined") {
        noStore();
        return process.env.SERVER_PHASE ?? "local";
    }

    return (globalThis as ServerPhaseGlobal).__SERVER_PHASE__ ?? "local";
}
