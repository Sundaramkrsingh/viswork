export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  void params
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center space-y-2">
        <p className="text-4xl">🔍</p>
        <h1 className="text-xl font-semibold text-foreground">Task Detail</h1>
        <p className="text-sm text-muted-foreground">Full task view with DNA strip. Coming soon.</p>
      </div>
    </div>
  )
}
