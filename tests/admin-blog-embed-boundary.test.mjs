import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const source = readFileSync(new URL('../app/api/admin/blogs/embed/route.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const privateDetail = 'private-database-provider-detail';

function route({ user = { email: 'owner@example.com' }, authError = null, rows = [], count,
  readError = null, provider = async () => [0.1, 0.2], write = async () => ({ data: [{ id: 'saved' }], error: null }),
  authThrows = false, readThrows = false, persistWrites = false } = {}) {
  const calls = { admin: 0, read: [], writes: [], provider: [], waits: [] };
  const exports = {};
  runInNewContext(compiled, {
    exports,
    require(name) {
      if (name === 'next/server') return { NextResponse: { json: (body, options) => Response.json(body, options) } };
      if (name === '@/app/lib/gemini') return { generateEmbedding: async (text) => {
        calls.provider.push(text);
        return provider(text);
      } };
      if (name === '@/app/lib/supabase/server') return {
        __esModule: true,
        default: async () => ({ auth: { getUser: async () => {
          if (authThrows) throw new Error(privateDetail);
          return { data: { user }, error: authError };
        } } }),
        createSupabaseAdminClient: async () => {
          calls.admin++;
          return { from(table) {
            assert.equal(table, 'blog_posts');
            const state = { filters: [] };
            const query = {
              select(columns, options) {
                state.columns = columns;
                state.options = options;
                return this;
              },
              update(value) { state.value = value; return this; },
              is(column, value) { state.filters.push(['is', column, value]); return this; },
              eq(column, value) { state.filters.push(['eq', column, value]); return this; },
              gt(column, value) { state.filters.push(['gt', column, value]); return this; },
              order(column, options) { state.order = [column, options]; return this; },
              limit(value) { state.limit = value; return this; },
              then(resolve, reject) {
                if (state.value) {
                  calls.writes.push(state);
                  return Promise.resolve(write(state)).then((result) => {
                    if (persistWrites && !result.error && result.data?.length) {
                      const id = state.filters.find((filter) => filter[1] === 'id')?.[2];
                      rows.find((row) => row.id === id).content_embedding = state.value.content_embedding;
                    }
                    resolve(result);
                  }, reject);
                }
                calls.read.push(state);
                if (readThrows) return Promise.reject(new Error(privateDetail)).then(resolve, reject);
                const after = state.filters.find((filter) => filter[0] === 'gt' && filter[1] === 'id')?.[2];
                const matching = rows.filter((row) => !row.content_embedding && (!after || row.id > after));
                return Promise.resolve({ data: readError ? null : matching.slice(0, state.limit),
                  count: count === undefined ? matching.length : count, error: readError }).then(resolve, reject);
              },
            };
            return query;
          } };
        },
      };
      return require(name);
    },
    process: { env: { ADMIN_EMAIL: 'owner@example.com' } },
    setTimeout(resolve, delay) { calls.waits.push(delay); resolve(); },
    Response,
  });
  return { post: (body) => exports.POST(new Request('http://localhost/api/admin/blogs/embed', {
    method: 'POST', ...(body === undefined ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }),
  })), calls };
}

function id(index) {
  return `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`;
}

function post(id, updated_at = '2026-10-09T00:00:00Z') {
  return { id, title: `Title ${id}`, summary: '', content: 'Body', updated_at };
}

test('owner gate precedes privileged client and provider work', async () => {
  for (const [options, status] of [
    [{ user: null }, 401],
    [{ user: { email: 'other@example.com' } }, 403],
    [{ authError: { message: privateDetail } }, 401],
    [{ authThrows: true }, 500],
  ]) {
    const { post: invoke, calls } = route(options);
    const response = await invoke('{');
    assert.equal(response.status, status);
    assert.equal(calls.admin, 0);
    assert.equal(calls.provider.length, 0);
    assert.doesNotMatch(JSON.stringify(await response.json()), /private-database-provider-detail/);
  }
});

test('malformed cursor is rejected before privileged reads or provider calls', async () => {
  for (const body of ['{', null, [], { cursor: null }, { cursor: 123 }, { cursor: 'not-a-uuid' },
    { cursor: id(1), typo: true }]) {
    const { post: invoke, calls } = route();
    const response = await invoke(body);
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: 'Invalid embedding cursor.' });
    assert.equal(calls.admin, 0);
    assert.equal(calls.read.length, 0);
    assert.equal(calls.provider.length, 0);
  }
});

test('read failure or missing count fails closed without leaking diagnostics', async () => {
  for (const options of [
    { readError: { message: privateDetail } },
    { count: null },
    { readThrows: true },
  ]) {
    const { post: invoke, calls } = route(options);
    const response = await invoke();
    assert.equal(response.status, 500);
    assert.equal(calls.provider.length, 0);
    assert.equal(calls.writes.length, 0);
    assert.doesNotMatch(JSON.stringify(await response.json()), /private-database-provider-detail/);
  }
});

test('one invocation reads and embeds at most five, reports remaining and guards every write', async () => {
  const rows = Array.from({ length: 12 }, (_, index) => post(id(index), index === 0 ? null : '2026-10-09T00:00:00Z'));
  const { post: invoke, calls } = route({ rows });
  const response = await invoke();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { embedded: 5, failed: 0, remainingAhead: 7, hasMore: true, nextCursor: id(4) });
  assert.equal(calls.read.length, 1);
  assert.equal(calls.read[0].limit, 5);
  assert.equal(calls.read[0].options.count, 'exact');
  assert.equal(calls.read[0].order[0], 'id');
  assert.equal(calls.read[0].order[1].ascending, true);
  assert.match(calls.read[0].columns, /updated_at/);
  assert.deepEqual(calls.read[0].filters, [['is', 'content_embedding', null]]);
  assert.equal(calls.provider.length, 5);
  assert.equal(calls.writes.length, 5);
  assert.deepEqual(calls.writes[0].filters, [
    ['eq', 'id', rows[0].id], ['is', 'content_embedding', null], ['is', 'updated_at', null],
  ]);
  assert.deepEqual(calls.writes[1].filters, [
    ['eq', 'id', rows[1].id], ['is', 'content_embedding', null], ['eq', 'updated_at', rows[1].updated_at],
  ]);
  assert.ok(calls.writes.every((entry) => entry.columns === 'id'));
  assert.deepEqual(calls.waits, [500, 500, 500, 500]);
});

test('no remaining work reports completion without provider calls', async () => {
  const { post: invoke, calls } = route();
  const response = await invoke();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { embedded: 0, failed: 0, remainingAhead: 0, hasMore: false, nextCursor: null });
  assert.equal(calls.provider.length, 0);
});

test('provider, write, and stale revision failures are non-200 and never expose row IDs or errors', async () => {
  for (const failure of ['provider', 'write', 'writeThrows', 'stale']) {
    const rows = [post(id(1)), post(id(2))];
    const { post: invoke, calls } = route({
      rows,
      provider: async (text) => {
        if (failure === 'provider' && text.includes(id(1))) throw new Error(privateDetail);
        return [0.1];
      },
      write: async (state) => {
        if (state.filters.some((filter) => filter[1] === 'id' && filter[2] === id(1))) {
          if (failure === 'write') return { data: null, error: { message: privateDetail } };
          if (failure === 'writeThrows') throw new Error(privateDetail);
          if (failure === 'stale') return { data: [], error: null };
        }
        return { data: [{ id: 'saved' }], error: null };
      },
    });
    const response = await invoke();
    assert.equal(response.status, 500, failure);
    assert.deepEqual(await response.json(), {
      error: 'Some embeddings could not be saved. Please try again.',
      embedded: 1,
      failed: 1,
      remainingAhead: 0,
      hasMore: false,
      nextCursor: id(2),
    });
    assert.equal(calls.provider.length, 2);
    assert.equal(calls.writes.length, failure === 'provider' ? 1 : 2);
  }
});

test('cursor advances past permanently failing first five and a fresh pass retries them', async () => {
  const rows = Array.from({ length: 8 }, (_, index) => post(id(index)));
  const { post: invoke, calls } = route({ rows, persistWrites: true,
    provider: async (text) => {
      if (Number(text.match(/8000-(\d{12})/)[1]) < 5) throw new Error(privateDetail);
      return [0.1];
    },
  });
  const first = await invoke();
  assert.equal(first.status, 500);
  assert.deepEqual(await first.json(), {
    error: 'Some embeddings could not be saved. Please try again.',
    embedded: 0, failed: 5, remainingAhead: 3, hasMore: true, nextCursor: id(4),
  });
  const second = await invoke({ cursor: id(4) });
  assert.equal(second.status, 200);
  assert.deepEqual(await second.json(), {
    embedded: 3, failed: 0, remainingAhead: 0, hasMore: false, nextCursor: id(7),
  });
  assert.deepEqual(calls.read[1].filters, [['is', 'content_embedding', null], ['gt', 'id', id(4)]]);
  const restarted = await invoke();
  assert.equal(restarted.status, 500);
  assert.deepEqual(await restarted.json(), {
    error: 'Some embeddings could not be saved. Please try again.',
    embedded: 0, failed: 5, remainingAhead: 0, hasMore: false, nextCursor: id(4),
  });
  assert.equal(calls.read[2].filters.length, 1);
  assert.equal(calls.provider.length, 13);
  assert.equal(calls.writes.length, 3);
});
