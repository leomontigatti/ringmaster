/** A route's `head`: the browser tab names the page as its title does. */
export function pageHead(title: string) {
  return { meta: [{ title: `${title} · ringmaster` }] };
}
