import { createClient } from "@/lib/supabase/client"

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'AUTH' | 'SYSTEM' | 'ACCESS_DENIED';

export async function logAction({
    action,
    module,
    description,
    oldData,
    newData
}: {
    action: AuditAction;
    module: string;
    description: string;
    oldData?: any;
    newData?: any;
}) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
        .from('audit_logs')
        .insert({
            user_id: user?.id,
            action_type: action,
            module,
            description,
            old_data: oldData,
            new_data: newData
        })

    if (error) {
        console.error("Audit Logging Failed:", error)
    }
}
