export type ConfigType = {
  /* The name of the wallpaper */
  "name"?: string
  /* Idk how this is different from the name */
  "_name"?: string
  /* The full filename, contains garbage*/
  "filename"?: string
  /* The full filename for the dark version, contains garbage*/
  "filename-dark"?: string
  /* How to display the wallpaper */
  "options"?: "stretched" | "zoom" | "scaled" | "wallpaper" | "fill"
  /* idk */
  "shade_type"?: "solid" | "horizontal-gradient" | "vertical-gradient"
  /* The primary color */
  "pcolor"?: `#${string}`
  /* The secondary color */
  "scolor"?: `#${string}`
}

export type DataType = {
  commit: string
  date: number
  previousFileHash?: string
  newFileHash?: string
  file?: string
  originalRepoPath: string
  name: string
  message: string
  type: "add" | "delete" | "edit" | "rename"
  configs: ConfigType[]
}
