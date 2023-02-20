import { Snapshot } from "functions/processData"

export const getImageBackground = (snapshot: Snapshot) => {
  if (snapshot.shadeType == "solid" || snapshot.secondaryColor === "#000000") {
    return snapshot.primaryColor
  }

  const rotation = snapshot.shadeType == "vertical-gradient" ? "90deg" : "0deg"
  return `linear-gradient(${rotation}, ${snapshot.primaryColor}, ${snapshot.secondaryColor})`
}
