import raw from './videos.json'

/** Shape of research/drum-videos.json. */
export interface Video { drummer: string; videoId: string; title: string; channel: string; song: string; uploadType?: string }
export const VIDEOS = raw as Video[]
export const videosFor = (name: string) => VIDEOS.filter(v => v.drummer.toLowerCase() === name.toLowerCase() && /^[\w-]{11}$/.test(v.videoId))
