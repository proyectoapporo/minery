-- Ejecutar solo en el proyecto Supabase de Minery, después de import-minery.sql.
BEGIN;
CREATE TABLE IF NOT EXISTS minery_knowledge.assistant_limits (
  bucket text NOT NULL,
  period timestamptz NOT NULL,
  requests integer NOT NULL DEFAULT 0 CHECK (requests >= 0),
  PRIMARY KEY(bucket, period)
);
ALTER TABLE minery_knowledge.assistant_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON minery_knowledge.assistant_limits FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON minery_knowledge.assistant_limits TO service_role;

CREATE OR REPLACE FUNCTION public.minery_assistant_allow(client_hash text)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  day_start timestamptz := date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
  hour_start timestamptz := date_trunc('hour', now());
  global_count integer;
  client_count integer;
BEGIN
  IF client_hash IS NULL OR client_hash !~ '^[a-f0-9]{64}$' THEN RETURN false; END IF;
  INSERT INTO minery_knowledge.assistant_limits(bucket,period) VALUES('global',day_start) ON CONFLICT DO NOTHING;
  SELECT requests INTO global_count FROM minery_knowledge.assistant_limits WHERE bucket='global' AND period=day_start FOR UPDATE;
  IF global_count >= 100 THEN RETURN false; END IF;
  INSERT INTO minery_knowledge.assistant_limits(bucket,period) VALUES(client_hash,hour_start) ON CONFLICT DO NOTHING;
  SELECT requests INTO client_count FROM minery_knowledge.assistant_limits WHERE bucket=client_hash AND period=hour_start FOR UPDATE;
  IF client_count >= 20 THEN RETURN false; END IF;
  UPDATE minery_knowledge.assistant_limits SET requests=requests+1 WHERE bucket='global' AND period=day_start;
  UPDATE minery_knowledge.assistant_limits SET requests=requests+1 WHERE bucket=client_hash AND period=hour_start;
  DELETE FROM minery_knowledge.assistant_limits WHERE period < now()-interval '2 days';
  RETURN true;
END; $$;
REVOKE EXECUTE ON FUNCTION public.minery_assistant_allow(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.minery_assistant_allow(text) TO service_role;

CREATE OR REPLACE FUNCTION public.minery_assistant_search(question text)
RETURNS TABLE(id text,title text,body text,status text,reviewed_on date,limitations text,sources jsonb)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  WITH q AS (
    SELECT websearch_to_tsquery('spanish',regexp_replace(left(question,2000),'\s+',' OR ','g')) AS query
  ), ranked AS (
    SELECT a.*,ts_rank_cd(
      setweight(to_tsvector('spanish',a.title),'A') ||
      setweight(to_tsvector('spanish',coalesce((SELECT string_agg(t.term,' ') FROM minery_knowledge.terms t WHERE t.article_id=a.id),'')),'A') ||
      setweight(to_tsvector('spanish',a.body),'B'),q.query) AS rank
    FROM minery_knowledge.articles a CROSS JOIN q
    WHERE a.status IN ('reviewed','commercial_claim')
    AND EXISTS(SELECT 1 FROM minery_knowledge.article_sources x WHERE x.article_id=a.id)
  )
  SELECT r.id,r.title,r.body,r.status,r.reviewed_on,r.limitations,
    (SELECT jsonb_agg(jsonb_build_object('title',s.title,'url',s.url,'kind',s.kind))
     FROM minery_knowledge.sources s JOIN minery_knowledge.article_sources x ON x.source_id=s.id WHERE x.article_id=r.id)
  FROM ranked r WHERE r.rank > 0 ORDER BY r.rank DESC,r.id LIMIT 6;
$$;
REVOKE EXECUTE ON FUNCTION public.minery_assistant_search(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.minery_assistant_search(text) TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;

-- Comprobar contenido y permisos desde SQL Editor:
SELECT id,title,status FROM public.minery_assistant_search('golfi');
SELECT has_function_privilege('anon','public.minery_assistant_search(text)','EXECUTE') AS anon_debe_ser_false,
       has_function_privilege('authenticated','public.minery_assistant_search(text)','EXECUTE') AS usuario_debe_ser_false,
       has_function_privilege('service_role','public.minery_assistant_search(text)','EXECUTE') AS servidor_debe_ser_true;
