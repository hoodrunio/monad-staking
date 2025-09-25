'use client';

import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import type { ResolvedMonadNetworkConfig } from '@monad-staking/config';
import { getExplorerUrl } from '@/lib/utils';

interface ExplorerLinkProps {
  config: ResolvedMonadNetworkConfig;
  type: 'address' | 'tx';
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function ExplorerLink({ config, type, value, children, className = '' }: ExplorerLinkProps) {
  const url = getExplorerUrl(config, type, value);
  
  if (!url) {
    return <span className={className}>{children}</span>;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors ${className}`}
    >
      {children}
      <ArrowTopRightOnSquareIcon className="h-3 w-3" />
    </a>
  );
}
