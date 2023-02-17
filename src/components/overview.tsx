import { OverviewWallpaper } from "components/overviewWallpaper"
import { WallpaperWithHistory } from "functions/processData"

export type OverviewProps = {
  wallpapers: WallpaperWithHistory[]
}

export const Overview = ({ wallpapers }: OverviewProps) => {
  return (
    <div style={{ display: "flex", flexWrap: "wrap" }}>
      {wallpapers.map(wallpaper => (
        <OverviewWallpaper
          key={`${wallpaper.snapshots[0]?.name}${wallpaper.snapshots[0]?.url}`}
          wallpaper={wallpaper}
        ></OverviewWallpaper>
      ))}
    </div>
  )
}
