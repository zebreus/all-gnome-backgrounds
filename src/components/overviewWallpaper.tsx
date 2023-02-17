import { css } from "@emotion/react"
import { fixDisplayName } from "functions/fixDisplayName"
import { getCssFit } from "functions/getCssFit"
import { getThumbnailUrl } from "functions/getImageUrl"
import { WallpaperWithHistory } from "functions/processData"

export type OverviewProps = {
  wallpaper: WallpaperWithHistory
}

export const OverviewWallpaper = ({ wallpaper }: OverviewProps) => {
  const latestSnapshot = wallpaper.snapshots[wallpaper.snapshots.length - 1]
  if (!latestSnapshot) throw new Error("No latest snapshot")

  return (
    <div
      key={latestSnapshot.name}
      css={css`
        margin: 1rem;
        width: 500px;
        height: 500px;
      `}
    >
      <img
        css={css`
          border-radius: 1rem;
          width: 500px;
          height: 309px;
          //"stretched" | "zoom" | "scaled" | "wallpaper" | "fill"

          object-fit: ${getCssFit(latestSnapshot.fillMode)};
          background-color: ${latestSnapshot.primaryColor};
        `}
        src={getThumbnailUrl(latestSnapshot.url)}
        alt={latestSnapshot.name}
      />
      <h2
        css={css`
          font-size: 2rem;
        `}
      >
        {fixDisplayName(latestSnapshot.name)}
      </h2>
      <span
        css={css`
          font-size: 1rem;
        `}
        title={"Commit: " + wallpaper.snapshots.at(-1)?.message}
      >
        {wallpaper.created.toLocaleDateString("de")}
      </span>
      {" - "}
      <span
        css={css`
          font-size: 1rem;
        `}
        title={"Commit: " + wallpaper.deleteMessage}
      >
        {wallpaper.deleted.toLocaleDateString("de")}
      </span>
      <section>
        {latestSnapshot.dark ? <span>Dark</span> : null}
        {latestSnapshot.night ? <span>Night</span> : null}
        {latestSnapshot.day ? <span>Day</span> : null}
        {latestSnapshot.morning ? <span>Morning</span> : null}
        {latestSnapshot.alt ? <span>Alternative</span> : null}
      </section>
    </div>
  )
}
