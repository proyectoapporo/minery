"""Publica solo fichas editoriales de la semilla, sin ejemplos ni claves."""
import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
seed=json.loads((root/'knowledge/seed.json').read_text(encoding='utf-8'))
sources={s['id']:s for s in seed['sources']}
articles=[]
for row in seed['articles']:
    if row['status']!='reviewed': continue
    item=dict(row)
    item['sources']=[sources[s] for s in row['sources']]
    if not item['sources']: raise ValueError('Ficha sin fuentes: '+row['id'])
    articles.append(item)
(root/'public/knowledge.json').write_text(json.dumps({'updated_on':'2026-10-17','topics':seed['topics'],'articles':articles},ensure_ascii=False,indent=2),encoding='utf-8')
print(f'Biblioteca generada: {len(articles)} fichas.')
