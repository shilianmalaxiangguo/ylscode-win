import { describe, expect, it } from 'vitest'
import releaseWorkflowSource from '../.github/workflows/release.yml?raw'

describe('release workflow contract', () => {
  it('publishes a GitHub release from version tags', () => {
    expect(releaseWorkflowSource).toContain('name: Release')
    expect(releaseWorkflowSource).toContain('tags:')
    expect(releaseWorkflowSource).toContain("- 'v*'")
    expect(releaseWorkflowSource).toContain('contents: write')
    expect(releaseWorkflowSource).toContain('Validate tag matches package version')
    expect(releaseWorkflowSource).toContain('gh release create "$GITHUB_REF_NAME"')
    expect(releaseWorkflowSource).toContain('--generate-notes')
  })
})
