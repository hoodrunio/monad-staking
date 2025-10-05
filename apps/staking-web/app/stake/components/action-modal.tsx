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
      <DialogContent className="grid w-full max-w-lg gap-6 overflow-hidden border-2 border-border bg-background/95 text-foreground p-5 sm:max-w-xl sm:p-6 lg:max-w-2xl lg:p-8">
        <DialogHeader className="gap-3">
          <DialogTitle className="font-display text-xl uppercase tracking-[0.16em] text-primary">{title}</DialogTitle>
          {description ? (
            <DialogDescription className="text-sm leading-relaxed tracking-[0.08em] text-muted-foreground">
              {description}
            </DialogDescription>
          ) : null}
        </DialogHeader>
        <div className="max-h-[calc(80vh-8rem)] space-y-4 overflow-y-auto pr-1">
          {children}
        </div>
        {footer ? <DialogFooter className="sm:px-0">{footer}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  );
}
