export default defineNuxtRouteMiddleware(async (to) => {
  const asdStore = useAsdStore()
  const slug = to.params.asd_slug
  
  if (slug) {
    await asdStore.loadAsd(slug)
  }
})