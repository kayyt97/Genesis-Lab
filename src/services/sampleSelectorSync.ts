/**
 * Resolve which catalogue category the Virtual Lab sample selector should show.
 * Prefer the dish experiment category so the UI cannot show Bacteria while HeLa is loaded.
 */
export function resolveSampleSelectorCategory(
  selectedCategory: string | undefined,
  dishCategory: string | undefined,
): string {
  if (dishCategory) return dishCategory;
  if (selectedCategory) return selectedCategory;
  return 'bacteria';
}
