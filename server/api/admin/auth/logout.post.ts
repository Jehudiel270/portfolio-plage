export default defineEventHandler(async (event) => {
  const admin = await getAdminSession(event)
  if (admin) assertSameOriginAndCsrf(event, admin)
  await endAdminSession(event)
  return { ok: true }
})
