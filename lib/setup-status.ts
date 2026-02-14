import { createClient } from "@/lib/supabase/client"

export async function isSetupRequired(): Promise<boolean> {
    const supabase = createClient()
    const { count, error } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })

    if (error) {
        console.error("Error checking setup status:", error)
        return false // Better to assume setup not required on error to avoid loops
    }

    return count === 0
}
