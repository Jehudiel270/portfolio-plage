<script setup lang="ts">
import { CheckCheck, FileUp, Sparkles, TriangleAlert } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'

definePageMeta({ layout: 'admin' })
interface Entry { selected: boolean; title: string; organization: string; location: string; startDate: string; endDate: string | null; isCurrent: boolean; description: string; bullets: string[]; needsReview: boolean }
interface Parsed {
  profile: { name: string; title: string; email: string; phone: string; location: string; about: string; links: { platform: string; url: string }[] }
  experiences: Entry[]; education: Entry[]; skills: { name: string; category: string }[]
  certifications: { name: string; issuer: string; issuedAt: string; needsReview: boolean }[]; languages: { name: string; level: string }[]
  projects: { title: string; description: string; technologies: string[]; url: string }[]; warnings: string[]
}
const toasts = useToasts()
const step = ref<'upload' | 'review' | 'done'>('upload')
const busy = ref(false)
const pasted = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const parsed = ref<Parsed | null>(null)
const pick = reactive({ profile: { name: true, title: true, email: true, location: true, about: true } as Record<string, boolean>, links: [] as boolean[], skills: [] as boolean[], certs: [] as boolean[], languages: [] as boolean[], projects: [] as boolean[] })
const exps = ref<Entry[]>([])
const edus = ref<Entry[]>([])
const report = ref<Record<string, { created: number; failed: { index: number; errors?: Record<string, string> }[] }> | null>(null)

async function analyse(file?: File): Promise<void> {
  busy.value = true
  try {
    const body = new FormData()
    if (file) body.append('file', file)
    else body.append('text', pasted.value)
    const response = await adminFetch<{ result: Parsed }>('/api/admin/cv/parse', { method: 'POST', body })
    const r = response.result
    parsed.value = r
    exps.value = r.experiences.map((e) => ({ ...e, selected: true }))
    edus.value = r.education.map((e) => ({ ...e, selected: true }))
    pick.links = r.profile.links.map(() => true)
    pick.skills = r.skills.map(() => true)
    pick.certs = r.certifications.map(() => true)
    pick.languages = r.languages.map(() => true)
    pick.projects = r.projects.map(() => true)
    step.value = 'review'
  } catch (error) { toasts.error(parseApiError(error).message) } finally { busy.value = false }
}
function onFile(event: Event): void { const file = (event.target as HTMLInputElement).files?.[0]; if (file) void analyse(file); if (fileInput.value) fileInput.value.value = '' }

const mapEntry = (e: Entry, kind: 'experiences' | 'education'): Record<string, unknown> => kind === 'experiences'
  ? { role: e.title, organization: e.organization || 'À préciser', type: 'job', location: e.location || null, startDate: e.startDate, endDate: e.isCurrent ? null : e.endDate || null, isCurrent: e.isCurrent, description: e.description, missions: e.bullets }
  : { title: e.title, institution: e.organization || 'À préciser', degree: '', field: '', description: e.description, startDate: e.startDate, endDate: e.isCurrent ? null : e.endDate || null, isCurrent: e.isCurrent, achievements: e.bullets }

async function apply(): Promise<void> {
  const r = parsed.value
  if (!r) return
  busy.value = true
  try {
    const profile = Object.fromEntries(Object.entries({ name: r.profile.name, title: r.profile.title, publicEmail: r.profile.email, location: r.profile.location, about: r.profile.about }).filter(([k]) => pick.profile[k === 'publicEmail' ? 'email' : k]))
    report.value = (await adminFetch<{ report: NonNullable<typeof report.value> }>('/api/admin/cv/apply', { method: 'POST', body: {
      profile,
      links: r.profile.links.filter((_, i) => pick.links[i]).map((l) => ({ platform: l.platform, label: '', url: l.url })),
      experiences: exps.value.filter((e) => e.selected).map((e) => mapEntry(e, 'experiences')),
      education: edus.value.filter((e) => e.selected).map((e) => mapEntry(e, 'education')),
      skills: r.skills.filter((_, i) => pick.skills[i]).map((s) => ({ name: s.name, category: s.category })),
      certifications: r.certifications.filter((_, i) => pick.certs[i]).map((c) => ({ name: c.name, issuer: c.issuer || 'À préciser', issuedAt: c.issuedAt, category: '' })),
      achievements: r.languages.filter((_, i) => pick.languages[i]).map((l) => ({ title: l.name, category: 'Langue', description: l.level })),
      projects: r.projects.filter((_, i) => pick.projects[i]).map((p) => ({ title: p.title, shortDescription: p.description.slice(0, 280), description: p.description, technologies: p.technologies, liveUrl: p.url || null, status: 'draft' })),
    } })).report
    step.value = 'done'
    toasts.ok('Import terminé : relisez les fiches créées.')
  } catch (error) { toasts.error(parseApiError(error).message) } finally { busy.value = false }
}
const LABELS: Record<string, string> = { experiences: 'Expériences', education: 'Formations', skills: 'Compétences', certifications: 'Certifications', achievements: 'Langues (réalisations)', projects: 'Projets (en brouillon)' }
const reset = (): void => { step.value = 'upload'; parsed.value = null; report.value = null; pasted.value = '' }
</script>

<template>
  <div>
    <AdminPageHeader title="Import de CV" description="Déposez votre CV (PDF, DOCX ou texte) pour pré-remplir expériences, formations, compétences, certifications et langues. La lecture est automatique et approximative : vous relisez et corrigez tout avant l’import. Le fichier n’est jamais stocké." />

    <section v-if="step === 'upload'" class="grid gap-6 lg:grid-cols-2">
      <div class="admin-card grid content-start gap-4 p-6"><h2 class="font-display text-lg font-bold">1. Déposer un fichier</h2>
        <label class="grid cursor-pointer place-items-center gap-2 rounded-2xl border-2 border-dashed border-primary/35 bg-primary/5 p-10 text-center transition hover:border-primary hover:bg-primary/8"><FileUp class="size-9 text-primary" aria-hidden="true" /><span class="font-bold">Choisir un CV</span><span class="text-sm text-muted">PDF, DOCX, TXT ou MD · 5 Mo maximum</span><input ref="fileInput" type="file" accept=".pdf,.docx,.txt,.md" class="sr-only" :disabled="busy" @change="onFile"></label>
        <p class="text-xs text-muted">PDF scanné (image) ? Le texte n’est pas lisible : collez-le plutôt à droite.</p></div>
      <div class="admin-card grid content-start gap-4 p-6"><h2 class="font-display text-lg font-bold">… ou coller le texte</h2>
        <label class="sr-only" for="cv-text">Texte du CV</label><textarea id="cv-text" v-model="pasted" class="admin-input font-mono" rows="10" placeholder="Collez ici le contenu de votre CV…" />
        <div><Button :disabled="busy || pasted.trim().length < 40" @click="analyse()"><Sparkles />{{ busy ? 'Analyse…' : 'Analyser' }}</Button></div></div>
    </section>

    <section v-else-if="step === 'review' && parsed" class="grid gap-6">
      <p v-for="w in parsed.warnings" :key="w" class="flex items-start gap-2 rounded-xl border border-warn/35 bg-warn/10 p-3 text-sm font-semibold text-warn"><TriangleAlert class="mt-0.5 size-4 shrink-0" />{{ w }}</p>

      <div class="admin-card p-6"><h2 class="font-display text-lg font-bold">Profil</h2>
        <div class="mt-4 grid gap-3 sm:grid-cols-2">
          <label v-for="[key, label] in [['name', 'Nom'], ['title', 'Titre'], ['email', 'E-mail public'], ['location', 'Localisation']]" :key="key" class="flex items-start gap-3"><input v-model="pick.profile[key]" type="checkbox" class="mt-3 size-4 accent-[var(--primary)]"><span class="grid flex-1 gap-1"><span class="text-sm font-semibold">{{ label }}</span><input v-model="(parsed.profile as unknown as Record<string, string>)[key]" class="admin-input"></span></label>
          <label class="flex items-start gap-3 sm:col-span-2"><input v-model="pick.profile.about" type="checkbox" class="mt-3 size-4 accent-[var(--primary)]"><span class="grid flex-1 gap-1"><span class="text-sm font-semibold">Texte « À propos »</span><textarea v-model="parsed.profile.about" class="admin-input" rows="3" /></span></label>
        </div>
        <ul v-if="parsed.profile.links.length" class="mt-4 flex flex-wrap gap-3"><li v-for="(link, i) in parsed.profile.links" :key="link.url"><label class="chip"><input v-model="pick.links[i]" type="checkbox" class="size-4 accent-[var(--primary)]">{{ link.platform }} · {{ link.url.replace('https://', '') }}</label></li></ul></div>

      <div v-for="[title, list, kind] in ([['Expériences', exps, 'exp'], ['Formations', edus, 'edu']] as const)" :key="title" class="admin-card p-6"><h2 class="font-display text-lg font-bold">{{ title }} <span class="text-sm font-normal text-muted">({{ list.length }})</span></h2>
        <p v-if="!list.length" class="mt-3 text-sm text-muted">Rien détecté.</p>
        <ul class="mt-4 grid gap-3"><li v-for="(e, i) in list" :key="`${kind}-${i}`" class="rounded-xl border p-4" :class="e.needsReview ? 'border-warn/50 bg-warn/5' : 'border-line'">
          <label class="mb-3 flex items-center gap-2 text-sm font-bold"><input v-model="e.selected" type="checkbox" class="size-4 accent-[var(--primary)]">Importer<span v-if="e.needsReview" class="tag tag--draft">à vérifier</span></label>
          <div class="grid gap-3 sm:grid-cols-2"><AdminField :label="kind === 'exp' ? 'Rôle' : 'Intitulé'"><input v-model="e.title" class="admin-input"></AdminField><AdminField :label="kind === 'exp' ? 'Organisation' : 'Établissement'"><input v-model="e.organization" class="admin-input"></AdminField>
            <AdminField label="Début"><input v-model="e.startDate" type="date" class="admin-input" :aria-invalid="!e.startDate"></AdminField><AdminField label="Fin" optional><input v-model="e.endDate" type="date" class="admin-input" :disabled="e.isCurrent"></AdminField>
            <label class="flex items-center gap-2 text-sm font-semibold"><input v-model="e.isCurrent" type="checkbox" class="size-4 accent-[var(--primary)]">En cours</label>
            <AdminField v-if="kind === 'exp'" label="Lieu" optional><input v-model="e.location" class="admin-input"></AdminField>
            <AdminLinesField v-model="e.bullets" :label="kind === 'exp' ? 'Missions' : 'Réalisations'" optional class="sm:col-span-2" /></div></li></ul></div>

      <div class="admin-card p-6"><h2 class="font-display text-lg font-bold">Compétences <span class="text-sm font-normal text-muted">({{ parsed.skills.length }}) · l’icône de la technologie est ajoutée automatiquement</span></h2>
        <p v-if="!parsed.skills.length" class="mt-3 text-sm text-muted">Rien détecté.</p>
        <ul class="mt-4 flex flex-wrap gap-2"><li v-for="(s, i) in parsed.skills" :key="s.name"><label class="chip"><input v-model="pick.skills[i]" type="checkbox" class="size-4 accent-[var(--primary)]">{{ s.name }}<span v-if="s.category" class="text-xs opacity-70">· {{ s.category }}</span></label></li></ul></div>

      <div class="grid gap-6 lg:grid-cols-2">
        <div class="admin-card p-6"><h2 class="font-display text-lg font-bold">Certifications <span class="text-sm font-normal text-muted">({{ parsed.certifications.length }})</span></h2><ul class="mt-4 grid gap-3"><li v-for="(c, i) in parsed.certifications" :key="c.name" class="grid gap-2 rounded-xl border p-3" :class="c.needsReview ? 'border-warn/50 bg-warn/5' : 'border-line'"><label class="flex items-center gap-2 text-sm font-bold"><input v-model="pick.certs[i]" type="checkbox" class="size-4 accent-[var(--primary)]">Importer</label><input v-model="c.name" class="admin-input" aria-label="Nom"><input v-model="c.issuer" class="admin-input" placeholder="Organisme" aria-label="Organisme"><input v-model="c.issuedAt" type="date" class="admin-input" :aria-invalid="!c.issuedAt" aria-label="Date d’obtention"></li></ul><p v-if="!parsed.certifications.length" class="mt-3 text-sm text-muted">Rien détecté.</p></div>
        <div class="admin-card p-6"><h2 class="font-display text-lg font-bold">Langues et projets</h2>
          <ul class="mt-4 flex flex-wrap gap-2"><li v-for="(l, i) in parsed.languages" :key="l.name"><label class="chip"><input v-model="pick.languages[i]" type="checkbox" class="size-4 accent-[var(--primary)]">{{ l.name }}<span v-if="l.level" class="text-xs opacity-70">· {{ l.level }}</span></label></li></ul>
          <ul class="mt-4 grid gap-2"><li v-for="(p, i) in parsed.projects" :key="p.title" class="rounded-xl border border-line p-3"><label class="flex items-center gap-2 text-sm font-bold"><input v-model="pick.projects[i]" type="checkbox" class="size-4 accent-[var(--primary)]">{{ p.title }}<span class="tag">brouillon</span></label></li></ul>
          <p v-if="!parsed.languages.length && !parsed.projects.length" class="mt-3 text-sm text-muted">Rien détecté.</p></div>
      </div>

      <div class="sticky bottom-3 z-10 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface/95 p-4 shadow-lg backdrop-blur"><Button :disabled="busy" @click="apply"><CheckCheck />{{ busy ? 'Import…' : 'Importer la sélection' }}</Button><Button variant="ghost" :disabled="busy" @click="reset">Recommencer</Button><span class="text-sm text-muted">Les éléments importés restent modifiables dans chaque section.</span></div>
    </section>

    <section v-else-if="report" class="admin-card grid gap-4 p-8"><h2 class="font-display text-xl font-bold">Import terminé</h2>
      <ul class="grid gap-2"><li v-for="(r, key) in report" :key="key" class="flex flex-wrap items-center gap-3 text-sm"><span class="w-52 font-semibold">{{ LABELS[key] ?? key }}</span><Badge tone="ok">{{ r.created }} créé(s)</Badge><Badge v-if="r.failed.length" tone="danger">{{ r.failed.length }} refusé(s)</Badge><span v-for="f in r.failed" :key="f.index" class="text-danger">ligne {{ f.index + 1 }} : {{ Object.values(f.errors ?? {}).join(' ; ') }}</span></li></ul>
      <div class="flex flex-wrap gap-2"><Button as-child><NuxtLink to="/admin/experiences">Relire les expériences</NuxtLink></Button><Button as-child variant="soft"><NuxtLink to="/admin/skills">Relire les compétences</NuxtLink></Button><Button variant="ghost" @click="reset">Importer un autre CV</Button></div></section>
  </div>
</template>
