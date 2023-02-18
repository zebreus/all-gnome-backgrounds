import { css } from "@emotion/react"
import { HistoryWallpaper } from "components/historyWallpaper"
import { getThumbnailUrl } from "functions/getImageUrl"
import { WallpaperWithHistory } from "functions/processData"
import Head from "next/head"

type HistoryProps = { wallpaper: WallpaperWithHistory }

export const History = ({ wallpaper }: HistoryProps) => {
  return (
    <>
      <Head>
        <title>{wallpaper.snapshots[0]?.name}</title>
        <meta property="og:title" content={wallpaper.snapshots[0]?.name} />
        <meta property="og:image" content={getThumbnailUrl(wallpaper.snapshots[0]?.url || "")} />
      </Head>
      <h1
        css={css`
          font-size: 2rem;
          text-align: center;
        `}
      >
        {wallpaper.snapshots[0]?.name}
      </h1>
      <div
        css={css`
          @media (min-width: 1000px) {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: baseline;
            width: min-content;
            margin-left: auto;
            margin-right: auto;
          }
        `}
      >
        {wallpaper.snapshots.map(snapshot => (
          <HistoryWallpaper snapshot={snapshot} key={snapshot.url} />
        ))}
      </div>
    </>
  )
}
