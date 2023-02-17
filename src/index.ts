import { changes } from "data"
import { writeFileSync } from "fs"
import { processData } from "functions/processData"

console.log("You launched the application!")

const result = processData(changes)
const processedData = JSON.stringify(result, null, 2)
const fixed = processedData.replace(/("\d{4}-[^"]*Z")/g, "new Date($1)")
const dataFile = `import { WallpaperWithHistory } from "./functions/processData"

export const processedData: WallpaperWithHistory[] = ${fixed}`

writeFileSync("src/processedData.ts", dataFile)
export {}
