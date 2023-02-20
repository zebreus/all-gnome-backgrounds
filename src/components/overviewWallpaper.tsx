import { css } from "@emotion/react"
import { fixDisplayName } from "functions/fixDisplayName"
import { getCssFit } from "functions/getCssFit"
import { getSmallThumbnailUrl, getThumbnailUrl } from "functions/getImageUrl"
import { WallpaperWithHistory } from "functions/processData"
import Link from "next/link"

export type OverviewProps = {
  wallpaper: WallpaperWithHistory
}

export const OverviewWallpaper = ({ wallpaper }: OverviewProps) => {
  const latestSnapshot = wallpaper.snapshots[0]
  if (!latestSnapshot) throw new Error("No latest snapshot")

  return (
    <Link href={`wallpaper/${latestSnapshot.hash}`} key={latestSnapshot.name} passHref>
      <a
        css={css`
          margin: 1rem;
          width: auto;
          height: fit-content;
          display: flex;
          flex-direction: column;
          @media (max-width: 700px) {
            margin-top: 0;
          }
          position: relative;
        `}
      >
        <img
          css={css`
            border-radius: 1rem;
            width: 100%;
            height: 309px;
            //"stretched" | "zoom" | "scaled" | "wallpaper" | "fill"

            object-fit: ${getCssFit(latestSnapshot.fillMode)};
            background-color: ${latestSnapshot.primaryColor};
          `}
          src={getThumbnailUrl(latestSnapshot.url)}
          alt={latestSnapshot.name}
        />
        {latestSnapshot.fillMode === "wallpaper" ? (
          <div
            css={css`
              position: absolute;
              border-radius: 1rem;
              width: 100%;
              height: 309px;
              pointer-events: none;
              background-color: ${latestSnapshot.primaryColor};
              background-image: url("${getSmallThumbnailUrl(latestSnapshot.url)}");
              background-repeat: repeat;
            `}
          />
        ) : null}
        <section
          css={css`
            width: auto;
            margin: 0;
            margin-top: 0;
            @media (max-width: 700px) {
              order: -1;
              display: flex;
              flex-direction: row;
              flex-basis: center;
              justify-content: center;
              align-items: baseline;
              align-content: center;
              column-gap: 1rem;
              flex-wrap: wrap;
            }
          `}
        >
          <h2
            css={css`
              font-size: 2rem;
              color: white;
              text-decoration: none !important;
              cursor: inherit;
              margin-top: 0;
              margin-bottom: 0;
              @media (max-width: 700px) {
                text-align: center;
              }
            `}
          >
            {fixDisplayName(latestSnapshot.name)}
          </h2>
          <span>
            <span
              css={css`
                font-size: 1rem;
              `}
              title={"Added in: " + latestSnapshot?.message}
            >
              {wallpaper.created.toLocaleDateString("de")}
            </span>
            {"-"}
            <span
              css={css`
                font-size: 1rem;
              `}
              title={wallpaper.current ? "Currently in gnome-backgrounds" : "Removed in: " + wallpaper.deleteMessage}
            >
              {wallpaper.current ? "present" : wallpaper.deleted.toLocaleDateString("de")}
            </span>
          </span>
          <section
            css={css`
              @media (max-width: 500px) {
                min-width: 100%;
                text-align: center;
              }
            `}
          >
            {latestSnapshot.dark ? <span>Dark</span> : null}
            {latestSnapshot.night ? <span>Night</span> : null}
            {latestSnapshot.day ? <span>Day</span> : null}
            {latestSnapshot.morning ? <span>Morning</span> : null}
            {latestSnapshot.alt ? <span>Alternative</span> : null}
            {latestSnapshot.fillMode === "wallpaper" ? (
              <span title="Wallpaper is meant to be used as a repeating pattern">Tiling</span>
            ) : null}
          </section>
        </section>
      </a>
    </Link>
  )
}
