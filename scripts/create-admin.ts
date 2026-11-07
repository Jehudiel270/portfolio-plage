import { createInterface } from 'node:readline/promises'
import { Writable } from 'node:stream'
import { z } from 'zod'
import { countAdmins, createAdmin, findAdminByEmail } from '../server/db/repositories/admin'
import { hashPassword, validatePasswordStrength } from '../server/utils/password'
import { requireDatabase } from './_env'

/** Lecture masquée du mot de passe dans le terminal (aucun écho). */
async function askHidden(question: string): Promise<string> {
  let muted = false
  const output = new Writable({ write(chunk, _enc, cb) { if (!muted) process.stdout.write(chunk); cb() } })
  const rl = createInterface({ input: process.stdin, output, terminal: true })
  const pending = rl.question(question)
  muted = true
  const answer = await pending
  muted = false
  rl.close()
  process.stdout.write('\n')
  return answer
}

const db = requireDatabase()
const allowAdditional = process.argv.includes('--add')
const ownerEmail = process.env.NUXT_SUPERADMIN_OWNER_EMAIL?.trim().toLowerCase() ?? ''

if (!ownerEmail) {
  console.error('✖ Définissez NUXT_SUPERADMIN_OWNER_EMAIL avant de créer le super administrateur propriétaire.')
  process.exit(1)
}

if (!allowAdditional && (await countAdmins(db)) > 0) {
  console.error('✖ Un administrateur existe déjà. Les comptes supplémentaires se créent depuis l’espace de gestion du propriétaire.')
  process.exit(1)
}

let email = process.env.ADMIN_EMAIL?.trim() ?? ''
let password = process.env.ADMIN_PASSWORD ?? ''
if (!email || !password) {
  if (!process.stdin.isTTY) {
    console.error('✖ Renseignez ADMIN_EMAIL et ADMIN_PASSWORD dans l’environnement, ou lancez la commande dans un terminal interactif.')
    process.exit(1)
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  email ||= (await rl.question('E-mail de l’administrateur : ')).trim()
  rl.close()
  password ||= await askHidden('Mot de passe (12 caractères minimum) : ')
}

const parsed = z.email().safeParse(email)
if (!parsed.success) { console.error('✖ Adresse e-mail invalide.'); process.exit(1) }
if (email.toLowerCase() !== ownerEmail) {
  console.error('✖ Cette commande ne peut créer que le compte indiqué par NUXT_SUPERADMIN_OWNER_EMAIL.')
  process.exit(1)
}
const weakness = validatePasswordStrength(password)
if (weakness) { console.error(`✖ ${weakness}`); process.exit(1) }
if (await findAdminByEmail(db, email)) { console.error('✖ Un administrateur utilise déjà cette adresse e-mail.'); process.exit(1) }

const created = await createAdmin(db, { email, passwordHash: await hashPassword(password), role: 'superadmin' })
console.log(`✔ ${created.role === 'superadmin' ? 'Super administrateur' : 'Administrateur'} créé : ${email.toLowerCase()}. Connectez-vous sur /admin/login.`)
console.log('  Conseil : retirez ADMIN_PASSWORD de votre environnement.')
