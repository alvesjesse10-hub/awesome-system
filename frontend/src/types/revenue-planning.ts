export interface RevenueGoal {
  id: string
  companyId: string
  year: number
  month: number
  targetAmount: number
}

export interface RevenueGoalComparisonRow {
  month: number
  target: number
  realized: number
  achievementPercent: number | null
}

export interface RevenueProjection {
  id: string
  companyId: string
  chartOfAccountId: string
  year: number
  month: number
  projectedAmount: number
  chartOfAccount?: { id: string; name: string }
}

export interface RevenueProjectionComparisonRow {
  month: number
  projected: number
  realized: number
}
