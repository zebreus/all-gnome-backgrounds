import { getThumbnailUrl } from "functions/getImageUrl"

export type Background = {
  url: string
  name: string
}

export type OverviewProps = {
  backgrounds: Background[]
}

export const Overview = ({ backgrounds }: OverviewProps) => {
  return (
    <div>
      {backgrounds.map(background => (
        <div key={background.name}>
          <h2>{background.name}</h2>
          <img src={getThumbnailUrl(background.url)} alt={background.name} />
        </div>
      ))}
    </div>
  )
}
