import { Snapshot } from "./processData"

export const getCssFit = (fit: Required<Snapshot>["fillMode"]) => {
  switch (fit) {
    case "zoom":
    case "wallpaper":
    case "scaled":
      return "cover"
    case "fill":
    case "stretched":
      return "fill"
  }
}
