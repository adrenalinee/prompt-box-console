import { apiFetch } from "@/lib/api/client";

export async function initDevData() {
    return apiFetch<void>(`/dev/init`, {
        method: "POST",
    });
}
