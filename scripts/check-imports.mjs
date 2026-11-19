#!/usr/bin/env node
/**
 * 检查 docs/.vitepress 下的模块引用是否统一用 @/ 别名，禁止相对路径。
 *
 *   node scripts/check-imports.mjs  # 有违规 exit 1
 *
 * 覆盖的写法：import ... from、import 'x'、export ... from、import('x')、require('x')
 * 注释与字符串内容不会误报。
 *
 * 例外：config、*.data.*、*.paths.* 由 Vite 的 loadConfigFromFile（esbuild）单独打包，
 * 拿不到 vite.resolve.alias，只能相对路径。它们及其相对依赖整棵子树都不检查。
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, dirname, extname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
// vite/vitepress 里 "@" 指向 docs/.vitepress，只检查这个目录
const ALIAS_DIR = join(ROOT, 'docs', '.vitepress')
const SCAN_DIR = ALIAS_DIR
const DOCS_DIR = join(ROOT, 'docs')
const ALIAS = '@/'

const EXTENSIONS = new Set(['.ts', '.mts', '.js', '.mjs', '.vue', '.tsx', '.jsx'])
const SKIP_DIRS = new Set(['node_modules', 'cache', 'dist', '.git'])

/** 走 esbuild 打包的入口：.vitepress/config.*、任意 *.data.*、*.paths.* */
const ESBUILD_ENTRY_RE = /\.(?:data|paths)\.[^./]+$/
const CONFIG_RE = /^config\.[^./]+$/

const SPECIFIER_PATTERNS = [
  /\bfrom\s*(['"])([^'"\n]+)\1/g,
  /\bimport\s*(['"])([^'"\n]+)\1/g,
  /\bimport\s*\(\s*(['"])([^'"\n]+)\1\s*\)/g,
  /\brequire\s*\(\s*(['"])([^'"\n]+)\1\s*\)/g,
]

/** 把注释替换成空格（保留换行），这样报错的 offset 和原文件完全对得上。 */
function blankComments(code) {
  const out = code.split('')
  let i = 0
  const n = code.length
  while (i < n) {
    const c = code[i]
    const next = code[i + 1]
    if (c === '/' && next === '/') {
      while (i < n && code[i] !== '\n') out[i++] = ' '
      continue
    }
    if (c === '/' && next === '*') {
      while (i < n && !(code[i] === '*' && code[i + 1] === '/')) {
        if (code[i] !== '\n') out[i] = ' '
        i++
      }
      out[i] = out[i] === '\n' ? '\n' : ' '
      out[i + 1] = ' '
      i += 2
      continue
    }
    if (c === '"' || c === "'" || c === '`') {
      i++
      while (i < n && code[i] !== c) i += code[i] === '\\' ? 2 : 1
      i++
      continue
    }
    i++
  }
  return out.join('')
}

function walk(dir) {
  const files = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue
    const path = join(dir, entry.name)
    if (entry.isDirectory()) files.push(...walk(path))
    else if (EXTENSIONS.has(extname(entry.name))) files.push(path)
  }
  return files
}

function position(code, offset) {
  const before = code.slice(0, offset).split('\n')
  return { line: before.length, column: before.at(-1).length + 1 }
}

/** 相对路径 → 等价的 @/ 写法；目标不在 docs/.vitepress 下就返回 null。 */
function suggestAlias(file, specifier) {
  const target = resolve(dirname(file), specifier)
  if (target !== ALIAS_DIR && !target.startsWith(ALIAS_DIR + sep)) return null
  return ALIAS + relative(ALIAS_DIR, target).split(sep).join('/')
}

/** 把 import 的 specifier 解析成实际文件，裸包名返回 null。 */
function resolveSpecifier(fromFile, specifier) {
  const base = specifier.startsWith(ALIAS)
    ? join(ALIAS_DIR, specifier.slice(ALIAS.length))
    : specifier.startsWith('.')
      ? resolve(dirname(fromFile), specifier)
      : null
  if (base === null) return null
  const candidates = [
    base,
    ...[...EXTENSIONS, '.css'].map((ext) => base + ext),
    ...[...EXTENSIONS, '.css'].map((ext) => join(base, 'index' + ext)),
  ]
  return candidates.find((p) => existsSync(p) && statSync(p).isFile()) ?? null
}

/** 被 esbuild 打包的入口文件（config / *.data.* / *.paths.*）。 */
function esbuildEntries() {
  return walk(DOCS_DIR).filter((file) => {
    const name = basename(file)
    return ESBUILD_ENTRY_RE.test(name) || (CONFIG_RE.test(name) && dirname(file) === ALIAS_DIR)
  })
}

/** 入口 + 它们的相对依赖整棵子树都不能用 @/，收集成集合。 */
function esbuildOnlyFiles() {
  const seen = new Set()
  const queue = esbuildEntries()
  while (queue.length > 0) {
    const file = queue.pop()
    if (seen.has(file)) continue
    seen.add(file)
    const masked = blankComments(readFileSync(file, 'utf8'))
    for (const pattern of SPECIFIER_PATTERNS) {
      for (const match of masked.matchAll(pattern)) {
        const target = resolveSpecifier(file, match[2])
        if (target !== null) queue.push(target)
      }
    }
  }
  return seen
}

const noAliasFiles = esbuildOnlyFiles()
const problems = []

for (const file of walk(SCAN_DIR)) {
  if (noAliasFiles.has(file)) continue
  const code = readFileSync(file, 'utf8')
  const masked = blankComments(code)
  for (const pattern of SPECIFIER_PATTERNS) {
    for (const match of masked.matchAll(pattern)) {
      const specifier = match[2]
      if (!specifier.startsWith('.')) continue
      const { line, column } = position(code, match.index)
      problems.push({
        file: relative(ROOT, file),
        line,
        column,
        specifier,
        suggestion: suggestAlias(file, specifier),
      })
    }
  }
}

if (problems.length === 0) {
  console.log('✓ 没有相对路径引用')
  process.exit(0)
}

for (const p of problems) {
  console.log(`${p.file}:${p.line}:${p.column}  ${p.specifier}${p.suggestion ? `  →  ${p.suggestion}` : '  →  (目标不在 @ 内，需手工处理)'}`)
}
console.log(`\n✗ ${problems.length} 处相对路径引用，请改用 ${ALIAS} 别名`)
process.exit(1)
