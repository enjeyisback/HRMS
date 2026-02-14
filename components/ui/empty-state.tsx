import { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
    title: string
    description: string
    icon: LucideIcon
    action?: {
        label: string
        onClick: () => void
    }
}

export function EmptyState({ title, description, icon: Icon, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-lg border-2 border-dashed border-gray-200 min-h-[400px]">
            <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <Icon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-500 max-w-sm mb-6">{description}</p>
            {action && (
                <Button onClick={action.onClick}>
                    {action.label}
                </Button>
            )}
        </div>
    )
}
