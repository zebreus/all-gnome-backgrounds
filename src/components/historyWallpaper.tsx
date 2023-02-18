import { css } from "@emotion/react"
import { getCssFit } from "functions/getCssFit"
import { getImageUrl } from "functions/getImageUrl"
import { Snapshot } from "functions/processData"
import Link from "next/link"

type HistoryWallpaperProps = { snapshot: Required<Snapshot> }

export const HistoryWallpaper = ({ snapshot }: HistoryWallpaperProps) => {
  return (
    <Link href={getImageUrl(snapshot.url)} passHref>
      <a
        css={css`
          margin-left: 2rem;
          margin-right: 2rem;
          margin-top: 2rem;
          margin-bottom: 2rem;
          display: flex;
          @media (max-width: 1000px) {
            flex-direction: column;
            margin-left: 5vw;
            margin-right: 5vw;
            margin-top: 1rem;
            margin-bottom: 1rem;
          }
        `}
      >
        <img
          css={css`
            border-radius: 2rem;
            width: 75vw;
            max-width: 1000px;
            @media (max-width: 1000px) {
              border-radius: 5vw;

              width: auto;
            }
            height: auto;
            //"stretched" | "zoom" | "scaled" | "wallpaper" | "fill"

            object-fit: ${getCssFit(snapshot.fillMode)};
            background-color: ${snapshot.primaryColor};
            cursor: pointer;
          `}
          src={"../" + getImageUrl(snapshot.url)}
          alt={snapshot.name}
        />
        <section
          css={css`
            width: auto;
            margin: 1rem;
            margin-top: 1rem;
            @media (max-width: 1000px) {
              order: -1;
              display: flex;
              flex-direction: column;
              flex-basis: center;
              justify-content: center;
              align-items: center;
            }
          `}
        >
          <h2
            css={css`
              font-size: 3rem;
              margin-bottom: 0;
              margin-top: 1rem;
              display: flex;
              flex-direction: column;
              flex-basis: center;
              justify-content: center;
              @media (max-width: 1000px) {
                font-size: 1.5rem;
                margin-bottom: 0;
                margin-top: 0rem;
                order: -1;
                display: flex;
                flex-direction: column;
                flex-basis: center;
                justify-content: center;
                align-items: center;
              }
            `}
            title={"Commit: " + snapshot?.message}
          >
            {snapshot.date.toLocaleDateString("de")}
          </h2>
          <span
            css={css`
              font-size: 1rem;
            `}
          >
            {snapshot?.message}
          </span>
        </section>
      </a>
    </Link>
  )
}
