import { createHash } from "node:crypto"
import { readdir } from "node:fs/promises"
import path from "node:path"
import type { SnapshotManifest } from "./types"

const snapshotFiles = ["brand.json", "app-icon.svg", "app-icon.png", "wordmark.svg", "tui.json"] as const
const permittedRootFiles = new Set(["snapshot-manifest.json", "build.ts", ...snapshotFiles])

export async function verifySnapshot(root: string): Promise<SnapshotManifest> {
  const manifest = parseManifest(await Bun.file(path.join(root, "snapshot-manifest.json")).text())
  const names = Object.keys(manifest.files).sort()
  const expected = [...snapshotFiles].sort()
  if (names.length !== expected.length || names.some((name, index) => name !== expected[index])) {
    throw new Error("snapshot-manifest.json 包含缺失或多余文件")
  }

  const entries = await readdir(root, { withFileTypes: true })
  const extraFiles = entries.filter((entry) => entry.isFile() && !permittedRootFiles.has(entry.name))
  if (extraFiles.length) throw new Error(`快照包含多余文件: ${extraFiles.map((entry) => entry.name).join(", ")}`)

  await Promise.all(
    snapshotFiles.map(async (file) => {
      const source = Bun.file(path.join(root, file))
      if (!(await source.exists())) throw new Error(`快照缺失文件: ${file}`)
      const content = await source.arrayBuffer()
      if (content.byteLength === 0) throw new Error(`快照缺失文件: ${file}`)
      const actual = createHash("sha256").update(new Uint8Array(content)).digest("hex")
      if (actual !== manifest.files[file]) throw new Error(`快照文件 ${file} 的 SHA-256 不匹配`)
    }),
  )
  return manifest
}

function parseManifest(content: string): SnapshotManifest {
  const parsed: unknown = JSON.parse(content)
  if (!parsed || typeof parsed !== "object" || !("frameworkVersion" in parsed) || !("files" in parsed)) {
    throw new Error("snapshot-manifest.json 无效")
  }
  if (
    parsed.frameworkVersion !== 1 ||
    !parsed.files ||
    typeof parsed.files !== "object" ||
    Array.isArray(parsed.files)
  ) {
    throw new Error("snapshot-manifest.json 无效")
  }
  for (const [file, hash] of Object.entries(parsed.files)) {
    if (
      !snapshotFiles.includes(file as (typeof snapshotFiles)[number]) ||
      typeof hash !== "string" ||
      !/^[a-f0-9]{64}$/.test(hash)
    ) {
      throw new Error("snapshot-manifest.json 无效")
    }
  }
  return parsed as SnapshotManifest
}
