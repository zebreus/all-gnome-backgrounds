import { css } from "@emotion/react"
import { OverviewWallpaper } from "components/overviewWallpaper"
import { WallpaperWithHistory } from "functions/processData"

export type OverviewProps = {
  wallpapers: WallpaperWithHistory[]
}

export const Overview = ({ wallpapers }: OverviewProps) => {
  return (
    <>
      {/* <h1
        css={css`
          font-size: 0.9rem;
          text-align: center;
          padding-top: 0.75rem;
          padding-bottom: 0.75rem;
          background-color: #303030;
          font-weight: 575;
        `}
      >
        Wallpapers
      </h1> */}
      <div
        css={css`
          display: grid;
          overflow: hidden;
          grid-auto-rows: auto;
          grid-column-gap: 5px;
          grid-row-gap: 5px;
          grid-template-columns: repeat(1, 1fr);
          @media (min-width: 700px) {
            grid-template-columns: repeat(2, 1fr);
          }
          @media (min-width: 1000px) {
            grid-template-columns: repeat(3, 1fr);
          }
          @media (min-width: 1700px) {
            grid-template-columns: repeat(4, 1fr);
          }
          @media (min-width: 2500px) {
            grid-template-columns: repeat(5, 1fr);
          }
        `}
      >
        {wallpapers.map(wallpaper => (
          <OverviewWallpaper
            key={`${wallpaper.created.toDateString()}${wallpaper.snapshots[0]?.url}`}
            wallpaper={wallpaper}
          ></OverviewWallpaper>
        ))}
      </div>
    </>
  )
}
