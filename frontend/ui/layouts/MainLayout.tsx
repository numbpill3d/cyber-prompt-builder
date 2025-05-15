import React from 'react';
import { cn } from '@shared/lib/utils';

type MainLayoutProps = {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

/**
 * MainLayout - Core layout component for the application
 * Provides a consistent structure with optional sidebar, header, and footer
 */
export function MainLayout({
  children,
  sidebar,
  header,
  footer,
  className,
}: MainLayoutProps) {
  return (
    <div className={cn(
      "min-h-screen bg-background text-foreground flex flex-col",
      className
    )}>
      {/* Header */}
      {header && (
        <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          {header}
        </header>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebar && (
          <aside className="w-64 border-r shrink-0 hidden md:block overflow-y-auto">
            {sidebar}
          </aside>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>

      {/* Footer */}
      {footer && (
        <footer className="border-t py-4 bg-muted/20">
          {footer}
        </footer>
      )}
    </div>
  );
}

/**
 * MainHeader - Header component for the MainLayout
 */
export function MainHeader({ 
  children,
  className 
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-4 h-14 flex items-center justify-between", className)}>
      {children}
    </div>
  );
}

/**
 * MainSidebar - Sidebar component for the MainLayout
 */
export function MainSidebar({ 
  children,
  className 
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("py-4 px-2", className)}>
      {children}
    </div>
  );
}

/**
 * MainFooter - Footer component for the MainLayout
 */
export function MainFooter({ 
  children,
  className 
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("container flex items-center justify-between", className)}>
      {children}
    </div>
  );
}

/**
 * ContentSection - Section wrapper for content areas
 */
export function ContentSection({ 
  children,
  title,
  description,
  className 
}: { 
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <section className={cn("mb-8", className)}>
      {(title || description) && (
        <div className="mb-4">
          {title && <h2 className="text-2xl font-bold tracking-tight">{title}</h2>}
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
      )}
      <div>
        {children}
      </div>
    </section>
  );
}