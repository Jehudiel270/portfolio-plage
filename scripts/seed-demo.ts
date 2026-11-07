import { seedDemoContent } from '../server/services/demo'
import { requireDatabase } from './_env'

const { inserted } = await seedDemoContent(requireDatabase())
console.log(inserted ? '✔ Données de démonstration insérées (marquées « démo »). Supprimez-les avec : pnpm db:purge:demo' : '• Des données de démonstration existent déjà : rien à faire.')
