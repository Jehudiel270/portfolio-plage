import { describe, expect, it } from 'vitest'
import { cloudinaryFolder, CLOUDINARY_ROOT_FOLDER } from '../../server/utils/cloudinary'

describe('dossiers Cloudinary', () => {
  it('range les nouveaux projets sous le dossier racine du portfolio', () => {
    expect(CLOUDINARY_ROOT_FOLDER).toBe('portfolio-plage')
    expect(cloudinaryFolder('projects')).toBe('portfolio-plage/projects')
  })
})
