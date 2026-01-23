import { redirect } from "next/navigation";

export default function WorkspaceHome({
    params,
}: {
    params: { workspaceId: string };
}) {
    redirect(`/workspaces/${params.workspaceId}/playground`);
}
