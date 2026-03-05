import { StackList } from '@/components/stack/StackList'

export default function StackPage() {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-8 py-6 border-b border-border shrink-0">
        <h1 className="text-lg font-semibold text-foreground">Master Stack</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Priority queue — engineers pull from the top
        </p>
      </div>

      {/* Stack content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-2xl mx-auto">
          <StackList />
        </div>
      </div>
    </div>
  )
}
