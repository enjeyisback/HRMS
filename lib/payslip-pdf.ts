import { jsPDF } from "jspdf"
import { format } from "date-fns"
import { PayrollCalculationResult } from "./payroll-generator"

export const generatePayslipPDF = (data: PayrollCalculationResult, month: number, year: number) => {
    const doc = new jsPDF()
    const monthName = format(new Date(year, month - 1), "MMMM")

    // Header
    doc.setFontSize(22)
    doc.setTextColor(63, 81, 181) // Theme color
    doc.text("COMPANY LOGO / NAME", 105, 20, { align: "center" })

    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.text("Corporate Address, City, State - Zip", 105, 28, { align: "center" })

    doc.line(20, 35, 190, 35)

    doc.setFontSize(16)
    doc.text(`Salary Slip for ${monthName} ${year}`, 105, 45, { align: "center" })

    // Employee Details
    doc.setFontSize(10)
    doc.text(`Employee Name: ${data.employeeName}`, 20, 60)
    doc.text(`Employee ID: ${data.employeeCode}`, 20, 65)
    doc.text(`Department: ${data.departmentName}`, 20, 70)

    doc.text(`Working Days: ${data.workingDays}`, 140, 60)
    doc.text(`Days Present: ${data.presentDays}`, 140, 65)
    doc.text(`Leaves Taken: ${data.paidLeaveDays + data.unpaidLeaveDays}`, 140, 70)
    doc.text(`LOP Days: ${data.lopDays}`, 140, 75)

    // Salary Table
    doc.setFillColor(245, 245, 245)
    doc.rect(20, 85, 85, 10, "F")
    doc.rect(105, 85, 85, 10, "F")

    doc.setFont("helvetica", "bold")
    doc.text("EARNINGS", 62, 92, { align: "center" })
    doc.text("DEDUCTIONS", 147, 92, { align: "center" })
    doc.setFont("helvetica", "normal")

    let earningY = 100
    data.earnings.forEach(e => {
        doc.text(e.name, 25, earningY)
        doc.text(e.amount.toLocaleString('en-IN'), 100, earningY, { align: "right" })
        earningY += 7
    })

    let deductionY = 100
    data.deductions.forEach(d => {
        doc.text(d.name, 110, deductionY)
        doc.text(d.amount.toLocaleString('en-IN'), 185, deductionY, { align: "right" })
        deductionY += 7
    })

    const maxY = Math.max(earningY, deductionY)
    doc.line(20, maxY, 190, maxY)

    doc.setFont("helvetica", "bold")
    doc.text("Total Earnings", 25, maxY + 10)
    doc.text(data.totalEarnings.toLocaleString('en-IN'), 100, maxY + 10, { align: "right" })

    doc.text("Total Deductions", 110, maxY + 10)
    doc.text(data.totalDeductions.toLocaleString('en-IN'), 185, maxY + 10, { align: "right" })

    // Net Payable
    doc.setFillColor(232, 245, 233)
    doc.rect(20, maxY + 20, 170, 15, "F")
    doc.setFontSize(14)
    doc.setTextColor(46, 125, 50)
    doc.text(`Net Payable Amount: ${data.netPayable.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}`, 105, maxY + 30, { align: "center" })

    // Footer
    doc.setFontSize(9)
    doc.setTextColor(150, 150, 150)
    doc.text("This is a computer generated payslip and does not require a physical signature.", 105, 280, { align: "center" })

    return doc
}
