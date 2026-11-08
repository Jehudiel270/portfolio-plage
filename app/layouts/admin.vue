<script setup lang="ts">
import { Award, Boxes, Briefcase, ExternalLink, FileUp, FolderKanban, GraduationCap, Inbox, Languages, LayoutDashboard, LogOut, Mail, Menu, Palette, Search, ShieldCheck, SlidersHorizontal, Tags, Trophy, UserRound, Users, Waves, X } from 'lucide-vue-next'
import { hasAdminPermission, type AdminModule } from '#shared/admin-permissions'

const session = useAdminSession()
const route = useRoute()
const menuOpen = ref(false)
watch(() => route.path, () => { menuOpen.value = false })
useHead({ title: 'Administration', meta: [{ name: 'robots', content: 'noindex, nofollow' }] })

const groups = computed(() => {
  const user = session.value?.user
  const allowed = (module: AdminModule): boolean => hasAdminPermission(user?.role, user?.permissions, module, 'read')
  const source = [
  { title: 'Vue d’ensemble', items: [{ to: '/admin', label: 'Tableau de bord', icon: LayoutDashboard }] },
  { title: 'Contenu', items: [
    { to: '/admin/projects', label: 'Projets', icon: FolderKanban, module: 'projects' },
    { to: '/admin/skills', label: 'Compétences', icon: Boxes, module: 'skills' },
    { to: '/admin/experiences', label: 'Expériences', icon: Briefcase, module: 'journey' },
    { to: '/admin/education', label: 'Formation', icon: GraduationCap, module: 'journey' },
    { to: '/admin/certifications', label: 'Certifications', icon: Award, module: 'journey' },
    { to: '/admin/achievements', label: 'Réalisations', icon: Trophy, module: 'journey' },
    { to: '/admin/categories', label: 'Catégories', icon: Tags, module: 'categories' },
    { to: '/admin/content', label: 'Textes et liens', icon: UserRound, module: 'profile' },
    { to: '/admin/import-cv', label: 'Import de CV', icon: FileUp, module: 'journey' },
  ] },
  { title: 'Site', items: [
    { to: '/admin/appearance', label: 'Apparence', icon: Palette, module: 'appearance' },
    { to: '/admin/display', label: 'Affichage et menu', icon: SlidersHorizontal, module: 'display' },
    { to: '/admin/labels', label: 'Textes de l’interface', icon: Languages, module: 'labels' },
    { to: '/admin/seo', label: 'SEO et confidentialité', icon: Search, module: 'seo' },
    { to: '/admin/effects', label: 'Décor 3D', icon: Waves, module: 'appearance' },
  ] },
  { title: 'Contact', items: [
    { to: '/admin/contact', label: 'Canaux et e-mail', icon: Mail, module: 'contact' },
    { to: '/admin/messages', label: 'Messages reçus', icon: Inbox, module: 'messages' },
  ] },
  { title: 'Compte', items: [{ to: '/admin/security', label: 'Sécurité', icon: ShieldCheck, module: 'security' }] },
  ...(user?.role === 'superadmin' ? [{ title: 'Gouvernance', items: [{ to: '/admin/accounts', label: 'Comptes et accès', icon: Users }] }] : []),
  ]
  return source.map((group) => ({ ...group, items: group.items.filter((item) => !('module' in item) || allowed(item.module as AdminModule)) })).filter((group) => group.items.length > 0)
})
const active = (to: string): boolean => (to === '/admin' ? route.path === '/admin' : route.path.startsWith(to))
</script>

<template>
  <div class="admin-theme">
    <header class="admin-side sticky top-0 z-30 flex items-center gap-3 px-4 py-3 lg:hidden">
      <button type="button" class="grid size-10 place-items-center rounded-lg transition hover:bg-white/15" aria-label="Menu" :aria-expanded="menuOpen" @click="menuOpen = !menuOpen"><component :is="menuOpen ? X : Menu" class="size-5" /></button>
      <span class="font-display text-base font-bold">Administration</span>
    </header>
    <div class="mx-auto grid max-w-[92rem] lg:grid-cols-[17.5rem_1fr]">
      <aside class="admin-side fixed inset-x-0 top-16 bottom-0 z-30 overflow-y-auto lg:sticky lg:top-0 lg:bottom-auto lg:z-auto lg:h-svh" :class="menuOpen ? 'block' : 'hidden lg:block'">
        <div class="flex items-center gap-3 p-5"><svg width="38" height="38" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="16" fill="#bfe9f5" /><circle cx="44" cy="20" r="8" fill="#ffb703" /><path d="M0 40c8-6 14-6 22 0s14 6 22 0 14-6 20 0v24H0z" fill="#0b7285" /></svg><div class="min-w-0"><p class="font-display text-lg font-bold leading-tight">Portfolio</p><p class="truncate text-xs opacity-75">{{ session?.user?.email }}</p></div></div>
        <nav aria-label="Administration" class="grid gap-5 px-3 pb-8">
          <div v-for="group in groups" :key="group.title">
            <p class="px-3 pb-1.5 text-xs font-bold opacity-60">{{ group.title }}</p>
            <NuxtLink v-for="item in group.items" :key="item.to" :to="item.to" class="relative flex items-center gap-3 rounded-xl px-3 py-2 text-[.93rem] font-semibold opacity-90 transition hover:bg-white/12 hover:opacity-100" :class="{ '!bg-white/18 !opacity-100 shadow-inner': active(item.to) }" :aria-current="active(item.to) ? 'page' : undefined"><span v-if="active(item.to)" class="absolute -left-3 top-2 h-6 w-1 rounded-r bg-sun" aria-hidden="true" /><component :is="item.icon" class="size-[1.1rem]" aria-hidden="true" />{{ item.label }}</NuxtLink>
          </div>
          <div class="grid gap-1 border-t border-white/15 pt-4">
            <a href="/?preview=1" target="_blank" rel="noopener" class="flex items-center gap-3 rounded-xl px-3 py-2 text-[.93rem] font-semibold opacity-90 transition hover:bg-white/12"><ExternalLink class="size-[1.1rem]" aria-hidden="true" />Aperçu du site</a>
            <button type="button" class="flex items-center gap-3 rounded-xl px-3 py-2 text-left text-[.93rem] font-semibold opacity-90 transition hover:bg-white/12" @click="adminLogout()"><LogOut class="size-[1.1rem]" aria-hidden="true" />Se déconnecter</button>
          </div>
        </nav>
      </aside>
      <main class="min-w-0 p-4 sm:p-6 lg:p-10"><slot /></main>
    </div>
    <AdminToasts />
  </div>
</template>
