'use client';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';

interface ActionModalProps {
  readonly open: boolean;
  readonly title: string;
  readonly description?: string;
  readonly onClose: () => void;
  readonly children: React.ReactNode;
  readonly footer?: React.ReactNode;
}

export function ActionModal({ open, title, description, onClose, children, footer }: ActionModalProps) {
  return (
    <Dialog open={open} onOpenChange={(value) => (!value ? onClose() : undefined)}>
      <DialogContent className="pixel-panel pixel-border max-w-lg border-2 border-border bg-secondary/50">
        <DialogHeader className="gap-3">
          <DialogTitle className="font-display text-xl uppercase tracking-[0.16em] text-primary">{title}</DialogTitle>
          {description ? (
            <DialogDescription className="text-[11px] tracking-[0.12em] text-muted-foreground">
              {description}
            </DialogDescription>
          ) : null}
        </DialogHeader>
        <div className="space-y-4">{children}</div>
        {footer ? <DialogFooter>{footer}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  );
}
