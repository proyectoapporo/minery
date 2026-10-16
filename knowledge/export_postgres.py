"""Genera importación transaccional al esquema exclusivo minery_knowledge."""
import json
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parent
tables = {
    'topics': 'id text primary key, title text not null',
    'sources': 'id text primary key, title text not null, url text not null, kind text not null, consulted_on date not null',
    'articles': "id text primary key, topic_id text not null references minery_knowledge.topics(id), title text not null, body text not null, status text not null check(status in ('reviewed','commercial_claim','user_example')), reviewed_on date not null, limitations text not null",
    'article_sources': 'article_id text not null references minery_knowledge.articles(id), source_id text not null references minery_knowledge.sources(id), primary key(article_id,source_id)',
    'terms': 'term text not null, article_id text not null references minery_knowledge.articles(id), primary key(term,article_id)',
    'documents': 'id text primary key, path text not null unique, content text not null, sha256 text not null, status text not null, imported_on date not null',
    'chunks': 'id text primary key, document_id text not null references minery_knowledge.documents(id), ordinal integer not null, body text not null'
}
keys = {'article_sources':['article_id','source_id'], 'terms':['term','article_id']}
def literal(value):
    if value is None: return 'NULL'
    if isinstance(value, int): return str(value)
    return "'" + str(value).replace("'", "''") + "'"

sql = ['-- Solo para el proyecto Supabase de Minery. No ejecutar en otros proyectos.',
       '-- Datos editoriales; no incluye cotizaciones en vivo ni credenciales.',
       'BEGIN;', 'CREATE SCHEMA IF NOT EXISTS minery_knowledge;',
       'REVOKE ALL ON SCHEMA minery_knowledge FROM PUBLIC, anon, authenticated;']
with sqlite3.connect(ROOT/'minery.sqlite3') as db:
    db.row_factory = sqlite3.Row
    for table, definition in tables.items():
        sql.append(f'CREATE TABLE IF NOT EXISTS minery_knowledge.{table} ({definition});')
        sql.append(f'ALTER TABLE minery_knowledge.{table} ENABLE ROW LEVEL SECURITY;')
        for row in db.execute('SELECT * FROM '+table):
            fields = row.keys()
            pk = keys.get(table,['id'])
            update = ', '.join(f'{k}=excluded.{k}' for k in fields if k not in pk)
            conflict = 'DO UPDATE SET '+update if update else 'DO NOTHING'
            sql.append(f"INSERT INTO minery_knowledge.{table} ({','.join(fields)}) VALUES ({','.join(literal(row[k]) for k in fields)}) ON CONFLICT ({','.join(pk)}) {conflict};")
    expected = {t:db.execute('SELECT count(*) FROM '+t).fetchone()[0] for t in tables}
sql += ["CREATE INDEX IF NOT EXISTS minery_articles_search ON minery_knowledge.articles USING gin(to_tsvector('spanish',title||' '||body));",
        "CREATE INDEX IF NOT EXISTS minery_chunks_search ON minery_knowledge.chunks USING gin(to_tsvector('spanish',body));",
        'REVOKE ALL ON ALL TABLES IN SCHEMA minery_knowledge FROM PUBLIC, anon, authenticated;',
        'GRANT USAGE ON SCHEMA minery_knowledge TO service_role;',
        'GRANT SELECT ON ALL TABLES IN SCHEMA minery_knowledge TO service_role;',
        'COMMIT;',
        '-- Verificación: cada tabla debe tener al menos los registros indicados.']
for table,count in expected.items():
    sql.append(f"SELECT '{table}' AS tabla, count(*) AS registros, count(*) >= {count} AS importacion_completa FROM minery_knowledge.{table};")
(ROOT/'import-minery.sql').write_text('\n'.join(sql)+'\n',encoding='utf-8')
print(json.dumps({'file':'knowledge/import-minery.sql','expected':expected}))
