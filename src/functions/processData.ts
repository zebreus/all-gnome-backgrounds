import { DataType } from "dataType"
import { fixDisplayName } from "functions/fixDisplayName"
import { hashes } from "hashes"

export type Snapshot = {
  date: Date
  /** Formatted displayname */
  name?: string
  /** Unprocessed name from config or file */
  originalName?: string
  url: string
  message: string
  originalFile: string
  fillMode?: "stretched" | "zoom" | "scaled" | "wallpaper" | "fill"
  commit: string
  type: "add" | "edit" | "rename"
  dark?: boolean
  alt?: boolean
  morning?: boolean
  night?: boolean
  day?: boolean
  primaryColor?: string
  secondaryColor?: string
  shadeType?: "solid" | "horizontal-gradient" | "vertical-gradient"
  hash: string
}

export type WallpaperWithHistory = {
  created: Date
  deleted: Date
  current?: boolean
  deleteMessage: string
  snapshots: Required<Snapshot>[]
  lastName?: string
}

export const getSnapshotType = (snapshot: Snapshot): "light" | "dark" | "alt" => {
  if (snapshot.dark || snapshot.night) {
    return "dark"
  }
  if (snapshot.alt || snapshot.morning) {
    return "alt"
  }
  return "light"
}

/** Replace the configs array with an optional config field */
type ConfigFixedDataType = Omit<DataType, "configs"> & { config?: Required<DataType["configs"]>[0] }

const getHistory = (current: ConfigFixedDataType, data: ConfigFixedDataType[]): ConfigFixedDataType[] => {
  if (current.previousFileHash === undefined) {
    return []
  }
  const history = data
    .filter(item => item.newFileHash === current.previousFileHash && item.date < current.date)
    .sort((a, b) => (a.date < b.date ? -1 : a.date === b.date ? 0 : 1))
    .reverse()

  const nonRenameAndRevertHistory = history
    .filter(item => item.type !== "rename")
    .filter(item => !item.message.includes("revert"))

  const preferredPredecessors =
    current.type === "rename" ? history : history.filter(item => item.originalRepoPath === current.originalRepoPath)
  const preferredPredecessor = preferredPredecessors[0]
  const hasExactlyOnePreferredPredecessor = preferredPredecessors.length === 1

  if (!hasExactlyOnePreferredPredecessor && nonRenameAndRevertHistory.length > 1) {
    console.error("More than one predecessor found for", current)
    //throw new Error("Too much history found")
  }
  const predecessor = preferredPredecessor || history[0]
  if (!predecessor) {
    console.error("No history found for", current)
    throw new Error("No history found")
  }

  return [predecessor, ...getHistory(predecessor, data)]
}

const toSnapshot = (item: ConfigFixedDataType): Snapshot => {
  if (item.newFileHash === undefined) {
    throw new Error("Cannot convert commit that did not create a file to snapshot")
  }
  if (item.type === "delete") {
    throw new Error("Cannot convert commit that did not create a file to snapshot")
  }

  const dark =
    item.config?.["filename-dark"]?.split("/").pop() === item.originalRepoPath.split("/").pop() ||
    item.name.endsWith("-d") ||
    undefined
  const day = item.name.endsWith("-day") || undefined
  const morning = item.name.endsWith("-morning") || undefined
  const night = item.name.endsWith("-night") || undefined
  const alt = item.name.endsWith("-alt") || undefined

  return {
    date: new Date(item.date * 1000),
    originalName: assertReasonableName(item.config?.name) || (assertReasonableName(item.config?._name) as string),
    url: `${item.name}-${item.newFileHash}.webp`,
    message: item.message,
    originalFile: item.originalRepoPath,
    commit: item.commit,
    type: item.type,
    fillMode: item.config?.options as Required<Snapshot>["fillMode"],
    shadeType: item.config?.shade_type as Required<Snapshot>["shadeType"],
    primaryColor: item.config?.pcolor as string,
    secondaryColor: item.config?.scolor as string,
    dark: dark as boolean,
    day: day as boolean,
    morning: morning as boolean,
    night: night as boolean,
    alt: alt as boolean,
    hash: item.newFileHash,
  }
}

const fixMoves = (snapshots: ConfigFixedDataType[]): ConfigFixedDataType[] => {
  const batchedIntoCommits = snapshots.reduce((batched, current) => {
    const commitPool = batched.find(batch => batch[0]?.commit === current.commit)
    if (commitPool) {
      commitPool.push(current)
      return batched
    }
    batched.push([current])
    return batched
  }, [] as ConfigFixedDataType[][])

  const batchedAndFixed = batchedIntoCommits.map(snapshots => {
    snapshots.sort((a, b) => (a.type > b.type ? -1 : a.type === b.type ? 0 : 1))
    return snapshots.reduce((fixedSnapshots, current) => {
      if (current.type !== "add") {
        fixedSnapshots.push(current)
        return fixedSnapshots
      }
      const matchingDelete = fixedSnapshots.findIndex(
        snapshot =>
          snapshot.previousFileHash === current.newFileHash &&
          snapshot.commit === current.commit &&
          snapshot.type === "delete"
      )
      if (matchingDelete === -1) {
        fixedSnapshots.push(current)
        return fixedSnapshots
      }
      current.type = "rename"
      current.previousFileHash = current.newFileHash as string
      fixedSnapshots[matchingDelete] = current
      return fixedSnapshots
    }, [] as ConfigFixedDataType[])
  })

  const flattenedBackOut = batchedAndFixed.flat()
  return flattenedBackOut
}
/** Remove commits that edit the file but don't change the hash. Usually this happens if the mode is changed */
const fixModeChanges = (snapshots: ConfigFixedDataType[]): ConfigFixedDataType[] => {
  return snapshots.reduce((fixedSnapshots, current) => {
    if (current.type !== "edit") {
      fixedSnapshots.push(current)
      return fixedSnapshots
    }
    if (current.previousFileHash !== current.newFileHash) {
      fixedSnapshots.push(current)
      return fixedSnapshots
    }
    return fixedSnapshots
  }, [] as ConfigFixedDataType[])
}

/** Remove duplicate changes */
const fixDuplicateChanges = (snapshots: ConfigFixedDataType[]): ConfigFixedDataType[] => {
  return snapshots.reduce((fixedSnapshots, current) => {
    const duplicate = fixedSnapshots.find(
      (possibleDuplicate: ConfigFixedDataType) =>
        current.date === possibleDuplicate.date &&
        current.newFileHash === possibleDuplicate.newFileHash &&
        current.previousFileHash === possibleDuplicate.previousFileHash &&
        current.message === possibleDuplicate.message
    )
    if (!duplicate) {
      fixedSnapshots.push(current)
      return fixedSnapshots
    }
    return fixedSnapshots
  }, [] as ConfigFixedDataType[])
}

/** Remove duplicate changes */
const fixDuplicateConfigs = (snapshots: DataType[]): ConfigFixedDataType[] => {
  return snapshots.map(snapshot => {
    const { configs, ...snapshotWithoutConfigs } = snapshot
    if (configs.length == 0) {
      return snapshotWithoutConfigs
    }
    if (configs.length == 1) {
      return {
        ...snapshotWithoutConfigs,
        ...(configs[0] ? { config: configs[0] } : {}),
      }
    }
    const chosenConfigs = snapshot.configs.filter(
      config => config.name === snapshot.name || config._name === snapshot.name
    )
    if (chosenConfigs.length > 1) {
      throw new Error("More than one possibly correct config found for " + snapshot.name)
    }
    const chosenConfig = chosenConfigs[0]
    return {
      ...snapshot,
      ...(chosenConfig ? { config: chosenConfig } : {}),
    }
  })
}

/** Check if a name is reasonable, as sometimes numbers were used as names */
const assertReasonableName = (name: string | undefined): string | undefined => {
  if (!name) {
    return undefined
  }
  if (name.length < 3) {
    return undefined
  }
  return name
}

/** Sometimes only some snapshots have metadata like the human readable name. This adds the missing data to snapshots. */
// Last name is used to override the name of the first snapshot. This is used to fix oceans, as the name is wrong until its deletion.
const fillMissingInfo = (snapshots: Snapshot[], lastName?: string): Required<Snapshot>[] => {
  if (!snapshots[0]) {
    throw new Error("No snapshots found")
  }
  snapshots[0].originalName = lastName || (snapshots[0]?.originalName as string)
  let originalName: string =
    snapshots.find(snapshot => snapshot.originalName)?.originalName ||
    assertReasonableName(snapshots[0]?.originalFile.split("/")?.pop()?.split(".")?.[0]) ||
    (() => {
      throw new Error("No originalName found")
    })()

  let fillMode: Required<Snapshot>["fillMode"] = snapshots.find(snapshot => snapshot.fillMode)?.fillMode || "zoom"
  let primaryColor: string = snapshots.find(snapshot => snapshot.primaryColor)?.primaryColor || "#3465a4"
  let secondaryColor: string = snapshots.find(snapshot => snapshot.secondaryColor)?.secondaryColor || "#000000"
  let shadeType: Required<Snapshot>["shadeType"] = snapshots.find(snapshot => snapshot.shadeType)?.shadeType || "solid"

  const dark = !!snapshots.find(snapshot => snapshot.dark)
  const day = !!snapshots.find(snapshot => snapshot.day)
  const morning = !!snapshots.find(snapshot => snapshot.morning)
  const night = !!snapshots.find(snapshot => snapshot.night)
  const alt = !!snapshots.find(snapshot => snapshot.alt)
  const moreThanOne =
    [...[dark, day, morning, alt].filter(Boolean)].length > 1 ||
    [...[night, day, morning, alt].filter(Boolean)].length > 1
  if (moreThanOne) {
    throw new Error("Wallpaper seems to be more than one variation")
  }
  const snapshotsFixedName = snapshots.map(snapshot => {
    originalName = snapshot.originalName || originalName
    fillMode = snapshot.fillMode || fillMode
    shadeType = snapshot.shadeType || shadeType
    primaryColor = snapshot.primaryColor || primaryColor
    secondaryColor = snapshot.secondaryColor || secondaryColor
    return {
      ...snapshot,
      originalName,
      name: fixDisplayName(originalName),
      fillMode,
      shadeType,
      dark,
      day,
      morning,
      night,
      alt,
      primaryColor,
      secondaryColor,
    }
  })

  return snapshotsFixedName
}

export const processData = (data: DataType[]): WallpaperWithHistory[] => {
  const fixedData = fixModeChanges(fixMoves(fixDuplicateChanges(fixDuplicateConfigs(data))))
  const deleted = fixedData.filter(item => item.type === "delete")
  const wallpapers = deleted.map(lastChange => {
    const deletedDate = new Date(lastChange.date * 1000)
    const deleteMessage = lastChange.message
    const lastName =
      assertReasonableName(lastChange.config?.name) || (assertReasonableName(lastChange.config?._name) as string)

    const history = getHistory(lastChange, fixedData)
    const snapshots = fillMissingInfo(history.map(toSnapshot), lastName)
    const createdDate = snapshots[snapshots.length - 1]?.date
    if (!createdDate) {
      throw new Error("No created date found")
    }

    const result: WallpaperWithHistory = {
      created: createdDate,
      deleted: deletedDate,
      snapshots,
      deleteMessage,
      lastName,
    }
    return result
  })
  const mergedWallpapers = removeDuplicateSnapshots(
    sortWallpapersByDate(mergeWallpapersByDisplayName(mergeWallpapersByFilename(removeNonWallpapers(wallpapers))))
  )
  return markCurrentWallpapers(mergedWallpapers)
}

const sortSnapshotsByDate = <T extends Snapshot>(snapshots: T[]): T[] => {
  return [...snapshots].sort((a, b) => {
    return b.date.getTime() - a.date.getTime()
  })
}

const sortWallpapersByDate = (wallpapers: WallpaperWithHistory[]): WallpaperWithHistory[] => {
  return [...wallpapers.map(wallpaper => ({ ...wallpaper, snapshots: sortSnapshotsByDate(wallpaper.snapshots) }))].sort(
    (a, b) => {
      const timediff = b.deleted.getTime() - a.deleted.getTime()
      if (timediff !== 0) {
        return timediff
      }
      const snapshotA = a.snapshots[0]
      const snapshotB = b.snapshots[0]
      if (!snapshotA || !snapshotB) {
        return 0
      }
      const namediff =
        snapshotA.name.toLowerCase() > snapshotB.name.toLowerCase()
          ? 0.5
          : snapshotA.name.toLowerCase() == snapshotB.name.toLowerCase()
          ? 0
          : -0.5
      if (namediff !== 0) {
        return namediff
      }

      const typeOrder = ["light", "dark", "alt"] as const

      const typeA = typeOrder.indexOf(getSnapshotType(snapshotA))
      const typeB = typeOrder.indexOf(getSnapshotType(snapshotB))

      const typediff = typeA - typeB

      return typediff
    }
  )
}

const removeNonWallpapers = (wallpapers: WallpaperWithHistory[]): WallpaperWithHistory[] => {
  return wallpapers.filter(
    wallpaper =>
      !wallpaper.snapshots.find(snapshot => {
        const blacklist = ["defaults", "badscaling"]
        return blacklist.includes(snapshot.name.toLowerCase())
      })
  )
}

const mergeWallpapers = (
  wallpapers: WallpaperWithHistory[],
  checker: (a: WallpaperWithHistory, b: WallpaperWithHistory) => boolean
): WallpaperWithHistory[] => {
  return sortWallpapersByDate(wallpapers).reduce((merged, wallpaper) => {
    const mergeIntos = merged.filter(futureWallpaper => checker(futureWallpaper, wallpaper))
    for (const mergeInto of mergeIntos) {
      const foundDeletedSignificantlyEarlierThanCurrentCreated =
        mergeInto.created.getTime() - wallpaper.deleted.getTime() > 1000 * 60 * 60 * 24 * 30 * 6
      if (foundDeletedSignificantlyEarlierThanCurrentCreated) {
        continue
      }

      mergeInto.snapshots = sortSnapshotsByDate([...mergeInto.snapshots, ...wallpaper.snapshots])
      mergeInto.created = mergeInto.created < wallpaper.created ? mergeInto.created : wallpaper.created
      mergeInto.deleted = mergeInto.deleted > wallpaper.deleted ? mergeInto.deleted : wallpaper.deleted
      mergeInto.deleteMessage = mergeInto.deleteMessage || wallpaper.deleteMessage
      return merged
    }
    merged.push(wallpaper)
    return merged
  }, [] as WallpaperWithHistory[])
}

const mergeWallpapersByDisplayName = (wallpapers: WallpaperWithHistory[]): WallpaperWithHistory[] => {
  const checker = (a: WallpaperWithHistory, b: WallpaperWithHistory) => {
    const snapshotA = a.snapshots[0]
    const snapshotB = b.snapshots[0]
    if (!snapshotA || !snapshotB) {
      throw new Error("No snapshots found")
    }
    const typesMatch = getSnapshotType(snapshotA) === getSnapshotType(snapshotB)
    if (!typesMatch) {
      return false
    }

    // Compare lowercase names. The -l suffix is removed, because light wallpapers were the default
    const displayNamesA = [snapshotA]
      .map(snapshot => snapshot.name.toLowerCase().replace(/-l$/, ""))
      .filter((name, index, self) => self.indexOf(name) === index)
    const displayNamesB = [snapshotB]
      .map(snapshot => snapshot.name.toLowerCase().replace(/-l$/, ""))
      .filter((name, index, self) => self.indexOf(name) === index)
    const displayNamesMatch = displayNamesA.some(nameA => displayNamesB.includes(nameA))

    if (!displayNamesMatch) {
      return false
    }
    return true
  }

  return mergeWallpapers(wallpapers, checker)
}

// Mostly copied from fixDisplayName. Could be nicer with half the transformations
export const normalizeFilename = (originalRepoPath: string) => {
  const name = originalRepoPath.split("/").at(-1)?.split(".")[0]?.toLowerCase()
  if (!name) throw new Error("No name found")
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

const mergeWallpapersByFilename = (wallpapers: WallpaperWithHistory[]): WallpaperWithHistory[] => {
  const checker = (a: WallpaperWithHistory, b: WallpaperWithHistory) => {
    const snapshotA = a.snapshots[0]
    const snapshotB = b.snapshots[0]
    if (!snapshotA || !snapshotB) {
      throw new Error("No snapshots found")
    }
    const typesMatch = getSnapshotType(snapshotA) === getSnapshotType(snapshotB)
    if (!typesMatch) {
      return false
    }

    // Compare lowercase names. The -l suffix is removed, because light wallpapers were the default
    const fileNamesA = a.snapshots
      .map(snapshot => normalizeFilename(snapshot.originalFile))
      .flatMap(self => (self ? [self] : []))
      .filter((name, index, self) => self.indexOf(name) === index)
    const fileNamesB = b.snapshots
      .map(snapshot => normalizeFilename(snapshot.originalFile))
      .flatMap(self => (self ? [self] : []))
      .filter((name, index, self) => self.indexOf(name) === index)
    const fileNamesMatch = fileNamesA.some(nameA => fileNamesB.includes(nameA))

    if (!fileNamesMatch) {
      return false
    }
    return true
  }

  return mergeWallpapers(wallpapers, checker)
}

const markCurrentWallpapers = (wallpapers: WallpaperWithHistory[]): WallpaperWithHistory[] => {
  const lastChange = wallpapers
    .reduce((lastChange, wallpaper) => {
      return lastChange > wallpaper.deleted ? lastChange : wallpaper.deleted
    }, new Date(0))
    .getTime()

  return wallpapers.map(wallpaper => {
    const isCurrent = wallpaper.deleted.getTime() === lastChange
    if (!isCurrent) {
      return wallpaper
    }
    return { ...wallpaper, current: true }
  })
}

const getSnapshotHash = (snapshot: Snapshot): string => {
  const hashElement = hashes.find(hash => hash.file === snapshot.url)
  if (!hashElement) {
    throw new Error(`No hash found for ${snapshot.url}`)
  }
  return `${hashElement.blockhash}.${hashElement.phash}`
}

const removeDuplicateSnapshots = (wallpapers: WallpaperWithHistory[]): WallpaperWithHistory[] => {
  return wallpapers.map(wallpaper => {
    const snapshots = wallpaper.snapshots
      .reverse()
      .filter((snapshot, index, self) => {
        const alphaHash = getSnapshotHash(snapshot)
        const foundIndex = self.findIndex(s => getSnapshotHash(s) === alphaHash)
        if (foundIndex === index) {
          return true
        }
        const other = self[foundIndex]
        if (!other) {
          throw new Error("No other found. Should never happen")
        }
        other.originalName = snapshot.originalName
        other.name = snapshot.name
        return false
      })
      .reverse()
    return { ...wallpaper, snapshots }
  })
}
