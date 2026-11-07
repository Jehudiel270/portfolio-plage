import { addAdminRecoveryCodes, findAdminByEmail, setAdminTotp } from '../server/db/repositories/admin'
import { requireDatabase } from './_env'

/** Secours : désactive la vérification en deux étapes d'un administrateur (accès au serveur requis). Usage : pnpm admin:reset-2fa -- vous@exemple.com */
const email = process.argv[2] ?? process.env.ADMIN_EMAIL
if (!email) { console.error('✖ Indiquez l’e-mail : pnpm admin:reset-2fa -- vous@exemple.com'); process.exit(1) }
const db = requireDatabase()
const admin = await findAdminByEmail(db, email)
if (!admin) { console.error('✖ Aucun administrateur avec cet e-mail.'); process.exit(1) }
await setAdminTotp(db, admin.id, { secret: null, enabled: false })
await addAdminRecoveryCodes(db, admin.id, [])
console.log(`✔ Vérification en deux étapes désactivée pour ${admin.email}. Réactivez-la depuis Sécurité.`)
