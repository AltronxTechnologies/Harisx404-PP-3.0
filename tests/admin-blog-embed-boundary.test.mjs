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

function route({ user = { email: 'owner@example.com' }, authError = null, rows = [], count = rows.length,
  readError = null, provider = async () => [0.1, 0.2], write = async () => ({ data: [{ id: 'saved' }], error: null }),
  authThrows = false, readThrows = false } = {}) {
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
              order(column, options) { state.order = [column, options]; return this; },
              limit(value) { state.limit = value; return this; },
              then(resolve, reject) {
                if (state.value) {
                  calls.writes.push(state);
                  return Promise.resolve(write(state)).then(resolve, reject);
                }
                calls.read.push(state);
                if (readThrows) return Promise.reject(new Error(privateDetail)).then(resolve, reject);
                return Promise.resolve({ data: readError ? null : rows.slice(0, state.limit), count, error: readError }).then(resolve, reject);
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
  return { post: exports.POST, calls };
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
    const response = await invoke();
    assert.equal(response.status, status);
    assert.equal(calls.admin, 0);
    assert.equal(calls.provider.length, 0);
    assert.doesNotMatch(JSON.stringify(await response.json()), /private-database-provider-detail/);
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
  const rows = Array.from({ length: 12 }, (_, index) => post(`private-row-${index}`, index === 0 ? null : '2026-10-09T00:00:00Z'));
  const { post: invoke, calls } = route({ rows });
  const response = await invoke();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { embedded: 5, remainingEstimate: 7, hasMore: true });
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
  assert.deepEqual(await response.json(), { embedded: 0, remainingEstimate: 0, hasMore: false });
  assert.equal(calls.provider.length, 0);
});

test('provider, write, and stale revision failures are non-200 and never expose row IDs or errors', async () => {
  for (const failure of ['provider', 'write', 'writeThrows', 'stale']) {
    const rows = [post('private-row-1'), post('private-row-2')];
    const { post: invoke, calls } = route({
      rows,
      provider: async (text) => {
        if (failure === 'provider' && text.includes('private-row-1')) throw new Error(privateDetail);
        return [0.1];
      },
      write: async (state) => {
        if (state.filters.some((filter) => filter[1] === 'id' && filter[2] === 'private-row-1')) {
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
      remainingEstimate: 1,
      hasMore: true,
    });
    assert.equal(calls.provider.length, 2);
    assert.equal(calls.writes.length, failure === 'provider' ? 1 : 2);
  }
});
