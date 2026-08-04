interface EmptyStateProps {
  icon:     React.ReactNode;
  title:    string;
  subtitle?: string;
  action?:  React.ReactNode;
}

export default function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-surface-hover flex items-center justify-center opacity-40">
        {icon}
      </div>
      <div>
        <p className="text-slate-400 font-medium">{title}</p>
        {subtitle && <p className="text-sm text-slate-600 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
