"""Almacén local de conocimiento: Python estándar + SQLite FTS5."""
import argparse
import hashlib
import json
import re
import sqlite3
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DB = ROOT / 'minery.sqlite3'

class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__(); self.parts = []; self.skip = 0
    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style'): self.skip += 1
    def handle_endtag(self, tag):
        if tag in ('script', 'style'): self.skip = max(0, self.skip - 1)
    def handle_data(self, text):
        if not self.skip and text.strip(): self.parts.append(text.strip())

def connect():
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    con.execute('PRAGMA foreign_keys=ON')
    return con

def build():
    data = json.loads((ROOT / 'seed.json').read_text(encoding='utf-8'))
    with connect() as con:
        con.executescript('''
        CREATE TABLE IF NOT EXISTS topics(id TEXT PRIMARY KEY, title TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS sources(id TEXT PRIMARY KEY, title TEXT NOT NULL, url TEXT NOT NULL, kind TEXT NOT NULL, consulted_on TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS articles(id TEXT PRIMARY KEY, topic_id TEXT NOT NULL REFERENCES topics(id), title TEXT NOT NULL, body TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('reviewed','commercial_claim','user_example')), reviewed_on TEXT NOT NULL, limitations TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS article_sources(article_id TEXT NOT NULL REFERENCES articles(id), source_id TEXT NOT NULL REFERENCES sources(id), PRIMARY KEY(article_id,source_id));
        CREATE TABLE IF NOT EXISTS terms(term TEXT NOT NULL, article_id TEXT NOT NULL REFERENCES articles(id), PRIMARY KEY(term,article_id));
        CREATE TABLE IF NOT EXISTS documents(id TEXT PRIMARY KEY, path TEXT NOT NULL UNIQUE, content TEXT NOT NULL, sha256 TEXT NOT NULL, status TEXT NOT NULL, imported_on TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS chunks(id TEXT PRIMARY KEY, document_id TEXT NOT NULL REFERENCES documents(id), ordinal INTEGER NOT NULL, body TEXT NOT NULL);
        CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(kind UNINDEXED, item_id UNINDEXED, title, body, terms, tokenize='unicode61 remove_diacritics 2');
        ''')
        for row in data['topics']:
            con.execute('INSERT INTO topics VALUES(:id,:title) ON CONFLICT(id) DO UPDATE SET title=excluded.title', row)
        for row in data['sources']:
            con.execute('INSERT INTO sources VALUES(:id,:title,:url,:kind,:consulted_on) ON CONFLICT(id) DO UPDATE SET title=excluded.title,url=excluded.url,kind=excluded.kind,consulted_on=excluded.consulted_on', row)
        for row in data['articles']:
            con.execute('INSERT INTO articles VALUES(:id,:topic_id,:title,:body,:status,:reviewed_on,:limitations) ON CONFLICT(id) DO UPDATE SET topic_id=excluded.topic_id,title=excluded.title,body=excluded.body,status=excluded.status,reviewed_on=excluded.reviewed_on,limitations=excluded.limitations', row)
            con.execute('DELETE FROM article_sources WHERE article_id=?', (row['id'],))
            con.execute('DELETE FROM terms WHERE article_id=?', (row['id'],))
            con.executemany('INSERT INTO article_sources VALUES(?,?)', [(row['id'], s) for s in row['sources']])
            con.executemany('INSERT INTO terms VALUES(?,?)', [(t, row['id']) for t in row['terms']])
        for relative in data['documents']:
            path = ROOT.parent / relative
            raw = path.read_text(encoding='utf-8')
            if path.suffix == '.html':
                parser = TextExtractor(); parser.feed(raw); text = '\n'.join(parser.parts)
            else: text = raw
            key = hashlib.sha256(relative.encode()).hexdigest()[:16]
            con.execute('INSERT INTO documents VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET content=excluded.content,sha256=excluded.sha256,imported_on=excluded.imported_on', (key, relative, text, hashlib.sha256(raw.encode()).hexdigest(), 'needs_review', data['updated_on']))
            con.execute('DELETE FROM chunks WHERE document_id=?', (key,))
            words = text.split()
            for i, start in enumerate(range(0, len(words), 220)):
                body = ' '.join(words[start:start+260])
                con.execute('INSERT INTO chunks VALUES(?,?,?,?)', (f'{key}:{i}', key, i, body))
        con.execute('DELETE FROM search_index')
        con.execute("INSERT INTO search_index SELECT 'article',a.id,a.title,a.body||' '||a.limitations,coalesce((SELECT group_concat(term,' ') FROM terms WHERE article_id=a.id),'') FROM articles a")
        con.execute("INSERT INTO search_index SELECT 'document',c.id,d.path,c.body,'' FROM chunks c JOIN documents d ON d.id=c.document_id")
    return verify()

def search(query):
    words = re.findall(r'[^\W_]+', query, flags=re.UNICODE)
    if not words: return []
    match = ' OR '.join('"'+w+'"' for w in words)
    with connect() as con:
        rows = con.execute('SELECT kind,item_id,title,snippet(search_index,3,\'\',\'\',\' … \',32) AS excerpt FROM search_index WHERE search_index MATCH ? ORDER BY bm25(search_index) LIMIT 8', (match,)).fetchall()
        result = []
        for row in rows:
            item = dict(row)
            if row['kind'] == 'article':
                item.update(dict(con.execute('SELECT status,reviewed_on,limitations FROM articles WHERE id=?',(row['item_id'],)).fetchone()))
                item['sources'] = [dict(x) for x in con.execute('SELECT s.title,s.url FROM sources s JOIN article_sources x ON x.source_id=s.id WHERE x.article_id=?',(row['item_id'],))]
            else: item['status'] = 'needs_review'
            result.append(item)
        return result

def verify():
    with connect() as con:
        assert con.execute('PRAGMA integrity_check').fetchone()[0] == 'ok'
        assert not con.execute('PRAGMA foreign_key_check').fetchall()
        assert not con.execute("SELECT a.id FROM articles a WHERE status<>'user_example' AND NOT EXISTS(SELECT 1 FROM article_sources s WHERE s.article_id=a.id)").fetchall()
        counts = {t: con.execute('SELECT count(*) FROM '+t).fetchone()[0] for t in ('topics','articles','sources','terms','documents','chunks')}
        assert counts['articles'] >= 20
    assert any(x['kind']=='article' for x in search('golfi'))
    assert any('mercurio' in x['title'].lower() for x in search('azogue'))
    return {'integrity':'ok', **counts}

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('command', choices=['build','search','verify'])
    parser.add_argument('query', nargs='?', default='')
    args = parser.parse_args()
    result = build() if args.command=='build' else verify() if args.command=='verify' else search(args.query)
    print(json.dumps(result, ensure_ascii=False, indent=2))
