#!/usr/bin/env python3
"""Régénère app/utils/lucide-map.ts à partir de LUCIDE_ICON_NAMES (shared/constants.ts). Usage : python3 scripts/generate-lucide-map.py"""
import re
names = re.findall(r"'([A-Za-z0-9]+)'", re.search(r"LUCIDE_ICON_NAMES = \[(.*?)\] as const", open('shared/constants.ts').read(), re.S).group(1))
extra = ['Menu','X','SlidersHorizontal','ArrowRight','ArrowUp','ArrowDown','ExternalLink','ChevronLeft','ChevronRight','Check','Search','Send','MessageSquare','CircleCheck','CircleAlert','TriangleAlert','Download','Maximize2','Waves','MapPin','Mail','Calendar','ShieldCheck','Expand','Hand','MousePointerClick','List']
allnames = sorted(set(names) | set(extra))
body = ",\n  ".join(allnames)
open('app/utils/lucide-map.ts', 'w').write(f"import type {{ Component }} from 'vue'\nimport {{\n  {body},\n}} from 'lucide-vue-next'\n\nexport const LUCIDE_MAP: Record<string, Component> = {{\n  {body},\n}}\n")
