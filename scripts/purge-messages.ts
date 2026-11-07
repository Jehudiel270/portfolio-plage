import { loadSettings } from '../server/db/repositories/settings'
import { purgeOldMessages } from '../server/db/repositories/messages'
import { requireDatabase } from './_env'

/** Applique la politique de conservation (réglage « Contact » > durée de conservation). Idéal en tâche planifiée. */
const db = requireDatabase()
const days = Number(process.argv[2] ?? (await loadSettings(db)).contact.retentionDays)
const removed = await purgeOldMessages(db, days)
console.log(days > 0 ? `✔ ${removed} message(s) de plus de ${days} jours supprimé(s).` : '• Conservation illimitée : aucune suppression.')
