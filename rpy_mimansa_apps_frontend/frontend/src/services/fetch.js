export async function getFetch () {
  if (window.fetch) {
    return window.fetch
  } else {
    const { fetch } = await import('whatwg-fetch')
    return fetch
  }
}
