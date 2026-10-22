/**
 * Free/Pro usage rules. Framework, database and Stripe free so this module can
 * be imported by server actions, route handlers, client components and Vitest.
 */

/** Maximum number of items a Free account may own. */
export const FREE_ITEM_LIMIT = 50;

/** Maximum number of collections a Free account may own. */
export const FREE_COLLECTION_LIMIT = 3;

/** System item types reserved for Pro accounts. */
export const PRO_ONLY_TYPE_IDS = ["file", "image"] as const;

export type ProOnlyTypeId = (typeof PRO_ONLY_TYPE_IDS)[number];

export function isProOnlyTypeId(typeId: string): typeId is ProOnlyTypeId {
  return (PRO_ONLY_TYPE_IDS as readonly string[]).includes(typeId);
}

export interface BillingEntitlements {
  isPro: boolean;
  itemCount: number;
  collectionCount: number;
}

export type LimitCheck =
  | { allowed: true }
  | { allowed: false; error: string };

export function checkItemLimit({
  isPro,
  itemCount,
}: Pick<BillingEntitlements, "isPro" | "itemCount">): LimitCheck {
  if (isPro || itemCount < FREE_ITEM_LIMIT) {
    return { allowed: true };
  }

  return {
    allowed: false,
    error: `You've reached the Free plan limit of ${FREE_ITEM_LIMIT} items. Upgrade to Pro for unlimited items.`,
  };
}

export function checkCollectionLimit({
  isPro,
  collectionCount,
}: Pick<BillingEntitlements, "isPro" | "collectionCount">): LimitCheck {
  if (isPro || collectionCount < FREE_COLLECTION_LIMIT) {
    return { allowed: true };
  }

  return {
    allowed: false,
    error: `You've reached the Free plan limit of ${FREE_COLLECTION_LIMIT} collections. Upgrade to Pro for unlimited collections.`,
  };
}

export function checkItemType(typeId: string, isPro: boolean): LimitCheck {
  if (isPro || !isProOnlyTypeId(typeId)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    error: "This item type is a Pro feature. Upgrade to Pro to add it.",
  };
}

/** Type check first, then the item-count check. */
export function checkItemCreation(
  typeId: string,
  entitlement: BillingEntitlements,
): LimitCheck {
  const typeCheck = checkItemType(typeId, entitlement.isPro);

  return typeCheck.allowed ? checkItemLimit(entitlement) : typeCheck;
}
