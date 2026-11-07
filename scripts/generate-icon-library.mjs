/**
 * Génère server/data/brand-icons.json : bibliothèque d'icônes de technologies (langages, frameworks, outils, réseaux).
 * Source : paquet npm `simple-icons` (licence CC0 — domaine public ; les logos restent des marques de leurs propriétaires).
 * Usage : pnpm add -D simple-icons && node scripts/generate-icon-library.mjs
 */
import { writeFileSync } from 'node:fs'
import * as simpleIcons from 'simple-icons'

const WANTED = `javascript typescript python php openjdk kotlin swift rust go cplusplus c dart ruby perl lua r scala elixir haskell clojure julia solidity webassembly html5 css sass less markdown json yaml graphql latex
react vuedotjs nuxt nextdotjs angular svelte astro remix solid qwik preact alpinedotjs htmx jquery tailwindcss bootstrap mui chakraui shadcnui radixui antdesign vite webpack rollupdotjs esbuild babel threedotjs d3dotjs chartdotjs p5dotjs gsap greensock framer lottiefiles storybook pinia vuetify quasar ionic capacitor electron tauri flutter expo reactquery reactrouter redux
nodedotjs express nestjs fastify deno bun django flask fastapi laravel symfony spring springboot rubyonrails dotnet apollographql trpc socketdotio prisma drizzle sequelize typeorm mongoose
postgresql mysql mariadb sqlite mongodb redis supabase firebase planetscale neon cockroachdb elasticsearch apachecassandra influxdb clickhouse duckdb appwrite pocketbase
amazonaws googlecloud cloudflare vercel netlify heroku digitalocean render railway flydotio docker kubernetes terraform ansible jenkins githubactions circleci nginx apache linux ubuntu debian archlinux fedora redhat apple android gnubash vim neovim jetbrains intellijidea pycharm webstorm androidstudio xcode
git github gitlab bitbucket npm pnpm yarn postman insomnia swagger jest vitest cypress selenium puppeteer testinglibrary mocha eslint prettier sentry datadog grafana prometheus cloudinary stripe paypal twilio sendgrid auth0 clerk okta keycloak algolia contentful strapi sanity wordpress woocommerce shopify prestashop magento drupal ghost
tensorflow pytorch keras scikitlearn pandas numpy scipy plotly jupyter anaconda huggingface langchain opencv apachespark apachehadoop apacheairflow dbt tableau looker metabase apachekafka rabbitmq mlflow nvidia googlecolab kaggle
figma sketch adobe adobexd canva blender unity unrealengine godotengine autodesk krita inkscape gimp davinciresolve obsstudio affinitydesigner miro webflow wix squarespace notion obsidian airtable
discord zoom trello jira confluence asana linear clickup googleanalytics googletagmanager googlesheets googledocs
github gitlab x instagram youtube facebook tiktok behance dribbble malt upwork whatsapp telegram medium devdotto hashnode stackoverflow codepen leetcode hackerrank fiverr freelancer gmail protonmail mastodon bluesky threads pinterest snapchat twitch spotify soundcloud
mtn orange visa mastercard`.split(/\s+/)

const bySlug = new Map(Object.values(simpleIcons).filter((i) => i && i.slug).map((i) => [i.slug, i]))
const seen = new Set()
const out = []
const missing = []
for (const slug of WANTED) {
  if (seen.has(slug)) continue
  seen.add(slug)
  const icon = bySlug.get(slug)
  if (!icon) { missing.push(slug); continue }
  out.push([icon.slug, icon.title, icon.hex, icon.path])
}
writeFileSync('server/data/brand-icons.json', JSON.stringify(out))
console.log(`✔ ${out.length} icônes écrites (${Math.round(JSON.stringify(out).length / 1024)} Ko). Absentes de cette version de simple-icons : ${missing.join(', ') || 'aucune'}`)
