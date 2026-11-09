// /exercises: each exercise's video, played in place.
//
// Every exercise is a link to its video on YouTube, holding its name
// and a thumbnail. A plain click (or Enter) swaps the link for YouTube's
// player, which starts at once, so the page loads five small images
// rather than five players. Starting another video puts the playing one
// back to its thumbnail, which stops it, so only one plays at a time. A
// click with a modifier key still opens YouTube, as does every link when
// this script doesn't run.
//
// The player comes from youtube-nocookie.com, which the page's CSP
// allows in frame-src (and the thumbnails' i.ytimg.com in img-src). The
// page sends no referrer, but YouTube's player refuses to play without
// one (Error 153), so the player's frame sends this site's origin.

const list = document.querySelector('.steps')
// The link taken out for the video now playing, and what replaced it.
let playing = null

list?.addEventListener('click', (event) => {
  const link = event.target.closest('a')
  if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  const id = new URL(link.href).searchParams.get('v')
  if (!id) return
  event.preventDefault()
  stop()

  const video = document.createElement('div')
  video.className = 'video'
  const frame = document.createElement('span')
  frame.className = 'frame'
  const player = document.createElement('iframe')
  player.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&playsinline=1`
  player.title = link.querySelector('.name').textContent
  player.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'
  player.allowFullscreen = true
  player.referrerPolicy = 'strict-origin-when-cross-origin'
  frame.append(player)
  video.append(link.querySelector('.name').cloneNode(true), frame)

  link.replaceWith(video)
  player.focus({ preventScroll: true })
  playing = { link, video }
})

function stop() {
  if (!playing) return
  playing.video.replaceWith(playing.link)
  playing = null
}
