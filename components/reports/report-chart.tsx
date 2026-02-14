"use client"

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

type ChartType = 'bar' | 'pie'

export function ReportChart({
    data,
    type = 'bar',
    title,
    dataKey = "count",
    nameKey = "name"
}: {
    data: any[],
    type?: ChartType,
    title?: string,
    dataKey?: string,
    nameKey?: string
}) {
    return (
        <div className="h-[300px] w-full">
            {title && <h3 className="text-sm font-medium mb-4 text-center">{title}</h3>}
            <ResponsiveContainer width="100%" height="100%">
                {type === 'bar' ? (
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey={nameKey} fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey={dataKey} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                ) : (
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey={dataKey}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                )}
            </ResponsiveContainer>
        </div>
    )
}
