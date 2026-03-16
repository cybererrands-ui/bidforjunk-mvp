import { requireProvider } from "@/components/layout/role-guard";
import ProviderJobDetail from "./provider-job-detail";

export default async function ProviderJobDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // Validate auth on the server side before rendering the client component
  await requireProvider();
  return <ProviderJobDetail jobId={params.id} />;
}
