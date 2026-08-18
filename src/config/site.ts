const clean = (value: string | undefined) => value?.trim() || ''

export const siteConfig = {
  siteUrl: clean(import.meta.env.VITE_SITE_URL),
  operatorName: clean(import.meta.env.VITE_OPERATOR_NAME),
  contactEmail: clean(import.meta.env.VITE_CONTACT_EMAIL),
  icpNumber: clean(import.meta.env.VITE_ICP_NUMBER),
  publicSecurityNumber: clean(import.meta.env.VITE_PUBLIC_SECURITY_NUMBER),
  publicSecurityUrl: clean(import.meta.env.VITE_PUBLIC_SECURITY_URL),
}

export const brand = {
  zh: '帧足记',
  en: 'VoyaFrame',
  full: '帧足记 VoyaFrame',
} as const

export const displayOperator = siteConfig.operatorName || '帧足记运营者'
export const displayContact = siteConfig.contactEmail || '请通过网站公示的联系方式与运营者联系'
