"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Download, Database, FileJson, FileSpreadsheet } from "lucide-react"
import { logAction } from "@/lib/audit-logger"

export function DataExport() {
    const [exporting, setExporting] = useState<string | null>(null)

    const handleExport = async (table: string, format: 'json' | 'csv') => {
        setExporting(`${table}-${format}`)
        const supabase = createClient()

        try {
            const { data, error } = await supabase.from(table).select('*')
            if (error) throw error

            const blob = new Blob(
                [format === 'json' ? JSON.stringify(data, null, 2) : convertToCSV(data)],
                { type: format === 'json' ? 'application/json' : 'text/csv' }
            )
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${table}_backup_${new Date().toISOString().split('T')[0]}.${format}`
            a.click()

            await logAction({
                action: 'SYSTEM',
                module: 'backup',
                description: `Exported ${table} data as ${format.toUpperCase()}`
            })
        } catch (error: any) {
            alert("Export failed: " + error.message)
        } finally {
            setExporting(null)
        }
    }

    const convertToCSV = (objArray: any[]) => {
        if (objArray.length === 0) return ""
        const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray
        let str = ''
        const headers = Object.keys(array[0]).join(',') + '\r\n'
        str += headers
        for (let i = 0; i < array.length; i++) {
            let line = ''
            for (const index in array[i]) {
                if (line !== '') line += ','
                line += `"${array[i][index]}"`
            }
            str += line + '\r\n'
        }
        return str
    }

    const tables = [
        { id: 'employees', name: 'Employees Master' },
        { id: 'attendance', name: 'Attendance Logs' },
        { id: 'leave_requests', name: 'Leave Records' },
        { id: 'payroll_runs', name: 'Payroll History' },
    ]

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-indigo-600" />
                    System Data Bakcup
                </CardTitle>
                <CardDescription>Download snapshots of your system data for offline storage or migration.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4">
                    {tables.map((table) => (
                        <div key={table.id} className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                            <div>
                                <h4 className="font-medium">{table.name}</h4>
                                <p className="text-xs text-muted-foreground">Table: {table.id}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleExport(table.id, 'json')}
                                    disabled={!!exporting}
                                >
                                    {exporting === `${table.id}-json` ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileJson className="h-4 w-4 mr-2" />}
                                    JSON
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleExport(table.id, 'csv')}
                                    disabled={!!exporting}
                                >
                                    {exporting === `${table.id}-csv` ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 mr-2" />}
                                    CSV
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
