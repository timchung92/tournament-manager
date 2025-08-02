import React from 'react';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface SheetContentProps {
  children: React.ReactNode;
  className?: string;
}

interface SheetHeaderProps {
  children: React.ReactNode;
}

interface SheetTitleProps {
  children: React.ReactNode;
}

export function Sheet({ open, onOpenChange, children }: SheetProps) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => onOpenChange(false)}
          />
          {children}
        </div>
      )}
    </>
  );
}

export function SheetContent({ children, className = '' }: SheetContentProps) {
  return (
    <div
      className={`fixed right-0 top-0 h-full w-[400px] bg-white shadow-lg border-l border-gray-200 overflow-y-auto ${className}`}
    >
      {children}
    </div>
  );
}

export function SheetHeader({ children }: SheetHeaderProps) {
  return (
    <div className="border-b border-gray-200 px-6 py-4">
      {children}
    </div>
  );
}

export function SheetTitle({ children }: SheetTitleProps) {
  return (
    <h2 className="text-lg font-semibold text-gray-900">
      {children}
    </h2>
  );
}