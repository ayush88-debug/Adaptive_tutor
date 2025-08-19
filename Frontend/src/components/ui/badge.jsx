import * as React from "react"

const badgeVariants = (variant) => {
    if (variant === 'success') {
        return "bg-green-100 text-green-800 border-transparent";
    }
    if (variant === 'destructive') {
        return "bg-red-100 text-red-800 border-transparent";
    }
    return "bg-slate-100 text-slate-800 border-transparent";
}

const Badge = ({ className, variant, ...props }) => {
    return (
        <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${badgeVariants(variant)} ${className}`} {...props} />
    )
}

export { Badge };