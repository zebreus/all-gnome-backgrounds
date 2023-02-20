export const getImageUrl = (filename: string, dontAddPrefix?: boolean) =>
  `${dontAddPrefix ? "" : process.env["NEXT_PUBLIC_GITHUB_PAGES_BASE"] || ""}/images/${filename}`
export const getThumbnailUrl = (filename: string, dontAddPrefix?: boolean) =>
  `${dontAddPrefix ? "" : process.env["NEXT_PUBLIC_GITHUB_PAGES_BASE"] || ""}/thumbs500/${filename}`
export const getSmallThumbnailUrl = (filename: string, dontAddPrefix?: boolean) =>
  `${dontAddPrefix ? "" : process.env["NEXT_PUBLIC_GITHUB_PAGES_BASE"] || ""}/thumbs250/${filename}`
