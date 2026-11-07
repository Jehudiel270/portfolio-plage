import { count, eq, max } from 'drizzle-orm'
import type { Database } from '../client'
import { achievements, certifications, educationEntries, professionalExperiences, projects, siteSettings, skills } from '../schema'
import { countUnreadMessages } from './messages'

export interface DashboardStats {
  projectsPublished: number
  projectsDraft: number
  skillsTotal: number
  skillsVisible: number
  educationCount: number
  experiencesCount: number
  certificationsCount: number
  achievementsCount: number
  unreadMessages: number
  lastModifiedAt: string | null
}

export async function loadDashboardStats(db: Database): Promise<DashboardStats> {
  const one = async (query: Promise<{ value: number }[]>) => (await query)[0]?.value ?? 0
  const [projectsPublished, projectsDraft, skillsTotal, skillsVisible, educationCount, experiencesCount, certificationsCount, achievementsCount, unreadMessages] = await Promise.all([
    one(db.select({ value: count() }).from(projects).where(eq(projects.status, 'published'))),
    one(db.select({ value: count() }).from(projects).where(eq(projects.status, 'draft'))),
    one(db.select({ value: count() }).from(skills)),
    one(db.select({ value: count() }).from(skills).where(eq(skills.visible, true))),
    one(db.select({ value: count() }).from(educationEntries)),
    one(db.select({ value: count() }).from(professionalExperiences)),
    one(db.select({ value: count() }).from(certifications)),
    one(db.select({ value: count() }).from(achievements)),
    countUnreadMessages(db),
  ])
  const dates = await Promise.all([
    db.select({ value: max(projects.updatedAt) }).from(projects),
    db.select({ value: max(skills.updatedAt) }).from(skills),
    db.select({ value: max(educationEntries.updatedAt) }).from(educationEntries),
    db.select({ value: max(professionalExperiences.updatedAt) }).from(professionalExperiences),
    db.select({ value: max(certifications.updatedAt) }).from(certifications),
    db.select({ value: max(achievements.updatedAt) }).from(achievements),
    db.select({ value: max(siteSettings.updatedAt) }).from(siteSettings),
  ])
  const timestamps = dates.map((rows) => rows[0]?.value).filter((v): v is Date => v instanceof Date).map((d) => d.getTime())
  return {
    projectsPublished, projectsDraft, skillsTotal, skillsVisible, educationCount, experiencesCount, certificationsCount, achievementsCount, unreadMessages,
    lastModifiedAt: timestamps.length ? new Date(Math.max(...timestamps)).toISOString() : null,
  }
}
