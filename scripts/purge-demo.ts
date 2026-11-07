import { purgeDemoContent } from '../server/services/demo'
import { requireDatabase } from './_env'

const removed = await purgeDemoContent(requireDatabase())
console.log(`✔ ${removed} élément(s) de démonstration supprimé(s). Vos données réelles sont intactes.`)
