import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local')
console.log('Loading .env from:', envPath)
dotenv.config({ path: envPath })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

console.log('URL:', supabaseUrl)
console.log('Anon Key exists:', !!anonKey)
console.log('Service Key exists:', !!serviceKey)

async function testConnection() {
    // 1. Test Anon Key
    if (anonKey) {
        console.log('\nTesting Anon Key...')
        const sbAnon = createClient(supabaseUrl!, anonKey)

        // Check Employees
        const { count: empCount, error: empError } = await sbAnon.from('employees').select('*', { count: 'exact', head: true })
        if (empError) console.error('Anon employees check failed:', empError.message)
        else console.log('Anon employees count:', empCount)

        // Check Departments
        const { data: depts, error: deptError } = await sbAnon.from('departments').select('id, name')
        if (deptError) console.error('Anon departments check failed:', deptError.message)
        else console.log('Anon departments count:', depts?.length, depts)

        // Check Designations
        const { data: desigs, error: desigError } = await sbAnon.from('designations').select('id, title')
        if (desigError) console.error('Anon designations check failed:', desigError.message)
        else console.log('Anon designations count:', desigs?.length, desigs)
    }
}

testConnection()
