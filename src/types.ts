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
  story?: string
  photoAssetId?: string
  photoName?: string
}

export type Transport = 'plane' | 'car' | 'train' | 'ship'
export type MapTheme = 'midnight' | 'ocean' | 'minimal'
export type Speed = 'fast' | 'standard' | 'slow'
export type Language = 'zh' | 'en'
export type AnimationStatus = 'idle' | 'playing' | 'paused' | 'completed' | 'recording'
export type RouteStyle = 'glow' | 'clean' | 'dashed'
export type LabelTiming = 'always' | 'arrival'
export type AspectRatio = '16:9' | '9:16' | '1:1'

export interface TripStory {
  subtitle: string
  traveler: string
  introDuration: number
  outroDuration: number
  showStats: boolean
  musicAssetId?: string
  musicName?: string
  musicVolume: number
}

export interface TripLeg {
  id: string
  fromId: string
  toId: string
  transport: Transport
  duration?: number
  holdDuration?: number
  cameraZoom?: number
  routeStyle?: RouteStyle
  labelTiming?: LabelTiming
}

export interface Trip {
  name: string
  locations: Location[]
  legs: TripLeg[]
  speed: Speed
  theme: MapTheme
  language: Language
  aspectRatio: AspectRatio
  story: TripStory
}

export interface TimelineState {
  time: number
  totalDuration: number
  progress: number
  segmentIndex: number
  segmentProgress: number
  holdProgress: number
  introProgress: number
  outroProgress: number
  phase: 'idle' | 'intro' | 'flight' | 'hold' | 'outro' | 'completed'
}

export interface Camera {
  centerLongitude: number
  centerLatitude: number
  zoom: number
}
