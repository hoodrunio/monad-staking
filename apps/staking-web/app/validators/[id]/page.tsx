import { ValidatorDetailClient } from './validator-detail-client';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ValidatorDetailPage(props: PageProps) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  
  const networkParam = Array.isArray(searchParams['network']) 
    ? searchParams['network'][0] 
    : searchParams['network'];

  return (
    <ValidatorDetailClient 
      validatorId={params.id}
      networkParam={networkParam}
    />
  );
}