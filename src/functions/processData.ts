import { DataType } from "dataType"

export type Snapshot = {
  date: Date
  name?: string | undefined
  url: string
  message: string
  originalFile: string
  commit: string
  type: "add" | "edit" | "rename"
}

export type WallpaperWithHistory = {
  created: Date
  deleted: Date
  deleteMessage: string
  snapshots: Required<Snapshot>[]
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

  return {
    date: new Date(item.date * 1000),
    name: assertReasonableName(item.config?.name) || assertReasonableName(item.config?._name),
    url: `${item.name}-${item.newFileHash}.webp`,
    message: item.message,
    originalFile: item.originalRepoPath,
    commit: item.commit,
    type: item.type,
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
const fillMissingInfo = (snapshots: Snapshot[]): Required<Snapshot>[] => {
  let name: string =
    snapshots.find(snapshot => snapshot.name)?.name ||
    assertReasonableName(snapshots[0]?.originalFile.split("/")?.pop()?.split(".")?.[0]) ||
    (() => {
      throw new Error("No name found")
    })()
  const snapshotsFixedName = snapshots.map(snapshot => {
    name = snapshot.name || name
    return {
      ...snapshot,
      name,
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

    const history = getHistory(lastChange, fixedData)
    const snapshots = fillMissingInfo(history.map(toSnapshot))
    const createdDate = snapshots[snapshots.length - 1]?.date
    if (!createdDate) {
      throw new Error("No created date found")
    }

    const result: WallpaperWithHistory = {
      created: createdDate,
      deleted: deletedDate,
      snapshots,
      deleteMessage,
    }
    return result
  })
  return wallpapers
}