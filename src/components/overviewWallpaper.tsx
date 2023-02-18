import { css } from "@emotion/react"
import { fixDisplayName } from "functions/fixDisplayName"
import { getCssFit } from "functions/getCssFit"
import { getThumbnailUrl } from "functions/getImageUrl"
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
              row-gap: 1rem;
              gap: 1rem;
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
            `}
          >
            {fixDisplayName(latestSnapshot.name)}
          </h2>
          <span>
            <span
              css={css`
                font-size: 1rem;
              `}
              title={"Commit: " + latestSnapshot?.message}
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
          </span>
          <section>
            {latestSnapshot.dark ? <span>Dark</span> : null}
            {latestSnapshot.night ? <span>Night</span> : null}
            {latestSnapshot.day ? <span>Day</span> : null}
            {latestSnapshot.morning ? <span>Morning</span> : null}
            {latestSnapshot.alt ? <span>Alternative</span> : null}
          </section>
        </section>
      </a>
    </Link>
  )
}
