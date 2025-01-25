export interface NameItem {
  name: string
  rank: string
}

export interface YearData {
  male: Record<string, string>
  female: Record<string, string>
}

export interface NamesByYear {
  [key: string]: YearData
} 