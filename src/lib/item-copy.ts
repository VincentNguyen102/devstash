/**
 * Resolves what a "quick copy" action should place on the clipboard for an
 * item summary. Text items copy their content, link items copy their URL, and
 * upload-backed items (images) copy a link to the proxied file. Returns null
 * when there is nothing copyable so callers can hide the action.
 */

/** The subset of an item summary needed to resolve its copy text. */
export interface CopyableItem {
  id: string;
  content: string | null;
  url: string | null;
  fileName: string | null;
}

/** App route that streams an item's stored object. */
const FILE_URL_PATH = "/api/items";

export function getItemCopyText(item: CopyableItem, origin = ""): string | null {
  const { content, url } = item;

  if (content && content.trim()) {
    return content;
  }

  if (url && url.trim()) {
    return url;
  }

  if (item.fileName) {
    return `${origin}${FILE_URL_PATH}/${item.id}/file`;
  }

  return null;
}
