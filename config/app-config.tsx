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

export function getApiBaseUrl() {
    const serverPhase = getInitServerPhase();
    console.log("serverPhase: " + serverPhase);
    if (serverPhase == "dev") {
        return "https://prompt-box-server-dev-245695755093.asia-northeast3.run.app";
    } else if (serverPhase == "local") {
        return "http://localhost:8080";
    } else {
        throw Error("정의되지 않은 serverPhase 입니다. serverPhase: " + serverPhase);
    }
}