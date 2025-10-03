import Link from 'next/link';
import { ShellSection } from '@/app/components/layout/shell';
import { Button } from '@/app/components/ui/button';
import { ChainBreakPixelIcon, SparklePixelIcon } from '@/app/components/icons';

export default function NotFound() {
  return (
    <ShellSection as="section" width="wide" className="flex min-h-[60vh] flex-col items-center justify-center gap-10 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="inline-flex items-center gap-3 border-2 border-border bg-secondary/40 px-6 py-3 font-display text-xs uppercase tracking-[0.14em] text-muted-foreground">
          <ChainBreakPixelIcon size={18} className="text-destructive" />
          Lost in the Monad grid
        </div>
        <h1 className="font-display text-4xl uppercase tracking-[0.16em] text-primary">404 – Page Not Found</h1>
        <p className="max-w-2xl text-sm tracking-[0.08em] text-muted-foreground">
          The pixel trail you followed fizzled out. The page you&apos;re looking for may have been moved, renamed, or never existed
          in this epoch.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <SparklePixelIcon size={22} className="animate-chest-sparkle text-accent" />
        <p className="text-xs tracking-[0.08em] text-muted-foreground">
          Return to the command center and pick a new quest.
        </p>
        <Button asChild variant="accent" className="px-6 py-3 font-display text-xs uppercase tracking-[0.14em]">
          <Link href="/">
            Back to Dashboard
          </Link>
        </Button>
      </div>
    </ShellSection>
  );
}
