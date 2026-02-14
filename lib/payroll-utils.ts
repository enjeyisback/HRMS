export const calculatePF = (basic: number): number => {
    // Standard PF is 12% of Basic
    return Math.round(basic * 0.12)
}

export const calculateESIC = (gross: number): number => {
    // ESIC is 0.75% of Gross if Gross < 21,000
    if (gross < 21000) {
        return Math.round(gross * 0.0075)
    }
    return 0
}

export const calculatePT = (gross: number): number => {
    // Professional Tax (Standard Maharashtra slabs as example)
    if (gross <= 7500) return 0
    if (gross <= 10000) return 175
    return 200 // Max PT is usually 2500/year (~200/month)
}

export const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount)
}
