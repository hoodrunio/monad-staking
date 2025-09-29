import { ValidatorDetailClient } from './validator-detail-client';
import { ClientOnly } from '@/app/components/client-only';

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
    <ClientOnly
      fallback={
        <div className="space-y-6">
          <h1 className="text-3xl font-semibold text-foreground">Validator detail</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <ValidatorDetailClient 
        validatorId={params.id}
        networkParam={networkParam}
      />
    </ClientOnly>
  );
}
