import ProviderJobDetail from "./provider-job-detail";

export default function ProviderJobDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <ProviderJobDetail jobId={params.id} />;
}
