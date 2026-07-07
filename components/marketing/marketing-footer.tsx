export function MarketingFooter() {
  return (
    <footer className="border-t py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>© {new Date().getFullYear()} LocalMap · Local Intelligence Platform</p>
        <p>
          Home services · Professional · Internet/SaaS · Healthcare · Retail
        </p>
      </div>
    </footer>
  );
}
