export interface Location {
  id: string
  name: string
  nameEn?: string
  country: string
  countryEn?: string
  province?: string
  provinceEn?: string
  aliases?: string[]
  administrativeCode?: string
  latitude: number
  longitude: number
  date?: string
}

export type Transport = 'plane' | 'car' | 'train' | 'ship'
export type MapTheme = 'midnight' | 'ocean' | 'minimal'
export type Speed = 'fast' | 'standard' | 'slow'
export type Language = 'zh' | 'en'
export type AnimationStatus = 'idle' | 'playing' | 'paused' | 'completed' | 'recording'

export interface TripLeg {
  id: string
  fromId: string
  toId: string
  transport: Transport
}

export interface Trip {
  name: string
  locations: Location[]
  legs: TripLeg[]
  speed: Speed
  theme: MapTheme
  language: Language
}

export interface TimelineState {
  time: number
  totalDuration: number
  progress: number
  segmentIndex: number
  segmentProgress: number
  holdProgress: number
  phase: 'idle' | 'flight' | 'hold' | 'completed'
}

export interface Camera {
  centerLongitude: number
  centerLatitude: number
  zoom: number
}
