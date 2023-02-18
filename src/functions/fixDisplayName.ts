export const fixDisplayName = (name: string) => {
  const removeDarkLightSuffix = name.replace(/-[d]$/g, "").replace(/-[l]$/g, "")
  const removeTimeSuffix = removeDarkLightSuffix
    .replace(/-morning$/g, "")
    .replace(/-day$/g, "")
    .replace(/-night$/g, "")
  const removeAltSuffix = removeTimeSuffix.replace(/-alt$/g, "")
  const splitAtDash = removeAltSuffix.replace(/-/g, " ")
  const split = splitAtDash.replace(/([a-zI])([A-Z])/g, l => l[0] + " " + l[1])
  const capitalized = split.replace(/((^| )[a-z])/g, l => l.toUpperCase())
  const withAmpersand = capitalized.replace("&amp;", "&")
  const removeBraces = withAmpersand.replace(/\(.*\)/g, "")
  const removeTrailingNumbers = removeBraces.replace(/ [0-9]$/g, "")

  return removeTrailingNumbers
}
