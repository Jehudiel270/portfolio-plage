const TYPE_LABELS: Record<string, string> = { job: 'Emploi', internship: 'Stage', mission: 'Mission', volunteer: 'Engagement associatif', other: 'Autre' }
export const experienceTypeLabel = (type: string): string => TYPE_LABELS[type] ?? 'Autre'
export const EXPERIENCE_TYPE_OPTIONS = Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))
