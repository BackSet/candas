/**
 * Helper reutilizable para descargar archivos desde blobs
 * @param {Blob} blob - El blob a descargar
 * @param {string} filename - Nombre del archivo
 */
export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const link = Object.assign(document.createElement('a'), {
    href: url,
    download: filename
  })
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/**
 * Genera un nombre de archivo con timestamp
 * @param {string} prefix - Prefijo del archivo
 * @param {string} extension - Extensión del archivo
 * @returns {string} Nombre del archivo generado
 */
export const generateFilename = (prefix, extension) => {
  const timestamp = new Date().toISOString().split('T')[0]
  return `${prefix}_${timestamp}.${extension}`
}

