export const getImageUrl = (filename: string) =>
  `${process.env["NEXT_PUBLIC_GITHUB_PAGES_BASE"] || ""}/images/${filename}`
export const getThumbnailUrl = (filename: string) =>
  `${process.env["NEXT_PUBLIC_GITHUB_PAGES_BASE"] || ""}/thumbs500/${filename}`
