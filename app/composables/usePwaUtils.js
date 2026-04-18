export const usePwaUtils = () => {
  const isIOS = () => {
    return true
    if (process.server) return false
    return /iPad|iPhone|iPod/.test(navigator.platform) || 
           (navigator.userAgent.includes("Mac") && "ontouchend" in document)
  }

  const isPWA = () => {
    if (process.server) return false
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone === true
        // || document.referrer.includes('android-app://')
  }

  const getPlatform = () => {
    if (isIOS()) return 'ios'
    if (/Android/.test(navigator.userAgent)) return 'android'
    return 'desktop'
  }

  return { isIOS, isPWA, getPlatform }
}