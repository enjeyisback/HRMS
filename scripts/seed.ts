import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local')
console.log('Loading .env from:', envPath)
const result = dotenv.config({ path: envPath })

if (result.error) {
    console.error('Error loading .env file:', result.error)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

console.log('URL:', supabaseUrl)
console.log('Key exists:', !!supabaseKey)
console.log('Key starts with:', supabaseKey ? supabaseKey.substring(0, 10) : 'N/A')

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials (URL or Service Role Key)')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function seed() {
    console.log('Seeding data...')

    const departments = [
        { name: 'Engineering', code: 'ENG' },
        { name: 'Human Resources', code: 'HR' },
        { name: 'Sales', code: 'SAL' },
        { name: 'Marketing', code: 'MKT' }
    ]

    const designations = [
        { title: 'Software Engineer' }, // Removed code column as it doesn't exist in schema
        { title: 'Senior Software Engineer' },
        { title: 'HR Manager' },
        { title: 'Sales Executive' }
    ]

    // Insert Departments
    for (const dept of departments) {
        const { error } = await supabase.from('departments').upsert(dept, { onConflict: 'code', ignoreDuplicates: true })
        if (error) console.error('Error inserting dept:', dept.name, error)
        else console.log('Inserted/Verified Dept:', dept.name)
    }

    // Insert Designations
    // Since we don't have a unique code to conflict on, checking title if unique constraint exists.
    // Schema has: title TEXT NOT NULL, but no UNIQUE constraint in CREATE TABLE. 
    // Wait, let's check schema again. 
    // CREATE TABLE designations (... title TEXT NOT NULL ...)
    // It does NOT have UNIQUE on title.
    // So UPSERT might duplicate if we run multiple times unless we have ID.
    // We should probably check if exists first or just insert if not exists.
    // For now, let's just insert to get things working.
    // Or better, I can check if it exists:

    for (const desig of designations) {
        const { data } = await supabase.from('designations').select('id').eq('title', desig.title).single()
        if (!data) {
            const { error } = await supabase.from('designations').insert(desig)
            if (error) console.error('Error inserting designation:', desig.title, error)
            else console.log('Inserted Designation:', desig.title)
        } else {
            console.log('Designation already exists:', desig.title)
        }
    }

    console.log('Seeding complete.')
}

seed()
